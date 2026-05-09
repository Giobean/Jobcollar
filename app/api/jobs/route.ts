import { NextResponse } from "next/server";
import { aggregateJobs } from "@/lib/jobSources";

export const runtime = "nodejs";
export const revalidate = 600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobs = await aggregateJobs({
    q: searchParams.get("q") ?? "",
    category: searchParams.get("category") ?? "",
    location: searchParams.get("location") ?? "",
    remote: searchParams.get("remote") === "true",
    source: searchParams.get("source") ?? "",
    limit: Number(searchParams.get("limit") ?? 80)
  });

  return NextResponse.json(jobs, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800"
    }
  });
}
