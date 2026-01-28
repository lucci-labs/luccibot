# LucciBot

LucciBot is a modular, event-driven AI agent interface built with **Bun**, **React**, and **TypeScript**. It features a TUI (Terminal User Interface) and follows a Hub-and-Spoke architecture to manage secure agent interactions.

## Architecture

*   **Hub**: The central event bus. Manages communication between the user, agent, and external tools.
*   **UI**: A React-based TUI (powered by `@opentui/react`) that renders the agent's state, logs, and accepts user input.
*   **Agent**: The intelligence layer. Listens for input, processes intent (mocked via Regex/Logic), and requests actions.
*   **Bridge**: Connects the Agent to external "Skills" (scripts in `./skills`).
*   **Vault**: A secure enclave for signing transactions. Simulates a keychain/wallet.

## Getting Started

### Prerequisites

*   [Bun](https://bun.sh) (v1.2.5+)

### Installation

```bash
bun install
```

### Running the Bot

```bash
bun start
```

### Testing

```bash
bun run test
```

## Structure

```
/
├── agent/    # Core logic and intent parsing
├── bridge/   # Execution layer for external skills
├── hub/      # Event emitter and type schemas
├── ui/       # React TUI components
├── vault/    # Secure transaction signing
├── skills/   # External scripts executable by Bridge
└── types/    # Shared Zod schemas and TypeScript interfaces
```