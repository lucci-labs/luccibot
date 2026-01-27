package bus

// Event represents a generic message for UI/System communication.
type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// Action represents a request to execute a skill.
type Action struct {
	SkillName string   `json:"skill_name"`
	Args      []string `json:"args"`
}

// SignRequest represents a request to sign a transaction.
type SignRequest struct {
	TxData       []byte
	ResponseChan chan<- SignResponse
}

// SignResponse represents the result of a signing operation.
type SignResponse struct {
	Signature []byte
	Error     error
}

// Hub manages the centralized channels for the application.
type Hub struct {
	// Inbound: User requests from the TUI to the Orchestrator.
	Inbound chan Event
	// Outbound: Responses/Logs from the Orchestrator to the TUI.
	Outbound chan Event
	// ActionReq: Orchestrator requests a Tool/Script execution from the Bridge.
	ActionReq chan Action
	// SignReq: Bridge/Orchestrator requests a signature from the Vault.
	SignReq chan SignRequest
}

// NewHub initializes and returns a new Hub with buffered channels.
func NewHub() *Hub {
	return &Hub{
		Inbound:   make(chan Event, 10),
		Outbound:  make(chan Event, 10),
		ActionReq: make(chan Action, 10),
		SignReq:   make(chan SignRequest, 10),
	}
}