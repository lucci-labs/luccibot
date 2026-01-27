# Clawdbot Architectural Investigation

This document outlines the high-level architecture, project structure, and core technical implementations of Clawdbot.

---

## 1. High-Level Architecture

Clawdbot follows a **Hub-and-Spoke** architecture tailored for multi-platform messaging and autonomous agents.

*   **The Hub (Gateway)**: The central server that coordinates all communication. It manages connections, enforces security, and routes messages. It speaks a standardized JSON-RPC-like protocol over WebSockets.
*   **The Spokes (Nodes/Extensions)**: Platform adapters (e.g., `extensions/telegram`, `extensions/slack`) that act as clients connecting to the Gateway. They translate platform-specific events into standardized Clawdbot protocol messages.
*   **The Brain (Agent/Pi)**: The intelligence layer. It interacts with the Gateway primarily through the `pi-coding-agent` library. It receives conversation transcripts and decides on actions (replies, tool calls).

## 2. Project Structure

*   `src/gateway`: The core of the system. Implementation of the WebSocket server, protocol, and routing logic.
*   `src/cli`: Entry point for the application. Handles CLI arguments and assembles the production environment/dependencies.
*   `src/infra`: Shared infrastructure services (e.g., security/device-pairing, routing/delivery-service).
*   `extensions/`: Independent modules for specific capabilities or platform connections (e.g., `discord`, `memory-lancedb`).

## 3. Data Flow: Telegram to Agent and Back

1.  **Ingestion**: User sends a message on Telegram; the `extensions/telegram` node receives it.
2.  **Normalization**: The extension converts the Telegram payload into the standard Clawdbot message format.
3.  **Transport**: The extension sends a `req` (request) frame to the Gateway over a persistent WebSocket connection.
4.  **Gateway Processing**:
    *   Validates frame using TypeBox schemas.
    *   Authenticates via device signatures or tokens.
    *   Invokes the agent runtime via `runEmbeddedPiAgent`.
5.  **Agent Execution**: The Agent processes the message history and issues a "Tool Call" (e.g., `sendMessage`).
6.  **Outbound Routing**: `OutboundService` intercepts the tool call, identifies the owning node, and routes instructions back.
7.  **Delivery**: The Telegram extension receives the instruction and calls the Telegram API.

## 4. Dependency Injection

Clawdbot uses a **Functional Dependency Injection** pattern.

*   **`createDefaultDeps`**: Located in `src/cli/deps.ts`, this is the "composition root." It creates singleton services (DB, loggers, API clients) and bundles them into a `CliDeps` object.
*   **Usage**: The `deps` object is passed down through the call stack, enabling easy unit testing via mocks.

## 5. Core Invariants ("Golden Rules")

1.  **Security by Default**: Nodes must authenticate via cryptographic Device Pairing or strict token authentication.
2.  **Session Isolation**: Every conversation is a distinct Session managed by `SessionManager` to prevent context leakage.
3.  **Protocol Strictness**: All WebSocket communication must adhere to strict TypeBox JSON schemas.

---

## Technical Deep Dive

### 1. Tool & Skill Discovery

**Dynamic Loading via `jiti`**:
Clawdbot uses a custom discovery system in `src/plugins/`.

*   **Discovery**: `src/plugins/discovery.ts` scans `extensions/` and `src/tools/`.
*   **Loading**: `src/plugins/loader.ts` uses `jiti` for dynamic TypeScript imports at runtime.
*   **Registration**: Plugins export a `register` function to hook into the central `PluginRegistry`.
*   **Skills**: Defined in `SKILL.md` files; the agent reads these to understand tool capabilities via "prompt-injection."

### 2. Concurrency & Locking

**File-Based Session Locking (`proper-lockfile`)**:
Ensures atomicity for session handling.

*   **Mechanism**: `src/agents/session-write-lock.ts` uses `proper-lockfile` to create `.lock` files alongside session JSON storage.
*   **Gateway Singleton**: A similar lock ensures only one Gateway instance runs per port/configuration.

### 3. Security Sandboxing

**Docker Wrapper Implementation**:
The sandbox is a TypeScript wrapper around the Docker CLI.

*   **Location**: `src/agents/bash-tools.exec.ts`.
*   **Logic**: Tool calls trigger `buildDockerExecArgs` to construct `docker exec` commands.
*   **Sanitization/Gatekeeping**: `src/infra/exec-approvals.ts` checks commands against an allowlist or requests user approval before execution.

### 4. Type Safety (TypeBox)

**Runtime Protocol Validation**:
Schemas define both TypeScript types and runtime validators.

**Example Schema (`src/gateway/protocol/schema/frames.ts`)**:
```typescript
export const RequestFrameSchema = Type.Object(
  {
    type: Type.Literal("req"),
    id: NonEmptyString,
    method: NonEmptyString,
    params: Type.Optional(Type.Unknown()),
  },
  { additionalProperties: false },
);
```

**Validation Logic**:
Incoming messages are validated immediately in the WebSocket handler (`src/gateway/server/ws-connection/message-handler.ts`) using compiled validators to ensure malformed JSON never reaches core logic.