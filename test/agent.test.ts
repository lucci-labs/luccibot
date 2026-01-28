import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";
import { Agent } from "../agent/agent";
import { Hub } from "../hub/hub";
import { ConfigService } from "../config/config";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Mock Config Service Environment
const TEMP_DIR = path.join(os.tmpdir(), "luccibot-agent-test-" + Date.now());
const CONFIG_PATH = path.join(TEMP_DIR, "config.json");

describe("Agent", () => {
  let hub: Hub;
  let configService: ConfigService;
  let agent: Agent;

  beforeEach(() => {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);
    
    hub = new Hub();
    configService = new ConfigService(hub, CONFIG_PATH);
    agent = new Agent(hub, configService);
  });

  afterAll(() => {
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  it("should handle 'config set' command", async () => {
    const p = new Promise<void>((resolve) => {
      hub.onLog((log) => {
        if (log.message.includes("Provider 'openai' updated")) resolve();
      });
    });

    hub.emitInput({ text: "config set openai sk-test gpt-4" });
    
    await p;
    const provider = configService.getProvider("openai");
    expect(provider?.apiKey).toBe("sk-test");
    expect(provider?.activeModels).toContain("gpt-4");
  });

  it("should handle 'config use' command", async () => {
    configService.setProvider("anthropic", { apiKey: "sk-ant" });
    
    const p = new Promise<void>((resolve) => {
      hub.onLog((log) => {
        if (log.message.includes("Default provider set to 'anthropic'")) resolve();
      });
    });

    hub.emitInput({ text: "config use anthropic" });
    
    await p;
    expect(configService.getConfig().defaultProvider).toBe("anthropic");
  });

  it("should fallback to hardcoded swap logic", async () => {
    const p = new Promise<void>((resolve) => {
      hub.onAction((action) => {
        if (action.skill === "swap") resolve();
      });
    });

    hub.emitInput({ text: "swap 10 eth" });
    await p;
    expect(true).toBe(true);
  });
});
