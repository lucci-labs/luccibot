package tui

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/lucci-labs/luccibot/bus"
)

// Colors - dark theme inspired by opencode
var (
	primaryColor    = lipgloss.Color("#7C3AED") // Purple accent
	secondaryColor  = lipgloss.Color("#10B981") // Green for bot
	backgroundColor = lipgloss.Color("#0D1117") // Dark background
	surfaceColor    = lipgloss.Color("#161B22") // Slightly lighter surface
	borderColor     = lipgloss.Color("#30363D") // Subtle border
	textColor       = lipgloss.Color("#E6EDF3") // Light text
	mutedColor      = lipgloss.Color("#8B949E") // Muted/dim text
	errorColor      = lipgloss.Color("#F85149") // Red for errors
	successColor    = lipgloss.Color("#3FB950") // Green for success
)

// Styles
var (
	// App container
	appStyle = lipgloss.NewStyle().
			Background(backgroundColor)

	// Header bar
	headerStyle = lipgloss.NewStyle().
			Foreground(textColor).
			Background(surfaceColor).
			Bold(true).
			Padding(0, 2)

	headerTitleStyle = lipgloss.NewStyle().
				Foreground(primaryColor).
				Bold(true)

	// Messages area
	messageContainerStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(borderColor).
				Padding(1, 2)

	userLabelStyle = lipgloss.NewStyle().
			Foreground(primaryColor).
			Bold(true)

	botLabelStyle = lipgloss.NewStyle().
			Foreground(secondaryColor).
			Bold(true)

	// Message box style - renders like a text area
	messageBoxStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(borderColor).
			Foreground(textColor).
			Padding(0, 1).
			MarginTop(1)

	systemLabelStyle = lipgloss.NewStyle().
				Foreground(mutedColor).
				Bold(true)

	logStyle = lipgloss.NewStyle().
			Foreground(mutedColor).
			MarginTop(1)

	errorMsgStyle = lipgloss.NewStyle().
			Foreground(errorColor).
			Bold(true).
			MarginTop(1)

	successMsgStyle = lipgloss.NewStyle().
			Foreground(successColor).
			Bold(true).
			MarginTop(1)

	// Input area - taller box with vertically centered text
	inputContainerStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(borderColor).
				Padding(1, 1) // Vertical padding to center the single line

	inputLabelStyle = lipgloss.NewStyle().
			Foreground(primaryColor).
			Bold(true)

	// Status bar
	statusBarStyle = lipgloss.NewStyle().
			Foreground(mutedColor).
			Background(surfaceColor).
			Padding(0, 2)

	statusTextStyle = lipgloss.NewStyle().
			Foreground(mutedColor)

	statusKeyStyle = lipgloss.NewStyle().
			Foreground(textColor).
			Background(lipgloss.Color("#238636")).
			Padding(0, 1).
			MarginRight(1)

	// Model info bar (below input)
	modelInfoStyle = lipgloss.NewStyle().
			Padding(0, 2)

	modelNameStyle = lipgloss.NewStyle().
			Foreground(textColor)

	providerStyle = lipgloss.NewStyle().
			Foreground(mutedColor)
)

type Model struct {
	hub          *bus.Hub
	textInput    textinput.Model
	viewport     viewport.Model
	messages     []string
	err          error
	width        int
	height       int
	ready        bool
	inputFocused bool
	modelName    string
	provider     string
}

func NewModel(h *bus.Hub) Model {
	ti := textinput.New()
	ti.Focus()
	ti.CharLimit = 500
	ti.TextStyle = lipgloss.NewStyle().Foreground(textColor)
	ti.PlaceholderStyle = lipgloss.NewStyle().Foreground(mutedColor)
	ti.Cursor.Style = lipgloss.NewStyle().Foreground(primaryColor)

	return Model{
		hub:          h,
		textInput:    ti,
		messages:     []string{},
		inputFocused: true,
		modelName:    "Gemini 2.5 Pro",
		provider:     "Google",
	}
}

