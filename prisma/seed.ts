import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("password", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@jobcollar.com" },
    update: {},
    create: {
      name: "Alex Johnson",
      email: "demo@jobcollar.com",
      password: hashedPassword,
    },
  });

  console.log("Created demo user:", user.email);

  const existingResumes = await prisma.resume.findMany({
    where: { userId: user.id },
  });

  if (existingResumes.length > 0) {
    console.log("Demo resume already exists, skipping...");
    return;
  }

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      title: "Software Engineer Resume",
      template: "professional",
      color: "#2563eb",
    },
  });

  await prisma.resumePersonal.create({
    data: {
      resumeId: resume.id,
      firstName: "Alex",
      lastName: "Johnson",
      email: "alex.johnson@email.com",
      phone: "+1 (555) 987-6543",
      location: "San Francisco, CA",
      website: "alexjohnson.dev",
      linkedin: "linkedin.com/in/alexjohnson",
      github: "github.com/alexjohnson",
      jobTitle: "Senior Software Engineer",
    },
  });

  await prisma.resumeSummary.create({
    data: {
      resumeId: resume.id,
      content:
        "Senior Software Engineer with 6+ years of experience building scalable web applications and distributed systems. Passionate about clean code, developer experience, and shipping products that users love. Proven track record of leading cross-functional teams and delivering high-impact features at scale.",
    },
  });

  const experiences = [
    {
      company: "Google",
      position: "Senior Software Engineer",
      location: "Mountain View, CA",
      startDate: "Mar 2022",
      endDate: "",
      current: "true",
      description:
        "Lead development of cloud-native microservices serving 10M+ daily active users. Architected a real-time data pipeline reducing latency by 40%. Mentored 4 junior engineers and led technical design reviews.",
    },
    {
      company: "Stripe",
      position: "Software Engineer",
      location: "San Francisco, CA",
      startDate: "Jun 2019",
      endDate: "Feb 2022",
      current: "false",
      description:
        "Built and maintained payment processing APIs handling $2B+ in annual transaction volume. Implemented fraud detection system that reduced chargebacks by 25%. Contributed to open-source Stripe SDK.",
    },
    {
      company: "Airbnb",
      position: "Junior Software Engineer",
      location: "San Francisco, CA",
      startDate: "Aug 2017",
      endDate: "May 2019",
      current: "false",
      description:
        "Developed front-end components for the search and booking flow using React and TypeScript. Improved page load performance by 30% through code splitting and lazy loading.",
    },
  ];

  for (let i = 0; i < experiences.length; i++) {
    await prisma.resumeEntry.create({
      data: {
        resumeId: resume.id,
        section: "experience",
        data: JSON.stringify(experiences[i]),
        sortOrder: i,
      },
    });
  }

  const educations = [
    {
      institution: "Stanford University",
      degree: "Master of Science",
      field: "Computer Science",
      startDate: "Sep 2015",
      endDate: "Jun 2017",
      gpa: "3.9",
      description: "Focus on distributed systems and machine learning.",
    },
    {
      institution: "UC Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "Sep 2011",
      endDate: "Jun 2015",
      gpa: "3.7",
      description: "Dean's List. Teaching assistant for Data Structures.",
    },
  ];

  for (let i = 0; i < educations.length; i++) {
    await prisma.resumeEntry.create({
      data: {
        resumeId: resume.id,
        section: "education",
        data: JSON.stringify(educations[i]),
        sortOrder: i,
      },
    });
  }

  const skills = [
    { name: "TypeScript", level: "Expert" },
    { name: "React", level: "Expert" },
    { name: "Node.js", level: "Advanced" },
    { name: "Python", level: "Advanced" },
    { name: "PostgreSQL", level: "Advanced" },
    { name: "AWS", level: "Intermediate" },
  ];

  for (let i = 0; i < skills.length; i++) {
    await prisma.resumeEntry.create({
      data: {
        resumeId: resume.id,
        section: "skills",
        data: JSON.stringify(skills[i]),
        sortOrder: i,
      },
    });
  }

  console.log("Seeded demo resume:", resume.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
