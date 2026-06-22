import { useApp } from "@/contexts/AppContext";
import { getInvoices, getClients, getBusinessProfile, saveBusinessProfile, BusinessProfile } from "@/lib/storage";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Upload, Download, RefreshCw, Trash2, Building2, Palette, Database } from "lucide-react";
import { toast } from "sonner";

const CURRENCIES = [
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "NZD", label: "New Zealand Dollar (NZ$)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "SGD", label: "Singapore Dollar (S$)" },
];

export default function Settings() {
  const { profile, updateProfile, refreshData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BusinessProfile>({ ...profile });

  const handleChange = (field: keyof BusinessProfile, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveBusinessProfile(form);
    refreshData();
    toast.success("Settings saved");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({ ...prev, logo: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logo: "" }));
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      profile: getBusinessProfile(),
      clients: getClients(),
      invoices: getInvoices(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `awais-invoicing-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.profile || !data.clients || !data.invoices) {
          toast.error("Invalid backup file format");
          return;
        }
        if (!confirm("This will replace ALL current data with the backup. Continue?")) return;
        localStorage.setItem("invoice_app_biz_profile", JSON.stringify(data.profile));
        localStorage.setItem("invoice_app_clients", JSON.stringify(data.clients));
        localStorage.setItem("invoice_app_invoices", JSON.stringify(data.invoices));
        refreshData();
        setForm({ ...data.profile });
        toast.success("Data restored from backup");
      } catch {
        toast.error("Failed to parse backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearData = () => {
    if (!confirm("This will permanently delete ALL clients and invoices. This cannot be undone. Are you sure?")) return;
    localStorage.removeItem("invoice_app_clients");
    localStorage.removeItem("invoice_app_invoices");
    const newProfile = { ...form, nextInvoiceNumber: 1001 };
    saveBusinessProfile(newProfile);
    setForm(newProfile);
    refreshData();
    toast.success("All data cleared");
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your business profile and app preferences</p>
      </div>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>This information appears on your invoices</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Business Logo</Label>
            <div className="flex items-center gap-4">
              {form.logo ? (
                <div className="relative">
                  <img src={form.logo} alt="Logo" className="h-16 max-w-[180px] object-contain rounded border p-1 bg-muted/30" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-full"
                    onClick={handleRemoveLogo}
                    data-testid="button-remove-logo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-16 w-20 rounded border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                  No logo
                </div>
              )}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-logo"
                >
                  <Upload className="mr-2 h-4 w-4" /> Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG. Max 2MB.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bizName">Business Name *</Label>
              <Input
                id="bizName"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Awais Tech Services"
                data-testid="input-business-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bizEmail">Email</Label>
              <Input
                id="bizEmail"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="hello@yourcompany.com"
                data-testid="input-business-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bizPhone">Phone</Label>
              <Input
                id="bizPhone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+61 400 000 000"
                data-testid="input-business-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bizCurrency">Currency</Label>
              <Select value={form.currency} onValueChange={(v) => handleChange("currency", v)}>
                <SelectTrigger id="bizCurrency" data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bizAddress">Business Address</Label>
            <Textarea
              id="bizAddress"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Tech Lane, Sydney NSW 2000, Australia"
              className="resize-none"
              data-testid="textarea-business-address"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Invoice Numbering</CardTitle>
              <CardDescription>Configure how invoice numbers are generated</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Invoice Prefix</Label>
              <Input
                id="prefix"
                value={form.invoicePrefix}
                onChange={(e) => handleChange("invoicePrefix", e.target.value.toUpperCase())}
                placeholder="INV"
                maxLength={6}
                data-testid="input-invoice-prefix"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextNum">Next Invoice Number</Label>
              <Input
                id="nextNum"
                type="number"
                min="1"
                value={form.nextInvoiceNumber}
                onChange={(e) => handleChange("nextInvoiceNumber", parseInt(e.target.value) || 1)}
                data-testid="input-next-invoice-number"
              />
            </div>
          </div>
          <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground">
            Next invoice will be numbered: <span className="font-semibold text-foreground">{form.invoicePrefix}-{String(form.nextInvoiceNumber).padStart(4, "0")}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" data-testid="button-save-settings">
          <Save className="mr-2 h-4 w-4" /> Save Settings
        </Button>
      </div>

      <Separator />

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Backup, restore, or clear your app data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportData} data-testid="button-export-data">
              <Download className="mr-2 h-4 w-4" /> Export Backup
            </Button>
            <Button variant="outline" onClick={() => importInputRef.current?.click()} data-testid="button-import-data">
              <RefreshCw className="mr-2 h-4 w-4" /> Restore from Backup
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportData}
            />
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-destructive mb-2">Danger Zone</p>
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleClearData}
              data-testid="button-clear-data"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will permanently delete all clients and invoices. Settings will be kept.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
