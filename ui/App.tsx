import React, { useState, useEffect } from "react";
// @ts-ignore
import { useKeyboard } from "@opentui/react"; 
import { Hub } from "../hub/hub";
import { LogEvent, AgentThought } from "../types/types";

// Professional "OpenCode" / Hacker Aesthetic
const THEME = {
  primary: "#007BFF",    // Deep Azure Blue
  secondary: "#00FF41",  // Matrix Green
  accent: "#FF00AA",     // Cyberpunk Pink
  warning: "#FFD700",    // Gold
  error: "#FF4444",      // Red
  text: "#E0E0E0",       // Soft White
  dim: "#666666",        // Gray
  panelBorder: "round",
};

interface AppProps {
  hub: Hub;
}

const App: React.FC<AppProps> = ({ hub }) => {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [thought, setThought] = useState<AgentThought>({ status: "idle", message: "Awaiting command." });
  const [input, setInput] = useState("");
  const [systemUptime, setSystemUptime] = useState(0);

  // Listen to Hub events
  useEffect(() => {
    hub.onLog((log) => setLogs(prev => [...prev.slice(-49), log])); // Increase scrollback
    hub.onThought((t) => setThought(t));
    
    // Fake system uptime ticker
    const timer = setInterval(() => setSystemUptime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [hub]);

  // Handle User Input
  useKeyboard((key) => {
    if (key.name === "return" || key.name === "enter") {
      if (input.trim()) {
        setLogs(prev => [...prev, { level: "info", message: `❯ ${input}`, timestamp: Date.now() }]);
        hub.emitInput({ text: input });
        setInput("");
      }
    } else if (key.name === "backspace") {
      setInput(prev => prev.slice(0, -1));
    } else if (key.name.length === 1 && !key.ctrl && !key.meta) {
      setInput(prev => prev + key.name);
    } else if (key.name === "space") {
      setInput(prev => prev + " ");
    }
  });

  return (
    // @ts-ignore - Intrinsic elements
    <box flexDirection="column" height="100%" padding={1}>
      
      {/* HEADER BAR */}
      {/* @ts-ignore */}
      <box height={3} borderStyle="single" borderColor={THEME.dim} flexDirection="row" justifyContent="space-between" paddingX={2}>
        {/* @ts-ignore */}
        <box flexDirection="row">
          {/* @ts-ignore */}
          <text bold color={THEME.primary}>LUCCIBOT </text>
          {/* @ts-ignore */}
          <text color={THEME.dim}>v2.0.0</text>
        </box>
        
        {/* @ts-ignore */}
        <box flexDirection="row">
          {/* @ts-ignore */}
          <text color={THEME.dim}>ENV: </text>
          {/* @ts-ignore */}
          <text color={THEME.secondary}>BUN/REACT</text>
          {/* @ts-ignore */}
          <text color={THEME.dim}> | UPTIME: {new Date(systemUptime * 1000).toISOString().substr(11, 8)}</text>
        </box>
      </box>

      {/* MAIN WORKSPACE */}
      {/* @ts-ignore */}
      <box flexDirection="row" flexGrow={1} marginTop={0}>
        
        {/* LEFT PANEL: NEURAL STATE (Sidebar) */}
        {/* @ts-ignore */}
        <box 
          width="25%" 
          borderStyle={THEME.panelBorder} 
          borderColor={thought.status === "error" ? THEME.error : (thought.status === "working" ? THEME.accent : THEME.dim)}
          flexDirection="column"
          padding={1}
          title=" NEURAL ENGINE "
        >
          {/* Status Indicator */}
          {/* @ts-ignore */}
          <box flexDirection="column" marginBottom={1}>
            {/* @ts-ignore */}
            <text color={THEME.dim} bold>STATUS</text>
            {/* @ts-ignore */}
            <text 
              color={thought.status === "working" ? THEME.accent : (thought.status === "error" ? THEME.error : THEME.secondary)} 
            >
              ● {thought.status.toUpperCase()}
            </text>
          </box>

          {/* Current Thought Process */}
          {/* @ts-ignore */}
          <box flexDirection="column" flexGrow={1}>
            {/* @ts-ignore */}
            <text color={THEME.dim} bold>PROCESS</text>
            {/* @ts-ignore */}
            <text color={THEME.text}>{thought.message}</text>
            
            {thought.details && (
              // @ts-ignore
              <box marginTop={1} borderStyle="single" borderColor={THEME.dim} padding={1}>
                {/* @ts-ignore */}
                <text color={THEME.dim} italic>{thought.details}</text>
              </box>
            )}
          </box>

          {/* Active Skills / Modules (Mocked) */}
          {/* @ts-ignore */}
          <box flexDirection="column" marginTop={1}>
             {/* @ts-ignore */}
             <text color={THEME.dim} bold>MODULES</text>
             {/* @ts-ignore */}
             <text color={THEME.primary}>[Bridge] Active</text>
             {/* @ts-ignore */}
             <text color={THEME.primary}>[Vault]  Secure</text>
          </box>
        </box>

        {/* RIGHT PANEL: TERMINAL LOGS */}
        {/* @ts-ignore */}
        <box 
          width="75%" 
          borderStyle={THEME.panelBorder} 
          borderColor={THEME.dim} 
          flexDirection="column"
          marginLeft={1}
          title=" CONSOLE "
          paddingX={1}
        >
          {logs.length === 0 && (
             // @ts-ignore
             <box justifyContent="center" alignItems="center" height="100%">
                {/* @ts-ignore */}
                <text color={THEME.dim}>No activity recorded.</text>
             </box>
          )}
          
          <box flexDirection="column" justifyContent="flex-end" flexGrow={1}>
            {logs.map((log, i) => {
              let logColor = THEME.text;
              if (log.level === "error") logColor = THEME.error;
              if (log.level === "success") logColor = THEME.secondary;
              if (log.level === "warn") logColor = THEME.warning;
              if (log.message.startsWith("❯")) logColor = THEME.primary; // User input color

              return (
                // @ts-ignore
                <box key={i} marginBottom={0} flexDirection="row">
                  {/* @ts-ignore */}
                  <text color={THEME.dim} dimColor>{new Date(log.timestamp).toLocaleTimeString()} </text>
                  {/* @ts-ignore */}
                  <text color={logColor} bold={log.message.startsWith("❯")}>
                    {log.message}
                  </text>
                </box>
              );
            })}
          </box>
        </box>
      </box>

      {/* FOOTER: INPUT */}
      {/* @ts-ignore */}
      <box 
        height={3} 
        borderStyle={THEME.panelBorder} 
        borderColor={input.length > 0 ? THEME.primary : THEME.dim}
        flexDirection="row"
        marginTop={0}
        paddingX={1}
      >
        {/* @ts-ignore */}
        <text color={THEME.secondary} bold>USER@{process.env.USER || "LucciBot"} $ </text>
        {/* @ts-ignore */}
        <text color={THEME.text}>{input}</text>
        {/* @ts-ignore */}
        <text color={THEME.secondary} blinking>█</text>
      </box>

    </box>
  );
};

export default App;
