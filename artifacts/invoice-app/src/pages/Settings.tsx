import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessProfile } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { upsertClient, upsertInvoice, upsertProfile, removeClient, removeInvoice } from "@/lib/supabase-db";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Upload, Download, RefreshCw, Trash2, Building2, CreditCard, FileText, Database, ShieldCheck, LogOut } from "lucide-react";
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
  const { profile, clients, invoices, updateProfile, refreshData } = useApp();
  const { logout, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<BusinessProfile>({ ...profile });
  const [pwForm, setPwForm] = useState({ newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleChange = (field: keyof BusinessProfile, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await updateProfile(form);
      toast.success("Settings saved to Supabase");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      profile,
      clients,
      invoices,
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

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.profile || !data.clients || !data.invoices) { toast.error("Invalid backup file"); return; }
        if (!confirm("This will import all data from the backup into your Supabase account. Continue?")) return;
        await upsertProfile(data.profile);
        for (const c of data.clients) await upsertClient(c);
        for (const inv of data.invoices) await upsertInvoice(inv);
        await refreshData();
        setForm({ ...data.profile });
        toast.success("Data restored from backup to Supabase");
      } catch { toast.error("Failed to parse backup file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearData = async () => {
    if (!confirm("Permanently delete ALL clients and invoices from Supabase? Cannot be undone.")) return;
    try {
      for (const c of clients) await removeClient(c.id);
      for (const inv of invoices) await removeInvoice(inv.id);
      const newProfile = { ...form, nextInvoiceNumber: 1001 };
      await upsertProfile(newProfile);
      setForm(newProfile);
      await refreshData();
      toast.success("All data cleared");
    } catch {
      toast.error("Failed to clear data");
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error("Passwords don't match"); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    setPwLoading(false);
    if (error) { toast.error(error.message); return; }
    setPwForm({ newPw: "", confirm: "" });
    toast.success("Password changed successfully");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your business profile and invoice defaults</p>
      </div>

      {/* Business Profile */}
      <Card className="crystal-card border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Appears on your invoice header and footer</CardDescription>
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
                  <img src={form.logo} alt="Logo" className="h-16 w-16 object-contain rounded-full border p-1 bg-muted/30" />
                  <Button variant="ghost" size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-full"
                    onClick={() => setForm(p => ({ ...p, logo: "" }))} data-testid="button-remove-logo">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs text-center">
                  Logo
                </div>
              )}
              <div>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-logo">
                  <Upload className="mr-2 h-4 w-4" /> Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG. Max 2MB.</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bizName">Business Name *</Label>
              <Input id="bizName" value={form.name} onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Awais Tech Services Pty Ltd" data-testid="input-business-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bizAbn">ABN</Label>
              <Input id="bizAbn" value={form.abn || ""} onChange={(e) => handleChange("abn", e.target.value)}
                placeholder="12 345 678 901" data-testid="input-abn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bizCurrency">Currency</Label>
              <Select value={form.currency} onValueChange={(v) => handleChange("currency", v)}>
                <SelectTrigger id="bizCurrency" data-testid="select-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bizEmail">Email</Label>
              <Input id="bizEmail" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)}
                placeholder="hello@awaistech.com" data-testid="input-business-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bizPhone">Phone</Label>
              <Input id="bizPhone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+61 400 000 000" data-testid="input-business-phone" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bizAddress">Address</Label>
              <Textarea id="bizAddress" value={form.address} onChange={(e) => handleChange("address", e.target.value)}
                placeholder="10 Sanur St Marsden 4132 QLD AUSTRALIA" className="resize-none h-16"
                data-testid="textarea-business-address" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment / Bank Details */}
      <Card className="crystal-card border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Bank account shown in the Payment Method section of invoices</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNo">Account Number</Label>
              <Input id="accountNo" value={form.accountNo || ""} onChange={(e) => handleChange("accountNo", e.target.value)}
                placeholder="723487772" data-testid="input-account-no" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" value={form.bankName || ""} onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="NAB" data-testid="input-bank-name" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" value={form.accountName || ""} onChange={(e) => handleChange("accountName", e.target.value)}
                placeholder="AWAIS TECH SERVICES PTY LTD" data-testid="input-account-name" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Invoice Numbering */}
      <Card className="crystal-card border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Invoice Defaults</CardTitle>
              <CardDescription>Terms printed on every invoice and auto-numbering settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea id="terms" value={form.terms || ""} onChange={(e) => handleChange("terms", e.target.value)}
              className="resize-none h-28 text-xs" placeholder="Payment due within 7 days of invoice date..."
              data-testid="textarea-terms" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Invoice Prefix</Label>
              <Input id="prefix" value={form.invoicePrefix}
                onChange={(e) => handleChange("invoicePrefix", e.target.value.toUpperCase())}
                placeholder="INV" maxLength={6} data-testid="input-invoice-prefix" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextNum">Next Number</Label>
              <Input id="nextNum" type="number" min="1" value={form.nextInvoiceNumber}
                onChange={(e) => handleChange("nextInvoiceNumber", parseInt(e.target.value) || 1)}
                data-testid="input-next-invoice-number" />
            </div>
          </div>
          <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground">
            Next invoice: <span className="font-semibold text-foreground">
              {form.invoicePrefix}-{String(form.nextInvoiceNumber).padStart(4, "0")}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saveLoading} data-testid="button-save-settings"
          className="aurora-bar border-0 text-white hover:opacity-90 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
          <Save className="mr-2 h-4 w-4" /> {saveLoading ? "Saving…" : "Save Settings"}
        </Button>
      </div>

      {/* Security */}
      <Card className="crystal-card border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Signed in as <span className="font-semibold text-foreground">{user?.email}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="newPw">New Password</Label>
                <Input id="newPw" type="password" value={pwForm.newPw}
                  onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                  placeholder="Min 6 characters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPw">Confirm Password</Label>
                <Input id="confirmPw" type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Re-enter new password" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Button variant="outline" onClick={handleChangePassword} disabled={pwLoading}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {pwLoading ? "Changing…" : "Change Password"}
            </Button>
            <Button variant="ghost" onClick={logout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Data Management */}
      <Card className="crystal-card border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Backup, restore, or clear all Supabase data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportData} data-testid="button-export-data">
              <Download className="mr-2 h-4 w-4" /> Export Backup
            </Button>
            <Button variant="outline" onClick={() => importInputRef.current?.click()} data-testid="button-import-data">
              <RefreshCw className="mr-2 h-4 w-4" /> Restore Backup
            </Button>
            <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportData} />
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-destructive mb-2">Danger Zone</p>
            <Button variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleClearData} data-testid="button-clear-data">
              <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Permanently deletes all clients and invoices from Supabase. Settings are kept.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
