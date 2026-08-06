import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
      <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-gray-400 text-sm mb-8">
        Sign in to continue building your resume
      </p>

      <form action={loginAction} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20"
        >
          Sign In
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
