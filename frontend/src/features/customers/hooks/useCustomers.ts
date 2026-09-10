import type {
  Contact,
  ContactVerificationStatus,
  Session,
} from "@/rpc/bindings";
import { useState, useCallback, useMemo } from "react";

/**
 * Comprehensive hook for CustomersView component.
 * Receives contacts as a parameter — NO default data inside this hook.
 * All default/initial data must come from the route via useContactsQuery.
 */
export function useCustomerManager(
  initialContacts: Contact[],
  sessions: Session[],
) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "registered" | "unregistered" | "unverified"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Selection
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set(),
  );

  // Verification state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] = useState("Chronic Care");
  const [newPrescription, setNewPrescription] = useState("");

  // Extract unique categories
  const categories = useMemo(
    () =>
      Array.from(
        new Set(contacts.map((c) => c.custom_fields?.category || "General")),
      ),
    [contacts],
  );

  // Filtered contacts
  const filteredContacts = useMemo(
    () =>
      contacts.filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.raw_phone.includes(searchQuery) ||
          c.formatted_phone.includes(searchQuery) ||
          (c.custom_fields?.prescription &&
            c.custom_fields.prescription
              .toLowerCase()
              .includes(searchQuery.toLowerCase()));
        const matchesStatus =
          statusFilter === "all" || c.verification_status === statusFilter;
        const matchesCategory =
          categoryFilter === "all" ||
          c.custom_fields?.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      }),
    [contacts, searchQuery, statusFilter, categoryFilter],
  );

  // Toggle select all / none
  const toggleSelectAll = useCallback(() => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)));
    }
  }, [filteredContacts, selectedContactIds.size]);

  // Toggle single contact
  const toggleSelectContact = useCallback((id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Verify single contact (simulated; real call goes through useVerifyContact mutation)
  const handleVerifySingle = useCallback(
    async (contact: Contact) => {
      if (!sessions[0]) return;
      setVerifyingId(contact.id);
      try {
        await new Promise((r) => setTimeout(r, 1500));
        const isRegistered = Math.random() > 0.2;
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contact.id
              ? {
                  ...c,
                  verificationStatus: isRegistered
                    ? "registered"
                    : "unregistered",
                  waId: isRegistered
                    ? `${contact.normalized_phone.replace(/\D/g, "")}@s.whatsapp.net`
                    : null,
                  verificationError: isRegistered
                    ? null
                    : "Not registered on WhatsApp",
                  verifiedAt: new Date().toISOString(),
                }
              : c,
          ),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setVerifyingId(null);
      }
    },
    [sessions],
  );

  // Add new contact
  const handleAddContact = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName || !newPhone) return;
      const clean = newPhone.replace(/\D/g, "");
      const newContact: Contact = {
        id: `cust_${Date.now()}`,
        campaign_id: "",
        name: newName,
        raw_phone: newPhone,
        formatted_phone: clean,
        normalized_phone: `+${clean}`,
        custom_fields: {
          category: newCategory,
          prescription: newPrescription || "Standard Care",
        },
        verification_status: "unverified",
        verification_error: null,
        verified_at: null,
        wa_id: null,
      };
      setContacts((prev) => [newContact, ...prev]);
      setIsAddModalOpen(false);
      setNewName("");
      setNewPhone("");
      setNewPrescription("");
    },
    [newName, newPhone, newCategory, newPrescription],
  );

  // Export contacts to CSV
  const handleExportCsv = useCallback(() => {
    const rows = filteredContacts.map((c, i) => ({
      Index: i + 1,
      Name: c.name,
      Phone: c.raw_phone,
      FormattedPhone: c.formatted_phone,
      VerificationStatus: c.verification_status,
      WhatsAppJID: c.wa_id || "",
      Category: c.custom_fields?.category || "",
      Prescription: c.custom_fields?.prescription || "",
      Doctor: c.custom_fields?.doctor || "",
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
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `pharmacy_patients_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredContacts]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selectedContactIds.has(c.id)),
    [contacts, selectedContactIds],
  );

  return {
    // Data
    contacts,
    filteredContacts,
    categories,
    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    // Selection
    selectedContactIds,
    selectedContacts,
    toggleSelectAll,
    toggleSelectContact,
    // Verification
    verifyingId,
    handleVerifySingle,
    // Add modal
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
    // Export
    handleExportCsv,
  };
}

/**
 * Legacy read-only hook — kept for backward compatibility.
 * @deprecated Use useCustomerManager instead.
 */
export function useCustomers(contacts: Contact[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ContactVerificationStatus | "all"
  >("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = contacts.filter((c) => {
    if (statusFilter !== "all" && c.verification_status !== statusFilter)
      return false;
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.raw_phone.includes(search)
    )
      return false;
    return true;
  });

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    () => setSelectedIds(new Set(filtered.map((c) => c.id))),
    [filtered],
  );
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selectedContacts = contacts.filter((c) => selectedIds.has(c.id));

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filtered,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    selectedContacts,
  };
}
