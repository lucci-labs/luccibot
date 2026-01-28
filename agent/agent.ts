import { Hub } from "../hub/hub";

export class Agent {
  private hub: Hub;

  constructor(hub: Hub) {
    this.hub = hub;
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.onInput((data) => {
      this.processInput(data.text);
    });
  }

  private async processInput(input: string) {
    // 1. Acknowledge
    this.hub.emitThought({ status: "thinking", message: "Parsing intent..." });

    const lower = input.toLowerCase().trim();

    // 2. Mock Logic (Regex "Brain")
    if (lower.startsWith("swap")) {
      const parts = lower.split(" ");
      const args = parts.slice(1);

      this.hub.emitThought({
        status: "working",
        message: "Intent identified: Transaction",
        details: "Preparing to call Bridge..."
      });

      // Simulate a small delay for effect
      await new Promise(r => setTimeout(r, 500));

      this.hub.emitAction({
        skill: "swap",
        args: args
      });
    }
    else if (lower === "clear") {
      // Handled by UI mostly, but we can log
      this.hub.emitLog({ level: "info", message: "Console cleared." });
      this.hub.emitThought({ status: "thinking", message: "Waiting..." });
      this.hub.emitThought({ status: "idle", message: "Ready." });
    }
    else {
      // Chat fallback
      await new Promise(r => setTimeout(r, 600)); // "Thinking" time
      this.hub.emitLog({
        level: "info",
        message: `LucciBot: I heard "${input}", but I only know 'swap' right now.`
      });
      this.hub.emitThought({ status: "idle", message: "Ready." });
    }
  }
}
