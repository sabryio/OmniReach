/**
 * WindowsTitleBar — top 36px chrome bar
 * Placeholder: app icon + name + status pills + theme/lang controls + window buttons
 */

import type { Session } from "@/features/sessions/schemas/session.schema";
import type {
  SchedulerState,
  ThemeColor,
  ThemeMode,
  WABridgeConfig,
} from "../schemas/layout.schema";

interface WindowsTitleBarProps {
  schedulerState: SchedulerState;
  config: WABridgeConfig;
  sessions: Session[];
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  onToggleScheduler: () => void;
  onToggleThemeMode: () => void;
  onSetThemeColor: (color: ThemeColor) => void;
  onOpenSettings: () => void;
}

export function WindowsTitleBar({
  schedulerState,
  sessions,
  themeMode,
  themeColor,
  onToggleScheduler,
  onToggleThemeMode,
  onSetThemeColor,
}: WindowsTitleBarProps) {
  const COLORS: ThemeColor[] = [
    "blue",
    "emerald",
    "violet",
    "amber",
    "rose",
    "cyan",
  ];

  return (
    <div className="h-9 bg-card border-b border-border select-none flex items-center justify-between px-3 z-40 shrink-0 text-xs">
      {/* Left: icon + title */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">
          O
        </div>
        <span className="font-semibold text-foreground">OmniReach</span>
        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
          Desktop
        </span>
      </div>

      {/* Center: status pills */}
      <div className="hidden md:flex items-center gap-3 text-[11px]">
        {/* Daemon status */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-muted-foreground">127.0.0.1:7171</span>
        </div>

        {/* Time window */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted">
          <span className="text-muted-foreground">
            {schedulerState.currentLocalTimeStr}
          </span>
          <span
            className={
              schedulerState.isWithinTimeWindow
                ? "text-success"
                : "text-destructive"
            }
          >
            {schedulerState.timeWindowText}
          </span>
        </div>

        {/* Queue pending */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted">
          <span className="text-muted-foreground">Queue:</span>
          <span className="text-foreground font-mono">
            {schedulerState.totalQueuePending}
          </span>
        </div>

        {/* Dispatcher toggle */}
        <button
          onClick={onToggleScheduler}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            schedulerState.isRunning
              ? "bg-success/20 text-success border border-success/30"
              : "bg-destructive/20 text-destructive border border-destructive/30"
          }`}
        >
          {schedulerState.isRunning ? "▶ Running" : "⏸ Paused"}
        </button>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Color picker */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onSetThemeColor(c)}
              title={c}
              className={`w-3 h-3 rounded-full transition-transform ${
                themeColor === c
                  ? "scale-125 ring-1 ring-ring ring-offset-1 ring-offset-background"
                  : ""
              }`}
              style={{
                backgroundColor: `var(--color-${c === themeColor ? "primary" : "muted-foreground"})`,
              }}
            />
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleThemeMode}
          className="px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {themeMode === "dark" ? "☀" : "☾"}
        </button>

        {/* Sessions count */}
        <span className="text-muted-foreground">
          {sessions.length} sessions
        </span>

        {/* Window controls placeholder */}
        <div className="flex items-center gap-1 ml-2">
          <button className="w-3 h-3 rounded-full bg-warning/70 hover:bg-warning transition-colors" />
          <button className="w-3 h-3 rounded-full bg-success/70 hover:bg-success transition-colors" />
          <button className="w-3 h-3 rounded-full bg-destructive/70 hover:bg-destructive transition-colors" />
        </div>
      </div>
    </div>
  );
}
