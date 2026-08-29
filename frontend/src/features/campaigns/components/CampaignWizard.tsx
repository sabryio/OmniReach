/**
 * CampaignWizard — 4-step wizard: csv → composer → sessions → review
 * Placeholder
 */
import type {
  Campaign,
  WABridgeSession,
  WABridgeConfig,
  Contact,
} from "@/types";
import { useCampaignWizard } from "../hooks/useCampaigns";
import { CsvImporter } from "./CsvImporter";
import { MessageComposer } from "./MessageComposer";

interface CampaignWizardProps {
  sessions: WABridgeSession[];
  config: WABridgeConfig;
  initialTemplate?: unknown;
  initialContacts?: Contact[] | null;
  onLaunchCampaign: (campaign: Campaign) => void;
  onCancel: () => void;
}

const STEPS = ["csv", "composer", "sessions", "review"] as const;

export function CampaignWizard({
  sessions,
  onLaunchCampaign,
  onCancel,
}: CampaignWizardProps) {
  const {
    step,
    contacts,
    setContacts,
    templateText,
    setTemplateText,
    imageUrl,
    setImageUrl,
    campaignTitle,
    setCampaignTitle,
    selectedSessionIds,
    setSelectedSessionIds,
    canAdvance,
    next,
    back,
  } = useCampaignWizard();

  const stepIdx = STEPS.indexOf(step);

  const handleLaunch = () => {
    const campaign: Campaign = {
      id: `camp_${Date.now()}`,
      title: campaignTitle || "Untitled Campaign",
      templateText,
      imageUrl,
      sessionIds: selectedSessionIds,
      status: "running",
      createdAt: Date.now(),
      totalContacts: contacts.length,
      verifiedContacts: 0,
      unregisteredCount: 0,
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
      contacts,
    };
    onLaunchCampaign(campaign);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            New Broadcast Campaign
          </h1>
          <p className="text-xs text-muted-foreground">
            Step {stepIdx + 1} of {STEPS.length}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕ Cancel
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                i === stepIdx
                  ? "bg-primary text-primary-foreground"
                  : i < stepIdx
                    ? "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span>{i < stepIdx ? "✓" : i + 1}</span>
              <span className="capitalize">{s.replace("_", " ")}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-lg p-6">
        {step === "csv" && (
          <CsvImporter
            onContactsParsed={(c) => {
              setContacts(c);
              next();
            }}
          />
        )}

        {step === "composer" && (
          <div className="space-y-4">
            <input
              type="text"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              placeholder="Campaign title..."
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <MessageComposer
              templateText={templateText}
              imageUrl={imageUrl}
              contacts={contacts}
              onTemplateChange={setTemplateText}
              onImageChange={setImageUrl}
            />
          </div>
        )}

        {step === "sessions" && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Select WABridge Sessions
            </p>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No sessions configured.
              </p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <label className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border cursor-pointer hover:bg-accent/30 transition-colors text-sm">
                      <input
                        type="checkbox"
                        checked={selectedSessionIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedSessionIds([
                              ...selectedSessionIds,
                              s.id,
                            ]);
                          else
                            setSelectedSessionIds(
                              selectedSessionIds.filter((id) => id !== s.id),
                            );
                        }}
                        className="accent-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.phoneNumber} • {s.hourlyLimit}/hr limit
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          s.status === "connected"
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {s.status}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4 text-sm">
            <p className="font-semibold text-foreground">Pre-launch Summary</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Campaign", campaignTitle || "Untitled"],
                ["Contacts", contacts.length],
                ["Sessions", selectedSessionIds.length],
                ["Template", templateText.slice(0, 40) + "…"],
              ].map(([k, v]) => (
                <div
                  key={String(k)}
                  className="bg-muted/40 rounded-lg p-3 border border-border"
                >
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="text-foreground font-medium mt-0.5 truncate">
                    {v}
                  </p>
                </div>
              ))}
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="w-full max-h-32 object-cover rounded-lg border border-border"
              />
            )}
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={back}
          disabled={stepIdx === 0}
          className="px-4 py-2 text-xs rounded border border-border text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
        >
          ← Back
        </button>
        {step !== "review" ? (
          <button
            onClick={next}
            disabled={!canAdvance}
            className="px-4 py-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleLaunch}
            className="px-4 py-2 text-xs rounded bg-success text-success-foreground hover:bg-success/90 font-semibold transition-colors"
          >
            🚀 Launch Campaign
          </button>
        )}
      </div>
    </div>
  );
}
