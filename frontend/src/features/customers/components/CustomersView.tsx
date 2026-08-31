/**
 * CustomersView — purely presentational
 * All state and handlers come from useCustomerManager via the route component.
 */
import type { Contact } from "@/features/campaigns/schemas/campaign.schema";
import type { WABridgeConfig } from "@/features/layout/schemas/layout.schema";
import type { Session } from "@/features/sessions/schemas/session.schema";
import {
  Users,
  Search,
  Download,
  Plus,
  ShieldCheck,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  CheckSquare,
  Square,
} from "lucide-react";

interface CustomersViewProps {
  // Data
  contacts: Contact[];
  filteredContacts: Contact[];
  categories: string[];
  // Filters
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: "all" | "registered" | "unregistered" | "unverified";
  setStatusFilter: (
    v: "all" | "registered" | "unregistered" | "unverified",
  ) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  // Selection
  selectedContactIds: Set<string>;
  selectedContacts: Contact[];
  toggleSelectAll: () => void;
  toggleSelectContact: (id: string) => void;
  // Verification
  verifyingId: string | null;
  handleVerifySingle: (contact: Contact) => void;
  // Add modal
  isAddModalOpen: boolean;
  setIsAddModalOpen: (v: boolean) => void;
  newName: string;
  setNewName: (v: string) => void;
  newPhone: string;
  setNewPhone: (v: string) => void;
  newCategory: string;
  setNewCategory: (v: string) => void;
  newPrescription: string;
  setNewPrescription: (v: string) => void;
  handleAddContact: (e: React.FormEvent) => void;
  // Export & navigation
  handleExportCsv: () => void;
  onLaunchCampaignWithContacts: (contacts: Contact[]) => void;
  onOpenVerifier: () => void;
  // Unused but kept for API compatibility
  sessions?: Session[];
  config?: WABridgeConfig;
  campaignContacts?: Contact[];
}

export function CustomersView({
  contacts,
  filteredContacts,
  categories,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  selectedContactIds,
  selectedContacts,
  toggleSelectAll,
  toggleSelectContact,
  verifyingId,
  handleVerifySingle,
  isAddModalOpen,
  setIsAddModalOpen,
  newName,
  setNewName,
  newPhone,
  setNewPhone,
  newCategory,
  setNewCategory,
  newPrescription,
  setNewPrescription,
  handleAddContact,
  handleExportCsv,
  onLaunchCampaignWithContacts,
  onOpenVerifier,
}: CustomersViewProps) {
  return (
    <div className="space-y-4 max-w-full">
      {/* Top Header & Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Customers</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono border border-border">
                {contacts.length} Total Patients
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage patient contacts and WhatsApp verification status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedContactIds.size > 0 && (
            <button
              type="button"
              onClick={() => onLaunchCampaignWithContacts(selectedContacts)}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast to Selected ({selectedContactIds.size})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenVerifier}
            className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium border border-border flex items-center gap-1.5 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-primary" />
            <span>Bulk Verifier</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium border border-border flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-warning" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border">
            {(
              [
                { id: "all", label: "All Status" },
                { id: "registered", label: "Registered" },
                { id: "unregistered", label: "Unregistered" },
                { id: "unverified", label: "Unverified" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === f.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            <option value="all">All Care Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or prescription..."
            className="w-64 pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Patients Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-md overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            No patients found matching your criteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedContactIds.size === filteredContacts.length &&
                      filteredContacts.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2.5 text-start text-[10px] uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-3 py-2.5 text-start text-[10px] uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-3 py-2.5 text-start text-[10px] uppercase tracking-wider">
                    WA Status
                  </th>
                  <th className="px-3 py-2.5 text-start text-[10px] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 py-2.5 text-start text-[10px] uppercase tracking-wider">
                    Prescription
                  </th>
                  <th className="px-3 py-2.5 text-end text-[10px] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContactIds.has(contact.id);
                  const isVerifying = verifyingId === contact.id;
                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectContact(contact.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground">
                        {contact.name}
                      </td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">
                        {contact.rawPhone}
                      </td>
                      <td className="px-3 py-2">
                        {contact.verificationStatus === "registered" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/30">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                        {contact.verificationStatus === "unregistered" && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/10 text-warning border border-warning/30"
                            title={contact.verificationError}
                          >
                            <AlertCircle className="w-3 h-3" /> Unregistered
                          </span>
                        )}
                        {contact.verificationStatus === "unverified" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                            <Clock className="w-3 h-3" /> Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-foreground">
                        <span className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] text-muted-foreground">
                          {contact.customFields?.category || "General"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground font-mono text-[11px]">
                        {contact.customFields?.prescription || "None specified"}
                      </td>
                      <td className="px-3 py-2 text-end">
                        <button
                          type="button"
                          disabled={isVerifying}
                          onClick={() => handleVerifySingle(contact)}
                          className="px-2 py-1 rounded bg-muted hover:bg-muted/80 text-primary text-[11px] font-medium border border-border transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <ShieldCheck
                            className={`w-3 h-3 ${isVerifying ? "animate-spin" : ""}`}
                          />
                          <span>{isVerifying ? "Checking..." : "Verify"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Add New Patient</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Johnathan Doe"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +966 50 123 4567"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">
                  Care Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="Chronic Care">Chronic Care</option>
                  <option value="VIP Patient">VIP Patient</option>
                  <option value="Refill Due">Refill Due</option>
                  <option value="Wellness VIP">Wellness VIP</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">
                  Prescription (Optional)
                </label>
                <input
                  type="text"
                  value={newPrescription}
                  onChange={(e) => setNewPrescription(e.target.value)}
                  placeholder="e.g. Metformin 500mg"
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
                >
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
