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
    const body = await req.json();
    const { action, subject, description, priority } = body;

    // Get subscriber zone
    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("zone_id")
      .eq("id", subscriberId)
      .single();

    // Create new ticket
    if (action === "create") {
      if (!subject || subject.trim().length < 5) {
        return new Response(
          JSON.stringify({ success: false, error: "Le sujet doit faire au moins 5 caractères" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (!description || description.trim().length < 10) {
        return new Response(
          JSON.stringify({ success: false, error: "La description doit faire au moins 10 caractères" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({
          subscriber_id: subscriberId,
          zone_id: subscriber?.zone_id,
          subject: subject.trim().slice(0, 200),
          description: description.trim().slice(0, 2000),
          priority: priority || "medium",
          status: "open",
        })
        .select("id, ticket_number, subject, status, created_at")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          ticket,
          message: `Votre ticket #${ticket.ticket_number} a été créé. Notre équipe vous contactera bientôt.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Action non reconnue" }),
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
