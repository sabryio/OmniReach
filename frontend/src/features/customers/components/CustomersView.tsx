/**
 * CustomersView — contacts management list with verification
 * Beautiful UI with exact mockup structure and enhanced functionality
 */
import { useState } from "react";
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
import type { Contact, WABridgeSession, WABridgeConfig } from "@/types";

interface CustomersViewProps {
  campaignContacts: Contact[];
  sessions: WABridgeSession[];
  config: WABridgeConfig;
  onLaunchCampaignWithContacts: (contacts: Contact[]) => void;
  onOpenVerifier: () => void;
}

// Built-in pharmacy contacts
const DEFAULT_CONTACTS: Contact[] = [
  {
    id: "cust_01",
    name: "Dr. Sabry El-Sayed",
    rawPhone: "+1 (415) 555-9901",
    formattedPhone: "14155559901",
    normalizedPhone: "+14155559901",
    customFields: {
      category: "Chronic Care",
      prescription: "Lipitor 20mg",
      doctor: "Dr. Roberts",
    },
    verificationStatus: "registered",
    waId: "14155559901@c.us",
  },
  {
    id: "cust_02",
    name: "Victoria Sterling",
    rawPhone: "+44 7700 900888",
    formattedPhone: "447700900888",
    normalizedPhone: "+447700900888",
    customFields: {
      category: "VIP Patient",
      prescription: "Amoxicillin 500mg",
      doctor: "Dr. Evans",
    },
    verificationStatus: "registered",
    waId: "447700900888@c.us",
  },
  {
    id: "cust_03",
    name: "Liam O'Connor",
    rawPhone: "+353 87 123 4564",
    formattedPhone: "353871234564",
    normalizedPhone: "+353871234564",
    customFields: {
      category: "Refill Due",
      prescription: "Metformin 500mg",
      doctor: "Dr. Kelly",
    },
    verificationStatus: "unregistered",
    verificationError: "Not registered on WhatsApp",
  },
  {
    id: "cust_04",
    name: "Sarah Jenkins",
    rawPhone: "+1 415-555-0122",
    formattedPhone: "14155550122",
    normalizedPhone: "+14155550122",
    customFields: {
      category: "Wellness VIP",
      prescription: "Vitamin D3 50000 IU",
      doctor: "Dr. Adams",
    },
    verificationStatus: "registered",
    waId: "14155550122@c.us",
  },
  {
    id: "cust_05",
    name: "Kenji Takahashi",
    rawPhone: "+81 90 1234 5678",
    formattedPhone: "819012345678",
    normalizedPhone: "+81901234567",
    customFields: {
      category: "Chronic Care",
      prescription: "Amlodipine 10mg",
      doctor: "Dr. Sato",
    },
    verificationStatus: "unverified",
  },
  {
    id: "cust_06",
    name: "Chloe Dubois",
    rawPhone: "+33 6 12 34 56 78",
    formattedPhone: "33612345678",
    normalizedPhone: "+33612345678",
    customFields: {
      category: "Dermatology",
      prescription: "Retin-A 0.05%",
      doctor: "Dr. Moreau",
    },
    verificationStatus: "registered",
    waId: "33612345678@c.us",
  },
];

export function CustomersView({
  campaignContacts,
  sessions,
  onLaunchCampaignWithContacts,
  onOpenVerifier,
}: CustomersViewProps) {
  // Merge unique contacts
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const existingIds = new Set(DEFAULT_CONTACTS.map((c) => c.formattedPhone));
    const additional = campaignContacts.filter(
      (c) => !existingIds.has(c.formattedPhone),
    );
    return [...DEFAULT_CONTACTS, ...additional];
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "registered" | "unregistered" | "unverified"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set(),
  );
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // New Contact Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] = useState("Chronic Care");
  const [newPrescription, setNewPrescription] = useState("");

  // Extract unique categories
  const categories = Array.from(
    new Set(contacts.map((c) => c.customFields?.category || "General")),
  );

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rawPhone.includes(searchQuery) ||
      c.formattedPhone.includes(searchQuery) ||
      (c.customFields?.prescription &&
        c.customFields.prescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || c.verificationStatus === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || c.customFields?.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const toggleSelectContact = (id: string) => {
    const next = new Set(selectedContactIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedContactIds(next);
  };

  const handleVerifySingle = async (contact: Contact) => {
    if (!sessions[0]) return;
    setVerifyingId(contact.id);

    try {
      // TODO: Implement actual WABridge verification
      // Simulate verification for now
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const isRegistered = Math.random() > 0.2; // 80% success rate

      setContacts((prev) =>
        prev.map((c) => {
          if (c.id === contact.id) {
            return {
              ...c,
              verificationStatus: isRegistered ? "registered" : "unregistered",
              waId: isRegistered ? `${contact.formattedPhone}@c.us` : undefined,
              verificationError: isRegistered
                ? undefined
                : "Not registered on WhatsApp",
              verifiedAt: Date.now(),
            };
          }
          return c;
        }),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const clean = newPhone.replace(/\D/g, "");
    const newContact: Contact = {
      id: `cust_${Date.now()}`,
      name: newName,
      rawPhone: newPhone,
      formattedPhone: clean,
      normalizedPhone: `+${clean}`,
      customFields: {
        category: newCategory,
        prescription: newPrescription || "Standard Care",
      },
      verificationStatus: "unverified",
    };

    setContacts([newContact, ...contacts]);
    setIsAddModalOpen(false);
    setNewName("");
    setNewPhone("");
    setNewPrescription("");
  };

  const handleExportCsv = () => {
    const rows = filteredContacts.map((c, i) => ({
      Index: i + 1,
      Name: c.name,
      Phone: c.rawPhone,
      FormattedPhone: c.formattedPhone,
      VerificationStatus: c.verificationStatus,
      WhatsAppJID: c.waId || "",
      Category: c.customFields?.category || "",
      Prescription: c.customFields?.prescription || "",
      Doctor: c.customFields?.doctor || "",
    }));

    const headers = Object.keys(rows[0] || {}).join(",");
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers,
        ...rows.map((r) =>
          Object.values(r)
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pharmacy_patients_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCampaignWithSelected = () => {
    const selected = contacts.filter((c) => selectedContactIds.has(c.id));
    if (selected.length > 0) {
      onLaunchCampaignWithContacts(selected);
    }
  };

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
              onClick={handleCreateCampaignWithSelected}
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
            {[
              { id: "all", label: "All Status" },
              { id: "registered", label: "Registered" },
              { id: "unregistered", label: "Unregistered" },
              { id: "unverified", label: "Unverified" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as any)}
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
                      className={`hover:bg-muted/30 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
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
