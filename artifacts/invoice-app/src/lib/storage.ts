export interface BusinessProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  currency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  theme: "light" | "dark";
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  discountPercent: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: "draft" | "sent" | "paid" | "overdue";
  invoiceDate: string;
  dueDate: string;
  lineItems: LineItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const KEYS = {
  PROFILE: "invoice_app_biz_profile",
  CLIENTS: "invoice_app_clients",
  INVOICES: "invoice_app_invoices",
};

const DEFAULT_PROFILE: BusinessProfile = {
  name: "Awais Tech Services",
  email: "hello@awaistech.com",
  phone: "+61 400 000 000",
  address: "123 Tech Lane, Sydney, NSW 2000",
  logo: "",
  currency: "AUD",
  invoicePrefix: "INV",
  nextInvoiceNumber: 1001,
  theme: "light",
};

export function initStorage() {
  if (!localStorage.getItem(KEYS.PROFILE)) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
  }
  if (!localStorage.getItem(KEYS.CLIENTS)) {
    const defaultClients: Client[] = [
      {
        id: crypto.randomUUID(),
        name: "Acme Corp",
        company: "Acme Corporation",
        email: "billing@acme.com",
        phone: "+61 400 111 222",
        address: "Level 1, 100 Business St, Melbourne",
        notes: "Key enterprise client",
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: "Globex Inc",
        company: "Globex Industries",
        email: "accounts@globex.com",
        phone: "+61 400 333 444",
        address: "Unit 5, 200 Corporate Blvd, Brisbane",
        notes: "",
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(defaultClients));
    
    const defaultInvoices: Invoice[] = [
      {
        id: crypto.randomUUID(),
        invoiceNumber: "INV-1001",
        clientId: defaultClients[0].id,
        status: "paid",
        invoiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [
          { id: crypto.randomUUID(), description: "Web Development", quantity: 40, rate: 120, taxPercent: 10, discountPercent: 0 }
        ],
        notes: "Thank you for your business.",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        invoiceNumber: "INV-1002",
        clientId: defaultClients[1].id,
        status: "sent",
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [
          { id: crypto.randomUUID(), description: "Monthly Retainer - SEO", quantity: 1, rate: 1500, taxPercent: 10, discountPercent: 0 },
          { id: crypto.randomUUID(), description: "Ad-hoc fixes", quantity: 5, rate: 120, taxPercent: 10, discountPercent: 0 }
        ],
        notes: "Please pay within 14 days.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(defaultInvoices));
    
    const profile = JSON.parse(localStorage.getItem(KEYS.PROFILE) || "{}");
    profile.nextInvoiceNumber = 1003;
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  }
}

export function getBusinessProfile(): BusinessProfile {
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.PROFILE) || "{}");
}

export function saveBusinessProfile(profile: BusinessProfile) {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export function getClients(): Client[] {
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.CLIENTS) || "[]");
}

export function saveClient(client: Client) {
  const clients = getClients();
  const existing = clients.findIndex(c => c.id === client.id);
  if (existing >= 0) clients[existing] = client;
  else clients.push(client);
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
}

export function deleteClient(id: string) {
  const clients = getClients().filter(c => c.id !== id);
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
}

export function getInvoices(): Invoice[] {
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.INVOICES) || "[]");
}

export function saveInvoice(invoice: Invoice) {
  const invoices = getInvoices();
  const existing = invoices.findIndex(i => i.id === invoice.id);
  if (existing >= 0) invoices[existing] = invoice;
  else invoices.push(invoice);
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
}

export function deleteInvoice(id: string) {
  const invoices = getInvoices().filter(i => i.id !== id);
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
}

export function getNextInvoiceNumber(): string {
  const profile = getBusinessProfile();
  return `${profile.invoicePrefix}-${String(profile.nextInvoiceNumber).padStart(4, '0')}`;
}

export function incrementInvoiceNumber() {
  const profile = getBusinessProfile();
  profile.nextInvoiceNumber++;
  saveBusinessProfile(profile);
}
