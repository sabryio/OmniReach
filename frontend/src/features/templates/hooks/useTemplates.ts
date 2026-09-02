import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type {
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
} from "../schemas/template.schema";

/**
 * Comprehensive hook for TemplatesView component.
 * Receives templates as a parameter — NO default data inside this hook.
 * All default/initial data must come from the route via useTemplatesQuery.
 *
 * Mutation functions (create/update/delete) are passed in as parameters to avoid
 * direct dependency on TanStack Query from this UI state hook.
 */
export function useTemplateManager(
  initialTemplates: Template[],
  mutations: {
    createTemplateAsync: (input: CreateTemplateInput) => Promise<Template>;
    updateTemplateAsync: (params: {
      id: string;
      input: UpdateTemplateInput;
    }) => Promise<Template>;
    deleteTemplateAsync: (id: string) => Promise<void>;
  },
) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplates[0]?.id ?? "",
  );

  // Sync templates when they load from backend
  useEffect(() => {
    if (initialTemplates.length > 0) {
      setTemplates(initialTemplates);
      if (
        !selectedTemplateId ||
        !initialTemplates.find((t) => t.id === selectedTemplateId)
      ) {
        setSelectedTemplateId(initialTemplates[0]?.id ?? "");
      }
    }
  }, [initialTemplates, selectedTemplateId]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editor modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<Partial<Template> | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Selected template
  const selectedTemplate = useMemo(
    () =>
      templates.find((t) => t.id === selectedTemplateId) ??
      templates[0] ??
      null,
    [templates, selectedTemplateId],
  );

  // Filtered templates
  const filteredTemplates = useMemo(
    () =>
      templates.filter((tmpl) => {
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
      }),
    [templates, selectedCategory, searchQuery],
  );

  const handleCopyText = useCallback((tmpl: Template) => {
    navigator.clipboard.writeText(tmpl.text);
    setCopiedId(tmpl.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
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
  }, []);

  const handleOpenEditModal = useCallback((tmpl: Template) => {
    setUploadError(null);
    setEditingTemplate({ ...tmpl });
    setIsEditorOpen(true);
  }, []);

  const handleImageFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
            ? { ...prev, imageUrl: dataUrl, imageFileName: file.name }
            : null,
        );
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleRemoveImage = useCallback(() => {
    setEditingTemplate((prev) =>
      prev ? { ...prev, imageUrl: undefined, imageFileName: undefined } : null,
    );
  }, []);

  const handleInsertVariable = useCallback((varName: string) => {
    setEditingTemplate((prev) => {
      if (!prev) return null;
      const currentText = prev.text ?? "";
      const tag = `{{${varName}}}`;
      const newText =
        currentText + (currentText.endsWith(" ") ? "" : " ") + tag + " ";
      const currentVars = prev.suggestedVariables ?? [];
      return {
        ...prev,
        text: newText,
        suggestedVariables: currentVars.includes(varName)
          ? currentVars
          : [...currentVars, varName],
      };
    });
  }, []);

  const handleSaveTemplate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTemplate?.title?.trim() || !editingTemplate?.text?.trim())
        return;

      const title = editingTemplate.title.trim();
      const text = editingTemplate.text.trim();
      const category = editingTemplate.category?.trim() ?? "Custom";
      const imageUrl = editingTemplate.imageUrl?.trim() || undefined;
      const imageFileName =
        editingTemplate.imageFileName ||
        (imageUrl ? "attached_image.jpg" : undefined);

      const detectedVars: string[] = [];
      for (const match of text.matchAll(/\{\{([a-zA-Z0-9_-]+)\}\}/g)) {
        if (match[1] && !detectedVars.includes(match[1]))
          detectedVars.push(match[1]);
      }

      try {
        if (editingTemplate.id) {
          // Update existing template via backend
          const input: UpdateTemplateInput = {
            title,
            category,
            text,
            imageUrl,
            imageFileName,
            suggestedVariables:
              detectedVars.length > 0
                ? detectedVars
                : (editingTemplate.suggestedVariables ?? ["name"]),
          };
          const updated = await mutations.updateTemplateAsync({
            id: editingTemplate.id,
            input,
          });
          setSelectedTemplateId(updated.id);
        } else {
          // Create new template via backend
          const input: CreateTemplateInput = {
            title,
            titleAr: null,
            category,
            categoryAr: null,
            text,
            textAr: null,
            imageUrl: imageUrl ?? null,
            imageFileName: imageFileName ?? null,
            suggestedVariables:
              detectedVars.length > 0 ? detectedVars : ["name", "prescription"],
          };
          const created = await mutations.createTemplateAsync(input);
          setSelectedTemplateId(created.id);
        }

        setIsEditorOpen(false);
        setEditingTemplate(null);
      } catch (error) {
        console.error("Failed to save template:", error);
        setUploadError(
          error instanceof Error ? error.message : "Failed to save template",
        );
      }
    },
    [editingTemplate, mutations],
  );

  const handleDeleteTemplate = useCallback(
    async (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const target = templates.find((t) => t.id === id);
      if (!target) return;

      if (window.confirm(`Delete template "${target.title}"?`)) {
        try {
          await mutations.deleteTemplateAsync(id);

          // Update local selection if deleted template was selected
          if (selectedTemplateId === id) {
            const remaining = templates.filter((t) => t.id !== id);
            setSelectedTemplateId(remaining[0]?.id ?? "");
          }
        } catch (error) {
          console.error("Failed to delete template:", error);
          alert(
            error instanceof Error
              ? error.message
              : "Failed to delete template",
          );
        }
      }
    },
    [templates, selectedTemplateId, mutations],
  );

  const handleDuplicateTemplate = useCallback(
    async (tmpl: Template, e?: React.MouseEvent) => {
      e?.stopPropagation();

      const input: CreateTemplateInput = {
        title: `${tmpl.title} (Copy)`,
        titleAr: tmpl.titleAr,
        category: tmpl.category,
        categoryAr: tmpl.categoryAr,
        text: tmpl.text,
        textAr: tmpl.textAr,
        imageUrl: tmpl.imageUrl ?? null,
        imageFileName: tmpl.imageFileName ?? null,
        suggestedVariables: tmpl.suggestedVariables,
      };

      try {
        const duplicate = await mutations.createTemplateAsync(input);
        setSelectedTemplateId(duplicate.id);
      } catch (error) {
        console.error("Failed to duplicate template:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to duplicate template",
        );
      }
    },
    [mutations],
  );

  return {
    // Template list
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    selectedTemplate,
    // Filters
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredTemplates,
    // Copy
    copiedId,
    handleCopyText,
    // Editor modal
    isEditorOpen,
    setIsEditorOpen,
    editingTemplate,
    setEditingTemplate,
    uploadError,
    setUploadError,
    fileInputRef,
    // Actions
    handleOpenCreateModal,
    handleOpenEditModal,
    handleImageFileUpload,
    handleRemoveImage,
    handleInsertVariable,
    handleSaveTemplate,
    handleDeleteTemplate,
    handleDuplicateTemplate,
  };
}
