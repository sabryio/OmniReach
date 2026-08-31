import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { locales, type Locale } from "@/paraglide/runtime";
import { useLayout } from "@/features/layout";
import { useModals } from "@/features/modals";
import {
  WindowsTitleBar,
  WindowsMenuBar,
  WindowsSidebar,
  AppFooter,
} from "@/features/layout";
import {
  SettingsModal,
  QuickVerifierModal,
  AboutModal,
} from "@/features/modals";
import { useSessions } from "@/features/sessions";
import { useLogsQuery } from "@/features/queue";
import { useSettingsQuery, useUpdateSettings } from "@/features/settings";
import type {
  SchedulerState,
  WABridgeConfig,
} from "@/features/layout/schemas/layout.schema";
import type { AppSettings } from "@/features/settings";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    const locale = params.locale as Locale;
    if (!locales.includes(locale)) {
      throw redirect({ to: "/$locale", params: { locale: "en" } });
    }
  },
  component: SharedLayout,
});

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_SCHEDULER: SchedulerState = {
  isRunning: false,
  isWithinTimeWindow: true,
  timeWindowText: "9AM–9PM Active",
  currentLocalTimeStr: new Date().toLocaleTimeString(),
  activeSendingCount: 0,
  totalQueuePending: 0,
  totalQueueHeld: 0,
  strictTimeWindow: true,
  customWindowStartHour: 9,
  customWindowEndHour: 21,
  simulatedHourOffset: 0,
};

const DEFAULT_CONFIG: WABridgeConfig = {
  baseUrl: "http://127.0.0.1:7171",
  timeoutMs: 5000,
  useSimulationMode: true,
  simulatedNetworkLatencyMs: 400,
  simulatedUnregisteredRate: 0.15,
};

// ─── Helpers — bridge AppSettings ↔ UI state ─────────────────────────────────

/** Map backend AppSettings → frontend WABridgeConfig */
function toConfig(s: AppSettings): WABridgeConfig {
  return {
    baseUrl: s.wabridgeBaseUrl,
    timeoutMs: s.wabridgeTimeoutMs,
    useSimulationMode: false,
    simulatedNetworkLatencyMs: 0,
    simulatedUnregisteredRate: 0,
  };
}

/** Map backend AppSettings → partial SchedulerState */
function toSchedulerPatch(s: AppSettings): Partial<SchedulerState> {
  return {
    customWindowStartHour: s.schedulerStartHour,
    customWindowEndHour: s.schedulerEndHour,
    strictTimeWindow: s.schedulerStrictTimeWindow,
  };
}

// ─── Shared Layout ────────────────────────────────────────────────────────────

