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
  const session = await getSession();
  if (!session) redirect("/login");

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();

  if (!email) throw new Error("Email is required");

  if (email !== session.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("Email already taken");
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { name, email, updatedAt: new Date() },
  });

  redirect("/settings");
}

export async function updatePassword(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

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

  const dbUser = await prisma.user.findUnique({ where: { id: session.id } });
  if (!dbUser || !dbUser.password) {
    throw new Error("Account not found");
  }

  const valid = await verifyPassword(currentPassword, dbUser.password);
  if (!valid) throw new Error("Current password is incorrect");

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.id },
    data: { password: hashed, updatedAt: new Date() },
  });

  redirect("/settings");
}

export async function deleteAccount() {
  const session = await getSession();
  if (!session) redirect("/login");

  await prisma.user.delete({ where: { id: session.id } });
  await destroySession();
  redirect("/");
}
