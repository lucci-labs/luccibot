import { Hub } from "../hub/hub";
import { SignRequest } from "../types/types";

// Interface for what we expect from Keytar
interface KeychainAdapter {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
}

export class Vault {
  private hub: Hub;
  private serviceName = "luccibot-vault";
  private keychain: KeychainAdapter;

  constructor(hub: Hub) {
    this.hub = hub;
    this.keychain = this.loadKeychain();
    this.setupListeners();
  }

  private loadKeychain(): KeychainAdapter {
    try {
      // Try to require the native keytar module
      // Using 'require' dynamically to avoid build errors if missing during scaffold
      const keytar = require("keytar");
      return keytar;
    } catch (e) {
      this.hub.emitLog({
        level: "warn",
        message: "Keytar not found. Using in-memory mock vault (Data will be lost on exit).",
      });
      return new MockKeychain();
    }
  }

  private setupListeners() {
    this.hub.onSignRequest(async (req) => {
      await this.handleSigning(req);
    });
  }

  private async handleSigning(req: SignRequest) {
    try {
      this.hub.emitThought({ status: "working", message: "Vault accessing secure storage..." });

      // 1. Retrieve Private Key (In a real app, we'd prompt for which account)
      const privKey = await this.keychain.getPassword(this.serviceName, "default-account");
      
      if (!privKey) {
        // For demo purposes, if no key exists, we create a dummy one
        await this.keychain.setPassword(this.serviceName, "default-account", "0xMOCK_PRIVATE_KEY_" + Date.now());
        this.hub.emitLog({ level: "info", message: "Created new default account in Vault." });
      }

      // 2. Mock Signing Process
      // In reality, we'd import ethers.js or viem here and use the privKey
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate work

      this.hub.emitLog({ 
        level: "success", 
        message: `Transaction ${req.txId.slice(0, 8)} signed successfully.` 
      });

      this.hub.emitThought({ status: "idle", message: "Ready." });

    } catch (err) {
      this.hub.emitLog({ level: "error", message: `Signing failed: ${err}` });
      this.hub.emitThought({ status: "error", message: "Signing failed." });
    }
  }
}

// Fallback Mock
class MockKeychain implements KeychainAdapter {
  private storage = new Map<string, string>();

  async getPassword(service: string, account: string) {
    return this.storage.get(`${service}:${account}`) || null;
  }
  async setPassword(service: string, account: string, password: string) {
    this.storage.set(`${service}:${account}`, password);
  }
  async deletePassword(service: string, account: string) {
    return this.storage.delete(`${service}:${account}`);
  }
}
