/**
 * Supabase database layer — replaces localStorage for all data operations.
 * All records are scoped to the authenticated user via RLS.
 */
import { supabase } from "./supabase";
import type { BusinessProfile, Client, Invoice } from "./storage";

// ── Business Profile ──────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<BusinessProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .single();
  if (error || !data) return null;
  return dbRowToProfile(data);
}

export async function upsertProfile(profile: BusinessProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    abn: profile.abn,
    logo: profile.logo,
    currency: profile.currency,
    invoice_prefix: profile.invoicePrefix,
    next_invoice_number: profile.nextInvoiceNumber,
    theme: profile.theme,
    account_no: profile.accountNo,
    account_name: profile.accountName,
    bank_name: profile.bankName,
    terms: profile.terms,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

function dbRowToProfile(row: Record<string, unknown>): BusinessProfile {
  return {
    name: (row.name as string) ?? "Awais Tech Services Pty Ltd",
    email: (row.email as string) ?? "",
    phone: (row.phone as string) ?? "",
    address: (row.address as string) ?? "",
    abn: (row.abn as string) ?? "",
    logo: (row.logo as string) ?? "",
    currency: (row.currency as string) ?? "AUD",
    invoicePrefix: (row.invoice_prefix as string) ?? "INV",
    nextInvoiceNumber: (row.next_invoice_number as number) ?? 1001,
    theme: ((row.theme as string) ?? "light") as "light" | "dark",
    accountNo: (row.account_no as string) ?? "",
    accountName: (row.account_name as string) ?? "",
    bankName: (row.bank_name as string) ?? "",
    terms: (row.terms as string) ?? "",
  };
}

// ── Clients ───────────────────────────────────────────────────────────────────

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbRowToClient);
}

export async function upsertClient(client: Client): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("clients").upsert({
    id: client.id,
    user_id: user.id,
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: client.address,
    abn: client.abn,
    notes: client.notes,
    created_at: client.createdAt,
  });
  if (error) throw error;
}

export async function removeClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

function dbRowToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    company: (row.company as string) ?? "",
    email: (row.email as string) ?? "",
    phone: (row.phone as string) ?? "",
    address: (row.address as string) ?? "",
    abn: (row.abn as string) ?? "",
    notes: (row.notes as string) ?? "",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export async function fetchInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbRowToInvoice);
}

export async function upsertInvoice(invoice: Invoice): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("invoices").upsert({
    id: invoice.id,
    user_id: user.id,
    invoice_number: invoice.invoiceNumber,
    client_id: invoice.clientId,
    status: invoice.status,
    invoice_date: invoice.invoiceDate,
    due_date: invoice.dueDate,
    line_items: invoice.lineItems,
    notes: invoice.notes,
    created_at: invoice.createdAt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function removeInvoice(id: string): Promise<void> {
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw error;
}

function dbRowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    invoiceNumber: (row.invoice_number as string) ?? "",
    clientId: (row.client_id as string) ?? "",
    status: (row.status as Invoice["status"]) ?? "draft",
    invoiceDate: (row.invoice_date as string) ?? "",
    dueDate: (row.due_date as string) ?? "",
    lineItems: (row.line_items as Invoice["lineItems"]) ?? [],
    notes: (row.notes as string) ?? "",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

// ── Invoice number helper ─────────────────────────────────────────────────────

export async function getNextInvoiceNumberFromDb(): Promise<string> {
  const profile = await fetchProfile();
  const prefix = profile?.invoicePrefix ?? "INV";
  const num = profile?.nextInvoiceNumber ?? 1001;
  return `${prefix}-${String(num).padStart(4, "0")}`;
}

export async function incrementInvoiceNumberInDb(): Promise<void> {
  const profile = await fetchProfile();
  if (!profile) return;
  await upsertProfile({ ...profile, nextInvoiceNumber: profile.nextInvoiceNumber + 1 });
}
