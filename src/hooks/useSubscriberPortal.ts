import { useState, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  payment_date: string;
  receipt_number?: string;
  months_paid: number;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

interface Bouquet {
  id: string;
  name: string;
  price: number;
  channels_count: number;
  description?: string;
}

async function callDataApi(resource: string, token: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/subscriber-data?resource=${resource}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

async function callPaymentApi(action: string, data: Record<string, unknown>, token: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/subscriber-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...data }),
  });
  return response.json();
}

async function callTicketApi(action: string, data: Record<string, unknown>, token: string) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/subscriber-ticket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...data }),
  });
  return response.json();
}

export function useSubscriberPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = () => localStorage.getItem("subscriber_token") || "";

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callDataApi("payments", getToken());
      if (result.success) {
        setPayments(result.data || []);
      }
    } catch {
      console.error("Failed to fetch payments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateAmount = useCallback(async (months: number, bouquetId?: string) => {
    try {
      const result = await callPaymentApi("calculate", { months, bouquetId }, getToken());
      return result;
    } catch {
      return { success: false, error: "Erreur de calcul" };
    }
  }, []);

  const initiatePayment = useCallback(
    async (paymentMethod: string, phoneNumber: string, months: number, bouquetId?: string) => {
      try {
        const result = await callPaymentApi(
          "initiate",
          { paymentMethod, phoneNumber, months, bouquetId },
          getToken()
        );
        return result;
      } catch {
        return { success: false, error: "Erreur de paiement" };
      }
    },
    []
  );

  const checkPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      const result = await callPaymentApi("status", { paymentId }, getToken());
      return result;
    } catch {
      return { success: false, error: "Erreur de vérification" };
    }
  }, []);

  return {
    payments,
    isLoading,
    fetchPayments,
    calculateAmount,
    initiatePayment,
    checkPaymentStatus,
  };
}

export function useSubscriberTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = () => localStorage.getItem("subscriber_token") || "";

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callDataApi("tickets", getToken());
      if (result.success) {
        setTickets(result.data || []);
      }
    } catch {
      console.error("Failed to fetch tickets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTicket = useCallback(
    async (subject: string, description: string, priority: string = "medium") => {
      try {
        const result = await callTicketApi("create", { subject, description, priority }, getToken());
        if (result.success) {
          await fetchTickets();
        }
        return result;
      } catch {
        return { success: false, error: "Erreur de création" };
      }
    },
    [fetchTickets]
  );

  return {
    tickets,
    isLoading,
    fetchTickets,
    createTicket,
  };
}

export function useSubscriberBouquets() {
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = () => localStorage.getItem("subscriber_token") || "";

  const fetchBouquets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callDataApi("bouquets", getToken());
      if (result.success) {
        setBouquets(result.data || []);
      }
    } catch {
      console.error("Failed to fetch bouquets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bouquets,
    isLoading,
    fetchBouquets,
  };
}
