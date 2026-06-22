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

export function generateGmailLink(invoice: Invoice, client: Client, profile: BusinessProfile) {
  const totals = calculateInvoiceTotals(invoice.lineItems);
  const amount = formatCurrency(totals.total, profile.currency);
  const dueDate = format(new Date(invoice.dueDate), "MMM dd, yyyy");
  const invoiceDate = format(new Date(invoice.invoiceDate), "MMM dd, yyyy");

  const subject = `Invoice ${invoice.invoiceNumber} from ${profile.name} – ${amount} due ${dueDate}`;

  const body = [
    `Hi ${client.name},`,
    ``,
    `Please find below the details for invoice ${invoice.invoiceNumber}.`,
    ``,
    `  Invoice Number : ${invoice.invoiceNumber}`,
    `  Invoice Date   : ${invoiceDate}`,
    `  Due Date       : ${dueDate}`,
    `  Amount Due     : ${amount}`,
    ``,
    `Payment Details`,
    `  Bank       : ${profile.bankName}`,
    `  Account    : ${profile.accountNo}`,
    `  Name       : ${profile.accountName}`,
    ``,
    `Please use the invoice number as the payment reference.`,
    ``,
    `If you have any questions, feel free to reply to this email.`,
    ``,
    `Kind regards,`,
    `${profile.name}`,
    `${profile.phone}`,
    `${profile.email}`,
  ].join("\n");

  const params = new URLSearchParams({ to: client.email, su: subject, body });
  return `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`;
}

export function handlePrint() {
  window.print();
}
