"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";

const moderationInput = z.object({
  creatorId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "suspended"]),
  reason: z.string().trim().max(500).optional(),
});

export type ModerationState = {
  success: boolean;
  message: string;
};

export async function moderateCreator(
  _previous: ModerationState,
  formData: FormData,
): Promise<ModerationState> {
  const session = await getAdminSession();
  if (!session.authorized) {
    return { success: false, message: "Administrator access is required." };
  }
  const parsed = moderationInput.safeParse({
    creatorId: formData.get("creatorId"),
    status: formData.get("status"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    return { success: false, message: "Review action was invalid." };
  }

  const now = new Date().toISOString();
  const update = {
    approval_status: parsed.data.status,
    approval_reason:
      parsed.data.status === "approved" ? null : parsed.data.reason || null,
    approved_at: parsed.data.status === "approved" ? now : null,
    rejected_at: parsed.data.status === "rejected" ? now : null,
    suspended_at: parsed.data.status === "suspended" ? now : null,
  };
  const { error } = await session.supabase
    .from("profiles")
    .update(update)
    .eq("id", parsed.data.creatorId)
    .eq("type", "creator");
  if (error) {
    return { success: false, message: "The creator status could not be updated." };
  }

  revalidatePath("/admin/creators");
  revalidatePath("/marketplace");
  return {
    success: true,
    message: `Creator ${parsed.data.status}.`,
  };
}
