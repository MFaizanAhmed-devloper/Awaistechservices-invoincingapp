import { useApp } from "@/contexts/AppContext";
import { LineItem, Invoice } from "@/lib/storage";
import { getNextInvoiceNumberFromDb, incrementInvoiceNumberInDb } from "@/lib/supabase-db";
import { calculateLineItemTotals, calculateInvoiceTotals, formatCurrency } from "@/lib/calculations";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, Save, User, Hash, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

function emptyLineItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, taxPercent: 10, discountPercent: 0 };
}
function todayStr() { return format(new Date(), "yyyy-MM-dd"); }
function in30DaysStr() { const d = new Date(); d.setDate(d.getDate() + 30); return format(d, "yyyy-MM-dd"); }

const TEAL = "#4BBFC0";

export default function InvoiceForm() {
  const { invoices, clients, profile, saveInvoice } = useApp();
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id && params.id !== "new";
  const existingInvoice = isEdit ? invoices.find((i) => i.id === params.id) : null;

  const [invoiceNumber, setInvoiceNumber] = useState(existingInvoice?.invoiceNumber || "");
  const [clientId, setClientId] = useState(existingInvoice?.clientId || "");
  const [status, setStatus] = useState<Invoice["status"]>(existingInvoice?.status || "draft");
  const [invoiceDate, setInvoiceDate] = useState(existingInvoice ? format(new Date(existingInvoice.invoiceDate), "yyyy-MM-dd") : todayStr());
  const [dueDate, setDueDate] = useState(existingInvoice ? format(new Date(existingInvoice.dueDate), "yyyy-MM-dd") : in30DaysStr());
  const [lineItems, setLineItems] = useState<LineItem[]>(existingInvoice?.lineItems || [emptyLineItem()]);
  const [notes, setNotes] = useState(existingInvoice?.notes || "Thank you for your business.");

  useEffect(() => {
    if (!isEdit && !invoiceNumber) {
      getNextInvoiceNumberFromDb().then(setInvoiceNumber).catch(() => {});
    }
  }, [isEdit, invoiceNumber]);

  const addLineItem = () => setLineItems(p => [...p, emptyLineItem()]);
  const removeLineItem = (id: string) => { if (lineItems.length > 1) setLineItems(p => p.filter(li => li.id !== id)); };
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) =>
    setLineItems(p => p.map(li => li.id === id ? { ...li, [field]: value } : li));

  const totals = calculateInvoiceTotals(lineItems);

  const handleSave = async () => {
    if (!clientId) { toast.error("Please select a client"); return; }
    if (lineItems.some(li => !li.description.trim())) { toast.error("All line items must have a description"); return; }
    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: existingInvoice?.id || crypto.randomUUID(),
      invoiceNumber, clientId, status,
      invoiceDate: new Date(invoiceDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      lineItems, notes,
      createdAt: existingInvoice?.createdAt || now,
      updatedAt: now,
    };
    await saveInvoice(invoice);
    if (!isEdit) await incrementInvoiceNumberInDb();
    toast.success(isEdit ? "Invoice updated" : "Invoice created");
    setLocation(`/invoices/${invoice.id}`);
  };

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <div className="space-y-5 max-w-4xl pb-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")}
          className="h-9 w-9 rounded-xl border border-border/50">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEdit ? `Edit ${existingInvoice?.invoiceNumber}` : "New Invoice"}</h1>
          <p className="text-muted-foreground text-sm">{isEdit ? "Update invoice details" : "Create a new invoice for a client"}</p>
        </div>
      </div>

      {/* Top grid: Invoice Details + Bill To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invoice Details */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40 bg-muted/30">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Invoice Details</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice Number</Label>
              <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                className="h-10 font-mono font-semibold" data-testid="input-invoice-number" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as Invoice["status"])}>
                <SelectTrigger className="h-10" data-testid="select-invoice-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="h-3 w-3" /> Invoice Date</Label>
                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
                  className="h-10" data-testid="input-invoice-date" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="h-3 w-3" /> Due Date</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="h-10" data-testid="input-due-date" />
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40 bg-muted/30">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Bill To</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-10" data-testid="select-client">
                  <SelectValue placeholder="Select a client…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 && (
                <p className="text-xs text-muted-foreground">No clients yet. <a href="/clients" className="text-primary underline">Add a client first.</a></p>
              )}
            </div>
            {selectedClient && (
              <div className="rounded-xl bg-muted/50 border border-border/40 p-3 space-y-1 text-sm">
                {selectedClient.company && <p className="font-semibold text-foreground">{selectedClient.company}</p>}
                {selectedClient.email && <p className="text-muted-foreground">{selectedClient.email}</p>}
                {selectedClient.phone && <p className="text-muted-foreground">{selectedClient.phone}</p>}
                {selectedClient.address && <p className="text-muted-foreground text-xs">{selectedClient.address}</p>}
                {selectedClient.abn && <p className="text-muted-foreground text-xs">ABN: {selectedClient.abn}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-muted/30">
          <span className="font-semibold text-sm">Line Items</span>
          <span className="text-xs text-muted-foreground">{lineItems.length} item{lineItems.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="p-4">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_80px_100px_80px_80px_90px_40px] gap-2 px-3 pb-2 mb-1 border-b border-border/40">
            {["Description", "Qty", "Rate (A$)", "Tax %", "Disc %", "Total", ""].map(h => (
              <div key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right first:text-left">{h}</div>
            ))}
          </div>

          <div className="space-y-2">
            {lineItems.map((item, idx) => {
              const itemTotals = calculateLineItemTotals(item);
              return (
                <div key={item.id} data-testid={`row-line-item-${idx}`}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_80px_100px_80px_80px_90px_40px] gap-2 items-center bg-muted/20 rounded-xl px-3 py-2.5 border border-border/30">
                  {/* Description */}
                  <Input
                    placeholder="Description of service…"
                    value={item.description}
                    onChange={e => updateLineItem(item.id, "description", e.target.value)}
                    className="h-9 text-sm col-span-1 md:col-span-1 bg-background border-border/60"
                    data-testid={`input-description-${idx}`}
                  />

                  {/* Mobile: delete button inline */}
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9"
                    onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>

                  {/* Qty */}
                  <Input
                    type="text" inputMode="decimal"
                    value={item.quantity}
                    onChange={e => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    className="h-9 text-right text-sm font-medium bg-background border-border/60 text-foreground"
                    data-testid={`input-quantity-${idx}`}
                  />
                  {/* Rate */}
                  <Input
                    type="text" inputMode="decimal"
                    value={item.rate}
                    onChange={e => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                    className="h-9 text-right text-sm font-medium bg-background border-border/60 text-foreground"
                    data-testid={`input-rate-${idx}`}
                  />
                  {/* Tax */}
                  <Input
                    type="text" inputMode="decimal"
                    value={item.taxPercent}
                    onChange={e => updateLineItem(item.id, "taxPercent", parseFloat(e.target.value) || 0)}
                    className="h-9 text-right text-sm font-medium bg-background border-border/60 text-foreground"
                    data-testid={`input-tax-${idx}`}
                  />
                  {/* Disc */}
                  <Input
                    type="text" inputMode="decimal"
                    value={item.discountPercent}
                    onChange={e => updateLineItem(item.id, "discountPercent", parseFloat(e.target.value) || 0)}
                    className="h-9 text-right text-sm font-medium bg-background border-border/60 text-foreground"
                    data-testid={`input-discount-${idx}`}
                  />
                  {/* Total */}
                  <div className="h-9 flex items-center justify-end pr-1">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(itemTotals.net, profile.currency)}
                    </span>
                  </div>
                  {/* Delete (desktop) */}
                  <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9"
                    onClick={() => removeLineItem(item.id)} disabled={lineItems.length === 1}
                    data-testid={`button-remove-line-${idx}`}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="mt-3 rounded-xl border-dashed"
            onClick={addLineItem} data-testid="button-add-line-item">
            <Plus className="mr-2 h-4 w-4" /> Add Line Item
          </Button>

          {/* Totals */}
          <div className="flex justify-end mt-5">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground py-1">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(totals.subtotal, profile.currency)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-green-600 py-1">
                  <span>Discount</span>
                  <span className="font-medium">-{formatCurrency(totals.discountAmount, profile.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground py-1">
                <span>Tax (GST 10%)</span>
                <span className="font-medium text-foreground">{formatCurrency(totals.taxAmount, profile.currency)}</span>
              </div>
              <div className="flex justify-between py-2.5 px-4 rounded-xl font-bold text-base"
                style={{ background: TEAL + "18", border: `1.5px solid ${TEAL}40` }}>
                <span style={{ color: TEAL }}>Total</span>
                <span style={{ color: TEAL }}>{formatCurrency(totals.total, profile.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40 bg-muted/30">
          <span className="font-semibold text-sm">Notes</span>
        </div>
        <div className="p-5">
          <Textarea
            placeholder="Additional notes or payment instructions…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="resize-none min-h-20 text-sm"
            data-testid="textarea-notes"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-xl" onClick={() => setLocation("/invoices")}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="rounded-xl px-6 font-semibold aurora-bar border-0 text-white"
          data-testid="button-save-invoice">
          <Save className="mr-2 h-4 w-4" />
          {isEdit ? "Save Changes" : "Create Invoice"}
        </Button>
      </div>
    </div>
  );
}
