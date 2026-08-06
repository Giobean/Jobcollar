"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function verifyOwnership(resumeId: string) {
  const user = await getSession();
  if (!user) throw new Error("Not authenticated");

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.userId !== user.id) {
    throw new Error("Resume not found");
  }

  return resume;
}

export async function updatePersonal(
  resumeId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
    jobTitle?: string;
  }
) {
  await verifyOwnership(resumeId);

  await prisma.resumePersonal.upsert({
    where: { resumeId },
    update: data,
    create: { resumeId, ...data },
  });

  await prisma.resume.update({
    where: { id: resumeId },
    data: { updatedAt: new Date() },
  });
}

export async function updateSummary(resumeId: string, content: string) {
  await verifyOwnership(resumeId);

  await prisma.resumeSummary.upsert({
    where: { resumeId },
    update: { content },
    create: { resumeId, content },
  });

  await prisma.resume.update({
    where: { id: resumeId },
    data: { updatedAt: new Date() },
  });
}

export async function addEntry(
  resumeId: string,
  section: string,
  data: Record<string, string>
) {
  await verifyOwnership(resumeId);

  const count = await prisma.resumeEntry.count({
    where: { resumeId, section },
  });

  const entry = await prisma.resumeEntry.create({
    data: {
      resumeId,
      section,
      data: JSON.stringify(data),
      sortOrder: count,
    },
  });

  await prisma.resume.update({
    where: { id: resumeId },
    data: { updatedAt: new Date() },
  });

  return entry;
}

export async function updateEntry(
  entryId: string,
  data: Record<string, string>
) {
  const entry = await prisma.resumeEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error("Entry not found");

  await verifyOwnership(entry.resumeId);

  await prisma.resumeEntry.update({
    where: { id: entryId },
    data: { data: JSON.stringify(data) },
  });

  await prisma.resume.update({
    where: { id: entry.resumeId },
    data: { updatedAt: new Date() },
  });
}

export async function deleteEntry(entryId: string) {
  const entry = await prisma.resumeEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error("Entry not found");

  await verifyOwnership(entry.resumeId);

  await prisma.resumeEntry.delete({ where: { id: entryId } });

  await prisma.resume.update({
    where: { id: entry.resumeId },
    data: { updatedAt: new Date() },
  });
}

export async function updateResumeMeta(
  resumeId: string,
  data: { title?: string; template?: string; color?: string }
) {
  await verifyOwnership(resumeId);

  await prisma.resume.update({
    where: { id: resumeId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}
