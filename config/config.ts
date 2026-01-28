import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Hub } from "../hub/hub";
import { PROVIDERS } from "./constants";

// --- Zod Schema for Configuration ---

export const ProviderConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  activeModels: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});

const defaultProviders = Object.entries(PROVIDERS).reduce((acc, [key, value]) => {
  acc[key] = {
    activeModels: [...value.models],
    enabled: true,
  };
  return acc;
}, {} as Record<string, z.infer<typeof ProviderConfigSchema>>);

export const ConfigSchema = z.object({
  providers: z.record(z.string(), ProviderConfigSchema).default(defaultProviders),
  defaultProvider: z.string().optional(),
  defaultModel: z.string().optional(),
  user: z.object({
    name: z.string().optional(),
    theme: z.enum(["light", "dark", "system"]).default("system"),
  }).default({ theme: "system" }),
});

export type Config = z.infer<typeof ConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

export class ConfigService {
  private config: Config;
  private readonly configPath: string;
  private hub: Hub;

  constructor(hub: Hub, configPath?: string) {
    this.hub = hub;
    // Default to ~/.luccibot/config.json
    this.configPath = configPath || path.join(os.homedir(), ".luccibot", "config.json");
    
    // Initialize with defaults
    this.config = ConfigSchema.parse({});
    
    this.ensureConfigDir();
    this.load();
  }

  private ensureConfigDir() {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (error) {
        this.hub.emitLog({ 
          level: "error", 
          message: `Failed to create config directory at ${dir}: ${error}` 
        });
      }
    }
  }

  /**
   * Loads configuration from disk. 
   * If file doesn't exist, it creates it with current defaults.
   */
  public load() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, "utf-8");
        const parsed = JSON.parse(raw);
        // Merge with existing defaults to ensure new fields are present
        const result = ConfigSchema.safeParse(parsed);
        
        if (result.success) {
          this.config = result.data;
          this.hub.emitLog({ level: "info", message: "Configuration loaded." });
        } else {
          this.hub.emitLog({ 
            level: "warn", 
            message: `Config validation failed: ${result.error.message}. Using defaults where necessary.` 
          });
          // Attempt to salvage valid parts or fallback? 
          // For now, we keep the defaults for invalid parts if we were to partial parse, 
          // but safeParse failing means we might want to just warn.
          // Let's rely on Zod's parsing to handle partials if we wanted, but here we just keep defaults if it fails hard.
        }
      } else {
        this.save(); // Create the file
      }
    } catch (error) {
      this.hub.emitLog({ level: "error", message: `Failed to load config: ${error}` });
    }
  }

  /**
   * Saves current configuration to disk.
   */
  public save() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      this.hub.emitLog({ level: "error", message: `Failed to save config: ${error}` });
    }
  }

  /**
   * Get the full config object (read-only recommended)
   */
  public getConfig(): Config {
    return this.config;
  }

  /**
   * Get a specific provider's config
   */
  public getProvider(name: string): ProviderConfig | undefined {
    return this.config.providers[name];
  }

  /**
   * Set/Update a provider's config
   */
  public setProvider(name: string, config: Partial<ProviderConfig>) {
    const current = this.config.providers[name] || ProviderConfigSchema.parse({});
    this.config.providers[name] = { ...current, ...config };
    this.save();
    this.hub.emitLog({ level: "success", message: `Updated configuration for provider: ${name}` });
  }

  /**
   * Set global default provider
   */
  public setDefaultProvider(name: string) {
    this.config.defaultProvider = name;
    this.save();
  }
  
  /**
   * Set global default model
   */
  public setDefaultModel(model: string) {
    this.config.defaultModel = model;
    this.save();
  }

  /**
   * Generic setter for top-level keys
   */
  public set<K extends keyof Config>(key: K, value: Config[K]) {
    this.config[key] = value;
    this.save();
  }
}
