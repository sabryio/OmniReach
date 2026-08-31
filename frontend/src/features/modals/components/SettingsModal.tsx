/**
 * SettingsModal — full-screen overlay with 4 tabs:
 *   Appearance · WABridge · Schedule · System
 *
 * Keeps mine's professional structure (scheduler debug, danger zone,
 * system info) + adds mockup's superior visual polish:
 *   - Icon-rich tab bar
 *   - Sectioned cards per setting group
 *   - Language picker
 *   - Theme mode 3-up card layout
 *   - Color palette with check-in-dot
 *   - Simulation sliders side-by-side
 *   - Tauri setup guide
 *   - Footer Save / Cancel buttons
 */
import { useState } from "react";
import {
  Settings,
  Server,
  Clock,
  Sliders,
  Check,
  Copy,
  Cpu,
  Trash2,
  Palette,
  Globe,
  Sun,
  Moon,
  Laptop,
  X,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type {
  WABridgeConfig,
  SchedulerState,
  ThemeColor,
  ThemeMode,
} from "@/features/layout/schemas/layout.schema";
import type { Session } from "@/features/sessions/schemas/session.schema";
import { useCreateSession, useDeleteSession } from "@/features/sessions";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WABridgeConfig;
  schedulerState: SchedulerState;
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  sessions: Session[];
  onSaveConfig: (config: WABridgeConfig) => void;
  onSetThemeColor: (color: ThemeColor) => void;
  onToggleThemeMode: () => void;
  onSetStrictTimeWindow: (strict: boolean) => void;
  onSetSimulatedHourOffset: (offset: number) => void;
  onClearAllData: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_PALETTES: {
  id: ThemeColor;
  label: string;
  dot: string;
  desc: string;
}[] = [
  {
    id: "blue",
    label: "Blue",
    dot: "bg-blue-500",
    desc: "Classic Desktop Default",
  },
  {
    id: "emerald",
    label: "Emerald",
    dot: "bg-emerald-500",
    desc: "Medical / Pharmacy Focus",
  },
  {
    id: "violet",
    label: "Violet",
    dot: "bg-violet-500",
    desc: "Modern Royal Violet",
  },
  {
    id: "amber",
    label: "Amber",
    dot: "bg-amber-500",
    desc: "Warm Golden Glow",
  },
  {
    id: "rose",
    label: "Rose",
    dot: "bg-rose-500",
    desc: "Vibrant Ruby Accent",
  },
  { id: "cyan", label: "Cyan", dot: "bg-cyan-500", desc: "Clinical Cyan Tone" },
];

const TAURI_COMMANDS = `# 1. Install frontend dependencies
npm install

# 2. Install Tauri v2 CLI (if not installed)
cargo install tauri-cli --version "^2.0.0"

# 3. Run desktop app in development mode
cargo tauri dev

# 4. Build standalone native production installer
cargo tauri build`;

type Tab = "appearance" | "wabridge" | "schedule" | "system";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "appearance",
    label: "Appearance",
    icon: <Palette className="w-3.5 h-3.5" />,
  },
  {
    id: "wabridge",
    label: "WABridge",
    icon: <Server className="w-3.5 h-3.5" />,
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  { id: "system", label: "System", icon: <Cpu className="w-3.5 h-3.5" /> },
];

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <div>
          <h4 className="text-xs font-bold text-foreground">{title}</h4>
          {desc && <p className="text-[11px] text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsModal({
  isOpen,
  onClose,
  config,
  schedulerState,
  themeMode,
  themeColor,
  sessions,
  onSaveConfig,
  onSetThemeColor,
  onToggleThemeMode,
  onSetStrictTimeWindow,
  onSetSimulatedHourOffset,
  onClearAllData,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("appearance");

  // Session management mutations
  const { createSession, isCreating } = useCreateSession();
  const { deleteSession, isDeleting } = useDeleteSession();

  // Session form state
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionApiKey, setNewSessionApiKey] = useState("");
  const [sessionFeedback, setSessionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // WABridge local state
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [useSimulation, setUseSimulation] = useState(config.useSimulationMode);
  const [latencyMs, setLatencyMs] = useState(config.simulatedNetworkLatencyMs);
  const [unregisteredRate, setUnregisteredRate] = useState(
    config.simulatedUnregisteredRate,
  );

  // Schedule local state
  const [strictWindow, setStrictWindow] = useState(
    schedulerState.strictTimeWindow,
  );
  const [hourOffset, setHourOffset] = useState(
    schedulerState.simulatedHourOffset ?? 0,
  );

  // Copy helper for Tauri code block
  const [copiedTauri, setCopiedTauri] = useState(false);
  const copyTauri = () => {
    navigator.clipboard.writeText(TAURI_COMMANDS);
    setCopiedTauri(true);
    setTimeout(() => setCopiedTauri(false), 2000);
  };

  const handleSave = () => {
    onSaveConfig({
      baseUrl: baseUrl.trim() || "http://127.0.0.1:7171",
      timeoutMs: config.timeoutMs,
      useSimulationMode: useSimulation,
      simulatedNetworkLatencyMs: latencyMs,
      simulatedUnregisteredRate: unregisteredRate,
    });
    onSetStrictTimeWindow(strictWindow);
    onSetSimulatedHourOffset(hourOffset);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Settings</h3>
              <p className="text-[11px] text-muted-foreground">
                Appearance, API connection, scheduling and system
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="px-5 border-b border-border flex items-center gap-0 overflow-x-auto shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`pb-2.5 pt-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all shrink-0 ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* ── APPEARANCE ── */}
          {tab === "appearance" && (
            <div className="space-y-4">
              {/* Language */}
              <SectionCard
                icon={<Globe className="w-4 h-4" />}
                title="Interface Language"
                desc="Changes display language across the application"
              >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      code: "en",
                      flag: "🇬🇧",
                      name: "English",
                      sub: "Standard LTR interface",
                    },
                    {
                      code: "ar",
                      flag: "🇸🇦",
                      name: "العربية",
                      sub: "واجهة عربية RTL",
                    },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      disabled
                      title="Language switching via URL (/en/ or /ar-EG/)"
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 text-start opacity-60 cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {lang.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {lang.sub}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Language is set via URL prefix — navigate to{" "}
                  <code className="bg-muted px-1 rounded font-mono">/en/</code>{" "}
                  or{" "}
                  <code className="bg-muted px-1 rounded font-mono">
                    /ar-EG/
                  </code>
                </p>
              </SectionCard>

              {/* Theme Mode */}
              <SectionCard
                icon={<Sun className="w-4 h-4" />}
                title="Theme Mode"
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "dark" as ThemeMode,
                      label: "Dark",
                      icon: Moon,
                      desc: "Elegant Dark",
                    },
                    {
                      id: "light" as ThemeMode,
                      label: "Light",
                      icon: Sun,
                      desc: "Crisp Light",
                    },
                    {
                      id: "system" as ThemeMode,
                      label: "System",
                      icon: Laptop,
                      desc: "System Match",
                    },
                  ].map(({ id, label, icon: Icon, desc }) => {
                    const active = themeMode === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onToggleThemeMode()}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          active
                            ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                            : "bg-muted/20 border-border hover:bg-muted/50"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mb-1 ${active ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className="text-xs font-bold text-foreground">
                          {label}
                        </span>
                        <span className="text-[9px] text-muted-foreground mt-0.5">
                          {desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Accent Color */}
              <SectionCard
                icon={<Palette className="w-4 h-4" />}
                title="Accent Color"
                desc="Applied to buttons, active states, and highlights"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLOR_PALETTES.map((c) => {
                    const active = themeColor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSetThemeColor(c.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-start transition-all ${
                          active
                            ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                            : "bg-muted/20 border-border hover:bg-muted/50"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full ${c.dot} shrink-0 flex items-center justify-center shadow-sm`}
                        >
                          {active && (
                            <Check className="w-2.5 h-2.5 text-white stroke-3" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground">
                            {c.label}
                          </div>
                          <div className="text-[9px] text-muted-foreground truncate">
                            {c.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── WABRIDGE ── */}
          {tab === "wabridge" && (
            <div className="space-y-4">
              <SectionCard
                icon={<Server className="w-4 h-4" />}
                title="API Connection"
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Base URL
                    </label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://127.0.0.1:7171"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={<Cpu className="w-4 h-4" />}
                title="Simulation Mode"
                desc="Mock API responses without a live WABridge server"
              >
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Enable Simulation
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Safe testing without real WhatsApp dispatch
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useSimulation}
                    onChange={(e) => setUseSimulation(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                </label>

                {useSimulation && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground block">
                        Network Latency ({latencyMs}ms)
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={1000}
                        step={50}
                        value={latencyMs}
                        onChange={(e) => setLatencyMs(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground block">
                        Unregistered Rate ({Math.round(unregisteredRate * 100)}
                        %)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={0.5}
                        step={0.05}
                        value={unregisteredRate}
                        onChange={(e) =>
                          setUnregisteredRate(Number(e.target.value))
                        }
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Session Management */}
              <SectionCard
                icon={<Server className="w-4 h-4" />}
                title="WhatsApp Sessions"
                desc="Each session represents a WhatsApp Business account connection"
              >
                {/* Session feedback banner */}
                {sessionFeedback && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      sessionFeedback.type === "success"
                        ? "bg-success/10 border-success/30 text-success"
                        : "bg-destructive/10 border-destructive/30 text-destructive"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {sessionFeedback.type === "success" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>{sessionFeedback.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSessionFeedback(null)}
                      className="text-[10px] font-bold uppercase hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Existing sessions list */}
                {sessions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Configured Sessions ({sessions.length})
                    </p>
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] border border-primary/20">
                            WA
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {session.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {session.phoneNumber || session.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              confirm(
                                `Delete session "${session.name}"? This cannot be undone.`,
                              )
                            ) {
                              try {
                                await deleteSession(session.id);
                                setSessionFeedback({
                                  type: "success",
                                  message: `Session "${session.name}" deleted successfully`,
                                });
                              } catch (error) {
                                setSessionFeedback({
                                  type: "error",
                                  message: `Failed to delete session: ${error instanceof Error ? error.message : "Unknown error"}`,
                                });
                              }
                            }
                          }}
                          disabled={isDeleting}
                          className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new session form */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Add New Session
                  </p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Session name (e.g., Main Account)"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                    <input
                      type="password"
                      placeholder="WABridge API key for this session"
                      value={newSessionApiKey}
                      onChange={(e) => setNewSessionApiKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !newSessionName.trim() ||
                          !newSessionApiKey.trim()
                        ) {
                          setSessionFeedback({
                            type: "error",
                            message:
                              "Please provide both session name and API key",
                          });
                          return;
                        }

                        try {
                          await createSession({
                            name: newSessionName.trim(),
                            apiKey: newSessionApiKey.trim(),
                            hourlyLimit: 1000,
                            dailyLimit: 10000,
                          });

                          setNewSessionName("");
                          setNewSessionApiKey("");

                          setSessionFeedback({
                            type: "success",
                            message: `Session "${newSessionName.trim()}" created successfully!`,
                          });
                        } catch (error) {
                          setSessionFeedback({
                            type: "error",
                            message: `Failed to create session: ${error instanceof Error ? error.message : "Unknown error"}`,
                          });
                        }
                      }}
                      disabled={
                        isCreating ||
                        !newSessionName.trim() ||
                        !newSessionApiKey.trim()
                      }
                      className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isCreating ? "Adding Session..." : "Add Session"}
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── SCHEDULE ── */}
          {tab === "schedule" && (
            <div className="space-y-4">
              <SectionCard
                icon={<Clock className="w-4 h-4" />}
                title="Time Window"
              >
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Strict Time Window (9AM – 9PM)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Block sending outside approved hours
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={strictWindow}
                    onChange={(e) => setStrictWindow(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                </label>
              </SectionCard>

              <SectionCard
                icon={<Sliders className="w-4 h-4" />}
                title="Time Travel (Testing)"
                desc="Simulate a different local hour for testing time-window logic"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Hour offset</span>
                    <span className="font-mono font-bold text-primary">
                      {hourOffset > 0 ? `+${hourOffset}` : hourOffset}h →{" "}
                      {schedulerState.currentLocalTimeStr}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={hourOffset}
                    onChange={(e) => setHourOffset(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>-12h</span>
                    <button
                      type="button"
                      onClick={() => setHourOffset(0)}
                      className="text-primary hover:underline"
                    >
                      Reset to Real Time
                    </button>
                    <span>+12h</span>
                  </div>
                </div>
              </SectionCard>

              {/* Scheduler state debug panel */}
              <SectionCard
                icon={<Server className="w-4 h-4" />}
                title="Scheduler State"
              >
                <div className="bg-muted/30 rounded-xl p-3 font-mono text-[11px] space-y-1 border border-border">
                  {[
                    {
                      label: "Running",
                      value: String(schedulerState.isRunning),
                      ok: schedulerState.isRunning,
                    },
                    {
                      label: "Within window",
                      value: String(schedulerState.isWithinTimeWindow),
                      ok: schedulerState.isWithinTimeWindow,
                    },
                    {
                      label: "Queue pending",
                      value: String(schedulerState.totalQueuePending),
                      ok: schedulerState.totalQueuePending === 0,
                    },
                    {
                      label: "Queue held",
                      value: String(schedulerState.totalQueueHeld),
                      ok: schedulerState.totalQueueHeld === 0,
                    },
                    {
                      label: "Active sends",
                      value: String(schedulerState.activeSendingCount),
                      ok: true,
                    },
                  ].map(({ label, value, ok }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-muted-foreground">{label}:</span>
                      <span className={ok ? "text-success" : "text-warning"}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {tab === "system" && (
            <div className="space-y-4">
              {/* App info */}
              <SectionCard icon={<Cpu className="w-4 h-4" />} title="App Info">
                <div className="space-y-1 font-mono text-[11px]">
                  {[
                    ["Version", "0.1.0"],
                    ["Runtime", "React 19 + Vite + TanStack Router"],
                    ["Storage", "TanStack DB (local IndexedDB)"],
                    ["Platform", "Web / Tauri v2 compatible"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Tauri setup guide */}
              <SectionCard
                icon={<Cpu className="w-4 h-4" />}
                title="Tauri v2 Desktop Setup"
                desc="Build a native desktop app from this codebase"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={copyTauri}
                    className="absolute top-2 right-2 px-2 py-1 rounded bg-card text-[10px] text-foreground border border-border flex items-center gap-1 hover:bg-muted/50 transition-colors z-10"
                  >
                    {copiedTauri ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copiedTauri ? "Copied!" : "Copy"}
                  </button>
                  <pre className="text-[11px] font-mono text-success bg-muted/30 rounded-xl p-4 pr-16 overflow-x-auto border border-border leading-relaxed">
                    {TAURI_COMMANDS}
                  </pre>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                  <li>
                    <strong className="text-foreground">
                      tauri-plugin-http
                    </strong>{" "}
                    — local WABridge daemon communication
                  </li>
                  <li>
                    <strong className="text-foreground">
                      tauri-plugin-store
                    </strong>{" "}
                    — SQLite & local persistence
                  </li>
                  <li>
                    <strong className="text-foreground">tauri-plugin-fs</strong>{" "}
                    — CSV file parsing from disk
                  </li>
                </ul>
              </SectionCard>

              {/* Danger zone */}
              <div className="border border-destructive/30 rounded-xl p-4 space-y-3 bg-destructive/5">
                <p className="text-xs font-bold text-destructive">
                  Danger Zone
                </p>
                <p className="text-xs text-muted-foreground">
                  Clear all local data including campaigns, queue, sessions, and
                  logs. This cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm("Clear ALL data? This cannot be undone.")
                    ) {
                      onClearAllData();
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-1.5 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="save-settings-submit-btn"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
