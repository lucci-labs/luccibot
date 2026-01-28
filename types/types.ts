import { z } from "zod";

// --- Zod Schemas ---

export const AgentThoughtSchema = z.object({
  status: z.enum(["thinking", "idle", "working", "error"]),
  message: z.string(),
  details: z.string().optional(),
});

export const UserInputSchema = z.object({
  text: z.string().min(1),
});

export const ActionRequestSchema = z.object({
  skill: z.string(),
  args: z.array(z.string()),
});

export const SignRequestSchema = z.object({
  txId: z.string().uuid().default(() => crypto.randomUUID()),
  payload: z.any(), // Flexible for various crypto tx formats
  description: z.string().optional(),
});

export const LogEventSchema = z.object({
  level: z.enum(["info", "warn", "error", "success"]),
  message: z.string(),
  timestamp: z.number().default(() => Date.now()),
});

// --- Types ---

export type AgentThought = z.infer<typeof AgentThoughtSchema>;
export type UserInput = z.infer<typeof UserInputSchema>;
export type ActionRequest = z.infer<typeof ActionRequestSchema>;
export type SignRequest = z.infer<typeof SignRequestSchema>;
export type LogEvent = z.infer<typeof LogEventSchema>;
