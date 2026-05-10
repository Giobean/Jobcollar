import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY environment variable." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeKey);

  try {
    const body = await request.json();
    const { position, company, email } = body;

    if (!position || !company || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "JobCollar - 30 Day Job Post",
              description: `${position} at ${company}`
            },
            unit_amount: 29900
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${getBaseUrl(request)}/post?success=true`,
      cancel_url: `${getBaseUrl(request)}/post?canceled=true`,
      metadata: {
        position,
        company,
        email
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