func (m Model) Init() tea.Cmd {
	return tea.Batch(
		textinput.Blink,
		waitForActivity(m.hub.Outbound),
	)
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var (
		vpCmd tea.Cmd
		taCmd tea.Cmd
	)

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height

		headerHeight := 1
		statusHeight := 1
		inputHeight := 5 // Border (2) + padding (2) + text line (1)
		bordersAndPadding := 4

		viewportHeight := m.height - headerHeight - statusHeight - inputHeight - bordersAndPadding

		if !m.ready {
			m.viewport = viewport.New(m.width-4, viewportHeight)
			m.viewport.Style = lipgloss.NewStyle().
				Foreground(textColor)
			m.ready = true
		} else {
			m.viewport.Width = m.width - 4
			m.viewport.Height = viewportHeight
		}

		m.textInput.Width = m.width - 8
		m.viewport.SetContent(m.renderMessages())
		m.viewport.GotoBottom()

	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC:
			return m, tea.Quit
		case tea.KeyEsc:
			if m.inputFocused {
				m.inputFocused = false
				m.textInput.Blur()
			} else {
				return m, tea.Quit
			}
			return m, nil
		case tea.KeyTab:
			m.inputFocused = !m.inputFocused
			if m.inputFocused {
				m.textInput.Focus()
			} else {
				m.textInput.Blur()
			}
			return m, nil
		case tea.KeyEnter:
			if m.inputFocused {
				v := m.textInput.Value()
				if strings.TrimSpace(v) == "" {
					return m, nil
				}
				// Add user message to UI
				m.messages = append(m.messages, m.formatUserMessage(v))

				// Send to Hub
				go func() {
					m.hub.Inbound <- bus.Event{
						Type:    "user_message",
						Payload: v,
					}
				}()

				m.textInput.SetValue("")
				m.viewport.SetContent(m.renderMessages())
				m.viewport.GotoBottom()
				return m, nil
			}
		}

	case bus.Event:
		// Handle incoming events from the Hub
		switch msg.Type {
		case "log":
			if payload, ok := msg.Payload.(string); ok {
				m.messages = append(m.messages, m.formatLogMessage(payload))
			}
		case "response":
			if payload, ok := msg.Payload.(string); ok {
				m.messages = append(m.messages, m.formatBotMessage(payload))
			}
		case "signed":
			m.messages = append(m.messages, m.formatSuccessMessage("Transaction Signed Successfully!"))
		case "error":
			if payload, ok := msg.Payload.(string); ok {
				m.messages = append(m.messages, m.formatErrorMessage(payload))
			}
		default:
			m.messages = append(m.messages, m.formatLogMessage(fmt.Sprintf("Event: %s", msg.Type)))
		}
		m.viewport.SetContent(m.renderMessages())
		m.viewport.GotoBottom()
		return m, waitForActivity(m.hub.Outbound)

	case error:
		m.err = msg
		m.messages = append(m.messages, m.formatErrorMessage(msg.Error()))
		m.viewport.SetContent(m.renderMessages())
		return m, nil
	}

	// Update viewport if not focused on input
	if !m.inputFocused {
		m.viewport, vpCmd = m.viewport.Update(msg)
	}

	// Update text input
	if m.inputFocused {
		m.textInput, taCmd = m.textInput.Update(msg)
	}

	return m, tea.Batch(vpCmd, taCmd)
}

func (m Model) View() string {
	if !m.ready {
		return "Initializing..."
	}

	// Header
	header := m.renderHeader()

	// Messages viewport
	messagesArea := messageContainerStyle.
		Width(m.width - 4).
		Render(m.viewport.View())

	// Input area with prompt
	inputArea := inputContainerStyle.
		Width(m.width - 4).
		Render(m.textInput.View())

	// Status bar
	statusBar := m.renderStatusBar()

	// Combine all parts
	return lipgloss.JoinVertical(
		lipgloss.Left,
		header,
		messagesArea,
		inputArea,
		statusBar,
	)
}

func (m Model) renderHeader() string {
	title := headerTitleStyle.Render("luccibot")
	version := statusTextStyle.Render(" v0.1.0")

	leftSide := title + version
	rightSide := statusTextStyle.Render(`27,913  3% ($0.00)`)

	spaces := m.width - lipgloss.Width(leftSide) - lipgloss.Width(rightSide) - 4
	if spaces < 0 {
		spaces = 0
	}

	return headerStyle.
		Width(m.width).
		Render(leftSide + strings.Repeat(" ", spaces) + rightSide)
}

func (m Model) renderStatusBar() string {
	// Left side: model info
	modelName := modelNameStyle.Render(m.modelName)
	provider := providerStyle.Render(" " + m.provider)
	leftSide := modelName + provider

	// Right side: mode/status
	mode := statusKeyStyle.Render("CHAT")
	rightSide := mode + statusTextStyle.Render(" tab switch focus • esc blur/quit • ctrl+c quit")

	spaces := m.width - lipgloss.Width(leftSide) - lipgloss.Width(rightSide) - 4
	if spaces < 0 {
		spaces = 0
	}

	return statusBarStyle.
		Width(m.width).
		Render(leftSide + strings.Repeat(" ", spaces) + rightSide)
}

func (m Model) renderMessages() string {
	if len(m.messages) == 0 {
		return logStyle.Render("No messages yet. Type a command to get started!")
	}

	return strings.Join(m.messages, "\n")
}

func (m Model) formatUserMessage(content string) string {
	label := userLabelStyle.Render("You")
	boxWidth := max(m.width-10, 20)
	box := messageBoxStyle.Width(boxWidth).Render(content)
	return label + "\n" + box
}

func (m Model) formatBotMessage(content string) string {
	label := botLabelStyle.Render("Lucci")
	boxWidth := max(m.width-10, 20)
	box := messageBoxStyle.Width(boxWidth).Render(content)
	return label + "\n" + box
}

func (m Model) formatLogMessage(content string) string {
	return logStyle.Render("→ " + content)
}

func (m Model) formatErrorMessage(content string) string {
	return errorMsgStyle.Render("✗ Error: " + content)
}

func (m Model) formatSuccessMessage(content string) string {
	return successMsgStyle.Render("✓ " + content)
}

// waitForActivity listens on the Outbound channel and returns a tea.Msg when an event arrives.
func waitForActivity(sub <-chan bus.Event) tea.Cmd {
	return func() tea.Msg {
		return <-sub
	}
}
