import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createResume, deleteResume } from "@/app/actions/resume";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const totalResumes = resumes.length;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentResumes = resumes.filter((r) => r.updatedAt > sevenDaysAgo).length;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, {user.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your resumes and track your progress
          </p>
        </div>
        <form action={createResume}>
          <input type="hidden" name="title" value="Untitled Resume" />
          <input type="hidden" name="template" value="minimal" />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create New Resume
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-gray-400 mb-1">Total Resumes</p>
          <p className="text-3xl font-bold">{totalResumes}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-gray-400 mb-1">Updated Recently</p>
          <p className="text-3xl font-bold">{recentResumes}</p>
        </div>
      </div>

      {/* Resumes grid */}
      {resumes.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2">No resumes yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create your first resume to get started. Our builder makes it easy
            to create a professional resume in minutes.
          </p>
          <form action={createResume} className="inline-block">
            <input type="hidden" name="title" value="My First Resume" />
            <input type="hidden" name="template" value="minimal" />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20"
            >
              Create Your First Resume
            </button>
          </form>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {resume.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {resume.template} template
                  </p>
                </div>
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: resume.color }}
                />
              </div>

              {/* Mini preview placeholder */}
              <div className="rounded-lg bg-white/5 p-3 mb-4 aspect-[3/2]">
                <div className="h-2 w-16 bg-white/10 rounded mb-1" />
                <div className="h-1.5 w-12 bg-white/5 rounded mb-3" />
                <div className="space-y-1">
                  <div className="h-1 w-full bg-white/5 rounded" />
                  <div className="h-1 w-4/5 bg-white/5 rounded" />
                  <div className="h-1 w-full bg-white/5 rounded" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {timeAgo(resume.updatedAt)}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/resumes/${resume.id}`}
                    className="rounded-lg bg-blue-600/15 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-600/25 transition-all"
                  >
                    Edit
                  </Link>
                  <form action={deleteResume}>
                    <input type="hidden" name="id" value={resume.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-red-600/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/20 transition-all"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
