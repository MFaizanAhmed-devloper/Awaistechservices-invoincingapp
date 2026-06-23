import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, BarChart3, Settings, Moon, Sun, Menu, Zap } from "lucide-react";
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

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const NavLinks = () => (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          {profile.logo ? (
            <img src={profile.logo} alt={profile.name} className="h-9 max-w-[140px] object-contain rounded-lg" />
          ) : (
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", boxShadow: "0 4px 14px rgba(79,70,229,0.5)" }}>
              {profile.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-bold text-sm leading-tight text-white truncate" title={profile.name}>
              {profile.name}
            </h2>
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="h-2.5 w-2.5 text-indigo-400" />
              <span className="text-[10px] text-indigo-300 font-medium uppercase tracking-wide">Pro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aurora divider */}
      <div className="mx-4 mb-4 h-px aurora-bar opacity-60 rounded-full" />

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <div
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                  active
                    ? "nav-active text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 shrink-0 transition-all ${active ? "text-white" : "text-slate-400 group-hover:text-indigo-300"}`} style={{height: "1.125rem", width: "1.125rem"}} />
                <span className={`text-sm font-medium ${active ? "text-white" : ""}`}>{item.label}</span>
                {active && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 mt-auto">
        <div className="h-px aurora-bar opacity-30 rounded-full mb-3" />
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer text-sm font-medium"
          data-testid="button-toggle-theme"
        >
          {profile.theme === "dark"
            ? <Sun className="h-4 w-4 text-amber-400" />
            : <Moon className="h-4 w-4 text-indigo-400" />}
          {profile.theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row crystal-bg">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 glass no-print">
        <div className="flex items-center gap-2">
          {profile.logo ? (
            <img src={profile.logo} alt={profile.name} className="h-7 object-contain" />
          ) : (
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}>
              {profile.name.charAt(0)}
            </div>
          )}
          <span className="font-semibold text-sm truncate max-w-[160px]">{profile.name}</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-r-0 glass-sidebar">
            <NavLinks />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 glass-sidebar no-print">
        <NavLinks />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-[1200px] mx-auto print:p-0 print:overflow-visible print:w-full print:max-w-none">
          {children}
        </div>
        {/* Footer */}
        <div className="no-print flex items-center justify-center py-2.5 border-t border-border/30 bg-background/50 shrink-0">
          <p className="text-[11px] text-muted-foreground/60 tracking-wide select-none">
            Made with <span className="text-red-400">♥</span> by{" "}
            <span className="font-semibold text-muted-foreground/80">Faizan</span>
          </p>
        </div>
      </main>
    </div>
  );
}
