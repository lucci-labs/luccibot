import React, { useState, useEffect } from "react";
// @ts-ignore
import { useKeyboard } from "@opentui/react";
import { Hub } from "../hub/hub";
import { LogEvent, AgentThought } from "../types/types";
import { COMMANDS } from "../config/constants";

// OpenCode-inspired Vibrant Theme
const THEME = {
  // Core colors
  primary: "#D2A8FF",      // Soft Purple - Primary
  secondary: "#56D364",    // Green - Success/Active
  accent: "#E3B341",       // Gold/Amber - Highlights
  error: "#FF7B72",        // Soft Red - Errors
  success: "#3FB950",      // Vibrant Green - Success

  // Text colors
  text: "#F0F6FC",         // White-ish
  textSecondary: "#8B949E", // Gray
  textDim: "#6E7681",      // Dim Gray

  // Background colors
  bgPrimary: "#0D1117",    // Very Dark GitHub Dim
  bgSecondary: "#161B22",   // Slightly lighter
  bgHighlight: "#21262D",   // Highlight/Active Layer
  bgInput: "#010409",       // Deep black for input

  // State colors
  statusWorking: "#D2A8FF",
  statusError: "#FFA198",
  statusIdle: "#7EE787",
  statusThinking: "#79C0FF",

  // UI elements
  selection: "#1F6FEB",     // Blue selection
  borderColor: "#30363D",   // Subtle border
  panelBorder: "single",    // Keep for compat
  gradient1: "#D2A8FF",
  gradient2: "#E3B341",
};

interface AppProps {
  hub: Hub;
}

