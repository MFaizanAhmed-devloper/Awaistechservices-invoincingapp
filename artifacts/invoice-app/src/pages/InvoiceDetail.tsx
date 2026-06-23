import { useApp } from "@/contexts/AppContext";
import { saveInvoice } from "@/lib/storage";
import { calculateInvoiceTotals, calculateLineItemTotals, formatCurrency } from "@/lib/calculations";
import { generateWhatsAppLink, generateGmailLink, downloadInvoicePDF } from "@/lib/pdf";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Printer, MessageCircle, CheckCircle, Mail, Loader2, Download } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

// ── Brand colours (FreshBooks-style deep navy) ─────────────────────────────
const NAVY   = "#0d1b6b";      // dark navy header / total bar
const NAVY2  = "#1a2e8a";      // slightly lighter navy
const SIDE   = "#dde8f5";      // light blue sidebar
const SIDE2  = "#ccdaf0";      // sidebar divider
const WHITE  = "#ffffff";
const GRAY1  = "#f5f7fc";      // table stripe
const GRAY2  = "#e2e8f0";      // table border

// ── Thin accent stripe row ──────────────────────────────────────────────────
function AccentStripe() {
  return (
    <div style={{ display: "flex", height: 6 }}>
      {[NAVY, "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"].map((c, i) => (
        <div key={i} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}

export default function InvoiceDetail() {
  const { invoices, clients, profile, refreshData } = useApp();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [pdfLoading, setPdfLoading] = useState(false);

  const invoice = invoices.find(i => i.id === params.id);
  const client  = invoice ? clients.find(c => c.id === invoice.clientId) : null;

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground text-lg">Invoice not found.</p>
        <Button variant="outline" onClick={() => setLocation("/invoices")}>Back to Invoices</Button>
      </div>
    );
  }

  const totals = calculateInvoiceTotals(invoice.lineItems);
  const MAX_ROWS = 5;
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

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadInvoicePDF(invoice.invoiceNumber);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("PDF generation failed");
    } finally {
      setPdfLoading(false);
    }
  };

  // ── helper cell style ──────────────────────────────────────────────────────
  const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: "9px 12px",
    fontSize: 11,
    borderBottom: `1px solid ${GRAY2}`,
    color: "#374151",
    ...extra,
  });

  const thCell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: "10px 12px",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    color: WHITE,
    background: NAVY,
    ...extra,
  });

  const sideLabel: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.09em",
    color: NAVY2,
    marginBottom: 2,
  };

  const sideValue: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "#1e3a5f",
    marginBottom: 0,
    wordBreak: "break-word" as const,
    lineHeight: 1.4,
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* ── Action bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl border border-border/50"
            onClick={() => setLocation("/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">
              Created {format(new Date(invoice.createdAt), "dd MMM yyyy")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {invoice.status !== "paid" && (
            <Button variant="outline" size="sm" onClick={handleMarkPaid}
              className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              data-testid="button-mark-paid">
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Mark Paid
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleGmail} disabled={pdfLoading}
            className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
            data-testid="button-gmail">
            {pdfLoading
              ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating…</>
              : <><Mail className="mr-1.5 h-3.5 w-3.5" /> Gmail</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleWhatsApp}
            className="rounded-xl text-green-600 border-green-200 hover:bg-green-50"
            data-testid="button-whatsapp">
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading}
            className="rounded-xl" data-testid="button-download-pdf">
            <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}
            className="rounded-xl" data-testid="button-print">
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" onClick={() => setLocation(`/invoices/${invoice.id}/edit`)}
            className="rounded-xl" data-testid="button-edit-invoice">
            <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          INVOICE DOCUMENT
      ══════════════════════════════════════════════════════════════════ */}
      <div
        id="invoice-document"
        style={{
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          background: WHITE,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 4px 32px rgba(13,27,107,0.13), 0 1px 4px rgba(0,0,0,0.06)",
          border: `1px solid ${GRAY2}`,
          width: "100%",
        }}
      >
        {/* ── TOP NAVY HEADER ── */}
        <div style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          {/* Logo box */}
          <div style={{
            background: WHITE,
            borderRadius: 8,
            padding: "6px 10px",
            minWidth: 100,
            height: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            {profile.logo ? (
              <img src={profile.logo} alt={profile.name}
                style={{ maxHeight: 46, maxWidth: 110, objectFit: "contain" }} />
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: NAVY, lineHeight: 1.2 }}>
                  {profile.name.split(" ").slice(0, 2).join(" ")}
                </p>
                {profile.name.split(" ").length > 2 && (
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: NAVY2 }}>
                    {profile.name.split(" ").slice(2).join(" ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Invoice title */}
          <p style={{
            margin: 0,
            fontSize: 52,
            fontWeight: 900,
            color: WHITE,
            letterSpacing: "0.02em",
            fontStyle: "italic",
            lineHeight: 1,
            opacity: 0.97,
          }}>
            Invoice
          </p>
        </div>

        {/* ── 5-colour accent stripe ── */}
        <AccentStripe />

        {/* ── BODY: left sidebar + right content ── */}
        <div style={{ display: "flex", minHeight: 440 }}>

          {/* LEFT SIDEBAR */}
          <div style={{
            background: SIDE,
            width: 178,
            flexShrink: 0,
            padding: "22px 18px",
            borderRight: `1.5px solid ${SIDE2}`,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}>
            {/* Bill To */}
            <div>
              <p style={{ ...sideLabel, marginBottom: 8 }}>Bill To:</p>
              <p style={{ ...sideLabel, fontSize: 8, marginBottom: 4 }}>Customer Name</p>
              <p style={{ ...sideValue, fontWeight: 700, fontSize: 12 }}>{client?.name || "—"}</p>

              {client?.company && (
                <p style={{ ...sideValue, fontSize: 10, marginTop: 2, color: "#3b5280" }}>{client.company}</p>
              )}
              {client?.address && (
                <p style={{ ...sideValue, fontSize: 10, marginTop: 4, color: "#4a5568", fontWeight: 400 }}>
                  {client.address}
                </p>
              )}
              {client?.phone && (
                <p style={{ ...sideValue, fontSize: 10, marginTop: 3, color: "#4a5568", fontWeight: 400 }}>
                  {client.phone}
                </p>
              )}
              {client?.email && (
                <p style={{ ...sideValue, fontSize: 10, marginTop: 3, color: "#4a5568", fontWeight: 400 }}>
                  {client.email}
                </p>
              )}
              {client?.abn && (
                <p style={{ ...sideValue, fontSize: 9.5, marginTop: 3, color: "#4a5568", fontWeight: 400 }}>
                  ABN: {client.abn}
                </p>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 1.5, background: SIDE2, borderRadius: 1 }} />

            {/* Invoice # */}
            <div>
              <p style={sideLabel}>Invoice #</p>
              <p style={{ ...sideValue, fontSize: 13, fontWeight: 800, color: NAVY }}>{invoice.invoiceNumber}</p>
            </div>

            {/* Date of Issue */}
            <div>
              <p style={sideLabel}>Date of Issue</p>
              <p style={sideValue}>{format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}</p>
            </div>

            {/* Due Date */}
            <div>
              <p style={sideLabel}>Due Date</p>
              <p style={{ ...sideValue, color: NAVY, fontWeight: 700 }}>
                {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
              </p>
            </div>

            {/* Payment */}
            {(profile.bankName || profile.accountNo) && (
              <>
                <div style={{ height: 1.5, background: SIDE2, borderRadius: 1 }} />
                <div>
                  <p style={sideLabel}>Payment</p>
                  {profile.bankName && <p style={{ ...sideValue, fontSize: 10 }}>Bank: {profile.bankName}</p>}
                  {profile.accountNo && <p style={{ ...sideValue, fontSize: 10 }}>Acct: {profile.accountNo}</p>}
                  {profile.accountName && <p style={{ ...sideValue, fontSize: 10 }}>{profile.accountName}</p>}
                </div>
              </>
            )}
          </div>

          {/* RIGHT CONTENT */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Items table */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thCell(), textAlign: "left", width: "35%" }}>Item / Service</th>
                  <th style={{ ...thCell(), textAlign: "left", width: "25%" }}>Description</th>
                  <th style={{ ...thCell({ textAlign: "center" }), width: "10%" }}>Qty/Hrs</th>
                  <th style={{ ...thCell({ textAlign: "right" }), width: "15%" }}>Rate</th>
                  <th style={{ ...thCell({ textAlign: "right" }), width: "15%" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {paddedItems.map((item, idx) => {
                  const t = item ? calculateLineItemTotals(item) : null;
                  const bg = idx % 2 === 0 ? WHITE : GRAY1;
                  return (
                    <tr key={idx} style={{ background: bg }}>
                      <td style={cell()}>
                        {item
                          ? <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{item.description}</span>
                          : <span style={{ color: "#ccc", fontSize: 10 }}>Placeholder</span>}
                      </td>
                      <td style={cell({ color: "#6b7280", fontSize: 10 })}>
                        {item ? <span style={{ color: "#666" }}>Text</span> : <span style={{ color: "#ddd" }}>Text</span>}
                      </td>
                      <td style={{ ...cell({ textAlign: "center" }) }}>
                        {item ? item.quantity : <span style={{ color: "#ccc" }}>000</span>}
                      </td>
                      <td style={{ ...cell({ textAlign: "right" }) }}>
                        {item
                          ? formatCurrency(item.rate, profile.currency)
                          : <span style={{ color: "#ccc" }}>000</span>}
                      </td>
                      <td style={{ ...cell({ textAlign: "right", fontWeight: 600, color: NAVY }) }}>
                        {t
                          ? formatCurrency(t.net, profile.currency)
                          : <span style={{ color: "#ccc" }}>000</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* TERMS + TOTALS row */}
            <div style={{ display: "flex", gap: 0, padding: "16px 16px 0 16px", flex: 1 }}>
              {/* Terms */}
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 800, color: NAVY,
                  textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Terms
                </p>
                <p style={{ margin: 0, fontSize: 9.5, color: "#555", lineHeight: 1.65 }}>
                  {profile.terms || "Payment due within 7 days of invoice date.\nAll completed services are non-refundable."}
                </p>
              </div>

              {/* Totals */}
              <div style={{ minWidth: 196, flexShrink: 0 }}>
                {[
                  { label: "Subtotal", value: formatCurrency(totals.subtotal, profile.currency), bold: false },
                  {
                    label: "Discount",
                    value: totals.discountAmount > 0
                      ? `-${formatCurrency(totals.discountAmount, profile.currency)}`
                      : `-${formatCurrency(0, profile.currency)}`,
                    bold: false,
                  },
                  { label: "Tax Rate", value: "10%", bold: false },
                  { label: "Tax", value: formatCurrency(totals.taxAmount, profile.currency), bold: false },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", gap: 16, marginBottom: 5,
                  }}>
                    <span style={{ fontSize: 10.5, color: "#555", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "#1a1a2e" }}>{value}</span>
                  </div>
                ))}

                {/* TOTAL button */}
                <div style={{
                  background: NAVY,
                  borderRadius: 5,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 8,
                  boxShadow: `0 4px 12px ${NAVY}55`,
                }}>
                  <span style={{ fontWeight: 900, fontSize: 13, color: WHITE, letterSpacing: "0.05em" }}>
                    TOTAL
                  </span>
                  <span style={{ fontWeight: 900, fontSize: 13, color: WHITE }}>
                    {formatCurrency(totals.total, profile.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Conditions / Notes */}
            <div style={{ padding: "16px 16px 18px", borderTop: `1.5px solid ${GRAY2}`, marginTop: 16 }}>
              <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 800, color: NAVY,
                textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Conditions / Instructions
              </p>
              <p style={{ margin: 0, fontSize: 9.5, color: "#555", lineHeight: 1.6 }}>
                {invoice.notes || "Thank you for your business."}
              </p>
            </div>
          </div>
        </div>

        {/* ── BOTTOM FOOTER BAR ── */}
        <div style={{
          background: NAVY,
          padding: "11px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap" as const,
        }}>
          {[
            { icon: "✉", value: profile.email },
            { icon: "✆", value: profile.phone },
            { icon: "⌂", value: profile.address },
          ].filter(x => x.value).map(({ icon, value }) => (
            <span key={value} style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ opacity: 0.6 }}>{icon}</span>
              {value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
