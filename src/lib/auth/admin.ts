import { createSupabaseServerClient } from "@/lib/supabase/server";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getAdminSession() {
  if (!isSupabaseConfigured()) {
    return { authorized: false as const, reason: "not_configured" as const };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { authorized: false as const, reason: "unauthenticated" as const };
  }
  if (user.app_metadata?.role !== "admin") {
    return { authorized: false as const, reason: "forbidden" as const };
  }
  return { authorized: true as const, user, supabase };
}
