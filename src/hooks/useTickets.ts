import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];
type TicketInsert = Database["public"]["Tables"]["support_tickets"]["Insert"];
type TicketUpdate = Database["public"]["Tables"]["support_tickets"]["Update"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPriority = Database["public"]["Enums"]["ticket_priority"];

export const useTickets = (filters?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
}) => {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select(`
          *,
          subscriber:subscribers(id, name, phone),
          zone:zones(id, name, city),
          assigned:profiles!support_tickets_assigned_to_fkey(id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }
      if (filters?.assignedTo) {
        query = query.eq("assigned_to", filters.assignedTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useTicket = (id: string) => {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          *,
          subscriber:subscribers(id, name, phone, address),
          zone:zones(id, name, city, quartier),
          assigned:profiles!support_tickets_assigned_to_fkey(id, full_name)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useTicketMessages = (ticketId: string) => {
  return useQuery({
    queryKey: ["ticket_messages", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select(`
          *,
          sender:profiles!ticket_messages_sender_id_fkey(id, full_name)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: TicketInsert) => {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert(ticket)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket créé avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TicketUpdate }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket mis à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });
};

export const useAddTicketMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      message, 
      isInternal = false 
    }: { 
      ticketId: string; 
      message: string; 
      isInternal?: boolean 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender_id: user?.id,
          message,
          is_internal: isInternal,
        });
      if (error) throw error;
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ["ticket_messages", ticketId] });
      toast.success("Message envoyé");
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });
};
