"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();

  if (!email) throw new Error("Email is required");

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("Email already taken");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, email },
  });

  redirect("/settings");
}

export async function updatePassword(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword) {
    throw new Error("All fields are required");
  }

  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  if (!user.password) {
    throw new Error("Account has no password set");
  }

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) throw new Error("Current password is incorrect");

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  redirect("/settings");
}

export async function deleteAccount() {
  const user = await getSession();
  if (!user) redirect("/login");

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
