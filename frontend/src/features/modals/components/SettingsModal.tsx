/**
 * SettingsModal — full-screen overlay with 4 tabs: Appearance / WABridge / Schedule / System
 * Placeholder
 */
import { useState } from "react";
import type {
  WABridgeConfig,
  SchedulerState,
  ThemeColor,
  ThemeMode,
} from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WABridgeConfig;
  schedulerState: SchedulerState;
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  onSaveConfig: (config: WABridgeConfig) => void;
  onSetThemeColor: (color: ThemeColor) => void;
  onToggleThemeMode: () => void;
  onSetStrictTimeWindow: (strict: boolean) => void;
  onSetSimulatedHourOffset: (offset: number) => void;
  onClearAllData: () => void;
}

type Tab = "appearance" | "wabridge" | "schedule" | "system";
const TABS: Tab[] = ["appearance", "wabridge", "schedule", "system"];

const COLORS: { id: ThemeColor; label: string; bg: string }[] = [
  { id: "blue", label: "Blue", bg: "bg-blue-500" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500" },
  { id: "violet", label: "Violet", bg: "bg-violet-500" },
  { id: "amber", label: "Amber", bg: "bg-amber-500" },
  { id: "rose", label: "Rose", bg: "bg-rose-500" },
  { id: "cyan", label: "Cyan", bg: "bg-cyan-500" },
];

export function SettingsModal({
  isOpen,
  onClose,
  config,
  schedulerState,
  themeMode,
  themeColor,
  onSaveConfig,
  onSetThemeColor,
  onToggleThemeMode,
  onSetStrictTimeWindow,
  onSetSimulatedHourOffset,
  onClearAllData,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("appearance");
  const [localConfig, setLocalConfig] = useState(config);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border px-6 shrink-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Appearance */}
          {tab === "appearance" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Theme Mode
                </p>
                <div className="flex gap-2">
                  {(["dark", "light", "system"] as ThemeMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={onToggleThemeMode}
                      className={`flex-1 py-2 text-xs rounded border capitalize transition-colors ${
                        themeMode === m
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {m === "dark"
                        ? "☾ Dark"
                        : m === "light"
                          ? "☀ Light"
                          : "⬡ System"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Accent Color
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSetThemeColor(c.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded border text-xs transition-colors ${
                        themeColor === c.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${c.bg} shrink-0`}
                      />
                      {c.label}
                      {themeColor === c.id && (
                        <span className="ml-auto">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* WABridge */}
          {tab === "wabridge" && (
            <div className="space-y-4">
              {[
                {
                  label: "Base URL",
                  key: "baseUrl",
                  type: "text",
                  placeholder: "http://127.0.0.1:8080",
                },
                {
                  label: "API Key",
                  key: "apiKey",
                  type: "password",
                  placeholder: "optional",
                },
                {
                  label: "Timeout (ms)",
                  key: "timeoutMs",
                  type: "number",
                  placeholder: "5000",
                },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={String(
                      (localConfig as Record<string, unknown>)[key] ?? "",
                    )}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        [key]:
                          type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                    placeholder={placeholder}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.useSimulationMode}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      useSimulationMode: e.target.checked,
                    })
                  }
                  className="accent-primary w-4 h-4"
                />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Simulation Mode
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Mock API responses without a live WABridge server
                  </p>
                </div>
              </label>

              {localConfig.useSimulationMode && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Simulated Latency (ms)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={3000}
                      step={100}
                      value={localConfig.simulatedNetworkLatencyMs}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          simulatedNetworkLatencyMs: Number(e.target.value),
                        })
                      }
                      className="w-full accent-primary"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {localConfig.simulatedNetworkLatencyMs}ms
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Unregistered Rate (0–1.0)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={localConfig.simulatedUnregisteredRate}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          simulatedUnregisteredRate: Number(e.target.value),
                        })
                      }
                      className="w-full accent-primary"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {(localConfig.simulatedUnregisteredRate * 100).toFixed(0)}
                      %
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => onSaveConfig(localConfig)}
                className="w-full py-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Save Configuration
              </button>
            </div>
          )}

          {/* Schedule */}
          {tab === "schedule" && (
            <div className="space-y-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedulerState.strictTimeWindow}
                  onChange={(e) => onSetStrictTimeWindow(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Strict Time Window (9AM – 9PM)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Block sending outside approved hours
                  </p>
                </div>
              </label>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Simulated Hour Offset (for testing)
                </label>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={schedulerState.simulatedHourOffset}
                  onChange={(e) =>
                    onSetSimulatedHourOffset(Number(e.target.value))
                  }
                  className="w-full accent-primary"
                />
                <p className="text-[10px] text-muted-foreground font-mono">
                  Offset: {schedulerState.simulatedHourOffset > 0 ? "+" : ""}
                  {schedulerState.simulatedHourOffset}h → Simulated:{" "}
                  {schedulerState.currentLocalTimeStr}
                </p>
              </div>

              <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-1 text-xs font-mono">
                <p className="text-muted-foreground">Scheduler State</p>
                <p>
                  Running:{" "}
                  <span
                    className={
                      schedulerState.isRunning
                        ? "text-success"
                        : "text-destructive"
                    }
                  >
                    {String(schedulerState.isRunning)}
                  </span>
                </p>
                <p>
                  Within window:{" "}
                  <span
                    className={
                      schedulerState.isWithinTimeWindow
                        ? "text-success"
                        : "text-warning"
                    }
                  >
                    {String(schedulerState.isWithinTimeWindow)}
                  </span>
                </p>
                <p>
                  Queue pending:{" "}
                  <span className="text-foreground">
                    {schedulerState.totalQueuePending}
                  </span>
                </p>
                <p>
                  Queue held:{" "}
                  <span className="text-warning">
                    {schedulerState.totalQueueHeld}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* System */}
          {tab === "system" && (
            <div className="space-y-4">
              <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-2 text-xs font-mono">
                <p className="text-muted-foreground font-semibold not-italic font-sans uppercase tracking-wide text-[10px]">
                  App Info
                </p>
                <p>
                  Version: <span className="text-foreground">0.1.0</span>
                </p>
                <p>
                  Runtime:{" "}
                  <span className="text-foreground">
                    React + Vite + TanStack
                  </span>
                </p>
                <p>
                  DB:{" "}
                  <span className="text-foreground">TanStack DB (local)</span>
                </p>
              </div>

              <div className="border border-destructive/30 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-destructive">
                  Danger Zone
                </p>
                <p className="text-xs text-muted-foreground">
                  Clear all local data including campaigns, queue, sessions, and
                  logs. This cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (
                      window.confirm("Clear ALL data? This cannot be undone.")
                    )
                      onClearAllData();
                  }}
                  className="px-3 py-1.5 text-xs rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  🗑 Clear All Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
