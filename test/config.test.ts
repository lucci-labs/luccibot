import { describe, it, expect, afterAll, beforeAll } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Hub } from "../hub/hub";
import { ConfigService } from "../config/config";

const TEMP_DIR = path.join(os.tmpdir(), "luccibot-test-" + Date.now());
const CONFIG_PATH = path.join(TEMP_DIR, "config.json");

describe("ConfigService", () => {
  let hub: Hub;
  let configService: ConfigService;

  beforeAll(() => {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR);
    }
    hub = new Hub();
    configService = new ConfigService(hub, CONFIG_PATH);
  });

  afterAll(() => {
    // Clean up
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  });

  it("should create config file if it does not exist", () => {
    expect(fs.existsSync(CONFIG_PATH)).toBe(true);
  });

  it("should have default values", () => {
    const config = configService.getConfig();
    expect(Object.keys(config.providers).length).toBeGreaterThan(0);
    expect(config.user?.theme).toBe("system");
  });

  it("should set and get provider config", () => {
    configService.setProvider("openai", { apiKey: "sk-test", activeModels: ["gpt-4"] });
    const provider = configService.getProvider("openai");
    expect(provider?.apiKey).toBe("sk-test");
    expect(provider?.activeModels).toContain("gpt-4");
  });

  it("should persist changes to disk", () => {
    // Re-instantiate to simulate restart
    const newConfigService = new ConfigService(new Hub(), CONFIG_PATH);
    const provider = newConfigService.getProvider("openai");
    expect(provider?.apiKey).toBe("sk-test");
  });

  it("should update existing provider config without overwriting other fields", () => {
    configService.setProvider("openai", { baseUrl: "https://api.openai.com/v1" });
    const provider = configService.getProvider("openai");
    expect(provider?.apiKey).toBe("sk-test"); // Should persist
    expect(provider?.baseUrl).toBe("https://api.openai.com/v1");
  });
});
