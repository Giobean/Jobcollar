import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Webhook is not configured", { status: 503 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error: claimError } = await supabase.from("webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
  });
  if (claimError?.code === "23505") return Response.json({ received: true, duplicate: true });
  if (claimError) return new Response("Could not claim event", { status: 500 });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await supabase.from("payments").update({
          status: "paid",
          stripe_payment_intent_id: String(session.payment_intent),
          paid_at: new Date().toISOString(),
        }).eq("stripe_checkout_session_id", session.id);
        await supabase.from("ad_requests").update({
          payment_status: "paid",
          stripe_payment_intent_id: String(session.payment_intent),
        }).eq("stripe_checkout_session_id", session.id);
        break;
      }
      case "payment_intent.payment_failed":
        await supabase.from("payments").update({ status: "failed" })
          .eq("stripe_payment_intent_id", event.data.object.id);
        break;
      case "charge.refunded":
        await supabase.from("payments").update({ status: "refunded" })
          .eq("stripe_payment_intent_id", String(event.data.object.payment_intent));
        break;
      case "charge.dispute.created":
        await supabase.from("payments").update({ status: "disputed" })
          .eq("stripe_payment_intent_id", String(event.data.object.payment_intent));
        break;
      case "account.updated": {
        const account = event.data.object;
        await supabase.from("profiles").update({
          stripe_onboarding_complete: account.details_submitted,
          payouts_enabled: account.payouts_enabled,
        }).eq("stripe_account_id", account.id);
        break;
      }
    }
    await supabase.from("webhook_events").update({ processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
    return Response.json({ received: true });
  } catch {
    return new Response("Webhook processing failed", { status: 500 });
  }
}
