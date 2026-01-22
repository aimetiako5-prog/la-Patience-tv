import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFaqs = (category?: string) => {
  return useQuery({
    queryKey: ["faqs", category],
    queryFn: async () => {
      let query = supabase
        .from("faqs")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useFaqCategories = () => {
  return useQuery({
    queryKey: ["faq_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("category")
        .eq("is_published", true);
      
      if (error) throw error;
      
      // Get unique categories
      const categories = [...new Set(data.map((faq) => faq.category))];
      return categories;
    },
  });
};
