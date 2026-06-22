import { useApp } from "@/contexts/AppContext";
import { saveInvoice } from "@/lib/storage";
import { calculateInvoiceTotals, calculateLineItemTotals, formatCurrency } from "@/lib/calculations";
import { generateWhatsAppLink } from "@/lib/pdf";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Printer, MessageCircle, CheckCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";

const TEAL = "#4BBFC0";
const ORANGE = "#F5A624";
const DARK = "#1A2B4B";

function DiagonalStripes({ color = ORANGE, count = 3 }: { color?: string; count?: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 48,
            background: color,
            transform: "skewX(-15deg)",
            opacity: 0.85 + i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

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
        <Button variant="outline" onClick={() => setLocation("/invoices")}>Back to Invoices</Button>
      </div>
    );
  }

  const totals = calculateInvoiceTotals(invoice.lineItems);
  const MAX_ROWS = 7;
  const paddedItems = [
    ...invoice.lineItems,
    ...Array.from({ length: Math.max(0, MAX_ROWS - invoice.lineItems.length) }, () => null),
  ];

  const handleMarkPaid = () => {
    saveInvoice({ ...invoice, status: "paid", updatedAt: new Date().toISOString() });
    refreshData();
    toast.success("Invoice marked as paid");
  };

  const handleWhatsApp = () => {
    if (!client) { toast.error("Client not found"); return; }
    window.open(generateWhatsAppLink(invoice, client, profile), "_blank");
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Created {format(new Date(invoice.createdAt), "dd MMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== "paid" && (
            <Button variant="outline" size="sm" onClick={handleMarkPaid}
              className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
              data-testid="button-mark-paid">
              <CheckCircle className="mr-1.5 h-4 w-4" /> Mark Paid
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleWhatsApp} data-testid="button-whatsapp">
            <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print">
            <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
          </Button>
          <Button size="sm" onClick={() => setLocation(`/invoices/${invoice.id}/edit`)} data-testid="button-edit-invoice">
            <Edit className="mr-1.5 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* ══ INVOICE DOCUMENT ══ */}
      <div
        id="invoice-document"
        className="bg-white dark:bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200"
        style={{ fontFamily: "'Inter', sans-serif", color: DARK }}
      >

        {/* ── HEADER ── */}
        <div style={{ background: TEAL, position: "relative", overflow: "hidden" }}>
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            {/* Left: logo + name */}
            <div className="flex items-center gap-3">
              {profile.logo ? (
                <img src={profile.logo} alt={profile.name} className="h-14 w-14 object-contain rounded-full bg-white/20 p-1" />
              ) : (
                <div className="h-14 w-14 rounded-full border-2 border-white/60 bg-white/20 flex items-center justify-center text-white font-black text-xl">
                  {profile.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-black text-lg tracking-wide leading-tight" style={{ color: DARK }}>
                  {profile.name.toUpperCase()}
                </p>
              </div>
            </div>
            {/* Right: INVOICE word */}
            <div className="flex items-center gap-3">
              <p className="font-black text-5xl tracking-widest" style={{ color: ORANGE, letterSpacing: "0.05em" }}>INVOICE</p>
              <DiagonalStripes color={ORANGE} count={3} />
            </div>
          </div>

          {/* Invoice To / Invoice meta row */}
          <div className="flex gap-6 px-6 pt-4 pb-5">
            {/* Left: Bill To */}
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: DARK }}>Invoice To:</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold" style={{ color: DARK }}>Name</p>
                  <div className="border-b border-gray-400/60 pb-0.5 min-w-[160px]">
                    <p className="text-sm font-medium text-gray-800">{client?.name || ""}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: DARK }}>Address</p>
                  <div className="border-b border-gray-400/60 pb-0.5 min-w-[160px]">
                    <p className="text-sm text-gray-700">{client?.address || ""}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: DARK }}>ABN</p>
                  <div className="border-b border-gray-400/60 pb-0.5 min-w-[120px]">
                    <p className="text-sm text-gray-700">{(client as any)?.abn || ""}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Right: Invoice meta */}
            <div className="text-right space-y-2 min-w-[180px]">
              <div className="flex justify-between gap-6 items-baseline">
                <span className="text-xs font-bold" style={{ color: DARK }}>Invoice No:</span>
                <div className="border-b border-gray-400/60 min-w-[80px] text-right">
                  <span className="text-sm font-semibold">#{invoice.invoiceNumber}</span>
                </div>
              </div>
              <div className="flex justify-between gap-6 items-baseline">
                <span className="text-xs font-bold" style={{ color: DARK }}>Due Date:</span>
                <div className="border-b border-gray-400/60 min-w-[80px] text-right">
                  <span className="text-sm">{format(new Date(invoice.dueDate), "dd/MM/yyyy")}</span>
                </div>
              </div>
              <div className="flex justify-between gap-6 items-baseline">
                <span className="text-xs font-bold" style={{ color: DARK }}>Invoice Date:</span>
                <div className="border-b border-gray-400/60 min-w-[80px] text-right">
                  <span className="text-sm">{format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ORANGE BAND ── */}
        <div style={{ background: ORANGE, height: 22, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 16, overflow: "hidden" }}>
          <DiagonalStripes color="rgba(255,255,255,0.25)" count={3} />
        </div>

        {/* ── PAYMENT METHOD ── */}
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="font-black text-sm uppercase tracking-wider mb-2" style={{ color: DARK }}>Payment Method</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 font-medium w-28 shrink-0">Account No:</span>
              <span className="font-semibold">{profile.accountNo || "—"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 font-medium w-28 shrink-0">Account Name:</span>
              <span className="font-semibold">{profile.accountName || "—"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 font-medium w-28 shrink-0">Bank</span>
              <span className="font-semibold">{profile.bankName || "—"}</span>
            </div>
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: TEAL }}>
                <th className="text-left px-4 py-2.5 font-black text-xs uppercase tracking-wider text-white w-[45%]">Description</th>
                <th className="text-right px-4 py-2.5 font-black text-xs uppercase tracking-wider text-white w-[20%]">Price</th>
                <th className="text-right px-4 py-2.5 font-black text-xs uppercase tracking-wider text-white w-[15%]">QTY</th>
                <th className="text-right px-4 py-2.5 font-black text-xs uppercase tracking-wider text-white w-[20%]">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {paddedItems.map((item, idx) => {
                const t = item ? calculateLineItemTotals(item) : null;
                return (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="px-4 py-2.5 text-gray-800">
                      {item ? (
                        <div>
                          <p className="font-medium">{item.description}</p>
                        </div>
                      ) : (
                        <div className="border-b border-gray-300 w-full h-5" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">
                      {item ? (
                        <span>A${item.rate.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">A$</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">
                      {item ? item.quantity : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                      {t ? (
                        <span>A${t.net.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">A$</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Purple divider */}
          <div className="mt-1 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #4f46e5)" }} />
        </div>

        {/* ── FOOTER: TERMS + TOTALS ── */}
        <div className="px-6 pb-6 flex gap-8 justify-between">
          {/* Terms */}
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm uppercase tracking-wider mb-2" style={{ color: DARK }}>Term and Conditions</p>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {profile.terms || "Payment due within 7 days of invoice date."}
            </p>

            {/* Contact info */}
            <div className="mt-4 space-y-1.5">
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 shrink-0 rounded-sm flex items-center justify-center text-white text-[8px]"
                    style={{ background: ORANGE }}>
                    ✆
                  </div>
                  <span className="text-xs text-gray-600">{profile.phone}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 shrink-0 rounded-sm flex items-center justify-center text-white text-[8px]"
                    style={{ background: ORANGE }}>
                    @
                  </div>
                  <span className="text-xs text-gray-600">{profile.email}</span>
                </div>
              )}
              {profile.address && (
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 shrink-0 rounded-sm flex items-center justify-center text-white text-[8px] mt-0.5"
                    style={{ background: ORANGE }}>
                    ⌂
                  </div>
                  <span className="text-xs text-gray-600">{profile.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="min-w-[200px]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-gray-600 font-medium">Sub-total:</span>
                <span className="font-semibold">A${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-600 font-medium">Discount:</span>
                <span className="font-semibold">
                  {totals.discountAmount > 0 ? `-A$${totals.discountAmount.toFixed(2)}` : "A$0.00"}
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-600 font-medium">Tax (10%):</span>
                <span className="font-semibold">A${totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t-2 pt-2 flex justify-between gap-8" style={{ borderColor: DARK }}>
                <span className="font-black text-base" style={{ color: DARK }}>Total:</span>
                <span className="font-black text-base" style={{ color: DARK }}>
                  A${totals.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Bottom-right orange stripes */}
            <div className="flex justify-end gap-1 mt-6">
              <DiagonalStripes color={TEAL} count={2} />
              <DiagonalStripes color={ORANGE} count={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
