"use client";

import { Ban, Check, X } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import {
  moderateCreator,
  type ModerationState,
} from "@/app/admin/creators/actions";

const initialState: ModerationState = { success: false, message: "" };

export function AdminReviewActions({ creatorId }: { creatorId: string }) {
  const [state, action, pending] = useActionState(moderateCreator, initialState);
  const rejectDialog = useRef<HTMLDialogElement>(null);
  const suspendDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (state.success) {
      rejectDialog.current?.close();
      suspendDialog.current?.close();
    }
  }, [state]);

  return (
    <div className="admin-actions">
      <form action={action}>
        <input type="hidden" name="creatorId" value={creatorId} />
        <input type="hidden" name="status" value="approved" />
        <button
          className="admin-action admin-approve"
          type="submit"
          disabled={pending}
          aria-label="Approve creator"
        >
          <Check aria-hidden="true" /> Approve
        </button>
      </form>
      <button
        className="admin-action"
        type="button"
        onClick={() => rejectDialog.current?.showModal()}
      >
        <X aria-hidden="true" /> Reject
      </button>
      <button
        className="admin-action"
        type="button"
        onClick={() => suspendDialog.current?.showModal()}
      >
        <Ban aria-hidden="true" /> Suspend
      </button>

      <ReasonDialog
        dialogRef={rejectDialog}
        creatorId={creatorId}
        status="rejected"
        title="Request profile changes"
        action={action}
        pending={pending}
      />
      <ReasonDialog
        dialogRef={suspendDialog}
        creatorId={creatorId}
        status="suspended"
        title="Suspend creator"
        action={action}
        pending={pending}
      />
      {state.message && (
        <span
          className={state.success ? "action-success" : "action-error"}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </span>
      )}
    </div>
  );
}

function ReasonDialog({
  dialogRef,
  creatorId,
  status,
  title,
  action,
  pending,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  creatorId: string;
  status: "rejected" | "suspended";
  title: string;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <dialog className="moderation-dialog" ref={dialogRef}>
      <form action={action}>
        <input type="hidden" name="creatorId" value={creatorId} />
        <input type="hidden" name="status" value={status} />
        <div className="dialog-heading">
          <h2>{title}</h2>
          <button
            type="button"
            aria-label={`Close ${title} dialog`}
            onClick={() => dialogRef.current?.close()}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <label htmlFor={`${status}-reason-${creatorId}`}>
          Reason <span>Optional</span>
        </label>
        <textarea
          id={`${status}-reason-${creatorId}`}
          name="reason"
          maxLength={500}
          rows={5}
          placeholder="Share a clear, actionable explanation with the creator."
        />
        <p>This explanation is visible only to the creator and administrators.</p>
        <div className="dialog-actions">
          <button
            className="button button-light"
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </button>
          <button className="button button-dark" type="submit" disabled={pending}>
            {pending ? "Saving…" : title}
          </button>
        </div>
      </form>
    </dialog>
  );
}
