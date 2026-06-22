import { useApp } from "@/contexts/AppContext";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subMonths, getYear } from "date-fns";
import { Download } from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  "hsl(238 84% 60%)",
  "hsl(200 80% 55%)",
  "hsl(150 60% 50%)",
  "hsl(40 90% 55%)",
  "hsl(340 80% 60%)",
];

export default function Reports() {
  const { invoices, clients, profile } = useApp();

  const getMonthlyData = () => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const monthStr = format(d, "MMM yy");
      const monthFull = format(d, "MMM yyyy");
      const total = invoices
        .filter(
          (inv) =>
            inv.status === "paid" &&
            format(new Date(inv.invoiceDate), "MMM yyyy") === monthFull
        )
        .reduce((sum, inv) => sum + calculateInvoiceTotals(inv.lineItems).total, 0);
      data.push({ name: monthStr, revenue: total });
    }
    return data;
  };

  const getYearlyData = () => {
    const years: Record<string, number> = {};
    invoices
      .filter((inv) => inv.status === "paid")
      .forEach((inv) => {
        const yr = String(getYear(new Date(inv.invoiceDate)));
        years[yr] = (years[yr] || 0) + calculateInvoiceTotals(inv.lineItems).total;
      });
    return Object.entries(years)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, revenue]) => ({ name: year, revenue }));
  };

  const getTopClients = () => {
    const clientRevenue: Record<string, number> = {};
    invoices
      .filter((inv) => inv.status === "paid")
      .forEach((inv) => {
        clientRevenue[inv.clientId] =
          (clientRevenue[inv.clientId] || 0) +
          calculateInvoiceTotals(inv.lineItems).total;
      });
    return Object.entries(clientRevenue)
      .map(([clientId, revenue]) => {
        const client = clients.find((c) => c.id === clientId);
        return { name: client?.name || "Unknown", revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const getStatusBreakdown = () => {
    const counts: Record<string, number> = { draft: 0, sent: 0, paid: 0, overdue: 0 };
    invoices.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({ name: status.charAt(0).toUpperCase() + status.slice(1), value: count }));
  };

  const monthlyData = getMonthlyData();
  const yearlyData = getYearlyData();
  const topClients = getTopClients();
  const statusBreakdown = getStatusBreakdown();

  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + calculateInvoiceTotals(inv.lineItems).total, 0);

  const avgInvoiceValue = invoices.length
    ? invoices.reduce((sum, inv) => sum + calculateInvoiceTotals(inv.lineItems).total, 0) / invoices.length
    : 0;

  const handleExport = () => {
    const content = [
      `Awais Tech Services — Revenue Report`,
      `Generated: ${format(new Date(), "dd MMM yyyy")}`,
      ``,
      `=== Summary ===`,
      `Total Revenue: ${formatCurrency(totalRevenue, profile.currency)}`,
      `Total Invoices: ${invoices.length}`,
      `Paid Invoices: ${invoices.filter((i) => i.status === "paid").length}`,
      `Avg Invoice Value: ${formatCurrency(avgInvoiceValue, profile.currency)}`,
      ``,
      `=== Monthly Revenue (Last 12 Months) ===`,
      ...monthlyData.map((d) => `${d.name}: ${formatCurrency(d.revenue, profile.currency)}`),
      ``,
      `=== Top Clients ===`,
      ...topClients.map((c, i) => `${i + 1}. ${c.name}: ${formatCurrency(c.revenue, profile.currency)}`),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${format(new Date(), "yyyy-MM-dd")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Business performance and revenue analytics</p>
        </div>
        <Button variant="outline" onClick={handleExport} data-testid="button-export-report">
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue, profile.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{invoices.filter((i) => i.status === "paid").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(avgInvoiceValue, profile.currency)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#888" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#888" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v, profile.currency), "Revenue"]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="revenue" fill="hsl(238 84% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {statusBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">No invoices yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {statusBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yearly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {yearlyData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">No paid invoices yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#888" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#888" tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v, profile.currency), "Revenue"]}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="revenue" fill="hsl(200 80% 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {topClients.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">No paid invoices yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topClients}
                    layout="vertical"
                    margin={{ top: 4, right: 60, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} stroke="#888" tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#888" width={80} />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v, profile.currency), "Revenue"]}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="revenue" fill="hsl(150 60% 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
