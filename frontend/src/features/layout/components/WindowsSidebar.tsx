/**
 * WindowsSidebar — collapsible left nav (256px / 56px collapsed)
 * Matches mockup: Lucide icons, per-badge colors, version badge, section headers, Language/Theme toggles
 */
import { getLocale } from "@/paraglide/runtime";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  PhoneCall,
  PlusCircle,
  Server,
  Sun,
  Users,
} from "lucide-react";

interface WindowsSidebarProps {
  // activeTab and onNavigate removed — TanStack Router handles active state
  campaignsCount: number;
  activeCampaignsCount: number;
  customersCount: number;
  templatesCount: number;
  sessionsCount: number;
  queuePendingCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  compactMode: boolean;
  onToggleCompactMode: () => void;
  onOpenVerifier: () => void;
}

const NAV_ITEMS = [
  {
    id: "dashboard",
    to: "/$locale",
    Icon: LayoutDashboard,
    label: "Dashboard",
    shortcut: "Alt+1",
    badgeKey: null as string | null,
  },
  {
    id: "campaigns",
    to: "/$locale/campaigns",
    Icon: Layers,
    label: "Campaigns",
    shortcut: "Alt+2",
    badgeKey: "campaigns" as const,
    badgeColor: "bg-primary/20 text-primary border-primary/30",
  },
  {
    id: "new_campaign",
    to: "/$locale/campaigns/new",
    Icon: PlusCircle,
    label: "New Broadcast",
    shortcut: "Ctrl+N",
    badgeKey: "newBadge" as const,
    badgeColor: "bg-success/20 text-success border-success/30",
  },
  {
    id: "customers",
    to: "/$locale/customers",
    Icon: Users,
    label: "Customers",
    shortcut: "Alt+3",
    badgeKey: "customers" as const,
    badgeColor: "bg-muted text-muted-foreground border-border",
  },
  {
    id: "templates",
    to: "/$locale/templates",
    Icon: FileText,
    label: "Templates",
    shortcut: "Alt+4",
    badgeKey: "templates" as const,
    badgeColor: "bg-muted text-muted-foreground border-border",
  },
  {
    id: "sessions",
    to: "/$locale/sessions",
    Icon: Server,
    label: "Sessions",
    shortcut: "Alt+5",
    badgeKey: "sessions" as const,
    badgeColor: "bg-success/15 text-success border-success/30",
  },
  {
    id: "queue",
    to: "/$locale/queue",
    Icon: Activity,
    label: "Queue & Logs",
    shortcut: "Alt+6",
    badgeKey: "queue" as const,
    badgeColor: "bg-warning/20 text-warning border-warning/30",
  },
  {
    id: "reports",
    to: "/$locale/reports",
    Icon: BarChart3,
    label: "Reports",
    shortcut: "Alt+7",
    badgeKey: null as string | null,
  },
] as const;

export function WindowsSidebar({
  campaignsCount,
  activeCampaignsCount,
  customersCount,
  templatesCount,
  sessionsCount,
  queuePendingCount,
  isCollapsed,
  onToggleCollapse,
  compactMode,
  onToggleCompactMode,
  onOpenVerifier,
}: WindowsSidebarProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentLocale = getLocale();
  const currentPath = routerState.location.pathname;

  const badges: Record<string, string | number | null> = {
    campaigns:
      activeCampaignsCount > 0
        ? `${activeCampaignsCount} active`
        : campaignsCount || null,
    newBadge: "+ CSV",
    customers: customersCount > 0 ? `${customersCount}` : null,
    templates: `${templatesCount}`,
    sessions: `${sessionsCount} active`,
    queue: queuePendingCount > 0 ? `${queuePendingCount}` : null,
  };

  const handleLocaleToggle = () => {
    const newLocale = currentLocale === "en" ? "ar-EG" : "en";
    const currentPath = routerState.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/[^/]+(\/|$)/, "/");

    navigate({
      to: "/$locale" + (pathWithoutLocale === "/" ? "" : pathWithoutLocale),
      params: { locale: newLocale },
    });
  };

  const CollapseIcon = isCollapsed ? ChevronRight : ChevronLeft;

  return (
    <aside
      className={`${
        isCollapsed ? "w-14" : "w-56"
      } bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-200 overflow-hidden select-none z-30`}
    >
      {/* Top Sidebar Header & Nav List */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Navigation Group Title */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Navigation</span>
            <span className="font-mono text-[9px] text-muted-foreground">
              v2.4
            </span>
          </div>
        )}

        <nav className="p-1.5 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.Icon;
            const badge = item.badgeKey ? badges[item.badgeKey] : null;
            const badgeColor =
              "badgeColor" in item
                ? item.badgeColor
                : "bg-primary/15 text-primary border-primary/20";
            // Determine active: exact match for dashboard, startsWith for others
            const isActive =
              item.id === "dashboard"
                ? currentPath === `/${currentLocale}` ||
                  currentPath === `/${currentLocale}/`
                : currentPath.startsWith(
                    `/${currentLocale}/${item.id === "new_campaign" ? "campaigns/new" : item.id}`,
                  );

            return (
              <Link
                key={item.id}
                to={item.to}
                params={{ locale: currentLocale }}
                title={
                  isCollapsed ? `${item.label} (${item.shortcut})` : undefined
                }
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />

                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-start truncate">
                      {item.label}
                    </span>
                    {badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono border ${
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                            : badgeColor
                        } ${item.id === "queue" && queuePendingCount > 0 ? "animate-pulse" : ""}`}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Tools Section */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Utilities</span>
          </div>
        )}

        <div className="p-1.5 space-y-0.5">
          <button
            type="button"
            onClick={onOpenVerifier}
            title={isCollapsed ? "Phone Validator (F2)" : undefined}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors group"
          >
            <PhoneCall className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && (
              <span className="flex-1 text-start truncate text-[11px]">
                Phone Validator
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Controls / Sidebar Toggles */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        {/* Quick Language & Theme Mode switchers in sidebar when not collapsed */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 pb-1">
            <button
              type="button"
              onClick={handleLocaleToggle}
              className="flex-1 flex items-center justify-center gap-1.5 py-1 px-1.5 rounded bg-card border border-border text-foreground text-[11px] hover:bg-muted/50 transition-colors"
              title={
                currentLocale === "en"
                  ? "التبديل إلى العربية"
                  : "Switch to English"
              }
            >
              <Globe className="w-3 h-3 text-primary" />
              <span>{currentLocale === "en" ? "العربية" : "English"}</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center p-1 rounded bg-card border border-border text-foreground hover:bg-muted/50 transition-colors w-7 h-7"
              title="Toggle Theme Mode (Coming Soon)"
            >
              <Sun className="w-3 h-3 text-warning" />
            </button>
          </div>
        )}

        {/* Compact Mode Toggle */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCompactMode}
            className="w-full flex items-center justify-between px-2 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <CheckSquare
                className={`w-3.5 h-3.5 ${
                  compactMode ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span>Compact Mode</span>
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">
              {compactMode ? "ON" : "OFF"}
            </span>
          </button>
        )}

        {/* Collapse Sidebar Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <CollapseIcon className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CollapseIcon className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