function SharedLayout() {
  const { locale } = Route.useParams();
  const navigate = useNavigate();
  const layout = useLayout();
  const modals = useModals();

  // Data from TanStack Query
  const { sessions } = useSessions();
  const { logs } = useLogsQuery();
  const { settings } = useSettingsQuery();
  const { updateSettingsAsync } = useUpdateSettings();

  // Scheduler state (frontend-only for now — no backend endpoint yet)
  const [schedulerState, setSchedulerState] =
    useState<SchedulerState>(DEFAULT_SCHEDULER);

  // Derive WABridgeConfig from backend settings; fall back to DEFAULT_CONFIG
  const config: WABridgeConfig = settings ? toConfig(settings) : DEFAULT_CONFIG;

  // Sync scheduler window from backend settings when they load
  useEffect(() => {
    if (settings) {
      setSchedulerState((prev) => ({ ...prev, ...toSchedulerPatch(settings) }));
    }
  }, [settings]);

  // Keep clock in sync
  useEffect(() => {
    const id = setInterval(() => {
      setSchedulerState((prev) => ({
        ...prev,
        currentLocalTimeStr: new Date().toLocaleTimeString(),
      }));
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        navigate({ to: "/$locale/campaigns/new", params: { locale } });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        modals.openSettings();
      }
      if (e.key === "F2") {
        e.preventDefault();
        modals.openVerifier();
      }
      if (e.key === "F1") {
        e.preventDefault();
        modals.openAbout();
      }
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setSchedulerState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modals, locale, navigate]);

  const handleToggleScheduler = useCallback(() => {
    setSchedulerState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const compactPadding = layout.compactMode ? "p-3" : "p-5";

  return (
    <div
      key={locale}
      className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground antialiased"
    >
      {/* 1. Title Bar */}
      <WindowsTitleBar
        schedulerState={schedulerState}
        config={config}
        sessions={sessions}
        themeMode={layout.themeMode}
        themeColor={layout.themeColor}
        onToggleScheduler={handleToggleScheduler}
        onToggleThemeMode={layout.toggleThemeMode}
        onSetThemeColor={layout.setThemeColor}
        onOpenSettings={modals.openSettings}
      />

      {/* 2. Menu Bar */}
      <WindowsMenuBar
        isSchedulerRunning={schedulerState.isRunning}
        compactMode={layout.compactMode}
        onNewCampaign={() =>
          navigate({ to: "/$locale/campaigns/new", params: { locale } })
        }
        onImportCsv={() =>
          navigate({ to: "/$locale/campaigns/new", params: { locale } })
        }
        onExportReport={() =>
          navigate({ to: "/$locale/reports", params: { locale } })
        }
        onOpenSettings={modals.openSettings}
        onOpenVerifier={modals.openVerifier}
        onOpenAbout={modals.openAbout}
        onToggleScheduler={handleToggleScheduler}
        onClearQueue={() => {}}
        onResetSessionLimits={() => {}}
        onClearLogs={() => {}}
        onToggleCompactMode={layout.toggleCompactMode}
      />

      {/* 3. Sidebar + Main */}
      <div className="flex-1 flex overflow-hidden">
        <WindowsSidebar
          campaignsCount={0}
          activeCampaignsCount={0}
          customersCount={0}
          templatesCount={0}
          sessionsCount={sessions.length}
          queuePendingCount={schedulerState.totalQueuePending}
          isCollapsed={layout.isSidebarCollapsed}
          onToggleCollapse={layout.toggleSidebar}
          compactMode={layout.compactMode}
          onToggleCompactMode={layout.toggleCompactMode}
          onOpenVerifier={modals.openVerifier}
        />

        <main
          className={`flex-1 overflow-y-auto bg-background ${compactPadding}`}
        >
          <Outlet key={locale} />
        </main>
      </div>

      {/* 4. Footer */}
      <AppFooter logs={logs} schedulerState={schedulerState} />

      {/* Modals — always mounted */}
      <SettingsModal
        isOpen={modals.isSettingsOpen}
        onClose={modals.closeSettings}
        config={config}
        schedulerState={schedulerState}
        themeMode={layout.themeMode}
        themeColor={layout.themeColor}
        sessions={sessions}
        onSaveConfig={async (newConfig) => {
          await updateSettingsAsync({
            wabridgeBaseUrl: newConfig.baseUrl,
            wabridgeTimeoutMs: newConfig.timeoutMs,
            schedulerStartHour: schedulerState.customWindowStartHour,
            schedulerEndHour: schedulerState.customWindowEndHour,
            schedulerStrictTimeWindow: schedulerState.strictTimeWindow,
          });
        }}
        onSetThemeColor={layout.setThemeColor}
        onToggleThemeMode={layout.toggleThemeMode}
        onSetStrictTimeWindow={(strict) => {
          setSchedulerState((p) => ({ ...p, strictTimeWindow: strict }));
          updateSettingsAsync({ schedulerStrictTimeWindow: strict });
        }}
        onSetSimulatedHourOffset={(offset) =>
          setSchedulerState((p) => ({ ...p, simulatedHourOffset: offset }))
        }
        onClearAllData={() => {}}
      />

      <QuickVerifierModal
        isOpen={modals.isVerifierOpen}
        onClose={modals.closeVerifier}
        sessions={sessions}
        config={config}
      />

      <AboutModal isOpen={modals.isAboutOpen} onClose={modals.closeAbout} />
    </div>
  );
}
