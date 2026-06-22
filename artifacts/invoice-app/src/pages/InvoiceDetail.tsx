import { useApp } from "@/contexts/AppContext";
import { saveInvoice } from "@/lib/storage";
import { calculateInvoiceTotals, calculateLineItemTotals, formatCurrency } from "@/lib/calculations";
import { generateWhatsAppLink } from "@/lib/pdf";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Printer, MessageCircle, CheckCircle, Download } from "lucide-react";
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
    if (!client) {
      toast.error("Client not found");
      return;
    }
    const url = generateWhatsAppLink(invoice, client, profile);
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Action bar — hidden on print */}
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
            <Button
              variant="outline"
              onClick={handleMarkPaid}
              className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
              data-testid="button-mark-paid"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Mark Paid
            </Button>
          )}
          <Button variant="outline" onClick={handleWhatsApp} data-testid="button-whatsapp">
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
          <Button variant="outline" onClick={handlePrint} data-testid="button-print">
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
          <Button onClick={() => setLocation(`/invoices/${invoice.id}/edit`)} data-testid="button-edit-invoice">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="bg-card border rounded-xl p-8 md:p-12 print:border-none print:shadow-none print:rounded-none print:p-0" id="invoice-document">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            {profile.logo ? (
              <img src={profile.logo} alt={profile.name} className="h-14 max-w-xs object-contain mb-3" />
            ) : (
              <div className="h-14 w-14 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-2xl mb-3">
                {profile.name.charAt(0)}
              </div>
            )}
            <h2 className="text-xl font-bold">{profile.name}</h2>
            {profile.email && <p className="text-muted-foreground text-sm">{profile.email}</p>}
            {profile.phone && <p className="text-muted-foreground text-sm">{profile.phone}</p>}
            {profile.address && <p className="text-muted-foreground text-sm">{profile.address}</p>}
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-primary tracking-tight mb-1">INVOICE</p>
            <p className="text-xl font-bold text-foreground">{invoice.invoiceNumber}</p>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-end gap-4">
                <span>Date:</span>
                <span className="font-medium text-foreground">{format(new Date(invoice.invoiceDate), "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span>Due:</span>
                <span className="font-medium text-foreground">{format(new Date(invoice.dueDate), "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span>Status:</span>
                <span className="font-medium text-foreground capitalize">{invoice.status}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bill To */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Bill To</p>
          {client ? (
            <div>
              <p className="font-bold text-lg">{client.name}</p>
              {client.company && <p className="text-muted-foreground">{client.company}</p>}
              {client.email && <p className="text-muted-foreground text-sm">{client.email}</p>}
              {client.phone && <p className="text-muted-foreground text-sm">{client.phone}</p>}
              {client.address && <p className="text-muted-foreground text-sm">{client.address}</p>}
            </div>
          ) : (
            <p className="text-muted-foreground italic">Client details not found</p>
          )}
        </div>

        {/* Line Items */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 pr-4 font-semibold text-muted-foreground uppercase tracking-wide text-xs">Description</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground uppercase tracking-wide text-xs">Qty</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground uppercase tracking-wide text-xs">Rate</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground uppercase tracking-wide text-xs">Tax</th>
                <th className="text-right py-3 px-2 font-semibold text-muted-foreground uppercase tracking-wide text-xs">Disc</th>
                <th className="text-right py-3 pl-4 font-semibold text-muted-foreground uppercase tracking-wide text-xs">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {invoice.lineItems.map((item) => {
                const t = calculateLineItemTotals(item);
                return (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 font-medium">{item.description}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(item.rate, profile.currency)}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{item.taxPercent}%</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{item.discountPercent > 0 ? `${item.discountPercent}%` : "—"}</td>
                    <td className="py-3 pl-4 text-right font-semibold">{formatCurrency(t.net, profile.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
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
              <div className="flex justify-between text-muted-foreground">
                <span>GST</span>
                <span>{formatCurrency(totals.taxAmount, profile.currency)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-black">
              <span>Total Due</span>
              <span className="text-primary">{formatCurrency(totals.total, profile.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-4 pt-6 border-t">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Notes</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          {profile.name} · {profile.email} · {profile.phone}
        </div>
      </div>
    </div>
  );
}
