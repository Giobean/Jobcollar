import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobCollar - Skilled trade jobs that are hard to automate",
  description:
    "JobCollar aggregates real public jobs for skilled trades, blue-collar work, healthcare, logistics, and AI-resilient careers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
