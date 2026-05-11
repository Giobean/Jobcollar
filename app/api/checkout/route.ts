import { NextResponse } from "next/server";
import Stripe from "stripe";

const ALLOWED_ORIGINS = new Set([
  "localhost:3000",
  "jobcollar.com",
  "www.jobcollar.com"
]);

const MAX_FIELD_LENGTH = 200;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

function sanitize(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_FIELD_LENGTH).replace(/[<>]/g, "");
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= MAX_FIELD_LENGTH;
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return NextResponse.json(
      { error: "Payment system is not configured." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeKey);

  try {
    const body = await request.json();
    const position = sanitize(body.position);
    const company = sanitize(body.company);
    const email = sanitize(body.email);

    if (!position || !company || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const baseUrl = getBaseUrl(request);

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
      success_url: `${baseUrl}/post?success=true`,
      cancel_url: `${baseUrl}/post?canceled=true`,
      metadata: {
        position,
        company,
        email
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
  }
}

function getBaseUrl(request: Request): string {
  const host = request.headers.get("host") ?? "jobcollar.com";
  const sanitizedHost = ALLOWED_ORIGINS.has(host) ? host : "jobcollar.com";
  const protocol = sanitizedHost.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${sanitizedHost}`;
}
