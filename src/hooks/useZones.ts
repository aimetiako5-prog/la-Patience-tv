import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Zone = Database["public"]["Tables"]["zones"]["Row"];
type ZoneInsert = Database["public"]["Tables"]["zones"]["Insert"];

export const useZones = () => {
  return useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("*")
        .order("city", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zone: ZoneInsert) => {
      const { data, error } = await supabase
        .from("zones")
        .insert(zone)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast.success("Zone créée avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });
};
