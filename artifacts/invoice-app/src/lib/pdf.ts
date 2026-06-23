import { Client, Invoice, BusinessProfile } from "./storage";
import { formatCurrency, calculateInvoiceTotals } from "./calculations";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function buildMessageBody(invoice: Invoice, client: Client, profile: BusinessProfile): string {
  const totals = calculateInvoiceTotals(invoice.lineItems);
  const amount = formatCurrency(totals.total, profile.currency);
  const dueDate = format(new Date(invoice.dueDate), "MM/dd/yyyy");
  return [
    `Hello ${client.name},`,
    ``,
    `This is a friendly reminder regarding Invoice #${invoice.invoiceNumber} in the amount of ${amount}. The payment due date is ${dueDate}.`,
    ``,
    `If you have already made the payment, please disregard this message. Otherwise, we kindly request that payment be completed by the due date.`,
    ``,
    `Thank you for your business.`,
    ``,
    `Kind regards,`,
    `${profile.name}`,
  ].join("\n");
}

export function generateWhatsAppLink(invoice: Invoice, client: Client, profile: BusinessProfile) {
  const text = buildMessageBody(invoice, client, profile);
  return `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

export function generateGmailLink(invoice: Invoice, client: Client, profile: BusinessProfile) {
  const totals = calculateInvoiceTotals(invoice.lineItems);
  const amount = formatCurrency(totals.total, profile.currency);
  const dueDate = format(new Date(invoice.dueDate), "MM/dd/yyyy");
  const subject = `Invoice #${invoice.invoiceNumber} – ${amount} due ${dueDate} | ${profile.name}`;
  const body = buildMessageBody(invoice, client, profile);
  const params = new URLSearchParams({ to: client.email, su: subject, body });
  return `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`;
}

export async function downloadInvoicePDF(invoiceNumber: string): Promise<void> {
  const element = document.getElementById("invoice-document");
  if (!element) throw new Error("Invoice element not found");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
  pdf.save(`${invoiceNumber}.pdf`);
}

export function handlePrint() {
  window.print();
}
