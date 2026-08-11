"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";

type AuthResult = { error?: string };

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists" };
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        updatedAt: new Date(),
      },
    });

    await createSession(user.id);
  } catch (e) {
    console.error("Register error:", e);
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/dashboard");
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return { error: "Invalid email or password" };
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return { error: "Invalid email or password" };
    }

    await createSession(user.id);
  } catch (e) {
    console.error("Login error:", e);
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
