import { $ } from "bun";
import { Hub } from "../hub/hub";
import { ActionRequest } from "../types/types";
import path from "path";

export class Bridge {
  private hub: Hub;
  private skillsDir: string;

  constructor(hub: Hub, skillsDir: string = "./skills") {
    this.hub = hub;
    this.skillsDir = skillsDir;
    this.setupListeners();
  }

  private setupListeners() {
    this.hub.onAction(async (action) => {
      await this.executeSkill(action);
    });
  }

  private async executeSkill(action: ActionRequest) {
    const { skill, args } = action;
    const scriptPath = path.join(this.skillsDir, `${skill}.ts`);

    this.hub.emitThought({ 
      status: "working", 
      message: `Bridge executing skill: ${skill}`,
      details: `Args: ${args.join(" ")}`
    });

    try {
      // Use Bun.$ to execute the script
      // We assume the script prints a JSON to stdout which is the "Transaction" or Result
      const output = await $`bun ${scriptPath} ${args}`.text();
      
      this.hub.emitLog({ level: "info", message: `Skill '${skill}' finished.` });

      // Try to parse output as JSON transaction
      try {
        const txJson = JSON.parse(output);
        
        // If it looks like a transaction, send to Vault
        this.hub.emitSignRequest({
          payload: txJson,
          description: `Result from ${skill}`
        });

      } catch (e) {
        // Output wasn't JSON, just log it
        this.hub.emitLog({ level: "info", message: `Output: ${output.trim()}` });
        this.hub.emitThought({ status: "idle", message: "Task completed." });
      }

    } catch (err) {
      this.hub.emitLog({ level: "error", message: `Bridge Error: ${err}` });
      this.hub.emitThought({ status: "error", message: `Failed to execute ${skill}` });
    }
  }
}
