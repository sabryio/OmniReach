/**
 * CampaignWizard — 4-step wizard: csv → composer → sessions → review
 * Beautiful UI with exact mockup structure and enhanced functionality
 */
import { useState, useEffect } from "react";
import {
  Send,
  ShieldCheck,
  Layers,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { CsvImporter } from "./CsvImporter";
import { MessageComposer } from "./MessageComposer";
import { getSessionQuota } from "@/features/sessions/utils/quota";
import { useVerificationJob } from "../hooks/useVerificationJob";
import type { Session } from "@/features/sessions/schemas/session.schema";
import type { Contact } from "@/features/customers/schemas/customer.schema";
import type { Campaign } from "../schemas/campaign.schema";
import type { WABridgeConfig } from "@/features/layout/schemas/layout.schema";

interface CampaignWizardProps {
  sessions: Session[];
  config: WABridgeConfig;
  initialTemplate?: unknown;
  initialContacts?: Contact[] | null;
  onLaunchCampaign: (campaign: Campaign) => void;
  onCancel: () => void;
}

type WizardStep = "csv" | "composer" | "sessions" | "review";

export function CampaignWizard({
  sessions,
  onLaunchCampaign,
  onCancel,
}: CampaignWizardProps) {
  const [step, setStep] = useState<WizardStep>("csv");
  const [campaignTitle, setCampaignTitle] = useState<string>(
    `Broadcast #${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} Campaign`,
  );
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templateText, setTemplateText] = useState<string>(
    "Hello {{name}}! 🌟 We are pleased to share our latest catalog update with you. Check your exclusive member perks today.",
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageFileName, _setImageFileName] = useState<string | undefined>(
    undefined,
  );
  const [mediaRef, setMediaRef] = useState<string | undefined>(undefined);

  // Selected WABridge session IDs
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>(
    sessions.map((s) => s.id),
  );

  // Batch verification job — replaces old runPreVerification simulation
  const verification = useVerificationJob();

  // Track current time for quota calculations
  const [now, setNow] = useState<number>(Date.now());

  // Update clock every second for live quota display
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleContactsParsed = (parsedContacts: Contact[]) => {
    setContacts(parsedContacts);
  };

  const toggleSession = (sessionId: string) => {
    if (selectedSessionIds.includes(sessionId)) {
      if (selectedSessionIds.length === 1) return;
      setSelectedSessionIds(
        selectedSessionIds.filter((id) => id !== sessionId),
      );
    } else {
      setSelectedSessionIds([...selectedSessionIds, sessionId]);
    }
  };

  // When verification completes, patch contacts with real results
  useEffect(() => {
    if (!verification.results) return;

    const resultMap = new Map(verification.results.map((r) => [r.phone, r]));

    setContacts((prev) =>
      prev.map((c) => {
        const r = resultMap.get(c.normalizedPhone);
        if (!r) return c;
        return {
          ...c,
          verificationStatus: r.is_registered ? "registered" : "unregistered",
          waId: r.wa_id ?? undefined,
        };
      }),
    );
  }, [verification.results]);

  const runPreVerification = () => {
    if (contacts.length === 0 || selectedSessionIds.length === 0) return;
    const sessionId = selectedSessionIds[0]!;
    const phones = contacts.map((c) => c.normalizedPhone);
    verification.startJob(sessionId, phones);
  };

  const handleCreateAndLaunch = () => {
    if (
      contacts.length === 0 ||
      selectedSessionIds.length === 0 ||
      !templateText.trim()
    ) {
      return;
    }

    const campaign: Campaign = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: campaignTitle.trim() || "Untitled Broadcast Campaign",
      templateText: templateText.trim(),
      imageUrl,
      mediaRef,
      sessionIds: selectedSessionIds,
      status: "running",
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      totalContacts: contacts.length,
      verifiedContacts: 0,
      sentCount: 0,
      skippedCount: 0,
      unregisteredCount:
        verification.progress?.unregistered ??
        contacts.filter((c) => c.verificationStatus === "unregistered").length,
      failedCount: 0,
      contacts: [...contacts],
      isArchived: false,
    };

    onLaunchCampaign(campaign);
  };

  // Determine available template tags from contacts
  // const availableVars = ["name", "phone", "prescription", "doctor", "company"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Wizard Header / Stepper */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>New Broadcast Campaign</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Follow the steps to create and launch your campaign
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl text-xs font-medium border border-border overflow-x-auto">
            <button
              type="button"
              onClick={() => setStep("csv")}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                step === "csv"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Recipients ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => contacts.length > 0 && setStep("composer")}
              disabled={contacts.length === 0}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                step === "composer"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : contacts.length > 0
                    ? "text-muted-foreground hover:text-foreground"
                    : "opacity-40 cursor-not-allowed"
              }`}
            >
              Message Template
            </button>
            <button
              type="button"
              onClick={() => contacts.length > 0 && setStep("sessions")}
              disabled={contacts.length === 0}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                step === "sessions"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : contacts.length > 0
                    ? "text-muted-foreground hover:text-foreground"
                    : "opacity-40 cursor-not-allowed"
              }`}
            >
              Sessions ({selectedSessionIds.length})
            </button>
            <button
              type="button"
              onClick={() => contacts.length > 0 && setStep("review")}
              disabled={contacts.length === 0}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                step === "review"
                  ? "bg-success text-white shadow-sm font-semibold"
                  : contacts.length > 0
                    ? "text-muted-foreground hover:text-foreground"
                    : "opacity-40 cursor-not-allowed"
              }`}
            >
              Review & Launch
            </button>
          </div>
        </div>

        {/* STEP 1: CSV IMPORT */}
        {step === "csv" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  id="campaign-title-input"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. VIP Summer Promotion 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium transition-all"
                />
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
                <div className="text-xs text-foreground">
                  <p className="font-semibold">Auto-Verification Enabled</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    All contacts will be verified before sending
                  </p>
                </div>
              </div>
            </div>

            <CsvImporter
              onContactsParsed={handleContactsParsed}
              onProceed={() => setStep("composer")}
            />
          </div>
        )}

        {/* STEP 2: MESSAGE & MEDIA COMPOSER */}
        {step === "composer" && (
          <div className="space-y-6">
            <MessageComposer
              templateText={templateText}
              imageUrl={imageUrl}
              mediaRef={mediaRef}
              contacts={contacts}
              onTemplateChange={setTemplateText}
              onImageChange={(url, ref) => {
                setImageUrl(url);
                setMediaRef(ref);
              }}
            />

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep("csv")}
                className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                ← Back to Recipients
              </button>
              <button
                type="button"
                id="wizard-next-sessions-btn"
                onClick={() => setStep("sessions")}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
              >
                <span>Proceed to Sessions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SESSION SELECTOR & RATE LIMITS */}
        {step === "sessions" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Select Sending Sessions
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose which WhatsApp sessions will send messages in parallel
              </p>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-center">
                <p className="text-sm text-warning font-medium">
                  No sessions configured
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please connect at least one WhatsApp session to send campaigns
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sessions.map((session) => {
                  const isSelected = selectedSessionIds.includes(session.id);
                  const quota = getSessionQuota(session, now);

                  return (
                    <div
                      key={session.id}
                      onClick={() => toggleSession(session.id)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                          : "border-border bg-muted/30 hover:bg-muted/50 opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              session.status === "connected"
                                ? "bg-success"
                                : "bg-warning"
                            }`}
                          />
                          <span className="text-xs font-bold text-foreground">
                            {session.name}
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-white transition-colors ${
                            isSelected
                              ? "bg-primary"
                              : "border border-border bg-muted"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 stroke-3" />
                          )}
                        </div>
                      </div>

                      {/* Quota Meters */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">
                              Hourly Cap:
                            </span>
                            <span
                              className={`font-mono font-semibold ${
                                quota.isHourlyCapped
                                  ? "text-destructive"
                                  : "text-success"
                              }`}
                            >
                              {quota.hourlyLimit - quota.hourlyUsed} /{" "}
                              {quota.hourlyLimit} remaining
                            </span>
                          </div>
                          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden border border-border">
                            <div
                              className={`h-full transition-all ${
                                quota.isHourlyCapped
                                  ? "bg-destructive"
                                  : "bg-success"
                              }`}
                              style={{
                                width: `${(quota.hourlyUsed / quota.hourlyLimit) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">
                              Daily Cap:
                            </span>
                            <span
                              className={`font-mono font-semibold ${
                                quota.isDailyCapped
                                  ? "text-destructive"
                                  : "text-foreground"
                              }`}
                            >
                              {quota.dailyLimit - quota.dailyUsed} /{" "}
                              {quota.dailyLimit} remaining
                            </span>
                          </div>
                          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden border border-border">
                            <div
                              className={`h-full transition-all ${
                                quota.isDailyCapped
                                  ? "bg-destructive"
                                  : "bg-primary"
                              }`}
                              style={{
                                width: `${(quota.dailyUsed / quota.dailyLimit) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep("composer")}
                className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                ← Back to Template
              </button>
              <button
                type="button"
                id="wizard-next-review-btn"
                onClick={() => setStep("review")}
                disabled={selectedSessionIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-md transition-all disabled:opacity-40"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & LAUNCH */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="bg-muted/30 rounded-xl p-5 border border-border space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Campaign Name:
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {campaignTitle}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Total Recipients:
                  </span>
                  <span className="font-bold text-success text-sm">
                    {contacts.length} recipients
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Sessions:
                  </span>
                  <span className="font-bold text-primary text-sm">
                    {selectedSessionIds.length} sessions
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">
                    Media Attachment:
                  </span>
                  <span className="font-medium text-foreground">
                    {imageFileName || "Text Only"}
                  </span>
                </div>
              </div>

              {/* Pre-verification batch checker */}
              <div className="bg-card p-4 rounded-xl border border-border space-y-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-success" />
                      <span>Pre-Send Verification</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Verify all WhatsApp numbers before campaign launch
                    </p>
                  </div>

                  <button
                    type="button"
                    id="run-pre-verify-btn"
                    disabled={verification.isRunning}
                    onClick={runPreVerification}
                    className="px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 border border-border transition-colors disabled:opacity-50"
                  >
                    {verification.isRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-success" />
                        <span>Run Pre-Check</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progress bar — visible while running */}
                {verification.isRunning && verification.progress && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        Checking {verification.progress.checked} /{" "}
                        {verification.progress.total} numbers…
                      </span>
                      <span className="font-mono">
                        {Math.round(
                          (verification.progress.checked /
                            verification.progress.total) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(verification.progress.checked / verification.progress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-success">
                        ✓ {verification.progress.registered} registered
                      </span>
                      <span className="text-warning">
                        ✗ {verification.progress.unregistered} unregistered
                      </span>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {verification.error && (
                  <p className="text-xs text-destructive pt-1">
                    Pre-check failed: {verification.error}
                  </p>
                )}

                {/* Verification badges */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <div className="px-2.5 py-1 rounded-md bg-success/10 text-success border border-success/30 font-medium">
                    🟢 Valid:{" "}
                    {
                      contacts.filter(
                        (c) => c.verificationStatus === "registered",
                      ).length
                    }
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/30 font-medium">
                    🔴 Unregistered:{" "}
                    {
                      contacts.filter(
                        (c) => c.verificationStatus === "unregistered",
                      ).length
                    }
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border font-medium">
                    ⚪ Unverified:{" "}
                    {
                      contacts.filter(
                        (c) => c.verificationStatus === "unverified",
                      ).length
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep("sessions")}
                className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                ← Back to Sessions
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Discard Draft
                </button>
                <button
                  type="button"
                  id="launch-campaign-submit-btn"
                  onClick={handleCreateAndLaunch}
                  className="px-6 py-2.5 rounded-xl bg-success hover:bg-success/90 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-[1.01]"
                >
                  <Send className="w-4 h-4" />
                  <span>Launch Campaign</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
