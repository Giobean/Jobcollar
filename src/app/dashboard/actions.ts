"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/auth/admin";

export type ReviewSubmissionState = {
  success: boolean;
  message: string;
};

export async function submitForReview(
  _previous: ReviewSubmissionState,
): Promise<ReviewSubmissionState> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: "Connect Supabase to submit this profile for review.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Sign in to submit your profile." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("approval_status,approval_submitted_at")
    .eq("user_id", user.id)
    .eq("type", "creator")
    .maybeSingle();
  if (!profile) return { success: false, message: "Creator profile not found." };
  if (profile.approval_status === "pending" && profile.approval_submitted_at) {
    return { success: false, message: "Your profile is already under review." };
  }

  const { error } = await supabase.rpc("submit_creator_for_review");
  if (error) {
    return {
      success: false,
      message:
        error.message.includes("required profile fields")
          ? "Complete all required profile fields before submitting."
          : "We could not submit your profile. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    message:
      "Profile submitted. You can keep building while we review your profile.",
  };
}
