import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Subscriber = Database["public"]["Tables"]["subscribers"]["Row"];
type SubscriberInsert = Database["public"]["Tables"]["subscribers"]["Insert"];
type SubscriberUpdate = Database["public"]["Tables"]["subscribers"]["Update"];
type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

export const useSubscribers = (filters?: {
  zoneId?: string;
  status?: SubscriptionStatus;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["subscribers", filters],
    queryFn: async () => {
      let query = supabase
        .from("subscribers")
        .select(`
          *,
          zone:zones(id, name, city, quartier),
          bouquet:bouquets(id, name, price)
        `)
        .order("created_at", { ascending: false });

      if (filters?.zoneId) {
        query = query.eq("zone_id", filters.zoneId);
      }
      if (filters?.status) {
        query = query.eq("subscription_status", filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useSubscriber = (id: string) => {
  return useQuery({
    queryKey: ["subscriber", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscribers")
        .select(`
          *,
          zone:zones(id, name, city, quartier),
          bouquet:bouquets(id, name, price)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateSubscriber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriber: SubscriberInsert) => {
      const { data, error } = await supabase
        .from("subscribers")
        .insert(subscriber)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      toast.success("Abonné créé avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });
};

export const useUpdateSubscriber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SubscriberUpdate }) => {
      const { data: result, error } = await supabase
        .from("subscribers")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      toast.success("Abonné mis à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });
};

export const useDeleteSubscriber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscribers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      toast.success("Abonné supprimé");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });
};

export const useToggleSignal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, signalActive }: { id: string; signalActive: boolean }) => {
      const { error } = await supabase
        .from("subscribers")
        .update({ signal_active: signalActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { signalActive }) => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      toast.success(signalActive ? "Signal activé" : "Signal désactivé");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });
};
