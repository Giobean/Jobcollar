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

function splitEntries(entries: EntryData[]) {
  return {
    experiences: entries.filter((e) => e.section === "experience"),
    educations: entries.filter((e) => e.section === "education"),
    skills: entries.filter((e) => e.section === "skills"),
  };
}

function fullName(p: PersonalData) {
  return `${p.firstName} ${p.lastName}`.trim();
}

function dateRange(d: Record<string, string>) {
  const start = d.startDate || "";
  const end = d.current === "true" ? "Present" : d.endDate || "";
  if (!start && !end) return "";
  return `${start}${start && end ? " – " : ""}${end}`;
}

/* ─── 1. Minimal ─── */
function MinimalTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries } = data;
  const { experiences, educations, skills } = splitEntries(entries);
  const name = fullName(p);

  return (
    <div style={{ padding: 32, color: "#1f2937", fontSize: 11, lineHeight: 1.6 }}>
      <div style={{ marginBottom: 20 }}>
        {name && <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", margin: 0 }}>{name}</h1>}
        {p.jobTitle && <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{p.jobTitle}</p>}
        {hasContactInfo(p) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px", marginTop: 8, fontSize: 10, color: "#6b7280" }}>
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.location && <span>{p.location}</span>}
            {p.website && <span>{p.website}</span>}
            {p.linkedin && <span>{p.linkedin}</span>}
            {p.github && <span>{p.github}</span>}
          </div>
        )}
      </div>

      {summary && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid #e5e7eb" }}>Summary</h2>
          <p style={{ color: "#4b5563", whiteSpace: "pre-line" }}>{summary}</p>
        </div>
      )}

      {experiences.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid #e5e7eb" }}>Experience</h2>
          {experiences.map((entry) => (
            <div key={entry.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.position || "Position"}</p>
                  <p style={{ color: "#6b7280" }}>{entry.data.company}{entry.data.location ? ` · ${entry.data.location}` : ""}</p>
                </div>
                <p style={{ color: "#9ca3af", fontSize: 10, whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
              </div>
              {entry.data.description && <p style={{ marginTop: 4, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
            </div>
          ))}
        </div>
      )}

      {educations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid #e5e7eb" }}>Education</h2>
          {educations.map((entry) => (
            <div key={entry.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.institution || "Institution"}</p>
                  <p style={{ color: "#6b7280" }}>{entry.data.degree}{entry.data.field ? ` in ${entry.data.field}` : ""}{entry.data.gpa ? ` · GPA: ${entry.data.gpa}` : ""}</p>
                </div>
                <p style={{ color: "#9ca3af", fontSize: 10, whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
              </div>
              {entry.data.description && <p style={{ marginTop: 4, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid #e5e7eb" }}>Skills</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {skills.map((entry) => (
              <span key={entry.id} style={{ display: "inline-block", backgroundColor: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>
                {entry.data.name}{entry.data.level && entry.data.level !== "none" ? ` · ${entry.data.level}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 2. Professional ─── */
function ProfessionalTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries, color } = data;
  const { experiences, educations, skills } = splitEntries(entries);
  const name = fullName(p);

  const sectionHeading: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
    marginBottom: 6, paddingLeft: 12, borderLeft: `3px solid ${color}`, color,
  };

  return (
    <div style={{ padding: 32, color: "#1f2937", fontSize: 11, lineHeight: 1.6 }}>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${color}` }}>
        {name && <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>{name}</h1>}
        {p.jobTitle && <p style={{ fontSize: 13, marginTop: 2, color }}>{p.jobTitle}</p>}
        {hasContactInfo(p) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px", marginTop: 8, fontSize: 10, color: "#6b7280" }}>
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.location && <span>{p.location}</span>}
            {p.website && <span>{p.website}</span>}
            {p.linkedin && <span>{p.linkedin}</span>}
            {p.github && <span>{p.github}</span>}
          </div>
        )}
      </div>

      {summary && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionHeading}>Professional Summary</h2>
          <p style={{ color: "#4b5563", paddingLeft: 12, whiteSpace: "pre-line" }}>{summary}</p>
        </div>
      )}

      {experiences.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionHeading}>Work Experience</h2>
          <div style={{ paddingLeft: 12 }}>
            {experiences.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.position}</p>
                    <p style={{ color }}>{entry.data.company}{entry.data.location ? `, ${entry.data.location}` : ""}</p>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 10, whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
                </div>
                {entry.data.description && <p style={{ marginTop: 4, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {educations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionHeading}>Education</h2>
          <div style={{ paddingLeft: 12 }}>
            {educations.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.degree}{entry.data.field ? ` in ${entry.data.field}` : ""}</p>
                    <p style={{ color }}>{entry.data.institution}</p>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 10, whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h2 style={sectionHeading}>Skills</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 12 }}>
            {skills.map((entry) => (
              <span key={entry.id} style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, color: "#fff", backgroundColor: color }}>
                {entry.data.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 3. Modern ─── */
function ModernTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries, color } = data;
  const { experiences, educations, skills } = splitEntries(entries);
  const name = fullName(p);

  const badge: React.CSSProperties = {
    display: "inline-block", padding: "2px 12px", borderRadius: 999,
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
    color: "#fff", backgroundColor: color,
  };

  return (
    <div style={{ color: "#1f2937", fontSize: 11, lineHeight: 1.6 }}>
      <div style={{ padding: "32px 32px 20px", textAlign: "center", color: "#fff", backgroundColor: color }}>
        {name && <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>{name}</h1>}
        {p.jobTitle && <p style={{ fontSize: 13, marginTop: 2, opacity: 0.9 }}>{p.jobTitle}</p>}
        {hasContactInfo(p) && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 12px", marginTop: 12, fontSize: 10, opacity: 0.8 }}>
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.location && <span>{p.location}</span>}
            {p.website && <span>{p.website}</span>}
            {p.linkedin && <span>{p.linkedin}</span>}
            {p.github && <span>{p.github}</span>}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 32px 32px" }}>
        {summary && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}><span style={badge}>About Me</span></div>
            <p style={{ color: "#4b5563", textAlign: "center", whiteSpace: "pre-line" }}>{summary}</p>
          </div>
        )}

        {experiences.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}><span style={badge}>Experience</span></div>
            {experiences.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.position}</p>
                    <p style={{ color: "#6b7280" }}>{entry.data.company}{entry.data.location ? ` · ${entry.data.location}` : ""}</p>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 10, whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
                </div>
                {entry.data.description && <p style={{ marginTop: 4, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
              </div>
            ))}
          </div>
        )}

        {educations.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}><span style={badge}>Education</span></div>
            {educations.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.institution}</p>
                    <p style={{ color: "#6b7280" }}>{entry.data.degree}{entry.data.field ? ` in ${entry.data.field}` : ""}{entry.data.gpa ? ` · GPA: ${entry.data.gpa}` : ""}</p>
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: 10, whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 8 }}><span style={badge}>Skills</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
              {skills.map((entry) => (
                <span key={entry.id} style={{ display: "inline-block", border: `1px solid ${color}`, padding: "2px 8px", borderRadius: 999, fontSize: 10, color }}>
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

/* ─── 4. Classic ─── */
function ClassicTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries } = data;
  const { experiences, educations, skills } = splitEntries(entries);
  const name = fullName(p);

  const sectionHeader: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
    marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #374151", color: "#111827",
    fontFamily: "Georgia, 'Times New Roman', serif",
  };

  return (
    <div style={{ padding: 32, color: "#1f2937", fontSize: 11, lineHeight: 1.65, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        {name && <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "0.02em" }}>{name}</h1>}
        {hasContactInfo(p) && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 8px", marginTop: 6, fontSize: 10, color: "#6b7280" }}>
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>· {p.phone}</span>}
            {p.location && <span>· {p.location}</span>}
            {p.website && <span>· {p.website}</span>}
            {p.linkedin && <span>· {p.linkedin}</span>}
            {p.github && <span>· {p.github}</span>}
          </div>
        )}
      </div>

      {summary && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={sectionHeader}>Professional Summary</h2>
          <p style={{ color: "#374151", whiteSpace: "pre-line" }}>{summary}</p>
        </div>
      )}

      {experiences.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={sectionHeader}>Experience</h2>
          {experiences.map((entry) => (
            <div key={entry.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, color: "#111827" }}>{entry.data.company}{entry.data.location ? `, ${entry.data.location}` : ""}</span>
                <span style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" }}>{dateRange(entry.data)}</span>
              </div>
              <p style={{ fontStyle: "italic", color: "#374151", marginTop: 1 }}>{entry.data.position}</p>
              {entry.data.description && <p style={{ marginTop: 3, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
            </div>
          ))}
        </div>
      )}

      {educations.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={sectionHeader}>Education</h2>
          {educations.map((entry) => (
            <div key={entry.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, color: "#111827" }}>{entry.data.institution}</span>
                <span style={{ fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" }}>{dateRange(entry.data)}</span>
              </div>
              <p style={{ fontStyle: "italic", color: "#374151", marginTop: 1 }}>
                {entry.data.degree}{entry.data.field ? ` in ${entry.data.field}` : ""}{entry.data.gpa ? ` — GPA: ${entry.data.gpa}` : ""}
              </p>
              {entry.data.description && <p style={{ marginTop: 3, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h2 style={sectionHeader}>Skills</h2>
          <p style={{ color: "#374151" }}>
            {skills.map((s) => s.data.name).filter(Boolean).join("  ·  ")}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── 5. Corporate ─── */
function CorporateTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries, color } = data;
  const { experiences, educations, skills } = splitEntries(entries);
  const name = fullName(p);

  const mainSectionHeader: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
    color: "#111827", marginBottom: 8, paddingBottom: 4, borderBottom: `2px solid ${color}`,
  };

  return (
    <div style={{ display: "flex", fontSize: 11, lineHeight: 1.6, color: "#1f2937", minHeight: "100%" }}>
      {/* Sidebar */}
      <div style={{ width: "35%", backgroundColor: "#1e293b", color: "#e2e8f0", padding: "28px 20px" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#475569", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff" }}>
          {p.firstName?.[0] || ""}{p.lastName?.[0] || ""}
        </div>
        {name && <h1 style={{ fontSize: 16, fontWeight: 700, textAlign: "center", color: "#fff", margin: "0 0 4px" }}>{name}</h1>}
        {p.jobTitle && <p style={{ fontSize: 10, textAlign: "center", color: "#94a3b8", marginBottom: 20 }}>{p.jobTitle}</p>}

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 8 }}>Contact</h3>
          <div style={{ fontSize: 10, lineHeight: 1.8 }}>
            {p.email && <p>{p.email}</p>}
            {p.phone && <p>{p.phone}</p>}
            {p.location && <p>{p.location}</p>}
            {p.website && <p>{p.website}</p>}
            {p.linkedin && <p>{p.linkedin}</p>}
            {p.github && <p>{p.github}</p>}
          </div>
        </div>

        {skills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 8 }}>Skills</h3>
            {skills.map((s) => (
              <div key={s.id} style={{ marginBottom: 6 }}>
                <p style={{ fontSize: 10, marginBottom: 2 }}>{s.data.name}</p>
                <div style={{ height: 3, backgroundColor: "#334155", borderRadius: 2 }}>
                  <div style={{
                    height: 3, borderRadius: 2, backgroundColor: color,
                    width: s.data.level === "Expert" ? "100%" : s.data.level === "Advanced" ? "80%" : s.data.level === "Intermediate" ? "60%" : s.data.level === "Beginner" ? "35%" : "50%",
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ width: "65%", padding: "28px 24px" }}>
        {summary && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={mainSectionHeader}>Summary</h2>
            <p style={{ color: "#4b5563", whiteSpace: "pre-line" }}>{summary}</p>
          </div>
        )}

        {experiences.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={mainSectionHeader}>Experience</h2>
            {experiences.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: "2px solid #e5e7eb" }}>
                <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.position}</p>
                <p style={{ color, fontSize: 10 }}>{entry.data.company}{entry.data.location ? ` · ${entry.data.location}` : ""}</p>
                <p style={{ fontSize: 10, color: "#9ca3af" }}>{dateRange(entry.data)}</p>
                {entry.data.description && <p style={{ marginTop: 3, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
              </div>
            ))}
          </div>
        )}

        {educations.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={mainSectionHeader}>Education</h2>
            {educations.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: "2px solid #e5e7eb" }}>
                <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.institution}</p>
                <p style={{ color: "#6b7280", fontSize: 10 }}>
                  {entry.data.degree}{entry.data.field ? ` in ${entry.data.field}` : ""}{entry.data.gpa ? ` · GPA: ${entry.data.gpa}` : ""}
                </p>
                <p style={{ fontSize: 10, color: "#9ca3af" }}>{dateRange(entry.data)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 6. Executive ─── */
function ExecutiveTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries, color } = data;
  const { experiences, educations, skills } = splitEntries(entries);
  const name = fullName(p);

  const sectionHeader: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
    color: "#374151", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e5e7eb",
  };

  return (
    <div style={{ fontSize: 11, lineHeight: 1.6, color: "#1f2937" }}>
      {/* Header */}
      <div style={{ position: "relative", padding: "28px 32px 24px" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: color }} />
        {name && <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>{name}</h1>}
        {p.jobTitle && <p style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>{p.jobTitle}</p>}
        {hasContactInfo(p) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0 16px", marginTop: 10, fontSize: 10, color: "#6b7280" }}>
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.location && <span>{p.location}</span>}
            {p.website && <span>{p.website}</span>}
            {p.linkedin && <span>{p.linkedin}</span>}
            {p.github && <span>{p.github}</span>}
          </div>
        )}
      </div>

      <div style={{ display: "flex", padding: "0 32px 32px" }}>
        {/* Main content */}
        <div style={{ width: "68%", paddingRight: 24 }}>
          {summary && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={sectionHeader}>Executive Summary</h2>
              <p style={{ color: "#4b5563", whiteSpace: "pre-line" }}>{summary}</p>
            </div>
          )}

          {experiences.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={sectionHeader}>Professional Experience</h2>
              {experiences.map((entry) => (
                <div key={entry.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ fontWeight: 700, color: "#111827" }}>{entry.data.position}</p>
                    <p style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
                  </div>
                  <p style={{ color, fontSize: 10, fontWeight: 600 }}>{entry.data.company}{entry.data.location ? `, ${entry.data.location}` : ""}</p>
                  {entry.data.description && <p style={{ marginTop: 4, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
                </div>
              ))}
            </div>
          )}

          {educations.length > 0 && (
            <div>
              <h2 style={sectionHeader}>Education</h2>
              {educations.map((entry) => (
                <div key={entry.id} style={{ marginBottom: 8 }}>
                  <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.degree}{entry.data.field ? ` in ${entry.data.field}` : ""}</p>
                  <p style={{ color: "#6b7280", fontSize: 10 }}>{entry.data.institution}{entry.data.gpa ? ` · GPA: ${entry.data.gpa}` : ""} — {dateRange(entry.data)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ width: "32%", paddingLeft: 24, borderLeft: "1px solid #e5e7eb" }}>
          {skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={sectionHeader}>Core Skills</h2>
              {skills.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, marginRight: 8, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#374151" }}>{s.data.name}</span>
                </div>
              ))}
            </div>
          )}

          {(p.linkedin || p.github || p.website) && (
            <div>
              <h2 style={sectionHeader}>Links</h2>
              <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.8 }}>
                {p.linkedin && <p>{p.linkedin}</p>}
                {p.github && <p>{p.github}</p>}
                {p.website && <p>{p.website}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── 7. Creative ─── */
function CreativeTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries, color } = data;
  const { experiences, educations, skills } = splitEntries(entries);
  const name = fullName(p);

  function lighten(hex: string, amount: number) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  const accentLight = lighten(color, 0.35);

  return (
    <div style={{ fontSize: 11, lineHeight: 1.6, color: "#1f2937", display: "flex", minHeight: "100%" }}>
      {/* Sidebar */}
      <div style={{ width: "34%", backgroundColor: color, color: "#fff", padding: "28px 18px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
          {p.firstName?.[0] || ""}{p.lastName?.[0] || ""}
        </div>
        {name && <h1 style={{ fontSize: 16, fontWeight: 700, textAlign: "center", margin: "0 0 4px" }}>{name}</h1>}
        {p.jobTitle && <p style={{ fontSize: 10, textAlign: "center", opacity: 0.8, marginBottom: 20 }}>{p.jobTitle}</p>}

        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, marginBottom: 6 }}>Contact</h3>
          <div style={{ fontSize: 10, lineHeight: 1.8, opacity: 0.9 }}>
            {p.email && <p>{p.email}</p>}
            {p.phone && <p>{p.phone}</p>}
            {p.location && <p>{p.location}</p>}
            {p.website && <p>{p.website}</p>}
            {p.linkedin && <p>{p.linkedin}</p>}
            {p.github && <p>{p.github}</p>}
          </div>
        </div>

        {skills.length > 0 && (
          <div>
            <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, marginBottom: 8 }}>Skills</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {skills.map((s) => (
                <span key={s.id} style={{ display: "inline-block", backgroundColor: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 999, fontSize: 9 }}>
                  {s.data.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ width: "66%", padding: "28px 24px" }}>
        {/* Gradient accent strip */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${accentLight})`, borderRadius: 2, marginBottom: 20 }} />

        {summary && (
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", backgroundColor: color, color: "#fff", fontSize: 9, lineHeight: "16px", textAlign: "center" }}>✦</span>
              About Me
            </h2>
            <p style={{ color: "#4b5563", whiteSpace: "pre-line" }}>{summary}</p>
          </div>
        )}

        {experiences.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", backgroundColor: color, color: "#fff", fontSize: 9, lineHeight: "16px", textAlign: "center" }}>▶</span>
              Experience
            </h2>
            {experiences.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 10, paddingLeft: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.position}</p>
                  <p style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
                </div>
                <p style={{ color, fontSize: 10, fontWeight: 500 }}>{entry.data.company}{entry.data.location ? ` · ${entry.data.location}` : ""}</p>
                {entry.data.description && <p style={{ marginTop: 3, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
              </div>
            ))}
          </div>
        )}

        {educations.length > 0 && (
          <div>
            <h2 style={{ fontSize: 12, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", backgroundColor: color, color: "#fff", fontSize: 9, lineHeight: "16px", textAlign: "center" }}>◆</span>
              Education
            </h2>
            {educations.map((entry) => (
              <div key={entry.id} style={{ marginBottom: 8, paddingLeft: 22 }}>
                <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.institution}</p>
                <p style={{ color: "#6b7280", fontSize: 10 }}>
                  {entry.data.degree}{entry.data.field ? ` in ${entry.data.field}` : ""}{entry.data.gpa ? ` · GPA: ${entry.data.gpa}` : ""} — {dateRange(entry.data)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 8. Clean ─── */
function CleanTemplate({ data }: { data: ResumeData }) {
  const { personal: p, summary, entries, color } = data;
  const { experiences, educations, skills } = splitEntries(entries);
  const name = fullName(p);

  const sectionHeader: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
    color: "#111827", marginBottom: 8, paddingLeft: 10, borderLeft: `2px solid ${color}`,
  };

  return (
    <div style={{ padding: 32, fontSize: 11, lineHeight: 1.65, color: "#1f2937" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        {name && <h1 style={{ fontSize: 30, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>{name}</h1>}
        {hasContactInfo(p) && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0 4px", marginTop: 6, fontSize: 10, color: "#6b7280" }}>
            {[p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean).map((item, i, arr) => (
              <span key={i}>{item}{i < arr.length - 1 ? <span style={{ margin: "0 4px", color: "#d1d5db" }}>·</span> : ""}</span>
            ))}
          </div>
        )}
        {p.jobTitle && <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{p.jobTitle}</p>}
      </div>

      {summary && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionHeader}>Summary</h2>
          <p style={{ color: "#4b5563", whiteSpace: "pre-line" }}>{summary}</p>
        </div>
      )}

      {experiences.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionHeader}>Experience</h2>
          {experiences.map((entry) => (
            <div key={entry.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.position}</p>
                  <p style={{ color: "#6b7280", fontSize: 10 }}>{entry.data.company}{entry.data.location ? ` · ${entry.data.location}` : ""}</p>
                </div>
                <p style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
              </div>
              {entry.data.description && <p style={{ marginTop: 4, color: "#4b5563", whiteSpace: "pre-line" }}>{entry.data.description}</p>}
            </div>
          ))}
        </div>
      )}

      {educations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={sectionHeader}>Education</h2>
          {educations.map((entry) => (
            <div key={entry.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "#111827" }}>{entry.data.institution}</p>
                  <p style={{ color: "#6b7280", fontSize: 10 }}>
                    {entry.data.degree}{entry.data.field ? ` in ${entry.data.field}` : ""}{entry.data.gpa ? ` · GPA: ${entry.data.gpa}` : ""}
                  </p>
                </div>
                <p style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginLeft: 8 }}>{dateRange(entry.data)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h2 style={sectionHeader}>Skills</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {skills.map((entry) => (
              <span key={entry.id} style={{ display: "inline-block", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", padding: "2px 10px", borderRadius: 4, fontSize: 10, color: "#374151" }}>
                {entry.data.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Router ─── */
export default function ResumePreview({ data }: { data: ResumeData }) {
  switch (data.template) {
    case "classic":
      return <ClassicTemplate data={data} />;
    case "professional":
      return <ProfessionalTemplate data={data} />;
    case "modern":
      return <ModernTemplate data={data} />;
    case "corporate":
      return <CorporateTemplate data={data} />;
    case "executive":
      return <ExecutiveTemplate data={data} />;
    case "creative":
      return <CreativeTemplate data={data} />;
    case "clean":
      return <CleanTemplate data={data} />;
    default:
      return <MinimalTemplate data={data} />;
  }
}