const App: React.FC<AppProps> = ({ hub }) => {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [thought, setThought] = useState<AgentThought>({ status: "idle", message: "Awaiting command." });
  const [input, setInput] = useState("");
  const [systemUptime, setSystemUptime] = useState(0);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

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
    // Command Selection Mode
    if (showCommands) {
      if (key.name === "up") {
        setSelectedCommandIndex(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.name === "down") {
        setSelectedCommandIndex(prev => Math.min(COMMANDS.length - 1, prev + 1));
        return;
      }
      if (key.name === "escape") {
        setShowCommands(false);
        return;
      }
      if (key.name === "enter" || key.name === "tab") {
        const cmd = COMMANDS[selectedCommandIndex].label.replace("/", "");
        setInput(cmd + " ");
        setShowCommands(false);
        return;
      }
      // If typing other keys, exit command mode but keep typing
      if (key.name.length === 1) {
        setShowCommands(false);
        // Fall through to normal input handling? 
        // For simplicity, just close command mode and let the next render handle input if we appended it?
        // Actually, the hook runs once per key. We should process it.
        // Let's just fall through.
      }
    }

    if (key.name === "return" || key.name === "enter") {
      if (input.trim()) {
        setLogs(prev => [...prev, { level: "info", message: `❯ ${input}`, timestamp: Date.now() }]);
        hub.emitInput({ text: input });
        setInput("");
        setShowCommands(false);
      }
    } else if (key.name === "backspace") {
      setInput(prev => {
        const next = prev.slice(0, -1);
        if (!next.includes("/")) setShowCommands(false);
        return next;
      });
    } else if (key.name.length === 1 && !key.ctrl && !key.meta) {
      const nextInput = input + key.name;
      setInput(nextInput);

      if (key.name === "/" && input.length === 0) {
        setShowCommands(true);
        setSelectedCommandIndex(0);
      }
    } else if (key.name === "space") {
      setInput(prev => prev + " ");
    }
  });

  return (
    // @ts-ignore - Intrinsic elements
    <box flexDirection="column" height="100%" padding={0} backgroundColor={THEME.bgPrimary}>

      {/* HEADER BAR */}
      {/* @ts-ignore */}
      <box height={1} flexDirection="row" justifyContent="space-between" paddingX={1} backgroundColor={THEME.bgHighlight}>
        {/* @ts-ignore */}
        <box flexDirection="row">
          {/* @ts-ignore */}
          <text bold color={THEME.textDim}>☰ </text>
          {/* @ts-ignore */}
          <text color={THEME.textSecondary}> AI Agent Environment</text>
        </box>

        {/* @ts-ignore */}
        <box flexDirection="row">
          {/* @ts-ignore */}
          <text color={THEME.textDim}>v2.0.0 </text>
          {/* @ts-ignore */}
          <text color={THEME.primary}>● Connected</text>
        </box>
      </box>

      {/* SEPARATOR */}
      {/* @ts-ignore */}
      <box height={1} flexDirection="row" paddingX={1}>
        {/* @ts-ignore */}
        <text color={THEME.textDim}>{"─".repeat(100)}</text>
      </box>

      {/* MAIN WORKSPACE */}
      {/* @ts-ignore */}
      <box flexDirection="row" flexGrow={1} marginTop={0}>

        {/* LEFT PANEL: NEURAL ENGINE (Sidebar) */}
        {/* @ts-ignore */}
        <box
          width="30%"
          flexDirection="column"
          padding={1}
          borderStyle="single"
          borderColor={THEME.borderColor}
        >
          {/* Status Header */}
          {/* @ts-ignore */}
          <box flexDirection="row" marginBottom={1}>
            {/* @ts-ignore */}
            <text color={THEME.primary}>← </text>
            {/* @ts-ignore */}
            <text color={THEME.textDim}>Edit ui/App.tsx</text>
          </box>

          {/* Current Thought Process / Status */}
          {/* @ts-ignore */}
          <box flexDirection="column" flexGrow={0} marginBottom={1}>
            {/* @ts-ignore */}
            <text
              color={
                thought.status === "working" ? THEME.statusWorking :
                  thought.status === "error" ? THEME.statusError :
                    thought.status === "thinking" ? THEME.statusThinking :
                      THEME.statusIdle
              }
            >
              {thought.status === "working" ? "⚡ " :
                thought.status === "error" ? "✖ " :
                  thought.status === "thinking" ? "⟳ " : "✓ "}{thought.status.toUpperCase()}
            </text>

            {/* @ts-ignore */}
            <box marginTop={0}>
              {/* @ts-ignore */}
              <text color={THEME.text}>{thought.message}</text>
            </box>
          </box>

          {/* Visual Improvements List (Mocked/Static based on image content or dynamic) */}
          {/* @ts-ignore */}
          <text color={THEME.text} bold marginTop={1}>🎨 Visual Improvements</text>

          {/* @ts-ignore */}
          <box flexDirection="column" marginTop={1}>
            {/* @ts-ignore */}
            <text color={THEME.accent}>Color Scheme:</text>
            {/* @ts-ignore */}
            <text color={THEME.textSecondary}>- Purple primary matching OpenCode</text>
            {/* @ts-ignore */}
            <text color={THEME.textSecondary}>- Vibrant status colors</text>
            {/* @ts-ignore */}
            <text color={THEME.textSecondary}>- Dark background</text>

            {/* @ts-ignore */}
            <text color={THEME.accent} marginTop={1}>Enhanced Header:</text>
            {/* @ts-ignore */}
            <text color={THEME.textSecondary}>- Multi-line version</text>
            {/* @ts-ignore */}
            <text color={THEME.textSecondary}>- Environment info</text>
          </box>

        </box>

        {/* RIGHT PANEL: CONSOLE OUTPUT */}
        {/* @ts-ignore */}
        <box
          width="70%"
          flexDirection="column"
          paddingX={1}
          borderStyle="none"
          borderColor={THEME.borderColor}
        >
          {/* @ts-ignore */}
          <box flexDirection="column" justifyContent="flex-end" flexGrow={1}>
            {logs.length === 0 && (
              // @ts-ignore
              <box flexDirection="column">
                {/* @ts-ignore */}
                <text color={THEME.textDim}>Perfect! Your UI has been updated with a much more colorful and modern OpenCode-inspired design. Here's what I've enhanced:</text>
                {/* @ts-ignore */}
                <text color={THEME.textDim}>...</text>
              </box>
            )}
            {logs.slice(-15).map((log, i) => {
              let logColor = THEME.text;
              let prefix = "•";
              if (log.level === "error") { logColor = THEME.error; prefix = "🔴"; }
              else if (log.level === "success") { logColor = THEME.success; prefix = "✅"; }
              else if (log.level === "warn") { logColor = THEME.accent; prefix = "⚠️"; }
              else if (log.message.startsWith("❯")) { logColor = THEME.primary; prefix = "My agent"; }

              return (
                // @ts-ignore
                <box key={i} flexDirection="row">
                  {/* @ts-ignore */}
                  <text color={THEME.selection}>▌ </text>
                  {/* @ts-ignore */}
                  <text color={THEME.textDim} width={10}>{log.level.toUpperCase()} </text>
                  {/* @ts-ignore */}
                  <text color={logColor}>{log.message.startsWith("❯") ? log.message.substring(2) : log.message}</text>
                </box>
              );
            })}
          </box>
        </box>
      </box>

      {/* COMMAND PALETTE POPUP */}
      {showCommands && (
        // @ts-ignore
        <box
          position="absolute"
          bottom={2}
          left={0}
          width="100%"
          height={Math.min(COMMANDS.length + 1, 10)}
          borderStyle="single"
          borderColor={THEME.primary}
          backgroundColor={THEME.bgSecondary}
          flexDirection="column"
          padding={0}
          zIndex={99}
        >
          {COMMANDS.slice(0, 6).map((cmd, i) => (
            // @ts-ignore
            <box key={i} flexDirection="row" paddingX={1} backgroundColor={i === selectedCommandIndex ? THEME.selection : undefined}>
              {/* @ts-ignore */}
              <text color={i === selectedCommandIndex ? THEME.accent : THEME.text}>
                {i === selectedCommandIndex ? "▶ " : "  "}{cmd.label.padEnd(15)}
              </text>
              {/* @ts-ignore */}
              <text color={THEME.textDim}>{cmd.description}</text>
            </box>
          ))}
        </box>
      )}

      {/* FOOTER: MODERN INPUT BAR */}
      {/* @ts-ignore */}
      <box
        height={3}
        backgroundColor={THEME.bgInput}
        flexDirection="row"
        alignItems="center"
        paddingX={1}
      >
        {/* Mode Badge */}
        {/* @ts-ignore */}
        <box backgroundColor={THEME.primary} paddingX={1} marginRight={1}>
          {/* @ts-ignore */}
          <text color={THEME.bgPrimary} bold>AGENT</text>
        </box>

        {/* Interactive Badge */}
        {/* @ts-ignore */}
        <box backgroundColor={THEME.bgHighlight} paddingX={1} marginRight={1}>
          {/* @ts-ignore */}
          <text color={THEME.textSecondary}>Opencode</text>
        </box>

        {/* Input prompt */}
        {/* @ts-ignore */}
        <text color={THEME.success} bold>❯ </text>

        {/* Text Input */}
        {/* @ts-ignore */}
        <text color={THEME.text}>{input}</text>

        {/* Blinking Cursor */}
        {/* @ts-ignore */}
        <text color={THEME.textDim} blinking>█</text>
      </box>

    </box>
  );
};

export default App;
