PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT NULL,
    preferences TEXT DEFAULT '{}',
    remember_token TEXT DEFAULT NULL,
    email_verified_at TEXT DEFAULT NULL,
    password_reset_token TEXT DEFAULT NULL,
    password_reset_expires TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Resume',
    slug TEXT NOT NULL,
    template TEXT NOT NULL DEFAULT 'professional',
    color_scheme TEXT NOT NULL DEFAULT '#2563eb',
    font_family TEXT NOT NULL DEFAULT 'Inter',
    font_size INTEGER NOT NULL DEFAULT 10,
    line_spacing REAL NOT NULL DEFAULT 1.15,
    margin TEXT NOT NULL DEFAULT 'normal',
    section_order TEXT NOT NULL DEFAULT '["personal","summary","experience","education","skills","projects","certifications","awards","languages","volunteer","references"]',
    is_public INTEGER NOT NULL DEFAULT 0,
    score INTEGER DEFAULT NULL,
    last_edited_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_personal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL UNIQUE,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    location TEXT DEFAULT '',
    website TEXT DEFAULT '',
    linkedin TEXT DEFAULT '',
    github TEXT DEFAULT '',
    portfolio TEXT DEFAULT '',
    job_title TEXT DEFAULT '',
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL UNIQUE,
    content TEXT DEFAULT '',
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    company TEXT NOT NULL DEFAULT '',
    position TEXT NOT NULL DEFAULT '',
    location TEXT DEFAULT '',
    start_date TEXT DEFAULT '',
    end_date TEXT DEFAULT '',
    is_current INTEGER NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    highlights TEXT DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    institution TEXT NOT NULL DEFAULT '',
    degree TEXT NOT NULL DEFAULT '',
    field_of_study TEXT DEFAULT '',
    location TEXT DEFAULT '',
    start_date TEXT DEFAULT '',
    end_date TEXT DEFAULT '',
    is_current INTEGER NOT NULL DEFAULT 0,
    gpa TEXT DEFAULT '',
    description TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    level TEXT DEFAULT 'intermediate',
    category TEXT DEFAULT 'general',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    url TEXT DEFAULT '',
    technologies TEXT DEFAULT '',
    start_date TEXT DEFAULT '',
    end_date TEXT DEFAULT '',
    highlights TEXT DEFAULT '[]',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    issuer TEXT DEFAULT '',
    date_issued TEXT DEFAULT '',
    date_expires TEXT DEFAULT '',
    credential_id TEXT DEFAULT '',
    url TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_awards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    issuer TEXT DEFAULT '',
    date TEXT DEFAULT '',
    description TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    language TEXT NOT NULL DEFAULT '',
    proficiency TEXT DEFAULT 'conversational',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_volunteer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    organization TEXT NOT NULL DEFAULT '',
    role TEXT DEFAULT '',
    location TEXT DEFAULT '',
    start_date TEXT DEFAULT '',
    end_date TEXT DEFAULT '',
    is_current INTEGER NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    company TEXT DEFAULT '',
    position TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    relationship TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_custom_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT 'Custom Section',
    content TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cover_letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_id INTEGER DEFAULT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Cover Letter',
    company TEXT DEFAULT '',
    position TEXT DEFAULT '',
    content TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_id INTEGER DEFAULT NULL,
    cover_letter_id INTEGER DEFAULT NULL,
    company TEXT NOT NULL DEFAULT '',
    position TEXT NOT NULL DEFAULT '',
    url TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    applied_at TEXT DEFAULT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
    FOREIGN KEY (cover_letter_id) REFERENCES cover_letters(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS job_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT NULL,
    action TEXT NOT NULL,
    entity_type TEXT DEFAULT NULL,
    entity_id INTEGER DEFAULT NULL,
    old_values TEXT DEFAULT NULL,
    new_values TEXT DEFAULT NULL,
    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_remember_token ON users(remember_token);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_slug ON resumes(slug);
CREATE INDEX IF NOT EXISTS idx_resumes_last_edited ON resumes(last_edited_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_experience_resume ON resume_experience(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resume_education_resume ON resume_education(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resume_skills_resume ON resume_skills(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resume_projects_resume ON resume_projects(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resume_certifications_resume ON resume_certifications(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resume_awards_resume ON resume_awards(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resume_languages_resume ON resume_languages(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resume_volunteer_resume ON resume_volunteer(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resume_references_resume ON resume_references(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_resume_custom_resume ON resume_custom_sections(resume_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_job_statuses_app ON job_statuses(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
