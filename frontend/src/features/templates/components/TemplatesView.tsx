/**
 * TemplatesView — template library with CRUD + live WhatsApp preview
 * Beautiful UI with exact mockup structure and enhanced functionality
 */
import { useState, useRef } from "react";
import {
  FileText,
  Plus,
  Copy,
  Check,
  Send,
  Trash2,
  Edit3,
  Smartphone,
  Image as ImageIcon,
  Upload,
  X,
  Search,
  Sparkles,
  Tag,
  Clock,
  Layers,
} from "lucide-react";
import type { MessageTemplate } from "@/types";

interface TemplatesViewProps {
  onUseTemplateInCampaign: (template: MessageTemplate) => void;
}

const SAMPLE_IMAGE_PRESETS = [
  {
    name: "Prescription Rx Ready",
    url: "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=600&q=80",
    fileName: "prescription_rx_ready.jpg",
  },
  {
    name: "Medication Bottles & Pills",
    url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    fileName: "medication_refill.jpg",
  },
  {
    name: "Clinical Lab Tests",
    url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80",
    fileName: "lab_results_banner.jpg",
  },
  {
    name: "Flu Vaccine",
    url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
    fileName: "vaccine_drive.jpg",
  },
  {
    name: "VIP Wellness Card",
    url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80",
    fileName: "vip_wellness.jpg",
  },
  {
    name: "Pharmacy Storefront",
    url: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=600&q=80",
    fileName: "pharmacy_store.jpg",
  },
];

const AVAILABLE_MERGE_TAGS = [
  { tag: "name", label: "Recipient Name", example: "Dr. Sabry El-Sayed" },
  { tag: "prescription", label: "Medication", example: "Lipitor 20mg" },
  { tag: "doctor", label: "Doctor", example: "Dr. Roberts" },
  { tag: "date", label: "Date", example: "Oct 24, 2026" },
  { tag: "pharmacy", label: "Pharmacy", example: "Main St Pharmacy" },
  { tag: "company", label: "Company", example: "Care Corp" },
  {
    tag: "portal_url",
    label: "Portal Link",
    example: "https://rx.care/login",
  },
];

// Default templates
const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "tmpl_001",
    title: "Prescription Ready for Pickup",
    category: "Pharmacy",
    text: "Hello {{name}}, your prescription for {{prescription}} is ready for pickup at our pharmacy. Please bring your ID.",
    imageUrl:
      "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=600&q=80",
    imageFileName: "prescription_ready.jpg",
    suggestedVariables: ["name", "prescription"],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 30,
  },
  {
    id: "tmpl_002",
    title: "Lab Results Available",
    category: "Lab Results",
    text: "Dear {{name}}, your lab results are now available. Please visit us during business hours or log into the patient portal at {{portal_url}}.",
    imageUrl:
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80",
    imageFileName: "lab_results.jpg",
    suggestedVariables: ["name", "portal_url"],
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 25,
  },
  {
    id: "tmpl_003",
    title: "Flu Vaccine Reminder",
    category: "Vaccination",
    text: "Hi {{name}}, flu season is here! Protect yourself and your family with our flu vaccine. Book your appointment today at {{pharmacy}}.",
    imageUrl:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80",
    imageFileName: "flu_vaccine.jpg",
    suggestedVariables: ["name", "pharmacy"],
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
  },
  {
    id: "tmpl_004",
    title: "VIP Membership Benefits",
    category: "VIP Care",
    text: "Exclusive offer for {{name}}! As a VIP member, enjoy 20% off all purchases this month. Visit us at {{pharmacy}} to claim your rewards.",
    imageUrl:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80",
    imageFileName: "vip_benefits.jpg",
    suggestedVariables: ["name", "pharmacy"],
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 15,
  },
  {
    id: "tmpl_005",
    title: "Refill Reminder",
    category: "Refill Reminder",
    text: "Hello {{name}}, it's time to refill your {{prescription}}. Call us or order online for convenient pickup or delivery.",
    suggestedVariables: ["name", "prescription"],
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
];

