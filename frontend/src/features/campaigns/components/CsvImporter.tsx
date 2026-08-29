/**
 * CsvImporter — drag-and-drop CSV upload, column mapping, contact preview
 * Placeholder
 */
import type { Contact, CSVParseResult } from '@/types'

interface CsvImporterProps {
  onContactsParsed: (contacts: Contact[], result: CSVParseResult) => void
}

export function CsvImporter({ onContactsParsed }: CsvImporterProps) {
  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center gap-3 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <span className="text-3xl">☁</span>
        <p className="text-sm font-medium text-foreground">Drop your CSV file here</p>
        <p className="text-xs text-muted-foreground">or click to browse — must include a phone column</p>
        <button className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Browse File
        </button>
      </div>

      {/* Column mapping placeholder */}
      <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Column Mapping</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Phone Column</label>
            <div className="h-8 bg-input rounded border border-border px-2 flex items-center text-xs text-muted-foreground">
              — select column —
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Name Column</label>
            <div className="h-8 bg-input rounded border border-border px-2 flex items-center text-xs text-muted-foreground">
              — select column —
            </div>
          </div>
        </div>
      </div>

      {/* Preview table placeholder */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Preview (first 5 rows)</span>
          <span className="text-xs text-muted-foreground">0 rows parsed</span>
        </div>
        <div className="p-4 text-xs text-muted-foreground text-center">No data yet</div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button className="text-xs text-primary hover:underline">
          Load sample data
        </button>
        <button
          onClick={() => onContactsParsed([], { fileName: '', headers: [], totalRows: 0, phoneColumn: '', customColumns: [] })}
          className="px-4 py-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          disabled
        >
          Apply & Continue →
        </button>
      </div>
    </div>
  )
}
