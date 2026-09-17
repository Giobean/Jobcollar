import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="h-8 w-8 rounded-lg bg-blue-600" />
        <span className="text-xl font-bold text-white">JobCollar</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
