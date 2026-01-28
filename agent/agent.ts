import { Hub } from "../hub/hub";
import { ConfigService, ProviderConfig } from "../config/config";

export class Agent {
  private hub: Hub;
  private configService: ConfigService;

  constructor(hub: Hub, configService: ConfigService) {
    this.hub = hub;
    this.configService = configService;
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

    // 2. Hardcoded/Reflex Logic (Fast Path)
    if (lower.startsWith("swap")) {
      await this.handleSwap(lower);
      return;
    }

    if (lower.startsWith("config")) {
      await this.handleConfig(input); // Pass original input to preserve case for keys
      return;
    }
    
    if (lower === "clear") {
      this.hub.emitLog({ level: "info", message: "Console cleared." });
      this.hub.emitThought({ status: "idle", message: "Ready." });
      return;
    }

    // 3. LLM Logic (Slow Path)
    // Check if we have a provider configured
    const providerName = this.configService.getConfig().defaultProvider || "openai";
    const provider = this.configService.getProvider(providerName);

    if (provider && provider.apiKey) {
      await this.handleLLMChat(input, provider);
    } else {
      // Fallback if no LLM configured
      await new Promise(r => setTimeout(r, 600)); 
      this.hub.emitLog({
        level: "info",
        message: `Configure an LLM provider in ~/.luccibot/config.json to enable chat`
      });
      this.hub.emitThought({ status: "idle", message: "Ready." });
    }
  }

  private async handleSwap(input: string) {
    const parts = input.split(" ");
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

  private async handleConfig(input: string) {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[1]?.toLowerCase();

    if (cmd === "set") {
      // config set <provider> <key> [model]
      const provider = parts[2];
      const key = parts[3];
      const model = parts[4];

      if (!provider || !key) {
        this.hub.emitLog({ level: "warn", message: "Usage: config set <provider> <key> [model]" });
        this.hub.emitThought({ status: "idle", message: "Invalid config command." });
        return;
      }

      const updates: Partial<ProviderConfig> = { apiKey: key };
      if (model) updates.activeModels = [model];
      
      this.configService.setProvider(provider, updates);
      
      // If this is the first provider, make it default
      if (!this.configService.getConfig().defaultProvider) {
        this.configService.setDefaultProvider(provider);
      }

      this.hub.emitLog({ level: "success", message: `Provider '${provider}' updated.` });
      this.hub.emitThought({ status: "idle", message: "Config updated." });
    } 
    else if (cmd === "use") {
      // config use <provider>
      const provider = parts[2];
      if (!provider) {
        this.hub.emitLog({ level: "warn", message: "Usage: config use <provider>" });
        return;
      }
      this.configService.setDefaultProvider(provider);
      this.hub.emitLog({ level: "success", message: `Default provider set to '${provider}'.` });
      this.hub.emitThought({ status: "idle", message: "Config updated." });
    }
    else {
      this.hub.emitLog({ level: "warn", message: "Unknown config command. Try 'set' or 'use'." });
      this.hub.emitThought({ status: "idle", message: "Ready." });
    }
  }

  private async handleLLMChat(input: string, provider: ProviderConfig) {
    this.hub.emitThought({ status: "thinking", message: "Consulting LLM...", details: "Streaming response..." });

    try {
      // Basic OpenAI-compatible completion
      const baseUrl = provider.baseUrl || "https://api.openai.com/v1";
      const model = provider.activeModels[0] || "gpt-3.5-turbo";
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: "You are LucciBot, a helpful CLI assistant. Be concise." },
            { role: "user", content: input }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "(No response)";

      this.hub.emitLog({
        level: "info",
        message: `LucciBot: ${reply}`
      });
      
      this.hub.emitThought({ status: "idle", message: "Ready." });

    } catch (error) {
      this.hub.emitLog({ level: "error", message: `LLM Error: ${error}` });
      this.hub.emitThought({ status: "error", message: "Failed to reach LLM." });
    }
  }
}
