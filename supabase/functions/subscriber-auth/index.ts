import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for PIN (in production, use bcrypt via a library)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "LA_PATIENCE_TV_SALT");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Normalize phone number to include country code
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");
  
  // If starts with 6, 7, 2 (Cameroon numbers), add +237
  if (/^[672]\d{8}$/.test(cleaned)) {
    cleaned = "+237" + cleaned;
  }
  // If starts with 237, add +
  else if (/^237\d{9}$/.test(cleaned)) {
    cleaned = "+" + cleaned;
  }
  
  return cleaned;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, pin, token } = body;
    const phone = body.phone ? normalizePhone(body.phone) : undefined;

    // Check if subscriber exists
    if (action === "check") {
      const { data: subscriber, error } = await supabase
        .from("subscribers")
        .select("id, name, pin_hash")
        .eq("phone", phone)
        .single();

      if (error || !subscriber) {
        return new Response(
          JSON.stringify({ success: false, error: "Numéro non trouvé" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          hasPin: !!subscriber.pin_hash,
          subscriberName: subscriber.name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set PIN for first time
    if (action === "set-pin") {
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return new Response(
          JSON.stringify({ success: false, error: "Le code PIN doit être 4 chiffres" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data: subscriber, error: findError } = await supabase
        .from("subscribers")
        .select("id, pin_hash")
        .eq("phone", phone)
        .single();

      if (findError || !subscriber) {
        return new Response(
          JSON.stringify({ success: false, error: "Numéro non trouvé" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      if (subscriber.pin_hash) {
        return new Response(
          JSON.stringify({ success: false, error: "Code PIN déjà défini" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const pinHash = await hashPin(pin);
      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await supabase
        .from("subscribers")
        .update({ pin_hash: pinHash, pin_set_at: new Date().toISOString(), last_login_at: new Date().toISOString() })
        .eq("id", subscriber.id);

      await supabase.from("subscriber_sessions").insert({
        subscriber_id: subscriber.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

      return new Response(
        JSON.stringify({ success: true, token: sessionToken }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Login with PIN
    if (action === "login") {
      if (!pin || pin.length !== 4) {
        return new Response(
          JSON.stringify({ success: false, error: "Code PIN invalide" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data: subscriber, error: findError } = await supabase
        .from("subscribers")
        .select("id, pin_hash")
        .eq("phone", phone)
        .single();

      if (findError || !subscriber) {
        return new Response(
          JSON.stringify({ success: false, error: "Numéro non trouvé" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      const pinHash = await hashPin(pin);
      if (pinHash !== subscriber.pin_hash) {
        return new Response(
          JSON.stringify({ success: false, error: "Code PIN incorrect" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await supabase
        .from("subscribers")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", subscriber.id);

      await supabase.from("subscriber_sessions").insert({
        subscriber_id: subscriber.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

      return new Response(
        JSON.stringify({ success: true, token: sessionToken }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate session
    if (action === "validate") {
      const { data: session, error } = await supabase
        .from("subscriber_sessions")
        .select("subscriber_id, expires_at")
        .eq("token", token)
        .single();

      if (error || !session || new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: "Session invalide" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, subscriberId: session.subscriber_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Logout
    if (action === "logout") {
      await supabase.from("subscriber_sessions").delete().eq("token", token);
      return new Response(
        JSON.stringify({ success: true }),
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
