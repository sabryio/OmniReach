/**
 * MessageComposer — template editor + live WhatsApp phone preview
 * Placeholder
 */

import type { Contact } from "@/features/customers/schemas/customer.schema";

interface MessageComposerProps {
  templateText: string;
  imageUrl?: string;
  contacts: Contact[];
  onTemplateChange: (text: string) => void;
  onImageChange: (url: string) => void;
}

export function MessageComposer({
  templateText,
  imageUrl,
  contacts,
  onTemplateChange,
  onImageChange,
}: MessageComposerProps) {
  const SAMPLE_VARS = [
    "{{name}}",
    "{{phone}}",
    "{{prescription}}",
    "{{doctor}}",
    "{{date}}",
  ];
  const SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&q=60",
    "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=300&q=60",
  ];

  // Render preview using first contact's fields
  const preview = contacts[0]
    ? templateText
        .replace(/{{name}}/g, contacts[0].name)
        .replace(/{{phone}}/g, contacts[0].rawPhone)
        .replace(
          /\{\{(\w+)\}\}/g,
          (_, k) => contacts[0]?.customFields[k] ?? `{{${k}}}`,
        )
    : templateText;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor side */}
      <div className="space-y-4">
        {/* Merge tag buttons */}
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_VARS.map((v) => (
            <button
              key={v}
              onClick={() => onTemplateChange(templateText + v)}
              className="px-2 py-0.5 text-[11px] rounded bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border transition-colors font-mono"
            >
              {v}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={templateText}
          onChange={(e) => onTemplateChange(e.target.value)}
          rows={6}
          placeholder="Write your message here. Use {{name}} for personalization."
          className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />

        {/* Image URL */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Image URL (optional)
          </label>
          <input
            type="text"
            value={imageUrl ?? ""}
            onChange={(e) => onImageChange(e.target.value)}
            placeholder="https://..."
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Sample images */}
        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_IMAGES.map((src) => (
            <button
              key={src}
              onClick={() => onImageChange(src)}
              className={`rounded overflow-hidden border-2 transition-colors ${imageUrl === src ? "border-primary" : "border-transparent"}`}
            >
              <img src={src} alt="" className="w-full h-16 object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp phone preview */}
      <div className="flex justify-center">
        <div className="w-64 bg-[oklch(0.18_0_0)] rounded-3xl border-2 border-border overflow-hidden shadow-lg">
          {/* Phone header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground text-xs font-bold">
              {contacts[0]?.name?.charAt(0) ?? "?"}
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-foreground">
                {contacts[0]?.name ?? "Preview Contact"}
              </p>
              <p className="text-[10px] text-primary-foreground/70">online</p>
            </div>
          </div>

          {/* Chat bubble */}
          <div
            className="p-3 min-h-32 space-y-2"
            style={{ background: "oklch(0.16 0 0)" }}
          >
            <div className="max-w-[90%] bg-card rounded-lg rounded-tl-none p-2.5 space-y-2">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full rounded object-cover max-h-28"
                />
              )}
              <p className="text-xs text-foreground whitespace-pre-wrap wrap-break-word">
                {preview || "..."}
              </p>
              <p className="text-[10px] text-muted-foreground text-right">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                ✓✓
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
