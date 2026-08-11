import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <SettingsClient
      userName={user.name || ""}
      userEmail={user.email}
    />
  );
}
