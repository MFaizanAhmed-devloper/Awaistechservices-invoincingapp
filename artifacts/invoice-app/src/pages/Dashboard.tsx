import { useApp } from "@/contexts/AppContext";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Plus, DollarSign, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subMonths } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Dashboard() {
  const { invoices, clients, profile } = useApp();

  const getTotals = () => {
    let revenue = 0;
    let pending = 0;
    let overdue = 0;
    let paid = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let paidCount = 0;

    invoices.forEach(inv => {
      const total = calculateInvoiceTotals(inv.lineItems).total;
      if (inv.status === "paid") {
        revenue += total;
        paid += total;
        paidCount++;
      } else if (inv.status === "overdue") {
        overdue += total;
        overdueCount++;
      } else if (inv.status === "sent") {
        pending += total;
        pendingCount++;
      }
    });

    return { revenue, pending, overdue, paid, pendingCount, overdueCount, paidCount };
  };

  const totals = getTotals();

  const getChartData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const monthStr = format(d, "MMM yyyy");
      
      const monthTotal = invoices
        .filter(inv => inv.status === "paid" && format(new Date(inv.invoiceDate), "MMM yyyy") === monthStr)
        .reduce((sum, inv) => sum + calculateInvoiceTotals(inv.lineItems).total, 0);
        
      data.push({
        name: monthStr,
        total: monthTotal
      });
    }
    return data;
  };

  const chartData = getChartData();
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your business performance.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/new">
            <Button data-testid="button-new-invoice">
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.revenue, profile.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">From all paid invoices</p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.pending, profile.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals.pendingCount} sent invoices</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.overdue, profile.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals.overdueCount} overdue invoices</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.paid, profile.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals.paidCount} paid invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value, profile.currency), "Revenue"]}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Link href="/invoices">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                        No recent invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentInvoices.map((inv) => {
                      const client = clients.find(c => c.id === inv.clientId);
                      const total = calculateInvoiceTotals(inv.lineItems).total;
                      return (
                        <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">
                            <Link href={`/invoices/${inv.id}`} className="hover:underline hover:text-primary">
                              {inv.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate" title={client?.name}>
                            {client?.name || "Unknown"}
                          </TableCell>
                          <TableCell>{formatCurrency(total, profile.currency)}</TableCell>
                          <TableCell>
                            <StatusBadge status={inv.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}