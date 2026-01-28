// @ts-ignore
import { createRoot } from "@opentui/react";
// @ts-ignore
import { createCliRenderer } from "@opentui/core";
import App from "./ui/App";
import { Hub } from "./hub/hub";
import { Agent } from "./agent/agent";
import { Vault } from "./vault/vault";
import { Bridge } from "./bridge/bridge";

// 1. Initialize System
const hub = new Hub();
const vault = new Vault(hub);
const bridge = new Bridge(hub, "./skills");
const agent = new Agent(hub);

// 2. Start TUI
const renderer = await createCliRenderer();
const root = createRoot(renderer);

root.render(<App hub={hub} />);

// 3. Graceful Shutdown
hub.on("shutdown", () => {
  root.unmount();
  process.exit(0);
});

// Log initial message
hub.emitLog({ level: "info", message: "LucciBot v2.0 (Bun/React) Initialized." });
