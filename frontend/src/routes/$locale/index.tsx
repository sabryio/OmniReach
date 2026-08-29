import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useLayout } from "@/features/layout";
import { useModals } from "@/features/modals";
import { WindowsTitleBar } from "@/features/layout";
import { WindowsMenuBar } from "@/features/layout";
import { WindowsSidebar } from "@/features/layout";
import { AppFooter } from "@/features/layout";
import { DashboardView } from "@/features/dashboard";
import { CampaignsList } from "@/features/campaigns";
import { CampaignWizard } from "@/features/campaigns";
import { CustomersView } from "@/features/customers";
import { TemplatesView } from "@/features/templates";
import { SessionsDashboard } from "@/features/sessions";
import { QueueAndLogsView } from "@/features/queue";
import { ReportsView } from "@/features/reports";
import { SettingsModal } from "@/features/modals";
import { QuickVerifierModal } from "@/features/modals";
import { AboutModal } from "@/features/modals";
import type {
  Campaign,
  QueueItem,
  WABridgeSession,
  LogEntry,
  SchedulerState,
  WABridgeConfig,
  Contact,
  MessageTemplate,
} from "@/types";

export const Route = createFileRoute("/$locale/")({ component: App });

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
  baseUrl: "http://127.0.0.1:8080",
  timeoutMs: 5000,
  useSimulationMode: true,
  simulatedNetworkLatencyMs: 400,
  simulatedUnregisteredRate: 0.15,
};

// ─── App Shell ───────────────────────────────────────────────────────────────

