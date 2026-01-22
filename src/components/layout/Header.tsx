import { Search, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header = ({ title, subtitle }: HeaderProps) => {
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="w-64 pl-10 bg-secondary border-border focus:border-primary"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] font-medium flex items-center justify-center text-destructive-foreground">
            3
          </span>
        </Button>

        {/* Quick Actions */}
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          Nouvel abonné
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
