import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles")
    .select("id,stripe_account_id,type").eq("user_id", user.id).single();
  if (!profile || profile.type !== "creator") {
    return NextResponse.json({ message: "Creator profile required." }, { status: 403 });
  }

  const stripe = getStripe();
  let accountId = profile.stripe_account_id;
  if (!accountId) {
    const account = await stripe.accounts.create({ type: "express", metadata: { profile_id: profile.id } });
    accountId = account.id;
    await admin.from("profiles").update({ stripe_account_id: accountId }).eq("id", profile.id);
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${origin}/dashboard?connect=refresh`,
    return_url: `${origin}/dashboard?connect=complete`,
  });
  return NextResponse.json({ url: link.url });
}
