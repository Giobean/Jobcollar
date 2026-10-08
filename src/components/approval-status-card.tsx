"use client";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Send,
} from "lucide-react";
import { useActionState } from "react";
import {
  submitForReview,
  type ReviewSubmissionState,
} from "@/app/dashboard/actions";
import type { CreatorApprovalStatus } from "@/lib/data";

type Props = {
  status: CreatorApprovalStatus;
  submitted: boolean;
  reason?: string | null;
  missingFields: string[];
};

const initialState: ReviewSubmissionState = { success: false, message: "" };

export function ApprovalStatusCard({
  status,
  submitted,
  reason,
  missingFields,
}: Props) {
  const [state, action, pending] = useActionState(submitForReview, initialState);
  const isDraft = status === "pending" && !submitted;
  const canSubmit =
    (isDraft || status === "rejected") && missingFields.length === 0;

  const content =
    status === "approved"
      ? {
          icon: CheckCircle2,
          label: "✓ Approved",
          title: "You’re approved to sell Ad Space.",
          description:
            "Your eligible listings can appear publicly and accept purchases.",
          tone: "approved",
        }
      : status === "rejected"
        ? {
            icon: AlertTriangle,
            label: "! Changes needed",
            title: "Your creator profile needs changes.",
            description:
              reason ||
              "Review your profile details, make the requested changes, and submit again.",
            tone: "rejected",
          }
        : status === "suspended"
          ? {
              icon: Ban,
              label: "× Suspended",
              title: "Your creator account is currently suspended.",
              description:
                reason ||
                "Your inventory is private. Contact support if you need help.",
              tone: "suspended",
            }
          : {
              icon: Clock3,
              label: isDraft ? "◷ Ready to submit" : "◷ Under review",
              title: isDraft
                ? "Your profile is ready for review."
                : "Your creator profile is under review.",
              description:
                "Build your profile and Ad Spaces while we review your account. Your listings will become available to advertisers once you’re approved.",
              tone: "pending",
            };
  const Icon = content.icon;

  return (
    <section
      className={`approval-card approval-${content.tone}`}
      aria-labelledby="approval-title"
    >
      <span className="approval-icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="approval-copy">
        <span className="approval-badge">{content.label}</span>
        <h2 id="approval-title">{content.title}</h2>
        <p>{content.description}</p>
        {(isDraft || status === "rejected") && missingFields.length > 0 && (
          <div className="profile-requirements" role="note">
            <strong>Complete these profile details first:</strong>
            <ul>
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        )}
        {state.message && (
          <p
            className={state.success ? "action-success" : "action-error"}
            role="status"
            aria-live="polite"
          >
            {state.message}
          </p>
        )}
      </div>
      {canSubmit && (
        <form action={action}>
          <button className="button button-dark" type="submit" disabled={pending}>
            <Send aria-hidden="true" />
            {pending ? "Submitting…" : "Submit for Review"}
          </button>
        </form>
      )}
    </section>
  );
}
