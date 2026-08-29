/**
 * WindowsMenuBar — 28px menu bar below title bar
 * View menu: nav shortcuts with icons + Language + Theme mode + Accent color palette + Compact toggle
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getLocale } from "@/paraglide/runtime";
import {
  FolderPlus,
  Upload,
  Download,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Info,
  CheckSquare,
  Clock,
  Settings,
  PhoneCall,
  Layers,
  Cpu,
  ShieldCheck,
  BookOpen,
  X,
  Globe,
  Sun,
  Moon,
  Monitor,
  Palette,
  Check,
  LayoutDashboard,
  Users,
  FileText,
  Server,
  Activity,
  BarChart3,
} from "lucide-react";

interface WindowsMenuBarProps {
  isSchedulerRunning: boolean;
  compactMode: boolean;
  onNewCampaign: () => void;
  onImportCsv: () => void;
  onExportReport: () => void;
  onOpenSettings: () => void;
  onOpenVerifier: () => void;
  onOpenAbout: () => void;
  onNavigate: (tab: string) => void;
  onToggleScheduler: () => void;
  onClearQueue: () => void;
  onResetSessionLimits: () => void;
  onClearLogs: () => void;
  onToggleCompactMode: () => void;
}

type Menu = "file" | "campaign" | "view" | "tools" | "help";
type ThemeMode = "dark" | "light" | "system";

const ACCENT_COLORS = [
  {
    id: "blue",
    label: "Classic Blue",
    dot: "bg-blue-500",
    ring: "ring-blue-500",
  },
  {
    id: "emerald",
    label: "Pharmacy Emerald",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500",
  },
  {
    id: "violet",
    label: "Royal Violet",
    dot: "bg-violet-500",
    ring: "ring-violet-500",
  },
  {
    id: "amber",
    label: "Warm Amber",
    dot: "bg-amber-500",
    ring: "ring-amber-500",
  },
  { id: "rose", label: "Ruby Rose", dot: "bg-rose-500", ring: "ring-rose-500" },
  {
    id: "cyan",
    label: "Clinical Cyan",
    dot: "bg-cyan-500",
    ring: "ring-cyan-500",
  },
] as const;

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard, key: "1" },
  { id: "campaigns", label: "Campaigns", Icon: Layers, key: "2" },
  { id: "customers", label: "Customers", Icon: Users, key: "3" },
  { id: "templates", label: "Templates", Icon: FileText, key: "4" },
  { id: "sessions", label: "Sessions", Icon: Server, key: "5" },
  { id: "queue", label: "Queue & Logs", Icon: Activity, key: "6" },
  { id: "reports", label: "Reports", Icon: BarChart3, key: "7" },
] as const;

export function WindowsMenuBar({
  isSchedulerRunning,
  compactMode,
  onNewCampaign,
  onImportCsv,
  onExportReport,
  onOpenSettings,
  onOpenVerifier,
  onOpenAbout,
  onNavigate,
  onToggleScheduler,
  onClearQueue,
  onResetSessionLimits,
  onClearLogs,
  onToggleCompactMode,
}: WindowsMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<Menu | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [accentColor, setAccentColor] = useState("blue");
  const menuBarRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentLocale = getLocale();

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        menuBarRef.current &&
        !menuBarRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const toggle = (menu: Menu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  const run = (action: () => void) => {
    action();
    setOpenMenu(null);
  };

  const handleLocaleSwitch = (locale: string) => {
    const currentPath = routerState.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/[^/]+(\/|$)/, "/");
    navigate({
      to: "/$locale" + (pathWithoutLocale === "/" ? "" : pathWithoutLocale),
      params: { locale },
    });
  };

  const dropdownCls =
    "absolute left-0 top-full mt-0.5 bg-card border border-border rounded-lg shadow-2xl py-1 z-50 text-xs text-foreground divide-y divide-border";

  const itemCls =
    "w-full px-3 py-1.5 hover:bg-primary hover:text-primary-foreground flex items-center justify-between text-left group transition-colors";

  const kbd = (text: string) => (
    <span className="text-[10px] text-muted-foreground group-hover:text-primary-foreground font-mono shrink-0">
      {text}
    </span>
  );

  const sectionLabel = (icon: React.ReactNode, text: string) => (
    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
      {icon}
      <span>{text}</span>
    </div>
  );

  return (
    <div
      ref={menuBarRef}
      className="h-7 bg-card border-b border-border px-2 flex items-center gap-0.5 text-xs select-none relative z-35 transition-colors"
    >
      {/* FILE */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("file")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            openMenu === "file"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          File
        </button>

        {openMenu === "file" && (
          <div className={`${dropdownCls} w-64`}>
            <div className="py-1">
              <button
                type="button"
                onClick={() => run(onNewCampaign)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <FolderPlus className="w-3.5 h-3.5 text-primary group-hover:text-primary-foreground" />
                  <span>New Campaign</span>
                </span>
                {kbd("Ctrl+N")}
              </button>
              <button
                type="button"
                onClick={() =>
                  run(() => {
                    onNewCampaign();
                    onImportCsv();
                  })
                }
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-success group-hover:text-primary-foreground" />
                  <span>Import CSV & Verify</span>
                </span>
                {kbd("Ctrl+I")}
              </button>
              <button
                type="button"
                onClick={() => run(onExportReport)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-warning group-hover:text-primary-foreground" />
                  <span>Export Delivery Report</span>
                </span>
                {kbd("Ctrl+E")}
              </button>
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => run(onOpenSettings)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary-foreground" />
                  <span>Settings</span>
                </span>
                {kbd("Ctrl+,")}
              </button>
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() =>
                  run(() => {
                    if (
                      confirm(
                        "Close application? Unsaved changes will be lost.",
                      )
                    )
                      window.close();
                  })
                }
                className="w-full px-3 py-1.5 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-between text-left group transition-colors"
              >
                <span className="flex items-center gap-2 text-destructive group-hover:text-destructive-foreground">
                  <X className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </span>
                {kbd("Alt+F4")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CAMPAIGN */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("campaign")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            openMenu === "campaign"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Campaign
        </button>

        {openMenu === "campaign" && (
          <div className={`${dropdownCls} w-64`}>
            <div className="py-1">
              <button
                type="button"
                onClick={() => run(onToggleScheduler)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  {isSchedulerRunning ? (
                    <Pause className="w-3.5 h-3.5 text-warning group-hover:text-primary-foreground" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-success group-hover:text-primary-foreground" />
                  )}
                  <span>
                    {isSchedulerRunning
                      ? "Pause All Queues"
                      : "Resume All Queues"}
                  </span>
                </span>
                {kbd("Space")}
              </button>
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => run(() => onNavigate("campaigns"))}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-primary group-hover:text-primary-foreground" />
                  <span>View All Campaigns</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => run(() => onNavigate("customers"))}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-success group-hover:text-primary-foreground" />
                  <span>Verify Contacts Pre-Send</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => run(onClearQueue)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-destructive group-hover:text-primary-foreground" />
                  <span>Clear Completed Queue Items</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW — rich panel */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("view")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            openMenu === "view"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          View
        </button>

        {openMenu === "view" && (
          <div className={`${dropdownCls} w-72 max-h-[85vh] overflow-y-auto`}>
            {/* Navigation shortcuts */}
            <div className="py-1">
              {NAV_ITEMS.map(({ id, label, Icon, key }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => run(() => onNavigate(id))}
                  className={itemCls}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary-foreground" />
                    <span>{label}</span>
                  </span>
                  {kbd(`Alt+${key}`)}
                </button>
              ))}
            </div>

            {/* Language switcher */}
            <div className="px-3 py-2.5">
              {sectionLabel(
                <Globe className="w-3 h-3 text-primary" />,
                "Language",
              )}
              <div className="flex gap-1.5">
                {(["en", "ar-EG"] as const).map((locale) => {
                  const isActive = currentLocale === locale;
                  return (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => handleLocaleSwitch(locale)}
                      className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 border-border"
                      }`}
                    >
                      {isActive && <Check className="w-2.5 h-2.5 shrink-0" />}
                      <span>{locale === "en" ? "English" : "العربية"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme mode */}
            <div className="px-3 py-2.5">
              {sectionLabel(<Sun className="w-3 h-3 text-warning" />, "Theme")}
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "light", label: "Light", Icon: Sun },
                    { id: "dark", label: "Dark", Icon: Moon },
                    { id: "system", label: "System", Icon: Monitor },
                  ] as const
                ).map(({ id, label, Icon }) => {
                  const isActive = themeMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setThemeMode(id)}
                      className={`py-1.5 px-1 rounded-md text-[10px] font-semibold border flex flex-col items-center gap-1 transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 border-border"
                      }`}
                    >
                      <Icon
                        className={`w-3 h-3 ${isActive ? "text-primary-foreground" : ""}`}
                      />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent color palette */}
            <div className="px-3 py-2.5">
              {sectionLabel(
                <Palette className="w-3 h-3 text-primary" />,
                "Primary Accent Color",
              )}
              <div className="grid grid-cols-3 gap-1.5">
                {ACCENT_COLORS.map(({ id, label, dot }) => {
                  const isActive = accentColor === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAccentColor(id)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium border transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary border-primary/40 font-bold"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 border-border"
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot} ${isActive ? "ring-2 ring-offset-1 ring-offset-card ring-primary/60" : ""}`}
                      />
                      <span className="truncate">{label.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact mode */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => run(onToggleCompactMode)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <CheckSquare
                    className={`w-3.5 h-3.5 ${compactMode ? "text-primary" : "text-muted-foreground"} group-hover:text-primary-foreground`}
                  />
                  <span>Compact UI Density</span>
                </span>
                {kbd("Ctrl+D")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOOLS */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("tools")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            openMenu === "tools"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Tools
        </button>

        {openMenu === "tools" && (
          <div className={`${dropdownCls} w-64`}>
            <div className="py-1">
              <button
                type="button"
                onClick={() => run(onOpenVerifier)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-primary group-hover:text-primary-foreground" />
                  <span>Phone Number Verifier (Quick)</span>
                </span>
                {kbd("F2")}
              </button>
              <button
                type="button"
                onClick={() => run(onResetSessionLimits)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-warning group-hover:text-primary-foreground" />
                  <span>Reset Session Rate Limits</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => run(onClearLogs)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-destructive group-hover:text-primary-foreground" />
                  <span>Clear All Event Logs</span>
                </span>
              </button>
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => run(onOpenSettings)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary group-hover:text-primary-foreground" />
                  <span>Time Window Simulator</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HELP */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("help")}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            openMenu === "help"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Help
        </button>

        {openMenu === "help" && (
          <div className={`${dropdownCls} w-64`}>
            <div className="py-1">
              <button
                type="button"
                onClick={() => run(onOpenAbout)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary group-hover:text-primary-foreground" />
                  <span>Pharmacy SOP Guide</span>
                </span>
                {kbd("F1")}
              </button>
              <button
                type="button"
                onClick={() => run(onOpenSettings)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-success group-hover:text-primary-foreground" />
                  <span>Tauri / System Information</span>
                </span>
              </button>
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => run(onOpenAbout)}
                className={itemCls}
              >
                <span className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary-foreground" />
                  <span>About OmniReach</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Hints */}
      <div className="ml-auto mr-2 text-[10px] text-muted-foreground font-mono hidden lg:flex items-center gap-3">
        <span>F1: Help</span>
        <span>Ctrl+N: New</span>
        <span>Space: {isSchedulerRunning ? "Pause" : "Resume"}</span>
      </div>
    </div>
  );
}
