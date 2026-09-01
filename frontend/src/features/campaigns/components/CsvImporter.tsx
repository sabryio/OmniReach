/**
 * CsvImporter — Drag-drop CSV upload, auto-detection, column mapping, contact preview
 *
 * Features:
 * - Drag-drop + file picker for CSV upload
 * - Auto-detection of phone/name columns with manual override
 * - Preview first 5 rows with current mapping applied
 * - Invalid row tracking with expandable error list
 * - Validation badges (valid/invalid/total counts)
 *
 * SOLID:
 * - SRP: Owns CSV import UI and user interactions only (logic in hook)
 * - DIP: Depends on useCsvImporter hook interface, not papaparse directly
 */

import { useRef, useState } from "react";
import { Upload, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { useCsvImporter } from "../hooks/useCsvImporter";
import { sampleCsvToFile } from "../sample-pharmacy-csv";
import type { Contact } from "../schemas/campaign.schema";

interface CsvImporterProps {
  onContactsParsed: (contacts: Contact[]) => void;
  onProceed?: () => void;
}

export function CsvImporter({ onContactsParsed, onProceed }: CsvImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showInvalidRows, setShowInvalidRows] = useState(false);

  const {
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
  } = useCsvImporter();

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleApply = () => {
    if (contacts.length > 0) {
      onContactsParsed(contacts);
      onProceed?.();
    }
  };

  const handleLoadSample = () => {
    const sampleFile = sampleCsvToFile();
    setFile(sampleFile);
  };

  const totalRows = contacts.length + invalidRows.length;
  const hasData = headers.length > 0;
  const allInvalid = totalRows > 0 && contacts.length === 0;

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50"
        }`}
      >
        <Upload
          className={`w-12 h-12 transition-colors ${
            isDragging ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Drop your CSV file here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse — must include a phone column
          </p>
        </div>
        {isLoading && (
          <div className="text-xs text-primary font-medium">Parsing CSV...</div>
        )}
      </div>

      {/* Error banner for all-invalid case */}
      {allInvalid && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-destructive">
              No valid contacts found
            </p>
            <p className="text-muted-foreground mt-1">
              Check that your phone column is selected correctly and phone
              numbers are in a valid format (7-15 digits).
            </p>
          </div>
        </div>
      )}

      {/* Column mapping */}
      {hasData && (
        <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Column Mapping
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Phone column selector */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Phone Column *
              </label>
              <select
                value={phoneColumn}
                onChange={(e) => setPhoneColumn(e.target.value)}
                className="w-full h-9 bg-card rounded-lg border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Name column selector */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">
                Name Column
              </label>
              <select
                value={nameColumn}
                onChange={(e) => setNameColumn(e.target.value)}
                className="w-full h-9 bg-card rounded-lg border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Use phone as name —</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom fields info */}
          {headers.length > 2 && (
            <p className="text-xs text-muted-foreground">
              Other columns will be available as custom fields in your message
              template (e.g., {"{"}
              {"{"}
              {headers
                .filter((h) => h !== phoneColumn && h !== nameColumn)
                .slice(0, 2)
                .map((h) => h.toLowerCase())
                .join(", ")}
              {"}}"}
              {headers.length > 4 && ", ..."})
            </p>
          )}
        </div>
      )}

      {/* Preview table */}
      {hasData && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Preview (first 5 rows)
            </span>
            <span className="text-xs text-muted-foreground">
              {totalRows} rows parsed
            </span>
          </div>

          {/* Preview rows */}
          {contacts.slice(0, 5).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground">
                      #
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground">
                      Phone
                    </th>
                    {Object.keys(contacts[0]?.customFields || {})
                      .slice(0, 3)
                      .map((field) => (
                        <th
                          key={field}
                          className="text-left px-4 py-2 font-semibold text-muted-foreground"
                        >
                          {field}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, 5).map((contact, index) => (
                    <tr
                      key={contact.id}
                      className="border-t border-border hover:bg-muted/30"
                    >
                      <td className="px-4 py-2 text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 text-foreground font-medium">
                        {contact.name}
                      </td>
                      <td className="px-4 py-2 text-foreground font-mono">
                        {contact.formattedPhone}
                      </td>
                      {Object.keys(contact.customFields)
                        .slice(0, 3)
                        .map((field) => (
                          <td
                            key={field}
                            className="px-4 py-2 text-muted-foreground"
                          >
                            {contact.customFields[field]}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-xs text-muted-foreground text-center">
              No valid contacts to preview
            </div>
          )}
        </div>
      )}

      {/* Validation badges */}
      {hasData && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-success/10 text-success border border-success/30 font-semibold text-xs">
            ✅ Valid: {contacts.length}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 font-semibold text-xs">
            ⚠️ Invalid: {invalidRows.length}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground border border-border font-semibold text-xs">
            📊 Total: {totalRows}
          </div>
        </div>
      )}

      {/* Invalid rows expandable list */}
      {invalidRows.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowInvalidRows(!showInvalidRows)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-destructive/10 transition-colors"
          >
            <span className="text-xs font-semibold text-destructive">
              Invalid Rows ({invalidRows.length})
            </span>
            {showInvalidRows ? (
              <ChevronDown className="w-4 h-4 text-destructive" />
            ) : (
              <ChevronRight className="w-4 h-4 text-destructive" />
            )}
          </button>

          {showInvalidRows && (
            <div className="border-t border-destructive/20 p-4 space-y-2 max-h-60 overflow-y-auto">
              {invalidRows.slice(0, 10).map((row) => (
                <div
                  key={row.rowIndex}
                  className="text-xs p-3 bg-card rounded-lg border border-border"
                >
                  <p className="font-semibold text-destructive mb-1">
                    Row {row.rowIndex}: {row.reason}
                  </p>
                  <p className="text-muted-foreground font-mono">
                    {JSON.stringify(row.rawData)
                      .slice(0, 100)
                      .replace(/[{}]/g, "")}
                    {JSON.stringify(row.rawData).length > 100 && "..."}
                  </p>
                </div>
              ))}
              {invalidRows.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  ... and {invalidRows.length - 10} more invalid rows
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleLoadSample}
          className="text-xs text-primary hover:underline transition-colors"
        >
          Load sample data
        </button>
        <div className="flex items-center gap-3">
          {hasData && (
            <button
              onClick={resetImporter}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={handleApply}
            disabled={contacts.length === 0}
            className="px-5 py-2.5 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-sm"
          >
            Apply & Proceed to Template →
          </button>
        </div>
      </div>
    </div>
  );
}
