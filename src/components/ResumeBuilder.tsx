"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import ResumePreview from "./ResumePreview";
import {
  updatePersonal,
  updateSummary,
  addEntry,
  updateEntry,
  deleteEntry,
  updateResumeMeta,
} from "@/app/(app)/resumes/[id]/actions";

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

const STEPS = [
  "Personal Info",
  "Summary",
  "Experience",
  "Education",
  "Skills",
] as const;

const TEMPLATES = [
  { value: "minimal", label: "Minimal" },
  { value: "classic", label: "Classic" },
  { value: "professional", label: "Professional" },
  { value: "modern", label: "Modern" },
  { value: "corporate", label: "Corporate" },
  { value: "executive", label: "Executive" },
  { value: "creative", label: "Creative" },
  { value: "clean", label: "Clean" },
];

export default function ResumeBuilder({
  resumeId,
  initialTitle,
  initialTemplate,
  initialColor,
  initialPersonal,
  initialSummary,
  initialEntries,
}: {
  resumeId: string;
  initialTitle: string;
  initialTemplate: string;
  initialColor: string;
  initialPersonal: PersonalData;
  initialSummary: string;
  initialEntries: EntryData[];
}) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(initialTitle);
  const [template, setTemplate] = useState(initialTemplate);
  const [color, setColor] = useState(initialColor);
  const [personal, setPersonal] = useState<PersonalData>(initialPersonal);
  const [summary, setSummary] = useState(initialSummary);
  const [entries, setEntries] = useState<EntryData[]>(initialEntries);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">(
    "idle"
  );
  const [showPreview, setShowPreview] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (saveFn: () => Promise<void>) => {
      setSaveStatus("saving");
      if (saveTimer.current !== null) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await saveFn();
          setSaveStatus("saved");
        } catch {
          setSaveStatus("idle");
        }
      }, 1000);
    },
    []
  );

  const handlePersonalChange = (field: keyof PersonalData, value: string) => {
    const updated = { ...personal, [field]: value };
    setPersonal(updated);
    debouncedSave(() => updatePersonal(resumeId, { [field]: value }));
  };

  const handleSummaryChange = (value: string) => {
    setSummary(value);
    debouncedSave(() => updateSummary(resumeId, value));
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    debouncedSave(() => updateResumeMeta(resumeId, { title: value }));
  };

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    updateResumeMeta(resumeId, { template: value });
  };

  const handleColorChange = (value: string) => {
    setColor(value);
    debouncedSave(() => updateResumeMeta(resumeId, { color: value }));
  };

  const handleAddEntry = async (section: string) => {
    const defaultData: Record<string, string> =
      section === "experience"
        ? {
            company: "",
            position: "",
            location: "",
            startDate: "",
            endDate: "",
            current: "false",
            description: "",
          }
        : section === "education"
          ? {
              institution: "",
              degree: "",
              field: "",
              startDate: "",
              endDate: "",
              gpa: "",
              description: "",
            }
          : { name: "", level: "none" };

    const entry = await addEntry(resumeId, section, defaultData);
    setEntries([
      ...entries,
      { id: entry.id, section, data: defaultData },
    ]);
  };

  const handleUpdateEntry = (entryId: string, data: Record<string, string>) => {
    setEntries(
      entries.map((e) => (e.id === entryId ? { ...e, data } : e))
    );
    debouncedSave(() => updateEntry(entryId, data));
  };

  const handleDeleteEntry = async (entryId: string) => {
    setEntries(entries.filter((e) => e.id !== entryId));
    await deleteEntry(entryId);
  };

  const experiences = entries.filter((e) => e.section === "experience");
  const educations = entries.filter((e) => e.section === "education");
  const skills = entries.filter((e) => e.section === "skills");

  const inputClass =
    "w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";

  const previewData = {
    personal,
    summary,
    entries,
    template,
    color,
  };

  return (
    <div className="flex flex-col h-screen bg-[#09090b]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-white/10 bg-[#111113] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Dashboard
          </Link>
          <span className="text-gray-600">|</span>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="bg-transparent text-white font-medium text-sm focus:outline-none border-b border-transparent hover:border-white/20 focus:border-blue-500 px-1 py-0.5 transition-all max-w-[200px]"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={template}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 hidden sm:block"
          >
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value} className="bg-[#111113]">
                {t.label}
              </option>
            ))}
          </select>
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent hidden sm:block"
          />
          <span className="text-xs text-gray-500 hidden sm:inline-block min-w-[60px] text-right">
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved ✓"
                : ""}
          </span>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="lg:hidden rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1.5 text-sm text-white"
          >
            {showPreview ? "Editor" : "Preview"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — Editor */}
        <div
          className={`w-full lg:w-1/2 overflow-y-auto p-6 md:p-8 ${showPreview ? "hidden lg:block" : ""}`}
        >
          {/* Progress bar */}
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-blue-600" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`text-xs font-medium px-2 py-1 rounded-lg transition-all ${
                  i === step
                    ? "text-blue-400 bg-blue-600/15"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Mobile-only template/color */}
          <div className="sm:hidden flex items-center gap-2 mb-6">
            <select
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="flex-1 rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none"
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value} className="bg-[#111113]">
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
            />
          </div>

          {/* Step forms */}
          {step === 0 && (
            <PersonalForm
              personal={personal}
              onChange={handlePersonalChange}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          )}
          {step === 1 && (
            <SummaryForm
              summary={summary}
              onChange={handleSummaryChange}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          )}
          {step === 2 && (
            <EntriesForm
              title="Experience"
              section="experience"
              entries={experiences}
              onAdd={handleAddEntry}
              onUpdate={handleUpdateEntry}
              onDelete={handleDeleteEntry}
              inputClass={inputClass}
              labelClass={labelClass}
              renderFields={(entry, onChange) => (
                <ExperienceFields
                  entry={entry}
                  onChange={onChange}
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
              )}
            />
          )}
          {step === 3 && (
            <EntriesForm
              title="Education"
              section="education"
              entries={educations}
              onAdd={handleAddEntry}
              onUpdate={handleUpdateEntry}
              onDelete={handleDeleteEntry}
              inputClass={inputClass}
              labelClass={labelClass}
              renderFields={(entry, onChange) => (
                <EducationFields
                  entry={entry}
                  onChange={onChange}
                  inputClass={inputClass}
                  labelClass={labelClass}
                />
              )}
            />
          )}
          {step === 4 && (
            <SkillsForm
              skills={skills}
              onAdd={handleAddEntry}
              onUpdate={handleUpdateEntry}
              onDelete={handleDeleteEntry}
              inputClass={inputClass}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="rounded-xl px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
              disabled={step === STEPS.length - 1}
              className="rounded-xl px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right panel — Preview */}
        <div
          className={`w-full lg:w-1/2 bg-[#1a1a1e] overflow-y-auto flex items-start justify-center p-6 md:p-10 ${!showPreview ? "hidden lg:flex" : "flex"}`}
        >
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[595px] min-h-[842px] relative">
            <ResumePreview data={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalForm({
  personal,
  onChange,
  inputClass,
  labelClass,
}: {
  personal: PersonalData;
  onChange: (field: keyof PersonalData, value: string) => void;
  inputClass: string;
  labelClass: string;
}) {
  const fields: { key: keyof PersonalData; label: string; type?: string; placeholder: string }[] = [
    { key: "firstName", label: "First Name", placeholder: "John" },
    { key: "lastName", label: "Last Name", placeholder: "Doe" },
    { key: "jobTitle", label: "Job Title", placeholder: "Senior Software Engineer" },
    { key: "email", label: "Email", type: "email", placeholder: "john@example.com" },
    { key: "phone", label: "Phone", type: "tel", placeholder: "+1 (555) 123-4567" },
    { key: "location", label: "Location", placeholder: "San Francisco, CA" },
    { key: "website", label: "Website", type: "url", placeholder: "https://johndoe.com" },
    { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/johndoe" },
    { key: "github", label: "GitHub", placeholder: "github.com/johndoe" },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Personal Information</h2>
      <p className="text-gray-400 text-sm mb-6">
        Add your contact details so employers can reach you.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.key === "jobTitle" ? "sm:col-span-2" : ""}>
            <label htmlFor={f.key} className={labelClass}>
              {f.label}
            </label>
            <input
              id={f.key}
              type={f.type || "text"}
              value={personal[f.key]}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryForm({
  summary,
  onChange,
  inputClass,
  labelClass,
}: {
  summary: string;
  onChange: (value: string) => void;
  inputClass: string;
  labelClass: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Professional Summary</h2>
      <p className="text-gray-400 text-sm mb-6">
        Write 2-3 sentences about your experience and what you bring to the table.
      </p>
      <label htmlFor="summary" className={labelClass}>Summary</label>
      <textarea
        id="summary"
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder="Experienced software engineer with 5+ years of expertise in building scalable web applications..."
        className={`${inputClass} resize-none`}
      />
    </div>
  );
}

function EntriesForm({
  title,
  section,
  entries,
  onAdd,
  onUpdate,
  onDelete,
  renderFields,
}: {
  title: string;
  section: string;
  entries: EntryData[];
  onAdd: (section: string) => void;
  onUpdate: (id: string, data: Record<string, string>) => void;
  onDelete: (id: string) => void;
  inputClass?: string;
  labelClass?: string;
  renderFields: (
    entry: EntryData,
    onChange: (data: Record<string, string>) => void
  ) => React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-gray-400 text-sm mt-1">
            Add your {title.toLowerCase()} history.
          </p>
        </div>
        <button
          onClick={() => onAdd(section)}
          className="rounded-xl bg-blue-600/15 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-600/25 transition-all"
        >
          + Add {title}
        </button>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/10">
          <p className="text-gray-500">
            No {title.toLowerCase()} entries yet.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const isCollapsed = collapsed[entry.id];
          const entryTitle =
            section === "experience"
              ? entry.data.position || entry.data.company || `Entry ${index + 1}`
              : entry.data.institution || entry.data.degree || `Entry ${index + 1}`;

          return (
            <div
              key={entry.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() =>
                  setCollapsed({ ...collapsed, [entry.id]: !isCollapsed })
                }
              >
                <span className="text-sm font-medium text-white truncate">
                  {entryTitle}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(entry.id);
                    }}
                    className="text-red-400/60 hover:text-red-400 transition-colors p-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </div>
              </div>
              {!isCollapsed && (
                <div className="px-5 pb-5 border-t border-white/5">
                  {renderFields(entry, (data) =>
                    onUpdate(entry.id, data)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExperienceFields({
  entry,
  onChange,
  inputClass,
  labelClass,
}: {
  entry: EntryData;
  onChange: (data: Record<string, string>) => void;
  inputClass: string;
  labelClass: string;
}) {
  const update = (field: string, value: string) => {
    onChange({ ...entry.data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
      <div>
        <label className={labelClass}>Company</label>
        <input
          type="text"
          value={entry.data.company || ""}
          onChange={(e) => update("company", e.target.value)}
          placeholder="Google"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Position</label>
        <input
          type="text"
          value={entry.data.position || ""}
          onChange={(e) => update("position", e.target.value)}
          placeholder="Senior Engineer"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Location</label>
        <input
          type="text"
          value={entry.data.location || ""}
          onChange={(e) => update("location", e.target.value)}
          placeholder="Mountain View, CA"
          className={inputClass}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Start</label>
          <input
            type="text"
            value={entry.data.startDate || ""}
            onChange={(e) => update("startDate", e.target.value)}
            placeholder="Jan 2022"
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <label className={labelClass}>End</label>
          <input
            type="text"
            value={entry.data.current === "true" ? "" : entry.data.endDate || ""}
            onChange={(e) => update("endDate", e.target.value)}
            placeholder="Present"
            disabled={entry.data.current === "true"}
            className={`${inputClass} ${entry.data.current === "true" ? "opacity-50" : ""}`}
          />
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-gray-300 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={entry.data.current === "true"}
            onChange={(e) =>
              update("current", e.target.checked ? "true" : "false")
            }
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500/50"
          />
          I currently work here
        </label>
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Description</label>
        <textarea
          value={entry.data.description || ""}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          placeholder="Describe your responsibilities and achievements..."
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  );
}

function EducationFields({
  entry,
  onChange,
  inputClass,
  labelClass,
}: {
  entry: EntryData;
  onChange: (data: Record<string, string>) => void;
  inputClass: string;
  labelClass: string;
}) {
  const update = (field: string, value: string) => {
    onChange({ ...entry.data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
      <div className="sm:col-span-2">
        <label className={labelClass}>Institution</label>
        <input
          type="text"
          value={entry.data.institution || ""}
          onChange={(e) => update("institution", e.target.value)}
          placeholder="Stanford University"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Degree</label>
        <input
          type="text"
          value={entry.data.degree || ""}
          onChange={(e) => update("degree", e.target.value)}
          placeholder="Bachelor of Science"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Field of Study</label>
        <input
          type="text"
          value={entry.data.field || ""}
          onChange={(e) => update("field", e.target.value)}
          placeholder="Computer Science"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Start Date</label>
        <input
          type="text"
          value={entry.data.startDate || ""}
          onChange={(e) => update("startDate", e.target.value)}
          placeholder="Sep 2018"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>End Date</label>
        <input
          type="text"
          value={entry.data.endDate || ""}
          onChange={(e) => update("endDate", e.target.value)}
          placeholder="Jun 2022"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>GPA</label>
        <input
          type="text"
          value={entry.data.gpa || ""}
          onChange={(e) => update("gpa", e.target.value)}
          placeholder="3.8"
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Description</label>
        <textarea
          value={entry.data.description || ""}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          placeholder="Relevant coursework, achievements..."
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  );
}

function SkillsForm({
  skills,
  onAdd,
  onUpdate,
  onDelete,
}: {
  skills: EntryData[];
  onAdd: (section: string) => void;
  onUpdate: (id: string, data: Record<string, string>) => void;
  onDelete: (id: string) => void;
  inputClass?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Skills</h2>
          <p className="text-gray-400 text-sm mt-1">
            Add your technical and professional skills.
          </p>
        </div>
        <button
          onClick={() => onAdd("skills")}
          className="rounded-xl bg-blue-600/15 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-600/25 transition-all"
        >
          + Add Skill
        </button>
      </div>

      {skills.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-white/10">
          <p className="text-gray-500">No skills added yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            <input
              type="text"
              value={skill.data.name || ""}
              onChange={(e) =>
                onUpdate(skill.id, { ...skill.data, name: e.target.value })
              }
              placeholder="Skill name"
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
            />
            <select
              value={skill.data.level || "none"}
              onChange={(e) =>
                onUpdate(skill.id, { ...skill.data, level: e.target.value })
              }
              className="rounded-lg bg-white/[0.06] border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="none" className="bg-[#111113]">
                No level
              </option>
              <option value="Beginner" className="bg-[#111113]">
                Beginner
              </option>
              <option value="Intermediate" className="bg-[#111113]">
                Intermediate
              </option>
              <option value="Advanced" className="bg-[#111113]">
                Advanced
              </option>
              <option value="Expert" className="bg-[#111113]">
                Expert
              </option>
            </select>
            <button
              onClick={() => onDelete(skill.id)}
              className="text-red-400/60 hover:text-red-400 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
