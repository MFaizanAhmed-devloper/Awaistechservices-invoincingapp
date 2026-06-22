import { useApp } from "@/contexts/AppContext";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Plus, DollarSign, Clock, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subMonths } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Dashboard() {
  const { invoices, clients, profile } = useApp();

  const getTotals = () => {
    let revenue = 0, pending = 0, overdue = 0, paid = 0;
    let pendingCount = 0, overdueCount = 0, paidCount = 0;
    invoices.forEach(inv => {
      const total = calculateInvoiceTotals(inv.lineItems).total;
      if (inv.status === "paid") { revenue += total; paid += total; paidCount++; }
      else if (inv.status === "overdue") { overdue += total; overdueCount++; }
      else if (inv.status === "sent") { pending += total; pendingCount++; }
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
      data.push({ name: format(d, "MMM"), total: monthTotal });
    }
    return data;
  };

  const chartData = getChartData();
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const kpis = [
    {
      label: "Total Revenue",
      value: formatCurrency(totals.revenue, profile.currency),
      sub: "From all paid invoices",
      icon: DollarSign,
      color: "text-indigo-500",
      gradient: "from-indigo-500/10 to-indigo-500/5",
      glow: "shadow-indigo-100 dark:shadow-indigo-900/30",
    },
    {
      label: "Pending",
      value: formatCurrency(totals.pending, profile.currency),
      sub: `${totals.pendingCount} sent invoice${totals.pendingCount !== 1 ? "s" : ""}`,
      icon: Clock,
      color: "text-blue-500",
      gradient: "from-blue-500/10 to-blue-500/5",
      glow: "shadow-blue-100 dark:shadow-blue-900/30",
    },
    {
      label: "Overdue",
      value: formatCurrency(totals.overdue, profile.currency),
      sub: `${totals.overdueCount} overdue invoice${totals.overdueCount !== 1 ? "s" : ""}`,
      icon: AlertCircle,
      color: "text-rose-500",
      gradient: "from-rose-500/10 to-rose-500/5",
      glow: "shadow-rose-100 dark:shadow-rose-900/30",
    },
    {
      label: "Paid",
      value: formatCurrency(totals.paid, profile.currency),
      sub: `${totals.paidCount} paid invoice${totals.paidCount !== 1 ? "s" : ""}`,
      icon: CheckCircle2,
      color: "text-emerald-500",
      gradient: "from-emerald-500/10 to-emerald-500/5",
      glow: "shadow-emerald-100 dark:shadow-emerald-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back — here's your business at a glance.</p>
        </div>
        <Link href="/invoices/new">
          <Button data-testid="button-new-invoice" className="aurora-bar border-0 text-white hover:opacity-90 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="crystal-card rounded-2xl p-5 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} pointer-events-none`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{kpi.label}</p>
                <p className="text-2xl font-black text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-white/80 dark:bg-white/5 flex items-center justify-center shadow-sm`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Recent */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Revenue Chart */}
        <div className="crystal-card rounded-2xl lg:col-span-4 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div>
              <h3 className="font-bold text-base">Revenue Overview</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 6 months of paid invoices</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              Paid only
            </div>
          </div>
          <div className="h-[260px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value, profile.currency), "Revenue"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  dot={{ fill: "#4f46e5", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="crystal-card rounded-2xl lg:col-span-3 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <h3 className="font-bold text-base">Recent Invoices</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Latest activity</p>
            </div>
            <Link href="/invoices">
              <Button variant="ghost" size="sm" className="text-indigo-500 hover:text-indigo-600 text-xs h-7 px-2">
                View All
              </Button>
            </Link>
          </div>
          <div className="px-2 pb-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-xs">Invoice</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24 text-sm">
                      No invoices yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInvoices.map((inv) => {
                    const client = clients.find(c => c.id === inv.clientId);
                    const total = calculateInvoiceTotals(inv.lineItems).total;
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/40 transition-colors border-border/40">
                        <TableCell>
                          <Link href={`/invoices/${inv.id}`}>
                            <span className="text-indigo-500 font-semibold text-xs hover:underline cursor-pointer">
                              {inv.invoiceNumber}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[80px] truncate">
                          {client?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-right">
                          {formatCurrency(total, profile.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <StatusBadge status={inv.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Clients", value: clients.length, icon: "👥" },
          { label: "Total Invoices", value: invoices.length, icon: "📄" },
          { label: "Draft", value: invoices.filter(i => i.status === "draft").length, icon: "✏️" },
          { label: "Collection Rate", value: invoices.length ? `${Math.round((invoices.filter(i => i.status === "paid").length / invoices.length) * 100)}%` : "—", icon: "📈" },
        ].map((stat) => (
          <div key={stat.label} className="crystal-card rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">{stat.icon}</span>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
