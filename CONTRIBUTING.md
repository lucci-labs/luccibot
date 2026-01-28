# Contributing to LucciBot

Thank you for your interest in improving LucciBot!

## Development Stack

*   **Runtime**: [Bun](https://bun.sh)
*   **Language**: TypeScript
*   **UI Framework**: React (via `@opentui/react`)
*   **Validation**: Zod

## Workflow

1.  **Fork & Clone**:
    ```bash
    git clone https://github.com/your-username/luccibot.git
    cd luccibot
    ```

2.  **Install Dependencies**:
    ```bash
    bun install
    ```

3.  **Make Changes**:
    *   **Logic**: Updates to `agent/`, `hub/`, etc. should include relevant tests in `test/`.
    *   **UI**: Updates to `ui/` should be verified by running the TUI locally (`bun start`).

4.  **Verify**:
    *   Run static analysis: `bun run build` (runs `tsc`).
    *   Run tests: `bun run test`.

5.  **Submit PR**:
    *   Ensure all checks pass.
    *   Describe your changes clearly.

## Adding Skills

To add a new capability to LucciBot:
1.  Create a script in `skills/<skill-name>.ts`.
2.  Ensure it outputs JSON to stdout if it performs a transaction.
3.  The Agent logic in `agent/agent.ts` currently mocks intent parsing; update it to trigger your new skill.