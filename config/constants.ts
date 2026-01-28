
export const PROVIDERS = {
  google: {
    name: "Google",
    models: [
      "gemini-2.0-pro-exp",
      "gemini-2.0-flash-thinking-exp",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
  },
  openai: {
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "o1"],
  },
  anthropic: {
    name: "Anthropic",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
  },
} as const;

export type ProviderName = keyof typeof PROVIDERS;

export const COMMANDS = [
  { label: "/config set", description: "Set provider API key & model" },
  { label: "/config use", description: "Switch default provider" },
  { label: "/swap", description: "Swap tokens (simulated)" },
  { label: "/clear", description: "Clear console logs" },
  { label: "/help", description: "Show help" },
];
