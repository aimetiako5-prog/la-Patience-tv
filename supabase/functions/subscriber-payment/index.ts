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
    const { action, paymentMethod, phoneNumber, months, bouquetId } = body;

    // Get subscriber info
    const { data: subscriber, error: subError } = await supabase
      .from("subscribers")
      .select("*, bouquet:bouquets(id, name, price)")
      .eq("id", subscriberId)
      .single();

    if (subError || !subscriber) {
      return new Response(
        JSON.stringify({ success: false, error: "Abonné non trouvé" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Calculate amount
    if (action === "calculate") {
      let price = subscriber.bouquet?.price || 0;
      
      // If changing bouquet
      if (bouquetId && bouquetId !== subscriber.bouquet_id) {
        const { data: newBouquet } = await supabase
          .from("bouquets")
          .select("price")
          .eq("id", bouquetId)
          .single();
        price = newBouquet?.price || price;
      }

      const totalAmount = price * (months || 1);

      return new Response(
        JSON.stringify({ success: true, amount: totalAmount, pricePerMonth: price }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initiate payment
    if (action === "initiate") {
      if (!paymentMethod || !["mtn_momo", "orange_money"].includes(paymentMethod)) {
        return new Response(
          JSON.stringify({ success: false, error: "Méthode de paiement invalide" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (!phoneNumber || !/^[0-9]{9,10}$/.test(phoneNumber.replace(/\s/g, ""))) {
        return new Response(
          JSON.stringify({ success: false, error: "Numéro de téléphone invalide" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      let price = subscriber.bouquet?.price || 0;
      if (bouquetId && bouquetId !== subscriber.bouquet_id) {
        const { data: newBouquet } = await supabase
          .from("bouquets")
          .select("price")
          .eq("id", bouquetId)
          .single();
        price = newBouquet?.price || price;
      }

      const totalAmount = price * (months || 1);

      // Create payment request
      const { data: paymentRequest, error: prError } = await supabase
        .from("payment_requests")
        .insert({
          subscriber_id: subscriberId,
          amount: totalAmount,
          months: months || 1,
          payment_method: paymentMethod,
          phone_number: phoneNumber.replace(/\s/g, ""),
          status: "pending",
        })
        .select()
        .single();

      if (prError) throw prError;

      // In production, you would call the MTN MoMo or Orange Money API here
      // For now, we simulate a pending payment that needs manual validation
      
      // Simulate payment processing (in real app, this would be async webhook)
      // For demo purposes, we'll mark it as processing
      await supabase
        .from("payment_requests")
        .update({ status: "processing" })
        .eq("id", paymentRequest.id);

      return new Response(
        JSON.stringify({
          success: true,
          paymentId: paymentRequest.id,
          message: `Veuillez confirmer le paiement de ${totalAmount} FCFA sur votre téléphone ${paymentMethod === "mtn_momo" ? "MTN" : "Orange"}.`,
          instructions: paymentMethod === "mtn_momo"
            ? "Composez *126# et suivez les instructions pour valider le paiement."
            : "Composez #144# et suivez les instructions pour valider le paiement.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check payment status
    if (action === "status") {
      const { paymentId } = body;
      
      const { data: paymentRequest, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("id", paymentId)
        .eq("subscriber_id", subscriberId)
        .single();

      if (error || !paymentRequest) {
        return new Response(
          JSON.stringify({ success: false, error: "Paiement non trouvé" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, status: paymentRequest.status, payment: paymentRequest }),
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
