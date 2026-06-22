export interface BusinessProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  abn: string;
  logo: string;
  currency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  theme: "light" | "dark";
  accountNo: string;
  accountName: string;
  bankName: string;
  terms: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  abn: string;
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
  VERSION: "invoice_app_version",
};

const CURRENT_VERSION = "2";

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

export function initStorage() {
  const storedVersion = localStorage.getItem(KEYS.VERSION);
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.removeItem(KEYS.CLIENTS);
    localStorage.removeItem(KEYS.INVOICES);
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.setItem(KEYS.VERSION, CURRENT_VERSION);
  }

  if (!localStorage.getItem(KEYS.PROFILE)) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
  }
  if (!localStorage.getItem(KEYS.CLIENTS)) {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.INVOICES)) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
  }
}

export function getBusinessProfile(): BusinessProfile {
  initStorage();
  const stored = JSON.parse(localStorage.getItem(KEYS.PROFILE) || "{}");
  return { ...DEFAULT_PROFILE, ...stored };
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
  const existing = clients.findIndex((c) => c.id === client.id);
  if (existing >= 0) clients[existing] = client;
  else clients.push(client);
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
}

export function deleteClient(id: string) {
  const clients = getClients().filter((c) => c.id !== id);
  localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
}

export function getInvoices(): Invoice[] {
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.INVOICES) || "[]");
}

export function saveInvoice(invoice: Invoice) {
  const invoices = getInvoices();
  const existing = invoices.findIndex((i) => i.id === invoice.id);
  if (existing >= 0) invoices[existing] = invoice;
  else invoices.push(invoice);
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
}

export function deleteInvoice(id: string) {
  const invoices = getInvoices().filter((i) => i.id !== id);
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
}

export function getNextInvoiceNumber(): string {
  const profile = getBusinessProfile();
  return `${profile.invoicePrefix}-${String(profile.nextInvoiceNumber).padStart(4, "0")}`;
}

export function incrementInvoiceNumber() {
  const profile = getBusinessProfile();
  profile.nextInvoiceNumber++;
  saveBusinessProfile(profile);
}
