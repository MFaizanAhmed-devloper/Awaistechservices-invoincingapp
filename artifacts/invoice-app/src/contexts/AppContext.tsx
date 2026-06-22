import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getBusinessProfile, getClients, getInvoices, BusinessProfile, Client, Invoice, saveBusinessProfile } from "@/lib/storage";

interface AppContextType {
  profile: BusinessProfile;
  clients: Client[];
  invoices: Invoice[];
  refreshData: () => void;
  updateProfile: (updates: Partial<BusinessProfile>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile>(getBusinessProfile());
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const refreshData = () => {
    setProfile(getBusinessProfile());
    setClients(getClients());
    setInvoices(getInvoices());
  };

  const updateProfile = (updates: Partial<BusinessProfile>) => {
    saveBusinessProfile({ ...profile, ...updates });
    refreshData();
  };

  useEffect(() => {
    refreshData();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("invoice_app_")) {
        refreshData();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AppContext.Provider value={{ profile, clients, invoices, refreshData, updateProfile }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}