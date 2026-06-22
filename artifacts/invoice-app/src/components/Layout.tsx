import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, BarChart3, Settings, Moon, Sun, Menu } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { profile, updateProfile } = useApp();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (profile.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [profile.theme]);

  const toggleTheme = () => {
    updateProfile({ theme: profile.theme === "dark" ? "light" : "dark" });
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/invoices", label: "Invoices", icon: FileText },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const NavLinks = () => (
    <>
      <div className="p-6">
        {profile.logo ? (
          <img src={profile.logo} alt={profile.name} className="h-10 max-w-full object-contain mb-2" />
        ) : (
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl mb-2">
            {profile.name.charAt(0)}
          </div>
        )}
        <h2 className="text-xl font-bold tracking-tight text-sidebar-foreground truncate" title={profile.name}>{profile.name}</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                location === item.href || (location.startsWith(item.href) && item.href !== "/")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleTheme}
        >
          {profile.theme === "dark" ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
          {profile.theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card no-print">
        <div className="flex items-center gap-2">
          {profile.logo ? (
            <img src={profile.logo} alt={profile.name} className="h-8 object-contain" />
          ) : (
            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-sm">
              {profile.name.charAt(0)}
            </div>
          )}
          <span className="font-semibold">{profile.name}</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar border-r-sidebar-border p-0 flex flex-col text-sidebar-foreground">
            <NavLinks />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground no-print">
        <NavLinks />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full max-w-[1200px] mx-auto print:p-0 print:overflow-visible print:w-full print:max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
}