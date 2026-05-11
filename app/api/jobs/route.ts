import { NextResponse } from "next/server";
import { aggregateJobs } from "@/lib/jobSources";

export const runtime = "nodejs";
export const revalidate = 600;

function sanitizeParam(value: string | null, maxLength = 100): string {
  if (!value) return "";
  return value.trim().slice(0, maxLength).replace(/[<>]/g, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobs = await aggregateJobs({
    q: sanitizeParam(searchParams.get("q")),
    category: sanitizeParam(searchParams.get("category"), 50),
    location: sanitizeParam(searchParams.get("location"), 50),
    remote: searchParams.get("remote") === "true",
    source: sanitizeParam(searchParams.get("source"), 30),
    limit: Math.min(Math.max(Number(searchParams.get("limit")) || 200, 1), 1000)
  });

  return NextResponse.json(jobs, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800"
    }
  });
}
