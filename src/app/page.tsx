import Link from "next/link";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: "⚡",
    title: "Smart Builder",
    desc: "Step-by-step guided editor with real-time preview. Build your resume in minutes, not hours.",
  },
  {
    icon: "🎯",
    title: "ATS Optimized",
    desc: "Templates engineered to pass applicant tracking systems used by 99% of Fortune 500 companies.",
  },
  {
    icon: "🎨",
    title: "Multiple Templates",
    desc: "Professional designs for every industry — from tech startups to corporate finance.",
  },
  {
    icon: "📄",
    title: "Export Anywhere",
    desc: "Download as PDF, DOCX, or share with a unique link. Your resume, your way.",
  },
];

const templates = [
  { name: "Classic", users: "19M", accent: "border-t-gray-600" },
  { name: "Minimal", users: "12M", accent: "border-t-gray-400" },
  { name: "Professional", users: "6.7M", accent: "border-t-blue-500" },
  { name: "Modern", users: "4.6M", accent: "border-t-violet-500" },
  { name: "Corporate", users: "5.1M", accent: "border-t-slate-500" },
  { name: "Clean", users: "2.2M", accent: "border-t-emerald-500" },
];

function MiniResume({ accent }: { accent: string }) {
  return (
    <div
      className={`bg-white rounded-lg p-5 shadow-sm border-t-4 ${accent} w-full aspect-[210/280]`}
    >
      <div className="h-4 w-24 bg-gray-800 rounded mb-1" />
      <div className="h-2 w-16 bg-gray-300 rounded mb-4" />
      <div className="h-2 w-full bg-gray-200 rounded mb-1.5" />
      <div className="h-2 w-5/6 bg-gray-200 rounded mb-4" />
      <div className="h-2 w-12 bg-gray-400 rounded mb-2" />
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-gray-100 rounded" />
        <div className="h-2 w-4/5 bg-gray-100 rounded" />
        <div className="h-2 w-full bg-gray-100 rounded" />
      </div>
      <div className="h-2 w-12 bg-gray-400 rounded mb-2 mt-4" />
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-gray-100 rounded" />
        <div className="h-2 w-3/4 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#09090b] text-white min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                The resume builder that{" "}
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  gets you hired
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-400 leading-relaxed max-w-xl">
                Create a professional resume in minutes with our AI-powered
                builder. ATS-optimized templates that recruiters love.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                >
                  Create My Resume →
                </Link>
                <a
                  href="#templates"
                  className="rounded-xl border border-white/15 px-8 py-4 text-base font-semibold text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-200"
                >
                  See Templates
                </a>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-violet-600/20 rounded-2xl blur-2xl" />
                <div className="relative bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200" />
                    <div>
                      <div className="h-4 w-28 bg-gray-800 rounded mb-1" />
                      <div className="h-3 w-20 bg-gray-400 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="h-2 w-full bg-gray-200 rounded" />
                    <div className="h-2 w-5/6 bg-gray-200 rounded" />
                    <div className="h-2 w-4/5 bg-gray-200 rounded" />
                  </div>
                  <div className="border-t border-gray-100 pt-3 mb-3">
                    <div className="h-3 w-20 bg-blue-600 rounded mb-2" />
                    <div className="h-2 w-full bg-gray-100 rounded mb-1" />
                    <div className="h-2 w-3/4 bg-gray-100 rounded" />
                  </div>
                  <div className="border-t border-gray-100 pt-3 mb-3">
                    <div className="h-3 w-16 bg-blue-600 rounded mb-2" />
                    <div className="h-2 w-full bg-gray-100 rounded mb-1" />
                    <div className="h-2 w-5/6 bg-gray-100 rounded" />
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="h-3 w-12 bg-blue-600 rounded mb-2" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-blue-50 border border-blue-200 rounded-full" />
                      <div className="h-5 w-14 bg-blue-50 border border-blue-200 rounded-full" />
                      <div className="h-5 w-18 bg-blue-50 border border-blue-200 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Everything you need to land
              <br />
              <span className="text-gray-500">your dream job</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-8 hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Showcase */}
      <section id="templates" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Professional templates
              <br />
              <span className="text-gray-500">for every career</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((t) => (
              <div
                key={t.name}
                className="group cursor-pointer"
              >
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-white/20 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-300">
                  <MiniResume accent={t.accent} />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-semibold text-lg">{t.name}</h3>
                  <p className="text-sm text-gray-500">{t.users} users</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/templates"
              className="rounded-xl border border-white/15 px-8 py-4 text-base font-semibold text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-200 inline-block"
            >
              View All Templates →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-12 md:p-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Ready to build your resume?
            </h2>
            <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
              Join millions of professionals who trust JobCollar to create
              resumes that land interviews.
            </p>
            <Link
              href="/register"
              className="inline-block rounded-xl bg-white px-10 py-4 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-blue-600" />
            <span className="font-semibold text-sm">JobCollar</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2026 JobCollar. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
