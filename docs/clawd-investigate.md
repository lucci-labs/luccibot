 1. High-Level Architecture
  Clawdbot follows a Hub-and-Spoke architecture tailored for multi-platform messaging and autonomous agents.

   * The Hub (Gateway): The central server that coordinates all communication. It manages connections, enforces security, and routes messages. It doesn't
     "know" the details of Telegram or Slack; it only speaks a standardized JSON-RPC-like protocol over WebSockets.
   * The Spokes (Nodes/Extensions): These are the platform adapters (e.g., extensions/telegram, extensions/slack). They act as "clients" that connect to the
     Gateway. They translate platform-specific events (like a Telegram webhook) into standardized Clawdbot protocol messages.
   * The Brain (Agent/Pi): The intelligence layer. It interacts with the Gateway primarily through the pi-coding-agent library. It receives a transcript of the
     conversation and decides what action to take (e.g., reply with text, call a tool).

  2. Project Structure
   * `src/gateway`: The core of the system. This directory contains the implementation of the WebSocket server, the request/response protocol, and the routing
     logic that connects incoming messages to the appropriate handlers or agents.
   * `src/cli`: The entry point for the application. It handles command-line arguments and, crucially, sets up the runtime environment. This is where the
     "production" version of all dependencies is assembled.
   * `src/infra`: Contains shared infrastructure services that are used across the system but aren't part of the core business logic. Examples include
     device-pairing.ts (security) and delivery-service.ts (routing outbound messages).
   * `extensions/`: A collection of independent modules. Each directory here (like extensions/discord or extensions/memory-lancedb) is effectively a plugin
     that provides a specific capability or connects to a specific platform.

  3. Data Flow: Telegram to Agent and Back
   1. Ingestion: A user sends a message on Telegram. The extensions/telegram node receives this via a webhook or long-polling.
   2. Normalization: The extension converts the Telegram payload into a standard Clawdbot message format.
   3. Transport: The extension, acting as a client, wraps this message in a req (request) frame and sends it to the Gateway over a persistent WebSocket
      connection.
   4. Gateway Processing:
       * The Gateway receives the frame and validates it using TypeBox schemas.
       * It authenticates the request (checking device signatures or tokens).
       * It identifies the target session and invokes the agent runtime via runEmbeddedPiAgent.
   5. Agent Execution: The Agent (Pi) processes the message history. If it decides to reply, it doesn't send a raw HTTP request. Instead, it issues a "Tool
      Call" (e.g., sendMessage).
   6. Outbound Routing: This tool call is intercepted by the Gateway's OutboundService. The service looks up which node owns the session (the Telegram node)
      and routes the instruction back to it.
   7. Delivery: The Telegram extension receives the instruction and makes the final API call to the Telegram servers to display the response to the user.

  4. Dependency Injection
  Clawdbot uses a Functional Dependency Injection pattern.
   * `createDefaultDeps`: Located in src/cli/deps.ts, this function is the "composition root." It creates all the singleton services (database connections,
     loggers, API clients) and bundles them into a single CliDeps object.
   * Usage: This deps object is passed down through the call stack to functions that need it. This makes testing easy—unit tests can simply pass a mock deps
     object with fake services instead of spinning up the real infrastructure.

  5. Core Invariants ("Golden Rules")
   1. Security by Default: Nodes must authenticate via a cryptographic Device Pairing protocol (public/private key handshake) or strict token authentication.
      Unverified connections are dropped immediately.
   2. Session Isolation: Every conversation is treated as a distinct Session. The SessionManager ensures that context from one user does not leak to another
      and handles the storage and retrieval of chat history (transcripts).
   3. Protocol Strictness: All communication over the WebSocket must adhere to strict JSON schemas defined with TypeBox. Malformed messages are rejected at the
      gate to prevent undefined behavior in the core logic.


1. Tool & Skill Discovery
  Dynamic Loading via `jiti`:
  Clawdbot uses a custom discovery and loading system located in src/plugins/.
   * Discovery: src/plugins/discovery.ts scans specific directories (like extensions/, src/tools/) for plugins.
   * Loading: src/plugins/loader.ts uses the `jiti` library to dynamically import TypeScript files at runtime without requiring a separate compilation step.
   * Registration: Plugins export a register function. When loaded, this function is called with a ClawdbotPluginApi object, allowing the plugin to register
     tools, webhooks, and event handlers into the central PluginRegistry (src/plugins/registry.ts).
   * Skills (ClawdHub): These are lighter-weight definitions (often just SKILL.md files) found by src/agents/skills.ts. The agent reads these markdown files to
     understand how to use tools, effectively "prompt-injecting" capabilities.

  2. Concurrency & Locking
  File-Based Session Locking (`proper-lockfile`):
  To ensure only one process handles a session at a time, Clawdbot implements strict file-level locking.
   * Mechanism: src/agents/session-write-lock.ts exports acquireSessionWriteLock. It uses the `proper-lockfile` library to create a .lock file alongside the
     session's JSON storage.
   * Usage: Before the Gateway or an Agent writes to a session transcript (e.g., in src/gateway/server-methods/sessions.ts or during auto-reply logic), it must
     acquire this lock. If the lock is held by another process (like a CLI tool or another Gateway instance), the request waits or fails with GatewayLockError.
   * Gateway Singleton: The Gateway itself uses a similar mechanism (src/infra/gateway-lock.ts) to ensure only one Gateway instance runs on a given
     port/configuration.

  3. Security Sandboxing
  Docker Wrapper Implementation:
  The "sandbox" is implemented as a wrapper around the docker CLI, orchestrated by TypeScript code.
   * Location: src/agents/bash-tools.exec.ts is the core implementation.
   * Logic: When a tool call requests execution in the sandbox:
       1. It resolves the configuration (image name, workdir).
       2. It calls buildDockerExecArgs (from bash-tools.shared.ts) to construct a command array: ['docker', 'exec', '-i', containerName, ...].
       3. It spawns this command using node:child_process.
   * Sanitization: The security isn't just "sanitizing strings" but rather isolation. The command runs inside the container. However,
     src/infra/exec-approvals.ts acts as a gatekeeper (the "Approve/Deny" system). It checks against an allowlist of safe commands. If a command isn't allowed,
     it throws an error or requests interactive user approval before docker exec is ever called.

  4. Type Safety (TypeBox)
  Runtime Protocol Validation:
  Clawdbot uses TypeBox (@sinclair/typebox) to define schemas that serve as both TypeScript types (via inference) and runtime validators.

   * Schema Definition:
      In src/gateway/protocol/schema/frames.ts, the Request Frame is defined:

   1     export const RequestFrameSchema = Type.Object(
   2       {
   3         type: Type.Literal("req"),
   4         id: NonEmptyString,
   5         method: NonEmptyString,
   6         params: Type.Optional(Type.Unknown()),
   7       },
   8       { additionalProperties: false },
   9     );

   * Validation Logic:
      In src/gateway/server/ws-connection/message-handler.ts, incoming WebSocket messages are parsed and immediately validated:

   1     // Inside the message handler loop
   2     if (!validateRequestFrame(parsed)) {
   3        // ... returns errorShape(ErrorCodes.INVALID_REQUEST, ...)
   4     }
      The validateRequestFrame function is a compiled validator (likely created via TypeBox's TypeCompiler.Compile or a similar wrapper in
  src/protocol/index.ts) that performs high-performance checks against the schema. This ensures malformed JSON never reaches the core business logic.
