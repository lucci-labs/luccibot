package tui

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/lucci-labs/luccibot/bus"
)

var (
	senderStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("5")).Bold(true)
	botStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("2")).Bold(true)
	logStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("240")).Italic(true)
	errorStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("1")).Bold(true)
)

type Model struct {
	hub       *bus.Hub
	textInput textinput.Model
	messages  []string
	err       error
}

func NewModel(h *bus.Hub) Model {
	ti := textinput.New()
	ti.Placeholder = "Type a command (e.g., 'swap 1 eth')..."
	ti.Focus()
	ti.CharLimit = 156
	ti.Width = 50

	return Model{
		hub:       h,
		textInput: ti,
		messages:  []string{},
	}
}

func (m Model) Init() tea.Cmd {
	return tea.Batch(textinput.Blink, waitForActivity(m.hub.Outbound))
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC, tea.KeyEsc:
			return m, tea.Quit
		case tea.KeyEnter:
			v := m.textInput.Value()
			if strings.TrimSpace(v) == "" {
				return m, nil
			}
			// Add user message to UI
			m.messages = append(m.messages, senderStyle.Render("You: ")+v)
			
			// Send to Hub
			go func() {
				m.hub.Inbound <- bus.Event{
					Type:    "user_message",
					Payload: v,
				}
			}()
			
			m.textInput.SetValue("")
			return m, nil
		}

	case bus.Event:
		// Handle incoming events from the Hub
		switch msg.Type {
		case "log":
			if payload, ok := msg.Payload.(string); ok {
				m.messages = append(m.messages, logStyle.Render("Log: "+payload))
			}
		case "response":
			if payload, ok := msg.Payload.(string); ok {
				m.messages = append(m.messages, botStyle.Render("Lucci: ")+payload)
			}
		case "signed":
			// Handle "Signed" events (e.g. success message)
			m.messages = append(m.messages, botStyle.Render("System: ")+"Transaction Signed Successfully!")
		default:
			m.messages = append(m.messages, logStyle.Render(fmt.Sprintf("Unknown event: %v", msg)))
		}
		// Continue listening
		return m, waitForActivity(m.hub.Outbound)

	case error:
		m.err = msg
		return m, nil
	}

	m.textInput, cmd = m.textInput.Update(msg)
	return m, cmd
}

func (m Model) View() string {
	s := strings.Builder{}

	s.WriteString("LucciBot Terminal\n\n")

	// Render messages (simple limit to last 20 for now)
	start := 0
	if len(m.messages) > 20 {
		start = len(m.messages) - 20
	}
	for _, msg := range m.messages[start:] {
		s.WriteString(msg + "\n")
	}

	s.WriteString("\n" + m.textInput.View())
	s.WriteString("\n\n(Esc to quit)\n")

	return s.String()
}

// waitForActivity listens on the Outbound channel and returns a tea.Msg when an event arrives.
func waitForActivity(sub <-chan bus.Event) tea.Cmd {
	return func() tea.Msg {
		return <-sub
	}
}
