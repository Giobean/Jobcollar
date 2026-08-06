"use client";

type PersonalData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  jobTitle: string;
};

type EntryData = {
  id: string;
  section: string;
  data: Record<string, string>;
};

type ResumeData = {
  personal: PersonalData;
  summary: string;
  entries: EntryData[];
  template: string;
  color: string;
};

function hasContactInfo(p: PersonalData) {
  return p.email || p.phone || p.location || p.website || p.linkedin || p.github;
}

function MinimalTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries } = data;
  const experiences = entries.filter((e) => e.section === "experience");
  const educations = entries.filter((e) => e.section === "education");
  const skills = entries.filter((e) => e.section === "skills");
  const fullName = `${p.firstName} ${p.lastName}`.trim();

  return (
    <div className="p-8 text-gray-800 text-[11px] leading-relaxed">
      {/* Header */}
      <div className="mb-5">
        {fullName && (
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {fullName}
          </h1>
        )}
        {p.jobTitle && (
          <p className="text-sm text-gray-500 mt-0.5">{p.jobTitle}</p>
        )}
        {hasContactInfo(p) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[10px] text-gray-500">
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.location && <span>{p.location}</span>}
            {p.website && <span>{p.website}</span>}
            {p.linkedin && <span>{p.linkedin}</span>}
            {p.github && <span>{p.github}</span>}
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1.5 pb-1 border-b border-gray-200">
            Summary
          </h2>
          <p className="text-gray-600 whitespace-pre-line">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1.5 pb-1 border-b border-gray-200">
            Experience
          </h2>
          <div className="space-y-3">
            {experiences.map((entry) => (
              <div key={entry.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {entry.data.position || "Position"}
                    </p>
                    <p className="text-gray-500">
                      {entry.data.company}
                      {entry.data.location ? ` · ${entry.data.location}` : ""}
                    </p>
                  </div>
                  <p className="text-gray-400 text-[10px] whitespace-nowrap ml-2">
                    {entry.data.startDate}
                    {entry.data.startDate && " – "}
                    {entry.data.current === "true"
                      ? "Present"
                      : entry.data.endDate}
                  </p>
                </div>
                {entry.data.description && (
                  <p className="mt-1 text-gray-600 whitespace-pre-line">
                    {entry.data.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1.5 pb-1 border-b border-gray-200">
            Education
          </h2>
          <div className="space-y-3">
            {educations.map((entry) => (
              <div key={entry.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {entry.data.institution || "Institution"}
                    </p>
                    <p className="text-gray-500">
                      {entry.data.degree}
                      {entry.data.field ? ` in ${entry.data.field}` : ""}
                      {entry.data.gpa ? ` · GPA: ${entry.data.gpa}` : ""}
                    </p>
                  </div>
                  <p className="text-gray-400 text-[10px] whitespace-nowrap ml-2">
                    {entry.data.startDate}
                    {entry.data.startDate && " – "}
                    {entry.data.endDate}
                  </p>
                </div>
                {entry.data.description && (
                  <p className="mt-1 text-gray-600 whitespace-pre-line">
                    {entry.data.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1.5 pb-1 border-b border-gray-200">
            Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((entry) => (
              <span
                key={entry.id}
                className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px]"
              >
                {entry.data.name}
                {entry.data.level && entry.data.level !== "none"
                  ? ` · ${entry.data.level}`
                  : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfessionalTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries, color } = data;
  const experiences = entries.filter((e) => e.section === "experience");
  const educations = entries.filter((e) => e.section === "education");
  const skills = entries.filter((e) => e.section === "skills");
  const fullName = `${p.firstName} ${p.lastName}`.trim();

  return (
    <div className="p-8 text-gray-800 text-[11px] leading-relaxed">
      {/* Header */}
      <div className="mb-6 pb-4 border-b-2" style={{ borderColor: color }}>
        {fullName && (
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
        )}
        {p.jobTitle && (
          <p className="text-sm mt-0.5" style={{ color }}>
            {p.jobTitle}
          </p>
        )}
        {hasContactInfo(p) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[10px] text-gray-500">
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.location && <span>{p.location}</span>}
            {p.website && <span>{p.website}</span>}
            {p.linkedin && <span>{p.linkedin}</span>}
            {p.github && <span>{p.github}</span>}
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-1.5 pl-3 border-l-3"
            style={{ color, borderColor: color }}
          >
            Professional Summary
          </h2>
          <p className="text-gray-600 pl-3 whitespace-pre-line">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <div className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-2 pl-3 border-l-3"
            style={{ color, borderColor: color }}
          >
            Work Experience
          </h2>
          <div className="space-y-3 pl-3">
            {experiences.map((entry) => (
              <div key={entry.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {entry.data.position}
                    </p>
                    <p style={{ color }}>
                      {entry.data.company}
                      {entry.data.location ? `, ${entry.data.location}` : ""}
                    </p>
                  </div>
                  <p className="text-gray-400 text-[10px] whitespace-nowrap ml-2">
                    {entry.data.startDate}
                    {entry.data.startDate && " – "}
                    {entry.data.current === "true"
                      ? "Present"
                      : entry.data.endDate}
                  </p>
                </div>
                {entry.data.description && (
                  <p className="mt-1 text-gray-600 whitespace-pre-line">
                    {entry.data.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <div className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-2 pl-3 border-l-3"
            style={{ color, borderColor: color }}
          >
            Education
          </h2>
          <div className="space-y-3 pl-3">
            {educations.map((entry) => (
              <div key={entry.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {entry.data.degree}
                      {entry.data.field ? ` in ${entry.data.field}` : ""}
                    </p>
                    <p style={{ color }}>{entry.data.institution}</p>
                  </div>
                  <p className="text-gray-400 text-[10px] whitespace-nowrap ml-2">
                    {entry.data.startDate}
                    {entry.data.startDate && " – "}
                    {entry.data.endDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-2 pl-3 border-l-3"
            style={{ color, borderColor: color }}
          >
            Skills
          </h2>
          <div className="flex flex-wrap gap-1.5 pl-3">
            {skills.map((entry) => (
              <span
                key={entry.id}
                className="inline-block px-2 py-0.5 rounded text-[10px] text-white"
                style={{ backgroundColor: color }}
              >
                {entry.data.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModernTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries, color } = data;
  const experiences = entries.filter((e) => e.section === "experience");
  const educations = entries.filter((e) => e.section === "education");
  const skills = entries.filter((e) => e.section === "skills");
  const fullName = `${p.firstName} ${p.lastName}`.trim();

  return (
    <div className="text-gray-800 text-[11px] leading-relaxed">
      {/* Header */}
      <div
        className="p-8 pb-5 text-center text-white"
        style={{ backgroundColor: color }}
      >
        {fullName && (
          <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
        )}
        {p.jobTitle && (
          <p className="text-sm mt-0.5 opacity-90">{p.jobTitle}</p>
        )}
        {hasContactInfo(p) && (
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 mt-3 text-[10px] opacity-80">
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.location && <span>{p.location}</span>}
            {p.website && <span>{p.website}</span>}
            {p.linkedin && <span>{p.linkedin}</span>}
            {p.github && <span>{p.github}</span>}
          </div>
        )}
      </div>

      <div className="p-8 pt-5">
        {/* Summary */}
        {summary && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1.5 text-center">
              <span
                className="inline-block px-3 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                About Me
              </span>
            </h2>
            <p className="text-gray-600 text-center mt-2 whitespace-pre-line">
              {summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 text-center">
              <span
                className="inline-block px-3 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                Experience
              </span>
            </h2>
            <div className="space-y-3 mt-2">
              {experiences.map((entry) => (
                <div key={entry.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {entry.data.position}
                      </p>
                      <p className="text-gray-500">
                        {entry.data.company}
                        {entry.data.location
                          ? ` · ${entry.data.location}`
                          : ""}
                      </p>
                    </div>
                    <p className="text-gray-400 text-[10px] whitespace-nowrap ml-2">
                      {entry.data.startDate}
                      {entry.data.startDate && " – "}
                      {entry.data.current === "true"
                        ? "Present"
                        : entry.data.endDate}
                    </p>
                  </div>
                  {entry.data.description && (
                    <p className="mt-1 text-gray-600 whitespace-pre-line">
                      {entry.data.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 text-center">
              <span
                className="inline-block px-3 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                Education
              </span>
            </h2>
            <div className="space-y-3 mt-2">
              {educations.map((entry) => (
                <div key={entry.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {entry.data.institution}
                      </p>
                      <p className="text-gray-500">
                        {entry.data.degree}
                        {entry.data.field ? ` in ${entry.data.field}` : ""}
                        {entry.data.gpa ? ` · GPA: ${entry.data.gpa}` : ""}
                      </p>
                    </div>
                    <p className="text-gray-400 text-[10px] whitespace-nowrap ml-2">
                      {entry.data.startDate}
                      {entry.data.startDate && " – "}
                      {entry.data.endDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 text-center">
              <span
                className="inline-block px-3 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                Skills
              </span>
            </h2>
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {skills.map((entry) => (
                <span
                  key={entry.id}
                  className="inline-block border px-2 py-0.5 rounded-full text-[10px]"
                  style={{ borderColor: color, color }}
                >
                  {entry.data.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResumePreview({ data }: { data: ResumeData }) {
  switch (data.template) {
    case "professional":
      return <ProfessionalTemplate data={data} />;
    case "modern":
      return <ModernTemplate data={data} />;
    default:
      return <MinimalTemplate data={data} />;
  }
}
