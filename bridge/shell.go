package bridge

import (
	"context"
	"fmt"
	"os/exec"
	"path/filepath"

	"github.com/lucci-labs/luccibot/bus"
)

// Bridge handles the execution of external skills/scripts.
type Bridge struct {
	hub       *bus.Hub
	skillsDir string
}

// NewBridge creates a new Bridge service.
func NewBridge(hub *bus.Hub, skillsDir string) *Bridge {
	return &Bridge{
		hub:       hub,
		skillsDir: skillsDir,
	}
}

// Start listens for Action requests and processes them.
func (b *Bridge) Start(ctx context.Context) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case action := <-b.hub.ActionReq:
				b.executeSkill(action)
			}
		}
	}()
}

// executeSkill runs the external script and handles its output.
func (b *Bridge) executeSkill(action bus.Action) {
	// Construct the path to the skill script.
	// Assuming TypeScript scripts run via 'bun'.
	scriptPath := filepath.Join(b.skillsDir, action.SkillName)
	
	cmd := exec.Command("bun", append([]string{scriptPath}, action.Args...)...)

	// Capture stdout to get the transaction JSON.
	output, err := cmd.Output()
	if err != nil {
		b.hub.Outbound <- bus.Event{
			Type:    "ERROR",
			Payload: fmt.Sprintf("Failed to execute skill %s: %v", action.SkillName, err),
		}
		return
	}

	// In a real scenario, we might want to validate that 'output' is valid JSON
	// or specific transaction structure before requesting a signature.
	// For this architecture, we treat the output as the Transaction Data.
	
	// Create a channel to receive the signature response.
	respChan := make(chan bus.SignResponse, 1)

	// Send request to Vault via the Hub.
	b.hub.SignReq <- bus.SignRequest{
		TxData:       output,
		ResponseChan: respChan,
	}

	// Wait for the signature.
	go func() {
		resp := <-respChan
		if resp.Error != nil {
			b.hub.Outbound <- bus.Event{
				Type:    "ERROR",
				Payload: fmt.Sprintf("Signing failed: %v", resp.Error),
			}
			return
		}

		b.hub.Outbound <- bus.Event{
			Type: "LOG",
			Payload: fmt.Sprintf("Transaction signed successfully. Signature: %s", string(resp.Signature)),
		}
		
		// Here we would likely broadcast the signed transaction or return it to the UI.
		b.hub.Outbound <- bus.Event{
			Type: "TX_SIGNED",
			Payload: map[string]string{
				"raw_tx":    string(output),
				"signature": string(resp.Signature),
			},
		}
	}()
}
