/**
 * AddSessionModal — Create or edit WhatsApp session
 * When sessionId is provided, loads and edits existing session
 * When sessionId is null, creates new session
 */
import { useEffect } from "react";
import { X, Plus, Save, Server } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import {
  useCreateSession,
  useUpdateSession,
} from "../hooks/useSessionMutations";
import { useSession } from "../hooks/useSessionsQuery";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string | null; // null = create mode, string = edit mode
}

// Create: all fields required
const createSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  phone_number: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^\+?\d{10,15}$/, "Invalid phone number format (10-15 digits)"),
  api_key: z.string().min(1, "API key is required"),
  hourly_limit: z.number().int().positive("Must be a positive number"),
  daily_limit: z.number().int().positive("Must be a positive number"),
});

// Edit: phoneNumber read-only (not validated), apiKey optional (empty = keep current)
const editSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  phone_number: z.string(),
  api_key: z.string(),
  hourly_limit: z.number().int().positive("Must be a positive number"),
  daily_limit: z.number().int().positive("Must be a positive number"),
});

export function AddSessionModal({
  isOpen,
  onClose,
  sessionId = null,
}: AddSessionModalProps) {
  const isEditMode = !!sessionId;

  const {
    createSessionAsync,
    isCreating,
    error: createError,
    reset: resetCreate,
  } = useCreateSession();
  const {
    updateSessionAsync,
    isUpdating,
    error: updateError,
    reset: resetUpdate,
  } = useUpdateSession();
  const { session: existingSession, isLoading: isLoadingSession } = useSession(
    sessionId || "",
  );

  const isSubmitting = isCreating || isUpdating;
  const error = createError || updateError;

  const form = useForm({
    defaultValues: {
      name: "",
      phone_number: "",
      api_key: "",
      hourly_limit: 1000,
      daily_limit: 10000,
    },
    validators: {
      onSubmit: isEditMode ? editSchema : createSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEditMode && sessionId) {
          await updateSessionAsync({
            id: sessionId,
            name: value.name,
            // Only send api_key if user typed a new one
            api_key: value.api_key.trim() || undefined,
            hourly_limit: value.hourly_limit,
            daily_limit: value.daily_limit,
          });
        } else {
          await createSessionAsync({
            name: value.name,
            phone_number: value.phone_number,
            api_key: value.api_key,
            hourly_limit: value.hourly_limit,
            daily_limit: value.daily_limit,
          });
        }
        form.reset();
        handleClose();
      } catch (err) {
        console.error(
          `Failed to ${isEditMode ? "update" : "create"} session:`,
          err,
        );
      }
    },
  });

  // Load existing session data into form when in edit mode
  useEffect(() => {
    if (isEditMode && existingSession) {
      form.setFieldValue("name", existingSession.name);
      form.setFieldValue("phone_number", existingSession.phone_number);
      form.setFieldValue("hourly_limit", existingSession.hourly_limit);
      form.setFieldValue("daily_limit", existingSession.daily_limit);
      // apiKey is write-only — leave blank (placeholder explains)
    }
  }, [isEditMode, existingSession]);

  const handleClose = () => {
    form.reset();
    resetCreate();
    resetUpdate();
    onClose();
  };

  if (!isOpen) return null;

  if (isEditMode && isLoadingSession) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isEditMode ? "Edit Session" : "Add WhatsApp Session"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isEditMode
                  ? "Update session name, API key, and rate limits"
                  : "Connect a new WhatsApp Business account"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="p-5 space-y-4"
        >
          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
              <p className="font-semibold">
                Failed to {isEditMode ? "update" : "create"} session
              </p>
              <p className="text-[11px] mt-0.5">{String(error)}</p>
            </div>
          )}

          {/* Session Name */}
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Session Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Main Account, Support Line"
                    aria-invalid={isInvalid}
                  />
                  <FieldDescription>
                    A friendly name to identify this WhatsApp connection
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* Phone Number — read-only in edit mode */}
          <form.Field
            name="phone_number"
            children={(field) => {
              const isInvalid =
                !isEditMode &&
                field.state.meta.isTouched &&
                !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="tel"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="+201234567890"
                    disabled={isEditMode}
                    aria-invalid={isInvalid}
                    className="font-mono"
                  />
                  <FieldDescription>
                    {isEditMode
                      ? "Phone number cannot be changed after creation"
                      : "WhatsApp number for this session (10-15 digits with optional +)"}
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* API Key — required on create, optional on edit */}
          <form.Field
            name="api_key"
            children={(field) => {
              const isInvalid =
                !isEditMode &&
                field.state.meta.isTouched &&
                !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    WABridge API Key{" "}
                    {isEditMode && (
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    )}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={
                      isEditMode
                        ? "Leave empty to keep current key"
                        : "Enter API key from WABridge"
                    }
                    aria-invalid={isInvalid}
                    className="font-mono"
                  />
                  <FieldDescription>
                    {isEditMode
                      ? "Enter a new key to replace the existing one, or leave empty to keep it"
                      : "Obtained from your WABridge server configuration"}
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* Rate Limits */}
          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="hourly_limit"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Hourly Limit</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="1"
                      max="10000"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(parseInt(e.target.value) || 0)
                      }
                      aria-invalid={isInvalid}
                      className="font-mono"
                    />
                    <FieldDescription>Messages per hour</FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <form.Field
              name="daily_limit"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Daily Limit</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="1"
                      max="100000"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(parseInt(e.target.value) || 0)
                      }
                      aria-invalid={isInvalid}
                      className="font-mono"
                    />
                    <FieldDescription>Messages per 24h</FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditMode ? (
                <>
                  <Save className="w-3.5 h-3.5 mr-2" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-2" />
                  {isSubmitting ? "Creating..." : "Create Session"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
