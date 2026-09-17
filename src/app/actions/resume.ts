"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function createResume(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string) || "Untitled Resume";
  const template = (formData.get("template") as string) || "minimal";

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      title,
      template,
    },
  });

  await prisma.resumePersonal.create({
    data: { resumeId: resume.id },
  });

  await prisma.resumeSummary.create({
    data: { resumeId: resume.id },
  });

  redirect(`/resumes/${resume.id}`);
}

export async function deleteResume(formData: FormData) {
  const user = await getSession();
  if (!user) redirect("/login");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Resume ID is required");

  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.userId !== user.id) {
    throw new Error("Resume not found");
  }

  await prisma.resume.delete({ where: { id } });
  redirect("/dashboard");
}
