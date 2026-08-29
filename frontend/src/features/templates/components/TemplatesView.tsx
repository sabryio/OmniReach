/**
 * TemplatesView — template library with CRUD + live WhatsApp preview
 * Placeholder
 */
import type { MessageTemplate } from '@/types'
import { useTemplates } from '../hooks/useTemplates'

interface TemplatesViewProps {
  onUseTemplateInCampaign: (template: MessageTemplate) => void
}

export function TemplatesView({ onUseTemplateInCampaign }: TemplatesViewProps) {
  const {
    templates,
    selected,
    selectedId,
    setSelectedId,
    isEditing,
    draft,
    setDraft,
    newTemplate,
    editTemplate,
    saveTemplate,
    deleteTemplate,
  } = useTemplates()

  const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&q=60',
    'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=200&q=60',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=60',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&q=60',
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Left — template list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Templates</h1>
          <button
            onClick={newTemplate}
            className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + New Template
          </button>
        </div>

        <ul className="space-y-2 overflow-y-auto">
          {templates.map((t) => (
            <li
              key={t.id}
              className={`bg-card border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedId === t.id ? 'border-primary/60' : 'border-border hover:border-primary/30'
              }`}
              onClick={() => setSelectedId(t.id)}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-sm text-foreground">{t.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize shrink-0">
                  {t.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{t.text}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onUseTemplateInCampaign(t) }}
                  className="text-[11px] px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
                >
                  Use
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); editTemplate(t) }}
                  className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id) }}
                  className="text-[11px] px-2 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 transition-colors ml-auto"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Right — editor + preview */}
      <div className="flex flex-col gap-4">
        {isEditing ? (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{draft.id ? 'Edit Template' : 'New Template'}</h2>

            {[
              { label: 'Title', key: 'title', type: 'text' },
              { label: 'Title (Arabic)', key: 'titleAr', type: 'text' },
              { label: 'Category', key: 'category', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <input
                  type={type}
                  value={(draft as Record<string, string>)[key] ?? ''}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  className="w-full bg-input border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Message Text</label>
              <textarea
                value={draft.text ?? ''}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                rows={4}
                className="w-full bg-input border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Message Text (Arabic)</label>
              <textarea
                value={draft.textAr ?? ''}
                onChange={(e) => setDraft({ ...draft, textAr: e.target.value })}
                rows={4}
                dir="rtl"
                className="w-full bg-input border border-border rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Image URL</label>
              <input
                type="text"
                value={draft.imageUrl ?? ''}
                onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-input border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Sample image presets */}
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_IMAGES.map((src) => (
                <button
                  key={src}
                  onClick={() => setDraft({ ...draft, imageUrl: src })}
                  className={`rounded overflow-hidden border-2 transition-colors ${draft.imageUrl === src ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={src} alt="" className="w-full h-12 object-cover" />
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={saveTemplate}
                className="flex-1 py-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Save Template
              </button>
            </div>
          </div>
        ) : selected ? (
          /* Live preview */
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Preview — {selected.title}</h2>
            <div className="flex justify-center">
              <div className="w-60 bg-[oklch(0.18_0_0)] rounded-3xl border-2 border-border overflow-hidden">
                <div className="bg-primary px-4 py-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground text-xs font-bold">J</div>
                  <p className="text-xs font-semibold text-primary-foreground">John Doe</p>
                </div>
                <div className="p-3 space-y-2" style={{ background: 'oklch(0.16 0 0)' }}>
                  <div className="max-w-[90%] bg-card rounded-lg rounded-tl-none p-2.5 space-y-2">
                    {selected.imageUrl && (
                      <img src={selected.imageUrl} alt="" className="w-full rounded object-cover max-h-24" />
                    )}
                    <p className="text-xs text-foreground whitespace-pre-wrap">{selected.text}</p>
                    <p className="text-[10px] text-muted-foreground text-right">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a template to preview or click New Template
          </div>
        )}
      </div>
    </div>
  )
}
