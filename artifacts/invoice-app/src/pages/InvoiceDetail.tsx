import { useApp } from "@/contexts/AppContext";
import { saveInvoice } from "@/lib/storage";
import { calculateInvoiceTotals, calculateLineItemTotals, formatCurrency } from "@/lib/calculations";
import { generateWhatsAppLink, generateGmailLink, downloadInvoicePDF } from "@/lib/pdf";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Printer, MessageCircle, CheckCircle, Mail, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

const TEAL = "#4BBFC0";
const ORANGE = "#F5A624";
const DARK = "#1A2B4B";

function CornerStripes({ position = "top-right" }: { position?: "top-right" | "bottom-right" }) {
  const stripes = [
    { width: 18, opacity: 0.7 },
    { width: 14, opacity: 0.85 },
    { width: 10, opacity: 1 },
  ];
  const isTop = position === "top-right";
  return (
    <div style={{
      position: "absolute",
      ...(isTop ? { top: 0, right: 0 } : { bottom: 0, right: 0 }),
      display: "flex",
      gap: 5,
      alignItems: isTop ? "flex-start" : "flex-end",
      overflow: "hidden",
      pointerEvents: "none",
    }}>
      {stripes.map((s, i) => (
        <div key={i} style={{
          width: s.width,
          height: isTop ? 72 : 64,
          background: ORANGE,
          transform: "skewX(-12deg)",
          opacity: s.opacity,
          transformOrigin: isTop ? "top center" : "bottom center",
        }} />
      ))}
    </div>
  );
}

function OrangeStripes() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {[0.6, 0.8, 1].map((op, i) => (
        <div key={i} style={{
          width: 14,
          height: 26,
          background: "rgba(255,255,255,0.55)",
          transform: "skewX(-12deg)",
          opacity: op,
        }} />
      ))}
    </div>
  );
}

