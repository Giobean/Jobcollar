import { NextResponse } from "next/server";
import { z } from "zod";
import { adSpaces, PLATFORM_FEE_RATE } from "@/lib/data";
import { getStripe } from "@/lib/stripe";

const checkoutInput = z.object({ adSpaceId: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = checkoutInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid Ad Space." }, { status: 400 });
  }

  // The browser never supplies the amount. In production, replace this
  // server-side demo lookup with the same query against Supabase ad_spaces.
  const space = adSpaces.find(({ id }) => id === parsed.data.adSpaceId);
  if (!space) {
    return NextResponse.json({ message: "Ad Space not found." }, { status: 404 });
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
