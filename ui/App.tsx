import React, { useState, useEffect } from "react";
// @ts-ignore
import { useKeyboard } from "@opentui/react"; 
import { Hub } from "../hub/hub";
import { LogEvent, AgentThought } from "../types/types";

const THEME = {
  green: "#00FF41",
  dim: "#666",
  border: "round",
};

interface AppProps {
  hub: Hub;
}

const App: React.FC<AppProps> = ({ hub }) => {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [thought, setThought] = useState<AgentThought>({ status: "idle", message: "System Ready." });
  const [input, setInput] = useState("");

  // Listen to Hub events
  useEffect(() => {
    hub.onLog((log) => setLogs(prev => [...prev.slice(-19), log])); // Keep last 20
    hub.onThought((t) => setThought(t));
  }, [hub]);

  // Handle User Input
  useKeyboard((key) => {
    // Basic key handling logic
    if (key.name === "return" || key.name === "enter") {
      if (input.trim()) {
        // Echo user input
        setLogs(prev => [...prev, { level: "info", message: `> ${input}`, timestamp: Date.now() }]);
        // Send to Hub
        hub.emitInput({ text: input });
        setInput("");
      }
    } else if (key.name === "backspace") {
      setInput(prev => prev.slice(0, -1));
    } else if (key.name.length === 1 && !key.ctrl && !key.meta) {
       // Only append single chars
      setInput(prev => prev + key.name);
    } else if (key.name === "space") {
      setInput(prev => prev + " ");
    }
  });

  return (
    // @ts-ignore - Intrinsic elements
    <box flexDirection="column" height="100%">
      
      {/* Main Split Pane */}
      {/* @ts-ignore */}
      <box flexDirection="row" flexGrow={1}>
        
        {/* Left: Agent Brain Stream */}
        {/* @ts-ignore */}
        <box 
          width="30%" 
          borderStyle="round" 
          borderColor={THEME.green} 
          flexDirection="column"
          title=" Agent State "
        >
          {/* @ts-ignore */}
          <text color={THEME.green} bold>Status: {thought.status.toUpperCase()}</text>
          {/* @ts-ignore */}
          <box height={1} />
          {/* @ts-ignore */}
          <text>{thought.message}</text>
          {/* @ts-ignore */}
          {thought.details && <text color="gray">{thought.details}</text>}
          
          {/* @ts-ignore */}
          <box marginTop={2}>
            {thought.status === "working" || thought.status === "thinking" ? (
               // @ts-ignore
               <text color={THEME.green}>● Processing...</text>
            ) : null}
          </box>
        </box>

        {/* Right: Terminal Output */}
        {/* @ts-ignore */}
        <box 
          width="70%" 
          borderStyle="round" 
          borderColor="white" 
          flexDirection="column"
          title=" Terminal "
        >
          {logs.map((log, i) => (
            // @ts-ignore
            <text key={i} color={log.level === "error" ? "red" : log.level === "success" ? "green" : "white"}>
              {log.message}
            </text>
          ))}
        </box>
      </box>

      {/* Bottom: Input Area */}
      {/* @ts-ignore */}
      <box 
        height={3} 
        borderStyle="round" 
        borderColor={THEME.green}
        flexDirection="row"
      >
        {/* @ts-ignore */}
        <text color={THEME.green} bold> COMMAND {">"} </text>
        {/* @ts-ignore */}
        <text>{input}</text>
        {/* @ts-ignore */}
        <text color={THEME.green} blinking>_</text>
      </box>

    </box>
  );
};

export default App;
