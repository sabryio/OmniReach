import { config } from "@/lib/config";
import {
  templateSchema,
  templatesSchema,
  createTemplateInputSchema,
  updateTemplateInputSchema,
  type Template,
  type CreateTemplateInput,
  type UpdateTemplateInput,
} from "../schemas/template.schema";

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<Template[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/templates`, {
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`);
  }

  const data = await response.json();
  return templatesSchema.parse(data);
}

export async function getTemplate(id: string): Promise<Template> {
  const response = await fetch(`${config.apiBaseUrl}/api/templates/${id}`, {
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch template ${id}: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation
  return templateSchema.parse(data);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createTemplate(
  input: CreateTemplateInput,
): Promise<Template> {
  // Validate input before sending
  const validatedInput = createTemplateInputSchema.parse(input);

  const response = await fetch(`${config.apiBaseUrl}/api/templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    throw new Error(`Failed to create template: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation
  return templateSchema.parse(data);
}

export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput,
): Promise<Template> {
  // Validate input before sending
  const validatedInput = updateTemplateInputSchema.parse(input);

  const response = await fetch(`${config.apiBaseUrl}/api/templates/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    throw new Error(`Failed to update template: ${response.statusText}`);
  }

  const data = await response.json();

  // Runtime validation
  return templateSchema.parse(data);
}

export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}/api/templates/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete template: ${response.statusText}`);
  }
}
