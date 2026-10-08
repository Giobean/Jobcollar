import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, PackageOpen, ShieldCheck, UsersRound } from "lucide-react";
import { AdminReviewActions } from "@/components/admin-review-actions";
import { getAdminSession } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Creator Review Queue" };

export default async function AdminCreatorsPage() {
  const session = await getAdminSession();
  if (!session.authorized) {
    return (
      <main id="main-content" className="admin-denied">
        <span aria-hidden="true"><LockKeyhole /></span>
        <p className="kicker">Restricted area</p>
        <h1>Administrator access required</h1>
        <p>Creator review tools are available only to authorized administrators.</p>
        <Link className="button button-dark" href="/">Return to marketplace</Link>
      </main>
    );
  }

  const { data: creators } = await session.supabase
    .from("profiles")
    .select(
      "id,name,username,content_category,followers,average_views,approval_submitted_at,approval_status",
    )
    .eq("type", "creator")
    .order("approval_submitted_at", { ascending: true, nullsFirst: false });

  return (
    <main id="main-content" className="admin-page">
      <header className="admin-header">
        <Link className="brand" href="/">
          <span className="brand-mark"><PackageOpen /></span>
          Creator<span>AdSpace</span>
        </Link>
        <nav aria-label="Admin navigation">
          <Link className="active" href="/admin/creators"><UsersRound /> Creators</Link>
          <Link href="/admin/creators?status=pending"><ShieldCheck /> Review Queue</Link>
        </nav>
        <span className="admin-identity">Admin</span>
      </header>
      <section className="admin-content">
        <div className="admin-title">
          <div><p className="kicker">Marketplace quality</p><h1>Creator review queue</h1><p>Review complete creator profiles before their inventory becomes public.</p></div>
          <span>{creators?.filter(({ approval_status }) => approval_status === "pending").length ?? 0} pending</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">Creator applications and moderation controls</caption>
            <thead><tr><th scope="col">Creator</th><th scope="col">Category</th><th scope="col">Followers</th><th scope="col">Avg. views</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {creators?.map((creator) => (
                <tr key={creator.id}>
                  <th scope="row"><span className="avatar">{creator.name.split(" ").map((part: string) => part[0]).join("")}</span><span><strong>{creator.name}</strong>@{creator.username}</span></th>
                  <td>{creator.content_category || "Not provided"}</td>
                  <td>{Number(creator.followers).toLocaleString()}</td>
                  <td>{Number(creator.average_views).toLocaleString()}</td>
                  <td>{creator.approval_submitted_at ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(creator.approval_submitted_at)) : "Not submitted"}</td>
                  <td><ApprovalBadge status={creator.approval_status} /></td>
                  <td><AdminReviewActions creatorId={creator.id} /></td>
                </tr>
              ))}
              {!creators?.length && <tr><td className="admin-empty" colSpan={7}>No creator applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    approved: "✓ Approved",
    pending: "◷ Under review",
    rejected: "! Changes needed",
    suspended: "× Suspended",
  };
  return <span className={`moderation-badge moderation-${status}`}>{labels[status] ?? status}</span>;
}
