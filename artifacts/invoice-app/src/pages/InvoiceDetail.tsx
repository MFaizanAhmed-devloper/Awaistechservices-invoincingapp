import { useApp } from "@/contexts/AppContext";
import { saveInvoice } from "@/lib/storage";
import { calculateInvoiceTotals, calculateLineItemTotals, formatCurrency } from "@/lib/calculations";
import { generateWhatsAppLink } from "@/lib/pdf";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Printer, MessageCircle, CheckCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";

export default function InvoiceDetail() {
  const { invoices, clients, profile, refreshData } = useApp();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();

  const invoice = invoices.find((i) => i.id === params.id);
  const client = invoice ? clients.find((c) => c.id === invoice.clientId) : null;

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground text-lg">Invoice not found.</p>
        <Button variant="outline" onClick={() => setLocation("/invoices")}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const totals = calculateInvoiceTotals(invoice.lineItems);

  const handleMarkPaid = () => {
    saveInvoice({ ...invoice, status: "paid", updatedAt: new Date().toISOString() });
    refreshData();
    toast.success("Invoice marked as paid");
  };

  const handleWhatsApp = () => {
    if (!client) { toast.error("Client not found"); return; }
    window.open(generateWhatsAppLink(invoice, client, profile), "_blank");
  };

  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-muted-foreground mt-1">
              Created {format(new Date(invoice.createdAt), "dd MMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== "paid" && (
            <Button variant="outline" onClick={handleMarkPaid}
              className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
              data-testid="button-mark-paid">
              <CheckCircle className="mr-2 h-4 w-4" /> Mark Paid
            </Button>
          )}
          <Button variant="outline" onClick={handleWhatsApp} data-testid="button-whatsapp">
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
          <Button variant="outline" onClick={() => window.print()} data-testid="button-print">
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
          <Button onClick={() => setLocation(`/invoices/${invoice.id}/edit`)} data-testid="button-edit-invoice">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* ── INVOICE DOCUMENT ── */}
      <div id="invoice-document" className="invoice-template bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-border/40 print:shadow-none print:rounded-none print:border-none">

        {/* Top gradient accent bar */}
        <div className="invoice-accent-bar h-2 w-full" style={{background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 40%, #06b6d4 100%)"}} />

        {/* Status watermark overlay */}
        {(isPaid || isOverdue) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
            <span className={`text-[8rem] font-black tracking-widest rotate-[-35deg] select-none opacity-[0.04] ${isPaid ? "text-green-600" : "text-red-600"}`}>
              {isPaid ? "PAID" : "OVERDUE"}
            </span>
          </div>
        )}

        <div className="relative p-8 md:p-12">
          {/* ── HEADER ── */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            {/* Left: Business info */}
            <div className="flex-1">
              {profile.logo ? (
                <img src={profile.logo} alt={profile.name} className="h-16 max-w-[200px] object-contain mb-4" />
              ) : (
                <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-black text-2xl mb-4"
                  style={{background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"}}>
                  {profile.name.charAt(0)}
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{profile.name}</h2>
              <div className="mt-1 space-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                {profile.email && <p>{profile.email}</p>}
                {profile.phone && <p>{profile.phone}</p>}
                {profile.address && <p className="max-w-xs">{profile.address}</p>}
              </div>
            </div>

            {/* Right: Invoice meta */}
            <div className="text-right">
              <p className="text-5xl font-black tracking-tight mb-2" style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>INVOICE</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{invoice.invoiceNumber}</p>
              <div className="inline-block rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
                <table className="text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-slate-800 text-left">Invoice Date</td>
                      <td className="px-4 py-2 font-semibold text-gray-800 dark:text-white text-left">{format(new Date(invoice.invoiceDate), "dd MMM yyyy")}</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-slate-800 text-left">Due Date</td>
                      <td className={`px-4 py-2 font-semibold text-left ${isOverdue ? "text-red-600" : "text-gray-800 dark:text-white"}`}>{format(new Date(invoice.dueDate), "dd MMM yyyy")}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-slate-800 text-left">Status</td>
                      <td className="px-4 py-2 text-left">
                        <StatusBadge status={invoice.status} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── BILL TO / FROM ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="rounded-xl p-5 border border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-500 mb-3">Bill To</p>
              {client ? (
                <div className="space-y-0.5">
                  <p className="font-bold text-base text-gray-900 dark:text-white">{client.name}</p>
                  {client.company && <p className="text-gray-600 dark:text-gray-300 font-medium">{client.company}</p>}
                  {client.email && <p className="text-gray-500 dark:text-gray-400 text-sm">{client.email}</p>}
                  {client.phone && <p className="text-gray-500 dark:text-gray-400 text-sm">{client.phone}</p>}
                  {client.address && <p className="text-gray-500 dark:text-gray-400 text-sm">{client.address}</p>}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">Client details not found</p>
              )}
            </div>
            <div className="rounded-xl p-5 border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/30">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-500 mb-3">Payment Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal, profile.currency)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(totals.discountAmount, profile.currency)}</span>
                  </div>
                )}
                {totals.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>GST</span>
                    <span>{formatCurrency(totals.taxAmount, profile.currency)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-black text-indigo-600 dark:text-indigo-400">
                  <span>Total Due</span>
                  <span>{formatCurrency(totals.total, profile.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── LINE ITEMS ── */}
          <div className="mb-10 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr style={{background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)"}}>
                  <th className="text-left px-5 py-3.5 text-white font-semibold text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right px-4 py-3.5 text-white font-semibold text-xs uppercase tracking-wider">Qty</th>
                  <th className="text-right px-4 py-3.5 text-white font-semibold text-xs uppercase tracking-wider">Rate</th>
                  <th className="text-right px-4 py-3.5 text-white font-semibold text-xs uppercase tracking-wider">Tax</th>
                  <th className="text-right px-4 py-3.5 text-white font-semibold text-xs uppercase tracking-wider">Disc</th>
                  <th className="text-right px-5 py-3.5 text-white font-semibold text-xs uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, idx) => {
                  const t = calculateLineItemTotals(item);
                  return (
                    <tr key={item.id}
                      className={`border-b border-gray-100 dark:border-slate-700/60 transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/50 dark:bg-slate-800/40"}`}>
                      <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-gray-200">{item.description}</td>
                      <td className="px-4 py-3.5 text-right text-gray-500 dark:text-gray-400">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.rate, profile.currency)}</td>
                      <td className="px-4 py-3.5 text-right text-gray-500 dark:text-gray-400">{item.taxPercent}%</td>
                      <td className="px-4 py-3.5 text-right text-gray-500 dark:text-gray-400">{item.discountPercent > 0 ? `${item.discountPercent}%` : "—"}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-800 dark:text-white">{formatCurrency(t.net, profile.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── TOTALS BOX ── */}
          <div className="flex justify-end mb-10">
            <div className="w-72 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm">
              <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal, profile.currency)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>−{formatCurrency(totals.discountAmount, profile.currency)}</span>
                  </div>
                )}
                {totals.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>GST (10%)</span>
                    <span>{formatCurrency(totals.taxAmount, profile.currency)}</span>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 flex justify-between items-center"
                style={{background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"}}>
                <span className="text-white font-bold text-base">TOTAL DUE</span>
                <span className="text-white font-black text-xl">{formatCurrency(totals.total, profile.currency)}</span>
              </div>
            </div>
          </div>

          {/* ── NOTES ── */}
          {invoice.notes && (
            <div className="mb-8 rounded-xl p-5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400 mb-2">Notes</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* ── FOOTER ── */}
          <div className="pt-6 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="font-semibold text-indigo-500">{profile.name}</span>
            <span>{[profile.email, profile.phone].filter(Boolean).join(" · ")}</span>
            <span>Thank you for your business</span>
          </div>
        </div>
      </div>
    </div>
  );
}
