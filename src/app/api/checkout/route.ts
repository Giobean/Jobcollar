import { NextResponse } from "next/server";
import { z } from "zod";
import {
  evaluatePurchasability,
  getAdSpace,
  PLATFORM_FEE_RATE,
} from "@/lib/data";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const checkoutInput = z.object({ adSpaceId: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = checkoutInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid Ad Space." }, { status: 400 });
  }

  let space: {
    id: string;
    objectName: string;
    placement: string;
    width: number;
    height: number;
    videos: number;
    price: number;
  } | undefined;

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabase) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { message: "Sign in as an advertiser to continue." },
        { status: 401 },
      );
    }
    const { data: advertiser } = await supabase
      .from("profiles")
      .select("id,type")
      .eq("user_id", user.id)
      .eq("type", "advertiser")
      .maybeSingle();
    if (!advertiser) {
      return NextResponse.json(
        { message: "An advertiser profile is required to purchase Ad Space." },
        { status: 403 },
      );
    }

    // This RLS-scoped query is authoritative. It can only return an available
    // listing whose creator is approved.
    const { data: row } = await supabase
      .from("ad_spaces")
      .select(
        "id,object_name,placement_location,width_inches,height_inches,video_count,creator_price,status,profiles!ad_spaces_creator_id_fkey!inner(approval_status)",
      )
      .eq("id", parsed.data.adSpaceId)
      .eq("status", "available")
      .eq("profiles.approval_status", "approved")
      .maybeSingle();
    if (row) {
      space = {
        id: row.id,
        objectName: row.object_name,
        placement: row.placement_location,
        width: Number(row.width_inches),
        height: Number(row.height_inches),
        videos: row.video_count,
        price: Number(row.creator_price),
      };
    }
  } else {
    const demoSpace = getAdSpace(parsed.data.adSpaceId);
    const eligibility = evaluatePurchasability(demoSpace);
    if (eligibility.allowed && demoSpace) {
      space = demoSpace;
    }
  }

  if (!space) {
    return NextResponse.json(
      { message: "This Ad Space is not available for purchase." },
      { status: 409 },
    );
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { message: "Demo checkout validated. Add Stripe keys to open secure payment." },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const fee = Math.round(space.price * PLATFORM_FEE_RATE * 100);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: space.price * 100 + fee,
            product_data: {
              name: `${space.objectName} — ${space.placement}`,
              description: `${space.width}" × ${space.height}" physical placement · ${space.videos} videos`,
            },
          },
        },
      ],
      metadata: {
        ad_space_id: space.id,
        creator_price_cents: String(space.price * 100),
        platform_fee_cents: String(fee),
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/spaces/${space.id}`,
    },
    { idempotencyKey: `checkout-${space.id}-${crypto.randomUUID()}` },
  );

  return NextResponse.json({ url: session.url });
}
