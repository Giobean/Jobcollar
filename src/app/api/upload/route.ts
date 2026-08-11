import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  let text = "";

  try {
    if (name.endsWith(".txt")) {
      text = await file.text();
    } else if (name.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdf = await pdfParse(buffer);
      text = pdf.text;
    } else if (name.endsWith(".docx")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to parse file. Please try a different format." },
      { status: 422 },
    );
  }

  const parsed = parseResumeText(text);

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      title: parsed.name || "Imported Resume",
      template: "minimal",
    },
  });

  await prisma.resumePersonal.create({
    data: {
      resumeId: resume.id,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      location: parsed.location,
      jobTitle: parsed.jobTitle,
    },
  });

  await prisma.resumeSummary.create({
    data: {
      resumeId: resume.id,
      content: parsed.summary,
    },
  });

  let sortOrder = 0;

  for (const exp of parsed.experiences) {
    await prisma.resumeEntry.create({
      data: {
        resumeId: resume.id,
        section: "experience",
        data: JSON.stringify(exp),
        sortOrder: sortOrder++,
      },
    });
  }

  for (const edu of parsed.educations) {
    await prisma.resumeEntry.create({
      data: {
        resumeId: resume.id,
        section: "education",
        data: JSON.stringify(edu),
        sortOrder: sortOrder++,
      },
    });
  }

  for (const skill of parsed.skills) {
    await prisma.resumeEntry.create({
      data: {
        resumeId: resume.id,
        section: "skills",
        data: JSON.stringify({ name: skill, level: "none" }),
        sortOrder: sortOrder++,
      },
    });
  }

  return NextResponse.json({ id: resume.id });
}

// ── Heuristic resume parser ──

interface ParsedResume {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  summary: string;
  experiences: Record<string, string>[];
  educations: Record<string, string>[];
  skills: string[];
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
const DATE_RE = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?\d{4}/i;
const DATE_RANGE_RE = new RegExp(`(${DATE_RE.source})\\s*[-–—]\\s*(${DATE_RE.source}|[Pp]resent|[Cc]urrent)`, "i");

const SECTION_HEADERS_RE = /^(professional\s+summary|summary|objective|profile|about\s+me|experience|work\s+history|work\s+experience|employment|professional\s+experience|education|academic|qualifications|skills|technical\s+skills|core\s+competencies|expertise|certifications?|projects?|languages?|awards?|honors?|publications?|references?)$/i;

const DEGREE_RE = /\b(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|M\.?B\.?A\.?|Ph\.?D\.?|Bachelor|Master|Doctor|Associate|Diploma)\b/i;

function parseResumeText(text: string): ParsedResume {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const result: ParsedResume = {
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    jobTitle: "",
    summary: "",
    experiences: [],
    educations: [],
    skills: [],
  };

  // Extract email
  for (const line of lines) {
    const emailMatch = line.match(EMAIL_RE);
    if (emailMatch) {
      result.email = emailMatch[0];
      break;
    }
  }

  // Extract phone
  for (const line of lines) {
    const phoneMatch = line.match(PHONE_RE);
    if (phoneMatch) {
      result.phone = phoneMatch[0].trim();
      break;
    }
  }

  // First non-empty, non-contact line is likely the name
  for (const line of lines) {
    if (
      !EMAIL_RE.test(line) &&
      !PHONE_RE.test(line) &&
      !SECTION_HEADERS_RE.test(line) &&
      line.length < 60 &&
      line.length > 1
    ) {
      result.name = line;
      const parts = line.split(/\s+/);
      result.firstName = parts[0] || "";
      result.lastName = parts.slice(1).join(" ") || "";
      break;
    }
  }

  // Split text into sections
  const sections: { header: string; content: string[] }[] = [];
  let currentSection: { header: string; content: string[] } | null = null;

  for (const line of lines) {
    const cleaned = line.replace(/[:\-_=]+$/, "").trim();
    if (SECTION_HEADERS_RE.test(cleaned)) {
      if (currentSection) sections.push(currentSection);
      currentSection = { header: cleaned.toLowerCase(), content: [] };
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }
  if (currentSection) sections.push(currentSection);

  for (const section of sections) {
    const h = section.header;
    const content = section.content;

    if (/summary|objective|profile|about/i.test(h)) {
      result.summary = content.join("\n").trim();
    } else if (/experience|work|employment/i.test(h)) {
      result.experiences = parseExperiences(content);
    } else if (/education|academic|qualifications/i.test(h)) {
      result.educations = parseEducations(content);
    } else if (/skills|competencies|expertise/i.test(h)) {
      result.skills = parseSkills(content);
    }
  }

  return result;
}

function parseExperiences(lines: string[]): Record<string, string>[] {
  const entries: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;
  const descLines: string[] = [];

  function flush() {
    if (current) {
      current.description = descLines.join("\n").trim();
      entries.push(current);
      descLines.length = 0;
    }
  }

  for (const line of lines) {
    const dateMatch = line.match(DATE_RANGE_RE);
    if (dateMatch) {
      flush();
      const cleaned = line.replace(DATE_RANGE_RE, "").replace(/[|,·\-–—]+$/, "").trim();
      const startDate = dateMatch[1] || "";
      const endDate = dateMatch[2] || "";
      const isCurrent = /present|current/i.test(endDate);
      current = {
        company: "",
        position: cleaned || "",
        location: "",
        startDate,
        endDate: isCurrent ? "" : endDate,
        current: isCurrent ? "true" : "false",
        description: "",
      };
    } else if (current) {
      if (!current.company && !current.position) {
        current.position = line;
      } else if (!current.company) {
        current.company = line;
      } else {
        descLines.push(line);
      }
    }
  }
  flush();

  return entries;
}

function parseEducations(lines: string[]): Record<string, string>[] {
  const entries: Record<string, string>[] = [];
  let current: Record<string, string> | null = null;

  function flush() {
    if (current) entries.push(current);
  }

  for (const line of lines) {
    const degreeMatch = line.match(DEGREE_RE);
    const dateMatch = line.match(DATE_RANGE_RE) || line.match(DATE_RE);

    if (degreeMatch || (dateMatch && !current)) {
      flush();
      const degree = degreeMatch ? degreeMatch[0] : "";
      const rest = line
        .replace(DEGREE_RE, "")
        .replace(DATE_RANGE_RE, "")
        .replace(DATE_RE, "")
        .replace(/[|,·\-–—]+/g, " ")
        .trim();

      let startDate = "";
      let endDate = "";
      const rangeMatch = line.match(DATE_RANGE_RE);
      if (rangeMatch) {
        startDate = rangeMatch[1] || "";
        endDate = rangeMatch[2] || "";
      } else if (dateMatch) {
        endDate = dateMatch[0] || "";
      }

      const fieldMatch = rest.match(/\bin\s+(.+)/i);
      const field = fieldMatch ? fieldMatch[1].trim() : "";
      const institution = rest.replace(/\bin\s+.*/i, "").trim();

      current = {
        institution,
        degree,
        field,
        startDate,
        endDate,
        gpa: "",
        description: "",
      };
    } else if (current) {
      const gpaMatch = line.match(/GPA[:\s]*([0-9.]+)/i);
      if (gpaMatch) {
        current.gpa = gpaMatch[1];
      } else if (!current.institution) {
        current.institution = line;
      }
    }
  }
  flush();

  return entries;
}

function parseSkills(lines: string[]): string[] {
  const skills: string[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;•·|/]+/).map((s) => s.replace(/^[-–—*●○►▪▸\s]+/, "").trim()).filter(Boolean);
    skills.push(...parts);
  }
  return [...new Set(skills)].slice(0, 30);
}
