import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBouquets = () => {
  return useQuery({
    queryKey: ["bouquets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bouquets")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};
