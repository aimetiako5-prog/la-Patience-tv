import { Users, CreditCard, AlertTriangle, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ZoneDistribution } from "@/components/dashboard/ZoneDistribution";
import { RecentPayments } from "@/components/dashboard/RecentPayments";
import { SupportTickets } from "@/components/dashboard/SupportTickets";
import { QuickActions } from "@/components/dashboard/QuickActions";

const Index = () => {
  return (
    <DashboardLayout 
      title="Tableau de bord" 
      subtitle="Vue d'ensemble de LA PATIENCE TV"
      currentPath="/"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-fade-in">
        <StatCard
          title="Abonnés actifs"
          value="3,247"
          change="+12% ce mois"
          changeType="positive"
          icon={Users}
          iconColor="text-primary"
        />
        <StatCard
          title="Revenus du mois"
          value="4.2M FCFA"
          change="+8% vs mois dernier"
          changeType="positive"
          icon={CreditCard}
          iconColor="text-success"
        />
        <StatCard
          title="Abonnements expirés"
          value="156"
          change="À relancer"
          changeType="negative"
          icon={AlertTriangle}
          iconColor="text-warning"
        />
        <StatCard
          title="Taux de renouvellement"
          value="87%"
          change="+3% ce trimestre"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-accent"
        />
      </div>

      {/* Signal Status Alert */}
      <div className="glass-card p-4 mb-6 border-l-4 border-l-success flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-medium text-foreground">Signal opérationnel</p>
            <p className="text-sm text-muted-foreground">Toutes les zones sont actives • Dernière vérification il y a 5 min</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            18 zones actives
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <WifiOff className="w-4 h-4 text-destructive" />
            0 zones en panne
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <RevenueChart />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <ZoneDistribution />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <RecentPayments />
        </div>
        <div className="space-y-6">
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <SupportTickets />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
