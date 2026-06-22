import { useApp } from "@/contexts/AppContext";
import { deleteInvoice, saveInvoice } from "@/lib/storage";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/calculations";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { Plus, Search, Eye, Edit, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StatusFilter = "all" | "draft" | "sent" | "paid" | "overdue";

export default function Invoices() {
  const { invoices, clients, profile, refreshData } = useApp();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = invoices
    .filter((inv) => {
      const client = clients.find((c) => c.id === inv.clientId);
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        (client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (client?.company || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleMarkPaid = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    saveInvoice({ ...inv, status: "paid", updatedAt: new Date().toISOString() });
    refreshData();
    toast.success("Invoice marked as paid");
  };

  const handleDelete = (id: string) => {
    deleteInvoice(id);
    refreshData();
    setDeleteId(null);
    toast.success("Invoice deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/invoices/new">
          <Button data-testid="button-new-invoice">
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center space-x-2 bg-card p-3 rounded-lg border flex-1">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search invoices or clients..."
            className="border-0 focus-visible:ring-0 px-0 shadow-none bg-transparent h-auto py-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-invoices"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-36 text-muted-foreground">
                  {search || statusFilter !== "all"
                    ? "No invoices match your filters."
                    : "No invoices yet. Create your first invoice to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => {
                const client = clients.find((c) => c.id === inv.clientId);
                const total = calculateInvoiceTotals(inv.lineItems).total;
                return (
                  <TableRow
                    key={inv.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`row-invoice-${inv.id}`}
                    onClick={() => setLocation(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-semibold text-primary">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client?.name || "Unknown Client"}</div>
                        {client?.company && (
                          <div className="text-xs text-muted-foreground">{client.company}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(inv.invoiceDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(inv.dueDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(total, profile.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLocation(`/invoices/${inv.id}`)}
                          title="View invoice"
                          data-testid={`button-view-invoice-${inv.id}`}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLocation(`/invoices/${inv.id}/edit`)}
                          title="Edit invoice"
                          data-testid={`button-edit-invoice-${inv.id}`}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        {inv.status !== "paid" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkPaid(inv.id)}
                            title="Mark as paid"
                            data-testid={`button-mark-paid-${inv.id}`}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(inv.id)}
                          title="Delete invoice"
                          data-testid={`button-delete-invoice-${inv.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the invoice. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
