/**
 * MessageComposer — template editor + live WhatsApp phone preview
 * With file upload support
 */

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import type { Contact } from "@/features/customers/schemas/customer.schema";
import { useMediaUpload } from "@/features/media";

interface MessageComposerProps {
  templateText: string;
  imageUrl?: string;
  mediaRef?: string;
  contacts: Contact[];
  onTemplateChange: (text: string) => void;
  onImageChange: (url: string, mediaRef?: string) => void;
}

export function MessageComposer({
  templateText,
  imageUrl,
  mediaRef: _mediaRef,
  contacts,
  onTemplateChange,
  onImageChange,
}: MessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { uploadMediaAsync, isUploading } = useMediaUpload();

  const SAMPLE_VARS = [
    "{{name}}",
    "{{phone}}",
    "{{prescription}}",
    "{{doctor}}",
    "{{date}}",
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are supported");
      return;
    }

    try {
      // Upload to backend
      const response = await uploadMediaAsync({
        file,
        mediaType: "image",
      });

      // Create local preview URL
      const previewUrl = URL.createObjectURL(file);

      // Pass both preview URL and mediaRef to parent
      onImageChange(previewUrl, response.mediaRef);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleRemoveImage = () => {
    onImageChange("", undefined);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

        {/* Character counter */}
        <div className="text-xs text-muted-foreground text-right">
          {templateText.length} / 1,600 characters
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex items-center gap-2">
            Image (optional)
            {isUploading && (
              <span className="text-primary text-[10px]">Uploading...</span>
            )}
          </label>

          {/* File input hidden */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload button or preview */}
          {!imageUrl ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Click to upload image
              </span>
            </button>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
        </div>

        {/* Image URL (for manual entry or sample selection) */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Or paste image URL
          </label>
          <input
            type="text"
            value={imageUrl ?? ""}
            onChange={(e) => onImageChange(e.target.value, undefined)}
            placeholder="https://..."
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
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
