import { useApp } from "@/contexts/AppContext";
import { saveInvoice, getNextInvoiceNumber, incrementInvoiceNumber, LineItem, Invoice } from "@/lib/storage";
import { calculateLineItemTotals, calculateInvoiceTotals, formatCurrency } from "@/lib/calculations";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

function emptyLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    rate: 0,
    taxPercent: 10,
    discountPercent: 0,
  };
}

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function in30DaysStr() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return format(d, "yyyy-MM-dd");
}

export default function InvoiceForm() {
  const { invoices, clients, profile, refreshData } = useApp();
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id && params.id !== "new";

  const existingInvoice = isEdit ? invoices.find((i) => i.id === params.id) : null;

  const [invoiceNumber, setInvoiceNumber] = useState(
    existingInvoice?.invoiceNumber || ""
  );
  const [clientId, setClientId] = useState(existingInvoice?.clientId || "");
  const [status, setStatus] = useState<Invoice["status"]>(existingInvoice?.status || "draft");
  const [invoiceDate, setInvoiceDate] = useState(
    existingInvoice ? format(new Date(existingInvoice.invoiceDate), "yyyy-MM-dd") : todayStr()
  );
  const [dueDate, setDueDate] = useState(
    existingInvoice ? format(new Date(existingInvoice.dueDate), "yyyy-MM-dd") : in30DaysStr()
  );
  const [lineItems, setLineItems] = useState<LineItem[]>(
    existingInvoice?.lineItems || [emptyLineItem()]
  );
  const [notes, setNotes] = useState(existingInvoice?.notes || "Thank you for your business.");

  useEffect(() => {
    if (!isEdit && !invoiceNumber) {
      setInvoiceNumber(getNextInvoiceNumber());
    }
  }, [isEdit, invoiceNumber]);

  const addLineItem = () => {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((li) => (li.id === id ? { ...li, [field]: value } : li))
    );
  };

  const totals = calculateInvoiceTotals(lineItems);

  const handleSave = () => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (lineItems.some((li) => !li.description.trim())) {
      toast.error("All line items must have a description");
      return;
    }

    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: existingInvoice?.id || crypto.randomUUID(),
      invoiceNumber,
      clientId,
      status,
      invoiceDate: new Date(invoiceDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      lineItems,
      notes,
      createdAt: existingInvoice?.createdAt || now,
      updatedAt: now,
    };

    saveInvoice(invoice);
    if (!isEdit) {
      incrementInvoiceNumber();
    }
    refreshData();
    toast.success(isEdit ? "Invoice updated" : "Invoice created");
    setLocation(`/invoices/${invoice.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? `Edit ${existingInvoice?.invoiceNumber}` : "New Invoice"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? "Update invoice details" : "Create a new invoice for a client"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                data-testid="input-invoice-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Invoice["status"])}>
                <SelectTrigger id="status" data-testid="select-invoice-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  data-testid="input-invoice-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  data-testid="input-due-date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Bill To</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client" data-testid="select-client">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.company ? ` — ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No clients yet.{" "}
                  <a href="/clients" className="text-primary underline">Add a client first.</a>
                </p>
              )}
            </div>
            {clientId && (() => {
              const client = clients.find((c) => c.id === clientId);
              if (!client) return null;
              return (
                <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                  {client.company && <p className="font-medium">{client.company}</p>}
                  {client.email && <p className="text-muted-foreground">{client.email}</p>}
                  {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
                  {client.address && <p className="text-muted-foreground">{client.address}</p>}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-[35%]">Description</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground w-16">Qty</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground w-24">Rate (A$)</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground w-20">Tax %</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground w-20">Disc %</th>
                  <th className="text-right py-2 pl-2 font-medium text-muted-foreground w-24">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lineItems.map((item, idx) => {
                  const itemTotals = calculateLineItemTotals(item);
                  return (
                    <tr key={item.id} data-testid={`row-line-item-${idx}`}>
                      <td className="py-2 pr-4">
                        <Input
                          placeholder="Description of service..."
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                          data-testid={`input-description-${idx}`}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                          className="text-right"
                          data-testid={`input-quantity-${idx}`}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                          className="text-right"
                          data-testid={`input-rate-${idx}`}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={item.taxPercent}
                          onChange={(e) => updateLineItem(item.id, "taxPercent", parseFloat(e.target.value) || 0)}
                          className="text-right"
                          data-testid={`input-tax-${idx}`}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={item.discountPercent}
                          onChange={(e) => updateLineItem(item.id, "discountPercent", parseFloat(e.target.value) || 0)}
                          className="text-right"
                          data-testid={`input-discount-${idx}`}
                        />
                      </td>
                      <td className="py-2 pl-2 text-right font-medium whitespace-nowrap">
                        {formatCurrency(itemTotals.net, profile.currency)}
                      </td>
                      <td className="py-2 pl-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                          data-testid={`button-remove-line-${idx}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={addLineItem}
            data-testid="button-add-line-item"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Line Item
          </Button>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <div className="space-y-2 w-64 text-sm">
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
                  <span>Tax (GST)</span>
                  <span>{formatCurrency(totals.taxAmount, profile.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.total, profile.currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Additional notes or payment instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none min-h-24"
            data-testid="textarea-notes"
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pb-6">
        <Button variant="outline" onClick={() => setLocation("/invoices")}>
          Cancel
        </Button>
        <Button onClick={handleSave} data-testid="button-save-invoice">
          <Save className="mr-2 h-4 w-4" />
          {isEdit ? "Save Changes" : "Create Invoice"}
        </Button>
      </div>
    </div>
  );
}
