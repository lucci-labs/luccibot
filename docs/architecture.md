# LucciBot Architecture

## Overview

LucciBot is designed as a local-first, secure, and interactive AI agent environment. It decouples the user interface, the agent's reasoning, and high-risk operations (like transaction signing) into distinct components.

## Core Components

### 1. The Hub (`hub/`)
The **Hub** is the central nervous system. It extends `EventEmitter` and provides a strongly-typed API for all inter-component communication.
*   **Responsibility**: Routing messages between UI, Agent, Bridge, and Vault.
*   **Safety**: Uses **Zod** schemas to validate every event (`emitThought`, `emitInput`, `emitLog`) at runtime.

### 2. The User Interface (`ui/`)
A Terminal User Interface (TUI) built with **React** and **@opentui/react**.
*   **Responsibility**:
    *   Rendering the "Agent State" (Thinking, Working, Idle).
    *   Displaying logs and transaction results.
    *   Capturing user keyboard input.
*   **Isolation**: The UI is purely a view layer; it sends input to the Hub and reacts to Hub events.

### 3. The Agent (`agent/`)
The decision-making entity.
*   **Current Implementation**: A heuristic-based engine (Regex/Logic) that parses natural language.
*   **Flow**:
    1.  Receives `user_input` from Hub.
    2.  Emits `thinking` status.
    3.  Determines intent (e.g., "swap").
    4.  Emits an `action_request` to the Hub.

### 4. The Bridge (`bridge/`)
The interface between the internal Agent and external "Skills".
*   **Responsibility**: Executing independent scripts located in `skills/`.
*   **Security**: Runs skills in a subprocess (via `bun $`).
*   **Output**: Captures `stdout` from skills. If the output is JSON, it attempts to parse it as a transaction payload for the Vault.

### 5. The Vault (`vault/`)
A secure module for managing secrets and signing transactions.
*   **Responsibility**:
    *   Listening for `sign_request` events.
    *   Accessing the system keychain (via `keytar` or a mock fallback).
    *   Signing payloads.
*   **Philosophy**: The Agent can *request* a signature, but only the Vault can *perform* it. In a production version, this would require explicit user confirmation via the TUI.

## Data Flow Example: "Swap"

1.  **User**: Types "swap 100 USDC to ETH".
2.  **UI**: Emits `user_input` -> **Hub**.
3.  **Agent**: Listens to `user_input`. Parses string. Identifies `swap` skill. Emits `action_request` -> **Hub**.
4.  **Bridge**: Listens to `action_request`. Spawns `bun skills/swap.ts 100 USDC to ETH`.
5.  **Skill**: Calculates route. Prints JSON transaction object to stdout.
6.  **Bridge**: Captures JSON. Emits `sign_request` -> **Hub**.
7.  **Vault**: Listens to `sign_request`. Retrieves private key. Signs transaction. Emits `success` log -> **Hub**.
8.  **UI**: Displays "Transaction signed successfully".
