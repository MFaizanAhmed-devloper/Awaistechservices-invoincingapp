import { Client, Invoice, BusinessProfile } from "./storage";
import { formatCurrency, calculateInvoiceTotals } from "./calculations";
import { format } from "date-fns";

export function generateWhatsAppLink(invoice: Invoice, client: Client, profile: BusinessProfile) {
  const totals = calculateInvoiceTotals(invoice.lineItems);
  const amount = formatCurrency(totals.total, profile.currency);
  const date = format(new Date(invoice.dueDate), "MMM dd, yyyy");
  
  const text = `Hi ${client.name}, here's an update regarding your invoice ${invoice.invoiceNumber} for ${amount}. The due date is ${date}. Thanks! - ${profile.name}`;
  return `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

export function handlePrint() {
  window.print();
}