function App() {
  const { locale } = Route.useParams();
  const layout = useLayout();
  const modals = useModals();

  // App-level data state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [queue] = useState<QueueItem[]>([]);
  const [sessions] = useState<WABridgeSession[]>([
    {
      id: "session-alpha",
      name: "Session Alpha",
      phoneNumber: "+1 415 555 0001",
      status: "connected",
      hourlyLimit: 5,
      dailyLimit: 30,
      hourlySentTimestamps: [],
      dailySentTimestamps: [],
    },
    {
      id: "session-beta",
      name: "Session Beta",
      phoneNumber: "+1 415 555 0002",
      status: "connected",
      hourlyLimit: 5,
      dailyLimit: 30,
      hourlySentTimestamps: [],
      dailySentTimestamps: [],
    },
  ]);
  const [logs] = useState<LogEntry[]>([]);
  const [schedulerState, setSchedulerState] =
    useState<SchedulerState>(DEFAULT_SCHEDULER);
  const [config, setConfig] = useState<WABridgeConfig>(DEFAULT_CONFIG);

  // Wizard pre-load state
  const [initialWizardTemplate, setInitialWizardTemplate] =
    useState<MessageTemplate | null>(null);
  const [initialWizardContacts, setInitialWizardContacts] = useState<
    Contact[] | null
  >(null);

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
        layout.setActiveTab("new_campaign");
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
  }, [layout, modals]);

  const handleToggleScheduler = useCallback(() => {
    setSchedulerState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const handleLaunchCampaign = useCallback(
    (campaign: Campaign) => {
      setCampaigns((prev) => [...prev, { ...campaign, status: "running" }]);
      layout.setActiveTab("campaigns");
      setInitialWizardTemplate(null);
      setInitialWizardContacts(null);
    },
    [layout],
  );

  const allContacts = campaigns.flatMap((c) => c.contacts);
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
        onNewCampaign={() => layout.setActiveTab("new_campaign")}
        onImportCsv={() => layout.setActiveTab("new_campaign")}
        onExportReport={() => layout.setActiveTab("reports")}
        onOpenSettings={modals.openSettings}
        onOpenVerifier={modals.openVerifier}
        onOpenAbout={modals.openAbout}
        onNavigate={(tab) => layout.setActiveTab(tab)}
        onToggleScheduler={handleToggleScheduler}
        onClearQueue={() => {}}
        onResetSessionLimits={() => {}}
        onClearLogs={() => {}}
        onToggleCompactMode={layout.toggleCompactMode}
      />

      {/* 3. Sidebar + Main */}
      <div className="flex-1 flex overflow-hidden">
        <WindowsSidebar
          activeTab={layout.activeTab}
          onNavigate={(tab) => layout.setActiveTab(tab)}
          campaignsCount={campaigns.length}
          activeCampaignsCount={
            campaigns.filter((c) => c.status === "running").length
          }
          customersCount={allContacts.length}
          templatesCount={5}
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
          {layout.activeTab === "dashboard" && (
            <DashboardView
              campaigns={campaigns}
              queue={queue}
              sessions={sessions}
              schedulerState={schedulerState}
              logs={logs}
              onNavigate={(tab) => layout.setActiveTab(tab)}
              onNewCampaignClick={() => layout.setActiveTab("new_campaign")}
              onToggleScheduler={handleToggleScheduler}
            />
          )}

          {layout.activeTab === "campaigns" && (
            <CampaignsList
              campaigns={campaigns}
              queue={queue}
              sessions={sessions}
              onPauseCampaign={(id) =>
                setCampaigns((p) =>
                  p.map((c) => (c.id === id ? { ...c, status: "paused" } : c)),
                )
              }
              onResumeCampaign={(id) =>
                setCampaigns((p) =>
                  p.map((c) => (c.id === id ? { ...c, status: "running" } : c)),
                )
              }
              onCancelCampaign={(id) =>
                setCampaigns((p) =>
                  p.map((c) =>
                    c.id === id ? { ...c, status: "cancelled" } : c,
                  ),
                )
              }
              onRetryFailed={(id) =>
                setCampaigns((p) =>
                  p.map((c) =>
                    c.id === id
                      ? { ...c, status: "running", failedCount: 0 }
                      : c,
                  ),
                )
              }
              onDeleteCampaign={(id) =>
                setCampaigns((p) => p.filter((c) => c.id !== id))
              }
              onArchiveCampaign={(id) =>
                setCampaigns((p) =>
                  p.map((c) => (c.id === id ? { ...c, isArchived: true } : c)),
                )
              }
              onUnarchiveCampaign={(id) =>
                setCampaigns((p) =>
                  p.map((c) => (c.id === id ? { ...c, isArchived: false } : c)),
                )
              }
              onNewCampaignClick={() => layout.setActiveTab("new_campaign")}
            />
          )}

          {layout.activeTab === "new_campaign" && (
            <CampaignWizard
              sessions={sessions}
              config={config}
              initialTemplate={initialWizardTemplate}
              initialContacts={initialWizardContacts}
              onLaunchCampaign={handleLaunchCampaign}
              onCancel={() => {
                layout.setActiveTab("campaigns");
                setInitialWizardTemplate(null);
                setInitialWizardContacts(null);
              }}
            />
          )}

          {layout.activeTab === "customers" && (
            <CustomersView
              campaignContacts={allContacts}
              sessions={sessions}
              config={config}
              onLaunchCampaignWithContacts={(contacts) => {
                setInitialWizardContacts(contacts);
                layout.setActiveTab("new_campaign");
              }}
              onOpenVerifier={modals.openVerifier}
            />
          )}

          {layout.activeTab === "templates" && (
            <TemplatesView
              onUseTemplateInCampaign={(template) => {
                setInitialWizardTemplate(template);
                layout.setActiveTab("new_campaign");
              }}
            />
          )}

          {layout.activeTab === "sessions" && (
            <SessionsDashboard
              sessions={sessions}
              config={config}
              onResetSessionLimits={() => {}}
              onUpdateSessions={() => {}}
            />
          )}

          {layout.activeTab === "queue" && (
            <QueueAndLogsView
              queue={queue}
              logs={logs}
              schedulerState={schedulerState}
              onClearLogs={() => {}}
            />
          )}

          {layout.activeTab === "reports" && (
            <ReportsView
              campaigns={campaigns}
              queue={queue}
              sessions={sessions}
              logs={logs}
              schedulerState={schedulerState}
            />
          )}
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
        onSaveConfig={setConfig}
        onSetThemeColor={layout.setThemeColor}
        onToggleThemeMode={layout.toggleThemeMode}
        onSetStrictTimeWindow={(strict) =>
          setSchedulerState((p) => ({ ...p, strictTimeWindow: strict }))
        }
        onSetSimulatedHourOffset={(offset) =>
          setSchedulerState((p) => ({ ...p, simulatedHourOffset: offset }))
        }
        onClearAllData={() => {
          setCampaigns([]);
        }}
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
