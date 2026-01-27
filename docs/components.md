# LucciBot Component Reference

This document details the core components of the LucciBot architecture, their responsibilities, and how they fit into the overall system.

---

## 1. Hub (The Central Nervous System)
**Location**: `internal/bus/bus.go`

The **Hub** is the central struct that holds all the communication channels. It acts as the "Bus" for the event-driven architecture, decoupling the services from each other.

### Channels
*   `Inbound chan Event`: Receives raw user messages from the TUI.
*   `Outbound chan Event`: Distributes system logs, agent responses, and errors back to the TUI.
*   `ActionReq chan Action`: Carries structured commands (e.g., "execute skill swap") from the Agent to the Bridge.
*   `SignReq chan SignRequest`: Carries transaction data from the Bridge to the Vault for signing.

---

## 2. Agent (The Brain)
**Location**: `internal/agent/agent.go`

The **Agent** is responsible for interpreting user intent. It consumes raw text and decides what action to take.

### Responsibilities
*   **Listening**: continuously listens to `Hub.Inbound`.
*   **Processing**:
    *   Uses `google.golang.org/genai` (if configured) or an internal parser to understand commands.
    *   Converts natural language (e.g., "swap 1 eth") into structured `Action` objects.
*   **Dispatching**: Sends `Action` objects to `Hub.ActionReq` or direct text responses to `Hub.Outbound`.

---

## 3. TUI (The Face)
**Location**: `internal/tui/tui.go`

The **TUI** (Terminal User Interface) is built with [Bubble Tea](https://github.com/charmbracelet/bubbletea). It manages the display state and user input.

### Responsibilities
*   **Rendering**: Displays the chat history and input field.
*   **Input Handling**: Captures user keystrokes. When `Enter` is pressed, it sends the message to `Hub.Inbound` in a non-blocking goroutine.
*   **Event Loop**: Uses a custom `tea.Cmd` called `waitForActivity` to listen to `Hub.Outbound`. When an event arrives, it updates the message list and immediately re-subscribes.

---

## 4. Bridge (The Hands)
**Location**: `internal/bridge/shell.go`

The **Bridge** connects the internal Go logic to external "Skills" (scripts, usually TypeScript/Bun).

### Responsibilities
*   **Listening**: Listens to `Hub.ActionReq`.
*   **Execution**: Spawns subprocesses (e.g., `bun run skills/swap.ts`) based on the requested `SkillName`.
*   **Output Handling**: Captures the standard output of the script (assumed to be transaction data).
*   **Signing Request**: Wraps the script output in a `SignRequest` and sends it to `Hub.SignReq`, creating a unique response channel for the result.

---

## 5. Vault (The Wallet)
**Location**: `internal/vault/vault.go` & `cmd/root.go`

The **Vault** is the secure enclave for signing operations. It is designed to be "passive" and synchronous, meaning it doesn't run its own loop internally.

### Responsibilities
*   **Security**: managing private keys (mocked for now, planned for OS Keychain integration).
*   **Signing**: `SignTransaction(data)` takes bytes and returns a signature.

### Integration
Because `Vault` is a passive interface, it is wrapped in an "Adapter Loop" within `cmd/root.go` that listens to `Hub.SignReq`, calls the method, and sends the result back on the provided `ResponseChan`.
