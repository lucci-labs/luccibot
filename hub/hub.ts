import { EventEmitter } from "events";
import { z } from "zod";
import { 
  AgentThought, 
  UserInput, 
  ActionRequest, 
  SignRequest, 
  LogEvent,
  AgentThoughtSchema,
  UserInputSchema,
  ActionRequestSchema,
  SignRequestSchema,
  LogEventSchema
} from "../types/types";

interface HubEvents {
  "agent_thought": (data: AgentThought) => void;
  "user_input": (data: UserInput) => void;
  "action_request": (data: ActionRequest) => void;
  "sign_request": (data: SignRequest) => void;
  "log": (data: LogEvent) => void;
  "shutdown": () => void;
}

export class Hub extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }

  // Type-safe emitters with Zod validation
  
  emitThought(data: z.input<typeof AgentThoughtSchema>) {
    const parsed = AgentThoughtSchema.parse(data);
    this.emit("agent_thought", parsed);
  }

  emitInput(data: z.input<typeof UserInputSchema>) {
    const parsed = UserInputSchema.parse(data);
    this.emit("user_input", parsed);
  }

  emitAction(data: z.input<typeof ActionRequestSchema>) {
    const parsed = ActionRequestSchema.parse(data);
    this.emit("action_request", parsed);
  }

  emitSignRequest(data: z.input<typeof SignRequestSchema>) {
    const parsed = SignRequestSchema.parse(data);
    this.emit("sign_request", parsed);
  }

  emitLog(data: z.input<typeof LogEventSchema>) {
    const parsed = LogEventSchema.parse(data);
    this.emit("log", parsed);
  }
  
  emitShutdown() {
    this.emit("shutdown");
  }

  // Type-safe listeners

  onThought(cb: (data: AgentThought) => void) {
    this.on("agent_thought", cb);
    return this;
  }

  onInput(cb: (data: UserInput) => void) {
    this.on("user_input", cb);
    return this;
  }

  onAction(cb: (data: ActionRequest) => void) {
    this.on("action_request", cb);
    return this;
  }

  onSignRequest(cb: (data: SignRequest) => void) {
    this.on("sign_request", cb);
    return this;
  }

  onLog(cb: (data: LogEvent) => void) {
    this.on("log", cb);
    return this;
  }
}
