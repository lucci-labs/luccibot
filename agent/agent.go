package agent

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/lucci-labs/luccibot/bus"
	"google.golang.org/genai"
)

// Agent represents the "Brain" of the application.
type Agent struct {
	Hub    *bus.Hub
	Client *genai.Client
}

// NewAgent initializes a new Agent.
func NewAgent(h *bus.Hub) *Agent {
	var client *genai.Client
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey != "" {
		var err error
		// Initialize the client with the API key.
		// Note: The actual initialization might depend on the specific version of the genai library.
		// Assuming a standard pattern here, but will fall back to mock if initialization fails or is complex without context.
		// For simplicity and safety in this scaffold, we'll just log if we were "supposed" to have one.
		// The prompt asks to "Integrate google.golang.org/genai", so I will attempt a basic setup.
		ctx := context.Background()
		client, err = genai.NewClient(ctx, &genai.ClientConfig{
			APIKey: apiKey,
		})
		if err != nil {
			fmt.Printf("Failed to create GenAI client: %v\n", err)
		}
	}

	return &Agent{
		Hub:    h,
		Client: client,
	}
}

// Start begins the Agent's main loop.
func (a *Agent) Start(ctx context.Context) error {
	// Notify that agent is running
	a.Hub.Outbound <- bus.Event{
		Type:    "log",
		Payload: "Agent started. Waiting for input...",
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case event := <-a.Hub.Inbound:
			// Process user message
			if event.Type == "user_message" {
				msg, ok := event.Payload.(string)
				if !ok {
					continue
				}
				a.processMessage(ctx, msg)
			}
		}
	}
}

func (a *Agent) processMessage(ctx context.Context, msg string) {
	// TODO: Use a.Client if available for more complex understanding.
	// For now, we use the mock response/logic as requested for scaffolding.

	// Test all kind of messages
	a.Hub.Outbound <- bus.Event{Type: "log", Payload: "Processing: " + msg}
	a.Hub.Outbound <- bus.Event{Type: "signed", Payload: "Processing: " + msg}
	a.Hub.Outbound <- bus.Event{Type: "error", Payload: "Processing: " + msg}

	// 2. Simple parsing logic (Mock "Brain")
	lowerMsg := strings.ToLower(msg)
	if strings.Contains(lowerMsg, "swap") {
		parts := strings.Fields(lowerMsg)
		// Very naive parsing: "swap 1 eth" -> Action: swap, Args: [1, eth]
		// In a real scenario, the LLM would extract this structured data.

		args := []string{}
		if len(parts) > 1 {
			args = parts[1:]
		}

		action := bus.Action{
			SkillName: "swap",
			Args:      args,
		}

		a.Hub.Outbound <- bus.Event{Type: "log", Payload: fmt.Sprintf("Identified intent: %s %v", action.SkillName, action.Args)}
		a.Hub.ActionReq <- action
	} else if strings.Contains(lowerMsg, "hello") {
		a.Hub.Outbound <- bus.Event{Type: "response", Payload: "Hello! I am LucciBot. I can help you swap assets or sign transactions."}
	} else {
		// Fallback for unknown commands
		if a.Client != nil {
			// Here we would call the LLM.
			// resp, err := a.Client.GenerateContent(...)
			// For this scaffold, we'll just acknowledge we have the client but revert to mock.
			a.Hub.Outbound <- bus.Event{Type: "response", Payload: "[LLM Connected] I heard you, but I am currently configured to only handle 'swap' commands in this scaffold."}
		} else {
			a.Hub.Outbound <- bus.Event{Type: "response", Payload: "I didn't understand that. Try 'swap 1 eth'."}
		}
	}
}