export function TemplatesView({ onUseTemplateInCampaign }: TemplatesViewProps) {
  const [templates, setTemplates] =
    useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    DEFAULT_TEMPLATES[0]?.id || "",
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for Create & Edit
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<Partial<MessageTemplate> | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0] || null;

  // Filter templates based on category & search query
  const filteredTemplates = templates.filter((tmpl) => {
    const matchesCat =
      selectedCategory === "all" ||
      tmpl.category.toLowerCase() === selectedCategory.toLowerCase();

    if (!matchesCat) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tmpl.title.toLowerCase().includes(q) ||
      tmpl.text.toLowerCase().includes(q) ||
      tmpl.category.toLowerCase().includes(q)
    );
  });

  const handleCopyText = (tmpl: MessageTemplate) => {
    navigator.clipboard.writeText(tmpl.text);
    setCopiedId(tmpl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setUploadError(null);
    setEditingTemplate({
      title: "",
      category: "Pharmacy",
      text: "Hello {{name}}, your prescription for {{prescription}} is ready for pickup at our pharmacy.",
      imageUrl: "",
      imageFileName: "",
      suggestedVariables: ["name", "prescription"],
    });
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (tmpl: MessageTemplate) => {
    setUploadError(null);
    setEditingTemplate({ ...tmpl });
    setIsEditorOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must not exceed 5MB");
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setEditingTemplate((prev) =>
        prev
          ? {
              ...prev,
              imageUrl: dataUrl,
              imageFileName: file.name,
            }
          : null,
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setEditingTemplate((prev) =>
      prev
        ? {
            ...prev,
            imageUrl: undefined,
            imageFileName: undefined,
          }
        : null,
    );
  };

  const handleInsertVariable = (varName: string) => {
    if (!editingTemplate) return;
    const currentText = editingTemplate.text || "";
    const tag = `{{${varName}}}`;
    const newText =
      currentText + (currentText.endsWith(" ") ? "" : " ") + tag + " ";

    const currentVars = editingTemplate.suggestedVariables || [];
    const newVars = currentVars.includes(varName)
      ? currentVars
      : [...currentVars, varName];

    setEditingTemplate({
      ...editingTemplate,
      text: newText,
      suggestedVariables: newVars,
    });
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.title?.trim() || !editingTemplate?.text?.trim()) {
      return;
    }

    const title = editingTemplate.title.trim();
    const text = editingTemplate.text.trim();
    const category = editingTemplate.category?.trim() || "Custom";
    const imageUrl = editingTemplate.imageUrl?.trim() || undefined;
    const imageFileName =
      editingTemplate.imageFileName ||
      (imageUrl ? "attached_image.jpg" : undefined);

    // Extract variables inside {{...}}
    const detectedVars: string[] = [];
    const matches = text.matchAll(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
    for (const match of matches) {
      if (match[1] && !detectedVars.includes(match[1])) {
        detectedVars.push(match[1]);
      }
    }

    if (editingTemplate.id) {
      // Update existing
      const updatedTemplate: MessageTemplate = {
        id: editingTemplate.id,
        title,
        category,
        text,
        imageUrl,
        imageFileName,
        suggestedVariables:
          detectedVars.length > 0
            ? detectedVars
            : editingTemplate.suggestedVariables || ["name"],
        updatedAt: Date.now(),
        createdAt: editingTemplate.createdAt || Date.now(),
      };

      const next = templates.map((t) =>
        t.id === updatedTemplate.id ? updatedTemplate : t,
      );
      setTemplates(next);
      setSelectedTemplateId(updatedTemplate.id);
    } else {
      // Create new
      const createdTemplate: MessageTemplate = {
        id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        category,
        text,
        imageUrl,
        imageFileName,
        suggestedVariables:
          detectedVars.length > 0 ? detectedVars : ["name", "prescription"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const next = [createdTemplate, ...templates];
      setTemplates(next);
      setSelectedTemplateId(createdTemplate.id);
    }

    setIsEditorOpen(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = templates.find((t) => t.id === id);
    if (!target) return;

    if (
      window.confirm(
        `Are you sure you want to permanently delete template "${target.title}"?`,
      )
    ) {
      const next = templates.filter((tmpl) => tmpl.id !== id);
      setTemplates(next);
      if (selectedTemplateId === id) {
        setSelectedTemplateId(next.length > 0 ? next[0]?.id || "" : "");
      }
    }
  };

  const handleDuplicateTemplate = (
    tmpl: MessageTemplate,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    const duplicate: MessageTemplate = {
      ...tmpl,
      id: `tmpl_${Date.now()}_copy`,
      title: `${tmpl.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [duplicate, ...templates];
    setTemplates(next);
    setSelectedTemplateId(duplicate.id);
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Restore standard default templates?")) {
      setTemplates(DEFAULT_TEMPLATES);
      setSelectedTemplateId(DEFAULT_TEMPLATES[0]?.id || "");
    }
  };

  // Categories list
  const categoryTabs = [
    { id: "all", label: "All Templates" },
    { id: "Pharmacy", label: "Pharmacy" },
    { id: "Refill Reminder", label: "Refills" },
    { id: "Lab Results", label: "Lab Results" },
    { id: "Vaccination", label: "Vaccination" },
    { id: "VIP Care", label: "VIP Care" },
  ];

  return (
    <div className="space-y-4 max-w-full">
      {/* Top Header Card */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                Message Templates
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono border border-primary/20 font-semibold">
                {templates.length} Saved Templates
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create, manage, and reuse message templates for campaigns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs border border-border transition-colors flex items-center gap-1"
            title="Restore Default Templates"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            id="btn-create-new-template"
            onClick={handleOpenCreateModal}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Search, Category Filters, and Template Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by name or content..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categoryTabs.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border hover:bg-muted/50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Template Card List */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-xl text-muted-foreground space-y-2">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                <p className="text-xs font-medium">No templates found</p>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Create New Template
                </button>
              </div>
            ) : (
              filteredTemplates.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 relative group ${
                      isSelected
                        ? "bg-primary/5 border-primary/60 shadow-md ring-1 ring-primary/30"
                        : "bg-card border-border hover:bg-muted/30 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider bg-muted text-primary border border-border font-medium">
                          {tmpl.category}
                        </span>
                        {tmpl.imageUrl && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 flex items-center gap-1">
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>Image</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {tmpl.text.length} chars
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-foreground line-clamp-1">
                      {tmpl.title}
                    </h3>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {tmpl.text}
                    </p>

                    {/* Quick Card Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{tmpl.suggestedVariables.join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicateTemplate(tmpl, e)}
                          title="Duplicate Template"
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Layers className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(tmpl);
                          }}
                          title="Edit Template"
                          className="p-1 rounded hover:bg-muted text-primary transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTemplate(tmpl.id, e)}
                          title="Delete Template"
                          className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Template Inspector & WhatsApp Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTemplate ? (
            <div className="bg-card border border-border rounded-xl p-5 shadow-md space-y-4">
              {/* Header Info & Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-primary/10 text-primary border border-primary/20 font-medium">
                      {selectedTemplate.category}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">
                      {selectedTemplate.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedTemplate.text.length} characters •{" "}
                    {selectedTemplate.suggestedVariables.length} variables
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(selectedTemplate)}
                    className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium border border-border flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId === selectedTemplate.id ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedId === selectedTemplate.id ? "Copied!" : "Copy"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUseTemplateInCampaign(selectedTemplate)}
                    className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Use in Campaign</span>
                  </button>
                </div>
              </div>

              {/* Template Details */}
              <div className="space-y-4">
                {/* Template Message Body Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Template Message Body:
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {selectedTemplate.text.length} characters
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedTemplate.text}
                    </p>
                  </div>
                </div>

                {/* Available Merge Variables */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Available Merge Variables:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.suggestedVariables.map((v) => (
                      <span
                        key={v}
                        className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-mono border border-primary/20 hover:bg-primary/20 transition-colors cursor-default"
                        title={`Variable: ${v}`}
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Image Attachment Info */}
                {selectedTemplate.imageUrl && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Media Attachment:
                    </h4>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-success/30 shrink-0">
                        <img
                          src={selectedTemplate.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ImageIcon className="w-3.5 h-3.5 text-success" />
                          <span className="text-xs font-medium text-foreground truncate">
                            {selectedTemplate.imageFileName ||
                              "pharmacy_rx_ready.jpg"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          This image will be dispatched alongside the message
                          caption.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Template Metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Category
                    </span>
                    <span className="text-xs font-medium text-foreground px-2 py-1 rounded bg-muted border border-border inline-block">
                      {selectedTemplate.category}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Created
                    </span>
                    <p className="text-xs text-foreground">
                      {new Date(
                        selectedTemplate.createdAt || Date.now(),
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Variables
                    </span>
                    <p className="text-xs text-foreground font-mono">
                      {selectedTemplate.suggestedVariables.length} merge tags
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Status
                    </span>
                    <span className="text-xs font-medium text-success flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Live Preview */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-primary" />
                    Live WhatsApp Recipient Preview
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/30 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Live Simulation
                  </span>
                </div>

                <div className="flex justify-center py-4">
                  {/* WhatsApp Business Interface */}
                  <div className="w-full max-w-md bg-[#0b141a] rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                    {/* WhatsApp Header */}
                    <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 border-b border-[#2a3942]">
                      <button className="text-[#8696a0] hover:text-[#aebac1] transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-success/30">
                        Rx
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#e9edef] truncate">
                          City Pharmacy Hub
                        </p>
                        <p className="text-[11px] text-[#8696a0]">
                          Official WhatsApp Business
                        </p>
                      </div>
                      <button className="text-[#8696a0] hover:text-[#aebac1] transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Chat Background Pattern */}
                    <div
                      className="p-4 min-h-100 relative"
                      style={{
                        background:
                          "linear-gradient(to bottom, #0b141a 0%, #0d1418 100%)",
                      }}
                    >
                      {/* Subtle pattern overlay */}
                      <div
                        className="absolute inset-0 opacity-[0.02]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                      />

                      {/* Message Bubble */}
                      <div className="relative flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="max-w-[85%] bg-[#005c4b] rounded-lg rounded-tl-sm p-2.5 shadow-lg">
                          {/* Image if exists */}
                          {selectedTemplate.imageUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden">
                              <img
                                src={selectedTemplate.imageUrl}
                                alt=""
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          )}

                          {/* Message Text with rendered variables */}
                          <div className="space-y-1.5">
                            <p className="text-[13px] text-[#e9edef] leading-[1.4] whitespace-pre-wrap">
                              {selectedTemplate.text
                                .replace(/\{\{name\}\}/g, "Dr. Sabry El-Sayed")
                                .replace(
                                  /\{\{prescription\}\}/g,
                                  "Lipitor 20mg",
                                )
                                .replace(/\{\{doctor\}\}/g, "Dr. Roberts")
                                .replace(
                                  /\{\{date\}\}/g,
                                  new Date().toLocaleDateString(),
                                )
                                .replace(
                                  /\{\{pharmacy\}\}/g,
                                  "Main Street Pharmacy",
                                )
                                .replace(/\{\{company\}\}/g, "Care Corp")
                                .replace(
                                  /\{\{portal_url\}\}/g,
                                  "https://rx.care/login",
                                )}
                            </p>

                            {/* Message metadata */}
                            <div className="flex items-center justify-end gap-1 pt-0.5">
                              <span className="text-[10px] text-[#8696a0]">
                                {new Date().toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <svg
                                className="w-4 h-4 text-[#53bdeb]"
                                viewBox="0 0 16 15"
                                fill="none"
                              >
                                <path
                                  d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                                  fill="currentColor"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timestamp Badge */}
                      <div className="flex justify-center mt-4">
                        <span className="px-3 py-1 rounded-full bg-[#202c33]/80 backdrop-blur-sm text-[10px] text-[#8696a0] font-medium shadow-lg border border-[#2a3942]/50">
                          Today
                        </span>
                      </div>
                    </div>

                    {/* Message Input Bar (disabled) */}
                    <div className="bg-[#202c33] px-3 py-2 flex items-center gap-2 border-t border-[#2a3942]">
                      <button className="text-[#8696a0] p-1.5 hover:bg-[#2a3942] rounded-full transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                      <div className="flex-1 bg-[#2a3942] rounded-lg px-3 py-1.5 flex items-center">
                        <span className="text-[13px] text-[#8696a0] select-none">
                          Type a message
                        </span>
                      </div>
                      <button className="text-[#8696a0] p-1.5 hover:bg-[#2a3942] rounded-full transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Details - Removed (moved above preview) */}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-12 text-center shadow-md">
              <Smartphone className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a template to preview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>
                  {editingTemplate.id ? "Edit Template" : "Create New Template"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Template Title
                </label>
                <input
                  type="text"
                  required
                  value={editingTemplate.title || ""}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Prescription Ready for Pickup"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Category
                </label>
                <select
                  value={editingTemplate.category || "Pharmacy"}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Refill Reminder">Refill Reminder</option>
                  <option value="Lab Results">Lab Results</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="VIP Care">VIP Care</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* Message Text */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Message Content
                </label>
                <textarea
                  required
                  value={editingTemplate.text || ""}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      text: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Write your message here. Use {{variable}} for personalization."
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
                />
              </div>

              {/* Merge Tags */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  Insert Variables
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_MERGE_TAGS.map((tag) => (
                    <button
                      key={tag.tag}
                      type="button"
                      onClick={() => handleInsertVariable(tag.tag)}
                      className="px-2 py-1 rounded text-[10px] font-mono bg-muted hover:bg-primary/20 hover:text-primary border border-border hover:border-primary/30 transition-all"
                      title={`${tag.label} - Example: ${tag.example}`}
                    >
                      {`{{${tag.tag}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Section */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">
                  Attachment (Optional)
                </label>

                {editingTemplate.imageUrl ? (
                  <div className="relative">
                    <img
                      src={editingTemplate.imageUrl}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-center hover:border-primary/50 hover:bg-muted/30 transition-all group"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-xs font-medium text-foreground">
                        Click to upload image
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        PNG, JPG, WebP up to 5MB
                      </p>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-destructive mt-1">{uploadError}</p>
                )}

                {/* Preset Images */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Or choose a preset:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {SAMPLE_IMAGE_PRESETS.slice(0, 6).map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() =>
                          setEditingTemplate({
                            ...editingTemplate,
                            imageUrl: preset.url,
                            imageFileName: preset.fileName,
                          })
                        }
                        className="rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all group"
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-16 object-cover group-hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {editingTemplate.id ? "Save Changes" : "Create Template"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
