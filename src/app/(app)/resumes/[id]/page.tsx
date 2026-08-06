import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ResumeBuilder from "@/components/ResumeBuilder";

export default async function ResumeBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      personal: true,
      summary: true,
      entries: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!resume || resume.userId !== user.id) {
    notFound();
  }

  const personal = resume.personal || {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
    jobTitle: "",
  };

  const entries = resume.entries.map((e) => ({
    id: e.id,
    section: e.section,
    data: JSON.parse(e.data) as Record<string, string>,
  }));

  return (
    <ResumeBuilder
      resumeId={resume.id}
      initialTitle={resume.title}
      initialTemplate={resume.template}
      initialColor={resume.color}
      initialPersonal={{
        firstName: personal.firstName,
        lastName: personal.lastName,
        email: personal.email,
        phone: personal.phone,
        location: personal.location,
        website: personal.website,
        linkedin: personal.linkedin,
        github: personal.github,
        jobTitle: personal.jobTitle,
      }}
      initialSummary={resume.summary?.content || ""}
      initialEntries={entries}
    />
  );
}
