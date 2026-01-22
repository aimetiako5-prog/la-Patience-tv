import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Non autorisé" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Validate session
    const { data: session, error: sessionError } = await supabase
      .from("subscriber_sessions")
      .select("subscriber_id, expires_at")
      .eq("token", token)
      .single();

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Session expirée" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const subscriberId = session.subscriber_id;
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");

    // Get subscriber profile
    if (resource === "profile") {
      const { data: subscriber, error } = await supabase
        .from("subscribers")
        .select(`
          id, name, phone, phone_secondary, email, address, line_number,
          subscription_status, subscription_expires_at, signal_active,
          zone:zones(id, name, city, quartier),
          bouquet:bouquets(id, name, price, channels_count, description)
        `)
        .eq("id", subscriberId)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: subscriber }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get payment history
    if (resource === "payments") {
      const { data: payments, error } = await supabase
        .from("payments")
        .select("id, amount, payment_method, status, payment_date, receipt_number, months_paid")
        .eq("subscriber_id", subscriberId)
        .order("payment_date", { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: payments }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get support tickets
    if (resource === "tickets") {
      const { data: tickets, error } = await supabase
        .from("support_tickets")
        .select(`
          id, ticket_number, subject, description, status, priority,
          created_at, updated_at, resolved_at, resolution_notes
        `)
        .eq("subscriber_id", subscriberId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: tickets }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get available bouquets for upgrade
    if (resource === "bouquets") {
      const { data: bouquets, error } = await supabase
        .from("bouquets")
        .select("id, name, price, channels_count, description")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: bouquets }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Resource non reconnue" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur serveur" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
