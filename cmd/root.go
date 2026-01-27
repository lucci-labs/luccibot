/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>

*/
package cmd

import (
	"context"
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/lucci-labs/luccibot/internal/agent"
	"github.com/lucci-labs/luccibot/internal/bridge"
	"github.com/lucci-labs/luccibot/internal/bus"
	"github.com/lucci-labs/luccibot/internal/tui"
	"github.com/lucci-labs/luccibot/internal/vault"
	"github.com/spf13/cobra"
	"golang.org/x/sync/errgroup"
)



// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "luccibot",
	Short: "LucciBot is your AI-powered CLI assistant",
	Long: `LucciBot integrates an LLM Agent, a TUI, and secure signing capabilities
to help you manage tasks and transactions directly from your terminal.`,
	Run: func(cmd *cobra.Command, args []string) {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		// 1. Initialize the Hub (Bus)
		h := bus.NewHub()

		// 2. Initialize Services
		// Vault (Passive)
		v := vault.NewLocalVault("default-key-id")

		// Bridge (Skills execution)
		// Assuming "skills" directory is in the current working directory
		b := bridge.NewBridge(h, "./skills")
		b.Start(ctx) // This runs in its own goroutine internally

		// Agent (Brain)
		a := agent.NewAgent(h)

		// TUI (Face)
		tuiModel := tui.NewModel(h)
		p := tea.NewProgram(tuiModel)

		// 3. Orchestration with errgroup
		g, ctx := errgroup.WithContext(ctx)

		// Start Vault Loop (Adapter)
		g.Go(func() error {
			for {
				select {
				case <-ctx.Done():
					return ctx.Err()
				case req := <-h.SignReq:
					sig, err := v.SignTransaction(req.TxData)
					req.ResponseChan <- bus.SignResponse{
						Signature: sig,
						Error:     err,
					}
				}
			}
		})

		// Start Agent
		g.Go(func() error {
			return a.Start(ctx)
		})

		// Start TUI
		// Note: tea.Program.Run() blocks, so we run it in the main group
		// or specifically here. However, usually TUI must be on the main goroutine
		// or simply the last blocking call if nothing else conflicts.
		// But errgroup expects functions.
		g.Go(func() error {
			_, err := p.Run()
			cancel() // Cancel context when TUI quits
			return err
		})

		// Wait for all services
		if err := g.Wait(); err != nil {
			// Context canceled is expected exit
			if err != context.Canceled {
				fmt.Fprintf(os.Stderr, "Error: %v\n", err)
				os.Exit(1)
			}
		}
	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	// Here you will define your flags and configuration settings.
	// Cobra supports persistent flags, which, if defined here,
	// will be global for your application.

	// rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.luccibot.yaml)")

	// Cobra also supports local flags, which will only run
	// when this action is called directly.
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}


