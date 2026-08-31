/**
 * CSV Importer Hook — Phone normalization + CSV parsing with auto-detection
 *
 * Handles:
 * - Multi-stage phone normalization (raw → formatted → normalized E.164)
 * - CSV parsing with auto-column detection (phone, name, custom fields)
 * - Contact validation and invalid row tracking
 *
 * SOLID:
 * - SRP: Owns CSV parsing and phone normalization logic only
 * - OCP: Column detection patterns extensible without modifying core logic
 * - DIP: Component depends on this hook's interface, not papaparse directly
 */

import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import type { Contact } from "../schemas/campaign.schema";

// ─── Phone Normalization Utilities ───────────────────────────────────────────

/**
 * Extract digits only from raw phone string
 * Example: "+20 (101) 234-5678" → "201012345678"
 */
function extractDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Detect and prepend country code if missing
 * Egypt +20 default per Blueprint requirement
 *
 * Rules:
 * - If starts with country code (2+ digits after +): use as-is
 * - If 10 digits and no prefix: assume Egypt, prepend "20"
 * - If 11 digits starting with 0: replace 0 with "20" (local format)
 * - Otherwise: assume international, prepend "20" if <15 digits
 */
function detectCountryCode(digits: string): string {
  // Already has country code (starts with recognized pattern)
  if (digits.length >= 12 && /^(20|1|44|49|33|34|39|81|86)/.test(digits)) {
    return digits;
  }

  // Egyptian local format: 10 digits starting with 1 (mobile) or 2 (landline)
  if (digits.length === 10 && /^[12]/.test(digits)) {
    return `20${digits}`;
  }

  // Egyptian format with leading 0: 01XXXXXXXXX
  if (digits.length === 11 && digits.startsWith("0")) {
    return `20${digits.slice(1)}`;
  }

  // Short number (likely missing country code) — assume Egypt
  if (digits.length < 12) {
    return `20${digits}`;
  }

  return digits;
}

/**
 * Format normalized phone for display with spaces
 * Example: "+201012345678" → "+20 101 234 5678"
 */
function formatPhone(normalized: string): string {
  if (!normalized.startsWith("+")) {
    normalized = `+${normalized}`;
  }

  // Egypt format: +20 1XX XXX XXXX
  if (normalized.startsWith("+20") && normalized.length === 13) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
  }

  // Generic international: +CC XXX XXX XXXX
  if (normalized.length >= 12) {
    const cc = normalized.slice(0, normalized.length - 10);
    const local = normalized.slice(normalized.length - 10);
    return `${cc} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }

  return normalized;
}

/**
 * Full normalization pipeline: raw → E.164 format
 * Returns E.164 with + prefix: "+201012345678"
 */
function normalizePhone(raw: string): string {
  const digits = extractDigits(raw);
  const withCountryCode = detectCountryCode(digits);
  return `+${withCountryCode}`;
}

/**
 * Validate normalized phone meets E.164 constraints
 * Rules: 7-15 digits (excludes + prefix)
 */
function validatePhone(normalized: string): boolean {
  const digits = extractDigits(normalized);
  return digits.length >= 7 && digits.length <= 15;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvalidRow {
  rowIndex: number;
  rawData: Record<string, string>;
  reason: string;
}

interface UseCsvImporterReturn {
  contacts: Contact[];
  headers: string[];
  invalidRows: InvalidRow[];
  phoneColumn: string;
  nameColumn: string;
  isLoading: boolean;
  setPhoneColumn: (column: string) => void;
  setNameColumn: (column: string) => void;
  setFile: (file: File | null) => void;
  resetImporter: () => void;
}

// ─── Auto-Detection Patterns ─────────────────────────────────────────────────

const PHONE_PATTERN = /phone|mobile|tel|cell|number|رقم|هاتف/i;
const NAME_PATTERN = /name|full.?name|اسم|الاسم/i;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCsvImporter(): UseCsvImporterReturn {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [phoneColumn, setPhoneColumn] = useState<string>("");
  const [nameColumn, setNameColumn] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Parse CSV when file changes
  useEffect(() => {
    if (!file) {
      setHeaders([]);
      setRows([]);
      setPhoneColumn("");
      setNameColumn("");
      return;
    }

    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedHeaders = result.meta.fields || [];
        const parsedRows = result.data as Record<string, string>[];

        setHeaders(parsedHeaders);
        setRows(parsedRows);

        // Auto-detect phone column
        const detectedPhone =
          parsedHeaders.find((h) => PHONE_PATTERN.test(h)) ||
          parsedHeaders[0] ||
          "";
        setPhoneColumn(detectedPhone);

        // Auto-detect name column
        const detectedName =
          parsedHeaders.find((h) => NAME_PATTERN.test(h)) ||
          parsedHeaders[1] ||
          "";
        setNameColumn(detectedName);

        setIsLoading(false);
      },
      error: () => {
        setIsLoading(false);
        setHeaders([]);
        setRows([]);
      },
    });
  }, [file]);

  // Map rows to contacts when columns or rows change
  useEffect(() => {
    if (rows.length === 0 || !phoneColumn) {
      setContacts([]);
      setInvalidRows([]);
      return;
    }

    const validContacts: Contact[] = [];
    const invalidEntries: InvalidRow[] = [];

    rows.forEach((row, index) => {
      const rawPhone = row[phoneColumn]?.trim() || "";

      // Validation: empty phone
      if (!rawPhone) {
        invalidEntries.push({
          rowIndex: index + 1,
          rawData: row,
          reason: "Empty phone number",
        });
        return;
      }

      // Normalize phone
      const normalizedPhone = normalizePhone(rawPhone);
      const isValid = validatePhone(normalizedPhone);

      // Validation: invalid format
      if (!isValid) {
        invalidEntries.push({
          rowIndex: index + 1,
          rawData: row,
          reason: `Invalid phone format (must be 7-15 digits): ${rawPhone}`,
        });
        return;
      }

      // Extract name
      const name =
        row[nameColumn]?.trim() || normalizedPhone.replace("+", "");

      // Build custom fields (all columns except phone and name)
      const customFields: Record<string, string> = {};
      headers.forEach((header) => {
        if (header !== phoneColumn && header !== nameColumn) {
          const value = row[header]?.trim() || "";
          if (value) {
            // Lowercase header for template consistency: {{Prescription}} → {{prescription}}
            customFields[header.toLowerCase()] = value;
          }
        }
      });

      // Format for display
      const formattedPhone = formatPhone(normalizedPhone);

      validContacts.push({
        id: uuidv4(),
        name,
        rawPhone,
        formattedPhone,
        normalizedPhone,
        customFields,
        verificationStatus: "unverified",
      });
    });

    setContacts(validContacts);
    setInvalidRows(invalidEntries);
  }, [rows, phoneColumn, nameColumn, headers]);

  const resetImporter = useCallback(() => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setPhoneColumn("");
    setNameColumn("");
    setContacts([]);
    setInvalidRows([]);
  }, []);

  return {
    contacts,
    headers,
    invalidRows,
    phoneColumn,
    nameColumn,
    isLoading,
    setPhoneColumn,
    setNameColumn,
    setFile,
    resetImporter,
  };
}
