import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      // Get subscribers count by status
      const { data: subscribers, error: subError } = await supabase
        .from("subscribers")
        .select("subscription_status");
      
      if (subError) throw subError;

      const activeCount = subscribers?.filter(s => s.subscription_status === "active").length || 0;
      const expiredCount = subscribers?.filter(s => s.subscription_status === "expired").length || 0;
      const suspendedCount = subscribers?.filter(s => s.subscription_status === "suspended").length || 0;

      // Get this month's revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: payments, error: payError } = await supabase
        .from("payments")
        .select("amount, status")
        .eq("status", "completed")
        .gte("payment_date", startOfMonth.toISOString());

      if (payError) throw payError;

      const monthlyRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Get open tickets count
      const { count: openTickets, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);

      if (ticketError) throw ticketError;

      // Get zones count
      const { count: zonesCount, error: zoneError } = await supabase
        .from("zones")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if (zoneError) throw zoneError;

      return {
        activeSubscribers: activeCount,
        expiredSubscribers: expiredCount,
        suspendedSubscribers: suspendedCount,
        totalSubscribers: subscribers?.length || 0,
        monthlyRevenue,
        openTickets: openTickets || 0,
        activeZones: zonesCount || 0,
        renewalRate: activeCount > 0 
          ? Math.round((activeCount / (activeCount + expiredCount)) * 100) 
          : 0,
      };
    },
  });
};

export const useRevenueByZone = () => {
  return useQuery({
    queryKey: ["revenue_by_zone"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscribers")
        .select(`
          zone:zones(id, name, city),
          subscription_status
        `);

      if (error) throw error;

      // Group by zone
      const zoneStats: Record<string, { name: string; count: number }> = {};
      
      data?.forEach((sub) => {
        if (sub.zone) {
          const zoneName = `${sub.zone.city} - ${sub.zone.name}`;
          if (!zoneStats[sub.zone.id]) {
            zoneStats[sub.zone.id] = { name: zoneName, count: 0 };
          }
          if (sub.subscription_status === "active") {
            zoneStats[sub.zone.id].count++;
          }
        }
      });

      return Object.values(zoneStats).sort((a, b) => b.count - a.count);
    },
  });
};
