import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Headphones, 
  Megaphone, 
  BarChart3, 
  Settings,
  Tv,
  MapPin,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/" },
  { icon: Users, label: "Abonnés", href: "/subscribers" },
  { icon: MapPin, label: "Zones", href: "/zones" },
  { icon: CreditCard, label: "Paiements", href: "/payments" },
  { icon: Headphones, label: "Support", href: "/support", badge: 5 },
  { icon: Megaphone, label: "Marketing", href: "/marketing" },
  { icon: BarChart3, label: "Rapports", href: "/reports" },
];

const bottomNavItems: NavItem[] = [
  { icon: Bell, label: "Notifications", href: "/notifications", badge: 3 },
  { icon: Settings, label: "Paramètres", href: "/settings" },
];

interface SidebarProps {
  currentPath?: string;
}

export const Sidebar = ({ currentPath = "/" }: SidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center glow-effect">
            <Tv className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">LA PATIENCE</h1>
            <p className="text-xs text-muted-foreground">TV Management</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 mb-3">
          Menu principal
        </p>
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "nav-item",
              currentPath === item.href && "active"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "nav-item",
              currentPath === item.href && "active"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="bg-destructive/20 text-destructive text-xs font-medium px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Admin</p>
            <p className="text-xs text-muted-foreground truncate">admin@lapatience.tv</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
