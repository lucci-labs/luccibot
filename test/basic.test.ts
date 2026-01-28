import { describe, it, expect } from "bun:test";
import { Hub } from "../hub/hub";
import { UserInputSchema } from "../types/types";

describe("Hub", () => {
  it("should validate user input schema", () => {
    const input = { text: "hello" };
    const parsed = UserInputSchema.parse(input);
    expect(parsed.text).toBe("hello");
  });

  it("should emit logs", async () => {
    const hub = new Hub();
    const message = "Test log";
    
    const p = new Promise<void>((resolve) => {
      hub.onLog((log) => {
        if (log.message === message) resolve();
      });
    });

    hub.emitLog({ level: "info", message });
    await p;
    expect(true).toBe(true);
  });
});
