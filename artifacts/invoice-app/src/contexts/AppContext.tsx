import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { BusinessProfile, Client, Invoice } from "@/lib/storage";
import {
  fetchProfile, upsertProfile,
  fetchClients, upsertClient, removeClient,
  fetchInvoices, upsertInvoice, removeInvoice,
} from "@/lib/supabase-db";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DEFAULT_PROFILE: BusinessProfile = {
  name: "Awais Tech Services Pty Ltd",
  email: "Awaisadil654@yahoo.com",
  phone: "+61 405 037 476",
  address: "10 Sanur St Marsden 4132 QLD AUSTRALIA",
  abn: "",
  logo: "",
  currency: "AUD",
  invoicePrefix: "INV",
  nextInvoiceNumber: 1001,
  theme: "light",
  accountNo: "723487772",
  accountName: "AWAIS TECH SERVICES PTY LTD",
  bankName: "NAB",
  terms:
    "Payment due within 7 days of invoice date.\nAll completed services are non-refundable.\nAdditional revisions may include extra charges.\nClients must provide accurate project details and approvals.\nAny invoice dispute must be reported within 3 days.",
};

interface AppContextType {
  profile: BusinessProfile;
  clients: Client[];
  invoices: Invoice[];
  loading: boolean;
  refreshData: () => Promise<void>;
  updateProfile: (updates: Partial<BusinessProfile>) => Promise<void>;
  saveClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  saveInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    if (!user) return;
    try {
      const [prof, cls, invs] = await Promise.all([
        fetchProfile(),
        fetchClients(),
        fetchInvoices(),
      ]);
      setProfile(prof ?? DEFAULT_PROFILE);
      setClients(cls);
      setInvoices(invs);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data from Supabase");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      refreshData();
    }
  }, [user, refreshData]);

  const updateProfile = async (updates: Partial<BusinessProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    try {
      await upsertProfile(updated);
    } catch (err) {
      toast.error("Failed to save profile");
      throw err;
    }
  };

  const saveClientFn = async (client: Client) => {
    try {
      await upsertClient(client);
      setClients(prev => {
        const idx = prev.findIndex(c => c.id === client.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = client; return next; }
        return [client, ...prev];
      });
    } catch (err) {
      toast.error("Failed to save client");
      throw err;
    }
  };

  const deleteClientFn = async (id: string) => {
    try {
      await removeClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast.error("Failed to delete client");
      throw err;
    }
  };

  const saveInvoiceFn = async (invoice: Invoice) => {
    try {
      await upsertInvoice(invoice);
      setInvoices(prev => {
        const idx = prev.findIndex(i => i.id === invoice.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = invoice; return next; }
        return [invoice, ...prev];
      });
    } catch (err) {
      toast.error("Failed to save invoice");
      throw err;
    }
  };

  const deleteInvoiceFn = async (id: string) => {
    try {
      await removeInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      toast.error("Failed to delete invoice");
      throw err;
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f4f8",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "#0d1b2a", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: "white",
            margin: "0 auto 16px", fontFamily: "Inter, sans-serif",
          }}>A</div>
          <p style={{ color: "#64748b", fontSize: 14, fontFamily: "Inter, sans-serif" }}>
            Syncing your data…
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      profile, clients, invoices, loading,
      refreshData,
      updateProfile,
      saveClient: saveClientFn,
      deleteClient: deleteClientFn,
      saveInvoice: saveInvoiceFn,
      deleteInvoice: deleteInvoiceFn,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