export default function InvoiceDetail() {
  const { invoices, clients, profile, refreshData } = useApp();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [pdfLoading, setPdfLoading] = useState(false);

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
  const MAX_ROWS = 6;
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

  const handleGmail = async () => {
    if (!client) { toast.error("Client not found"); return; }
    if (!client.email) { toast.error("Client has no email address"); return; }
    setPdfLoading(true);
    try {
      toast.info("Generating PDF…", { duration: 2000 });
      await downloadInvoicePDF(invoice.invoiceNumber);
      window.open(generateGmailLink(invoice, client, profile), "_blank");
      toast.success("PDF saved! Attach it to the Gmail that just opened.", { duration: 6000 });
    } catch {
      toast.error("PDF generation failed");
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4 max-w-3xl">
      {/* ── Action bar ── */}
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
              className="text-green-600 border-green-300 hover:bg-green-50"
              data-testid="button-mark-paid">
              <CheckCircle className="mr-1.5 h-4 w-4" /> Mark Paid
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleGmail} disabled={pdfLoading}
            className="text-red-600 border-red-200 hover:bg-red-50"
            data-testid="button-gmail">
            {pdfLoading
              ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating…</>
              : <><Mail className="mr-1.5 h-4 w-4" /> Gmail</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp} data-testid="button-whatsapp">
            <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print">
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
        style={{
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          color: DARK,
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.13)",
          border: "1px solid #e5e7eb",
          width: "100%",
        }}
      >
        {/* ── TEAL HEADER ── */}
        <div style={{ background: TEAL, position: "relative", overflow: "hidden" }}>
          {/* Corner stripes top-right */}
          <CornerStripes position="top-right" />

          {/* Top row: logo + name | INVOICE */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 0 24px" }}>
            {/* Left: logo + business name */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt={profile.name}
                  style={{ height: 52, width: 52, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.7)", objectFit: "contain", background: "rgba(255,255,255,0.15)", padding: 2 }}
                />
              ) : (
                <div style={{
                  height: 52, width: 52, borderRadius: "50%",
                  border: "2.5px solid rgba(255,255,255,0.7)",
                  background: "rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "#fff",
                }}>
                  {profile.name.charAt(0)}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontWeight: 900, fontSize: 15, letterSpacing: "0.06em", color: DARK, lineHeight: 1.2 }}>
                  <span style={{ color: DARK }}>{profile.name.split(" ")[0].toUpperCase()}</span>
                  {" "}
                  <span style={{ color: DARK, fontWeight: 900 }}>
                    {profile.name.split(" ").slice(1).join(" ").toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {/* Right: INVOICE label */}
            <p style={{
              margin: 0,
              fontWeight: 900,
              fontSize: 52,
              color: ORANGE,
              letterSpacing: "0.04em",
              lineHeight: 1,
              paddingRight: 72,
            }}>
              INVOICE
            </p>
          </div>

          {/* Bill To + Invoice meta */}
          <div style={{ display: "flex", gap: 24, padding: "16px 24px 20px 24px" }}>
            {/* Left: Invoice To */}
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: DARK, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Invoice To:
              </p>
              {[
                { label: "Name", value: client?.name || "" },
                { label: "Address", value: client?.address || "" },
                { label: "ABN", value: client?.abn || "" },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 6 }}>
                  <p style={{ margin: "0 0 1px", fontSize: 9, fontWeight: 600, color: DARK }}>{label}</p>
                  <div style={{ borderBottom: "1.5px solid rgba(26,43,75,0.4)", minWidth: 170, paddingBottom: 2 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#1e3a5f", fontWeight: 500, minHeight: 14 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Invoice meta */}
            <div style={{ minWidth: 200 }}>
              {[
                { label: "Invoice No:", value: `#${invoice.invoiceNumber}` },
                { label: "Due Date:", value: format(new Date(invoice.dueDate), "dd/MM/yyyy") },
                { label: "Invoice Date:", value: format(new Date(invoice.invoiceDate), "dd/MM/yyyy") },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, gap: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: DARK, whiteSpace: "nowrap" }}>{label}</span>
                  <div style={{ borderBottom: "1.5px solid rgba(26,43,75,0.4)", minWidth: 90, paddingBottom: 2, textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1e3a5f" }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ORANGE BAND ── */}
        <div style={{ background: ORANGE, height: 28, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 20 }}>
          <OrangeStripes />
        </div>

        {/* ── PAYMENT METHOD ── */}
        <div style={{ padding: "12px 24px 14px", borderBottom: "1px solid #e5e7eb" }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 900, color: DARK, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Payment Method
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 24px", fontSize: 11 }}>
            {[
              ["Account No:", profile.accountNo || "—"],
              ["Account Name:", profile.accountName || "—"],
              ["Bank", profile.bankName || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#555", fontWeight: 500, minWidth: 96, flexShrink: 0 }}>{k}</span>
                <span style={{ fontWeight: 700, color: DARK }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div style={{ padding: "0 24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: TEAL }}>
                {["Description", "Price", "QTY", "Subtotal"].map((h, i) => (
                  <th key={h} style={{
                    padding: "10px 12px",
                    fontWeight: 900,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "#fff",
                    textAlign: i === 0 ? "left" : "right",
                    width: i === 0 ? "45%" : i === 1 ? "20%" : i === 2 ? "15%" : "20%",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paddedItems.map((item, idx) => {
                const t = item ? calculateLineItemTotals(item) : null;
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px 12px", color: "#333" }}>
                      {item
                        ? <span style={{ fontWeight: 500 }}>{item.description}</span>
                        : <div style={{ borderBottom: "1px solid #ccc", width: "70%", height: 14 }} />}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#555" }}>
                      {item ? `A$${item.rate.toFixed(2)}` : <span style={{ color: "#aaa" }}>$___</span>}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#555" }}>
                      {item ? item.quantity : <span style={{ color: "#bbb" }}>—</span>}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#333" }}>
                      {t ? `A$${t.net.toFixed(2)}` : <span style={{ color: "#aaa" }}>$___</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Purple gradient divider */}
          <div style={{ height: 4, background: "linear-gradient(90deg, #7c3aed, #4f46e5)", borderRadius: 2, marginTop: 2 }} />
        </div>

        {/* ── FOOTER: TERMS + TOTALS ── */}
        <div style={{ display: "flex", gap: 32, justifyContent: "space-between", padding: "16px 24px 0 24px", position: "relative" }}>
          {/* Left: Terms */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 900, color: DARK, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Term and Conditions
            </p>
            <p style={{ margin: 0, fontSize: 9.5, color: "#555", lineHeight: 1.55, whiteSpace: "pre-line" }}>
              {profile.terms || "Payment due within 7 days of invoice date."}
            </p>

            {/* Contact info */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: "✆", value: profile.phone },
                { icon: "@", value: profile.email },
                { icon: "⌂", value: profile.address },
              ].filter(x => x.value).map(({ icon, value }) => (
                <div key={value} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  <div style={{
                    height: 16, width: 16, borderRadius: 3, background: ORANGE,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: "#fff", flexShrink: 0, marginTop: 1,
                  }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 9.5, color: "#555", lineHeight: 1.4 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Totals */}
          <div style={{ minWidth: 200 }}>
            {[
              { label: "Sub-total:", value: `A$${totals.subtotal.toFixed(2)}` },
              { label: "Discount:", value: totals.discountAmount > 0 ? `-A$${totals.discountAmount.toFixed(2)}` : "A$0.00" },
              { label: "Tax (10%):", value: `A$${totals.taxAmount.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 32, marginBottom: 6, fontSize: 11 }}>
                <span style={{ color: "#555", fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 600, color: DARK }}>
                  <span style={{ color: "#aaa", marginRight: 2 }}>$</span>
                  {value.replace("A$", "").replace("-A$", "-")}
                </span>
              </div>
            ))}
            <div style={{ borderTop: `2.5px solid ${DARK}`, paddingTop: 6, display: "flex", justifyContent: "space-between", gap: 32 }}>
              <span style={{ fontWeight: 900, fontSize: 13, color: DARK }}>Total:</span>
              <span style={{ fontWeight: 900, fontSize: 13, color: DARK }}>
                A${totals.total.toFixed(2)}
              </span>
            </div>

            {/* Bottom-right corner stripes */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 5, marginTop: 18, paddingBottom: 16 }}>
              {[TEAL, TEAL, ORANGE, ORANGE].map((c, i) => (
                <div key={i} style={{
                  width: 14, height: 42, background: c,
                  transform: "skewX(-12deg)",
                  opacity: 0.7 + i * 0.08,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
