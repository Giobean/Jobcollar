/* ============================================================
   JobCollar — Resume Builder Module
   Multi-step wizard with live preview, auto-save, 3 templates
   ============================================================ */

'use strict';

const ResumeBuilder = {
    resumeId: null,
    data: null,
    currentStep: 0,
    steps: [
        'personal', 'summary', 'experience', 'education', 'skills',
        'projects', 'certifications', 'awards', 'languages',
        'volunteer', 'references', 'custom',
    ],
    stepLabels: {
        personal: 'Personal Info',
        summary: 'Summary',
        experience: 'Experience',
        education: 'Education',
        skills: 'Skills',
        projects: 'Projects',
        certifications: 'Certifications',
        awards: 'Awards',
        languages: 'Languages',
        volunteer: 'Volunteer',
        references: 'References',
        custom: 'Custom Sections',
    },
    autoSaveTimer: null,
    template: 'minimal',
    accentColor: '#2563eb',
    _saveIndicatorTimer: null,
    _previewScale: 1,
    _mobilePreviewOpen: false,
    _expandedEntries: new Set(),

    /* --------------------------------------------------------
       Preset colors for the accent picker
       -------------------------------------------------------- */
    presetColors: [
        { name: 'Blue',   hex: '#2563eb' },
        { name: 'Red',    hex: '#ef4444' },
        { name: 'Green',  hex: '#22c55e' },
        { name: 'Purple', hex: '#8b5cf6' },
        { name: 'Orange', hex: '#f59e0b' },
        { name: 'Teal',   hex: '#14b8a6' },
        { name: 'Pink',   hex: '#ec4899' },
        { name: 'Slate',  hex: '#64748b' },
    ],

    /* ========================================================
       init — Load resume data, render wizard
       ======================================================== */
    async init(id) {
        this.resumeId = id;

        if (!id) {
            const app = $('#app');
            app.innerHTML = Layout.render(`
                <div class="page-header"><h1 class="page-title">Create New Resume</h1></div>
                <div id="resume-content">${skeleton(3)}</div>
            `, 'resumes');
            Layout.bindEvents();
            try {
                const res = await API.post('/api/resumes', { title: 'Untitled Resume' });
                navigate(`/resumes/${res.data.id}`);
            } catch (err) {
                Toast.error(err.message || 'Failed to create resume');
                $('#resume-content').innerHTML = `<div class="empty-state"><p>Failed to create resume. <a href="/dashboard" class="btn btn--secondary">Back to Dashboard</a></p></div>`;
            }
            return;
        }

        const app = $('#app');
        app.innerHTML = Layout.render(`<div id="resume-content" style="padding:2rem;text-align:center;">${skeleton(8)}</div>`, 'resumes');
        Layout.bindEvents();

        try {
            const res = await API.get(`/api/resumes/${id}`);
            this.data = res.data;
            this.template = this.data.template || 'minimal';
            this.accentColor = this.data.color || '#2563eb';
            this._expandedEntries = new Set();
            this.render();
        } catch (err) {
            $('#resume-content').innerHTML = `<div class="empty-state"><p>Resume not found. <a href="/dashboard" class="btn btn--secondary">Back to Dashboard</a></p></div>`;
        }
    },

    /* ========================================================
       render — Build full page: header, sidebar, editor, preview
       ======================================================== */
    render() {
        const mainContent = $('#main-content');
        if (!mainContent) return;

        mainContent.innerHTML = `
        <div class="rb">
            <!-- Header bar -->
            <header class="rb__header">
                <div class="rb__header-left">
                    <a href="/dashboard" class="btn btn--ghost btn--sm rb__back" aria-label="Back to dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>
                    </a>
                    <input type="text" class="rb__title-input" id="rb-title"
                           value="${escapeHtml(this.data.title || 'Untitled Resume')}"
                           aria-label="Resume title" />
                    <span class="rb__save-indicator" id="rb-save-indicator"></span>
                </div>
                <div class="rb__header-right">
                    <div class="rb__template-select">
                        <label for="rb-template-select" class="sr-only">Template</label>
                        <select id="rb-template-select" class="rb__select" aria-label="Choose template">
                            <option value="minimal" ${this.template === 'minimal' ? 'selected' : ''}>Minimal</option>
                            <option value="professional" ${this.template === 'professional' ? 'selected' : ''}>Professional</option>
                            <option value="modern" ${this.template === 'modern' ? 'selected' : ''}>Modern</option>
                        </select>
                    </div>
                    <div class="rb__color-picker" id="rb-color-picker">
                        ${this.presetColors.map(c => `
                            <button class="rb__color-swatch ${c.hex === this.accentColor ? 'rb__color-swatch--active' : ''}"
                                    style="background:${c.hex}" data-color="${c.hex}"
                                    title="${c.name}" aria-label="Set accent color to ${c.name}"></button>
                        `).join('')}
                    </div>
                    <button class="btn btn--ghost btn--sm" id="rb-btn-ats" title="Check ATS compatibility">ATS</button>
                    <button class="btn btn--ghost btn--sm" id="rb-btn-score" title="Check resume score">Score</button>
                    <button class="btn btn--primary btn--sm" id="rb-btn-export">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Export PDF
                    </button>
                    <button class="btn btn--ghost btn--sm rb__preview-toggle" id="rb-preview-toggle" title="Toggle preview">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
            </header>

            <!-- Body: steps nav + editor + preview -->
            <div class="rb__body">
                <nav class="rb__steps" id="rb-steps" aria-label="Resume sections">
                    ${this.renderStepNav()}
                </nav>
                <section class="rb__editor" id="rb-editor" aria-label="Editor">
                    ${this._renderCurrentStep()}
                    ${this._renderStepButtons()}
                </section>
                <aside class="rb__preview ${this._mobilePreviewOpen ? 'rb__preview--open' : ''}" id="rb-preview" aria-label="Resume preview">
                    <div class="rb__preview-paper" id="rb-preview-paper">
                        ${this.renderPreview()}
                    </div>
                </aside>
            </div>
        </div>

        <!-- ATS / Score slide-over -->
        <div class="rb__slideover" id="rb-slideover" aria-hidden="true">
            <div class="rb__slideover-backdrop" id="rb-slideover-backdrop"></div>
            <div class="rb__slideover-panel" id="rb-slideover-panel">
                <header class="rb__slideover-header">
                    <h2 id="rb-slideover-title">ATS Check</h2>
                    <button class="rb__slideover-close" id="rb-slideover-close" aria-label="Close panel">&times;</button>
                </header>
                <div class="rb__slideover-body" id="rb-slideover-body"></div>
            </div>
        </div>`;

        this._bindHeaderEvents();
        this._bindStepNavEvents();
        this._bindEditorEvents();
        this._scalePreview();
        window.addEventListener('resize', () => this._scalePreview());
    },

    /* ========================================================
       renderStepNav — Vertical step indicators
       ======================================================== */
    renderStepNav() {
        return this.steps.map((step, i) => {
            const active = i === this.currentStep ? 'rb__step--active' : '';
            const complete = this._isStepComplete(step) ? 'rb__step--complete' : '';
            return `
            <button class="rb__step ${active} ${complete}" data-step-index="${i}" aria-label="${this.stepLabels[step]}">
                <span class="rb__step-num">${complete && i !== this.currentStep ? '&#10003;' : i + 1}</span>
                <span class="rb__step-label">${escapeHtml(this.stepLabels[step])}</span>
            </button>`;
        }).join('');
    },

    /* ========================================================
       goToStep — Switch to another step
       ======================================================== */
    goToStep(index) {
        if (index < 0 || index >= this.steps.length) return;
        this.currentStep = index;

        const stepsContainer = $('#rb-steps');
        if (stepsContainer) stepsContainer.innerHTML = this.renderStepNav();
        this._bindStepNavEvents();

        const editor = $('#rb-editor');
        if (editor) {
            editor.innerHTML = this._renderCurrentStep() + this._renderStepButtons();
            this._bindEditorEvents();
            editor.scrollTop = 0;
        }
    },

    /* ========================================================
       Step completion detection
       ======================================================== */
    _isStepComplete(step) {
        if (!this.data) return false;
        switch (step) {
            case 'personal': {
                const p = this.data.personal;
                return p && (p.first_name || p.last_name || p.email || p.phone || p.job_title);
            }
            case 'summary':
                return this.data.summary && this.data.summary.content;
            case 'experience':
                return Array.isArray(this.data.experience) && this.data.experience.length > 0;
            case 'education':
                return Array.isArray(this.data.education) && this.data.education.length > 0;
            case 'skills':
                return Array.isArray(this.data.skills) && this.data.skills.length > 0;
            case 'projects':
                return Array.isArray(this.data.projects) && this.data.projects.length > 0;
            case 'certifications':
                return Array.isArray(this.data.certifications) && this.data.certifications.length > 0;
            case 'awards':
                return Array.isArray(this.data.awards) && this.data.awards.length > 0;
            case 'languages':
                return Array.isArray(this.data.languages) && this.data.languages.length > 0;
            case 'volunteer':
                return Array.isArray(this.data.volunteer) && this.data.volunteer.length > 0;
            case 'references':
                return Array.isArray(this.data.references) && this.data.references.length > 0;
            case 'custom':
                return Array.isArray(this.data.custom_sections) && this.data.custom_sections.length > 0;
            default:
                return false;
        }
    },

    /* ========================================================
       _renderCurrentStep — Dispatch to section renderer
       ======================================================== */
    _renderCurrentStep() {
        const step = this.steps[this.currentStep];
        switch (step) {
            case 'personal':       return this.renderPersonal();
            case 'summary':        return this.renderSummary();
            case 'experience':     return this.renderExperience();
            case 'education':      return this.renderEducation();
            case 'skills':         return this.renderSkills();
            case 'projects':       return this.renderProjects();
            case 'certifications': return this.renderCertifications();
            case 'awards':         return this.renderAwards();
            case 'languages':      return this.renderLanguages();
            case 'volunteer':      return this.renderVolunteer();
            case 'references':     return this.renderReferences();
            case 'custom':         return this.renderCustom();
            default:               return '<p>Unknown step</p>';
        }
    },

    /* ========================================================
       Step navigation buttons (Prev / Next)
       ======================================================== */
    _renderStepButtons() {
        const prevDisabled = this.currentStep === 0 ? 'disabled' : '';
        const nextDisabled = this.currentStep === this.steps.length - 1 ? 'disabled' : '';
        return `
        <div class="rb__step-buttons">
            <button class="btn btn--secondary" id="rb-btn-prev" ${prevDisabled}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
                Previous
            </button>
            <button class="btn btn--primary" id="rb-btn-next" ${nextDisabled}>
                Next
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
        </div>`;
    },

    /* ========================================================
       Section Renderers
       ======================================================== */

    /* --- Personal Information --- */
    renderPersonal() {
        const p = this.data.personal || {};
        return `
        <div class="rb__section">
            <h2 class="rb__section-title">Personal Information</h2>
            <p class="rb__section-desc">Basic contact details that appear at the top of your resume.</p>
            <form class="rb__form" id="rb-form-personal" novalidate>
                <div class="rb__form-grid">
                    <div class="form-group">
                        <label for="rb-p-first">First Name</label>
                        <input type="text" id="rb-p-first" data-field="first_name" value="${escapeHtml(p.first_name || '')}" placeholder="Jane" />
                    </div>
                    <div class="form-group">
                        <label for="rb-p-last">Last Name</label>
                        <input type="text" id="rb-p-last" data-field="last_name" value="${escapeHtml(p.last_name || '')}" placeholder="Doe" />
                    </div>
                    <div class="form-group">
                        <label for="rb-p-email">Email</label>
                        <input type="email" id="rb-p-email" data-field="email" value="${escapeHtml(p.email || '')}" placeholder="jane@example.com" />
                    </div>
                    <div class="form-group">
                        <label for="rb-p-phone">Phone</label>
                        <input type="tel" id="rb-p-phone" data-field="phone" value="${escapeHtml(p.phone || '')}" placeholder="+1 (555) 123-4567" />
                    </div>
                    <div class="form-group">
                        <label for="rb-p-location">Location</label>
                        <input type="text" id="rb-p-location" data-field="location" value="${escapeHtml(p.location || '')}" placeholder="New York, NY" />
                    </div>
                    <div class="form-group">
                        <label for="rb-p-jobtitle">Job Title</label>
                        <input type="text" id="rb-p-jobtitle" data-field="job_title" value="${escapeHtml(p.job_title || '')}" placeholder="Senior Software Engineer" />
                    </div>
                    <div class="form-group">
                        <label for="rb-p-website">Website</label>
                        <input type="url" id="rb-p-website" data-field="website" value="${escapeHtml(p.website || '')}" placeholder="https://janedoe.com" />
                    </div>
                    <div class="form-group">
                        <label for="rb-p-linkedin">LinkedIn URL</label>
                        <input type="url" id="rb-p-linkedin" data-field="linkedin" value="${escapeHtml(p.linkedin || '')}" placeholder="https://linkedin.com/in/janedoe" />
                    </div>
                    <div class="form-group rb__form-full">
                        <label for="rb-p-github">GitHub URL</label>
                        <input type="url" id="rb-p-github" data-field="github" value="${escapeHtml(p.github || '')}" placeholder="https://github.com/janedoe" />
                    </div>
                </div>
            </form>
        </div>`;
    },

    /* --- Summary --- */
    renderSummary() {
        const content = this.data.summary?.content || '';
        const charCount = content.length;
        return `
        <div class="rb__section">
            <h2 class="rb__section-title">Professional Summary</h2>
            <p class="rb__section-desc">A brief overview of your qualifications and career goals.</p>
            <form class="rb__form" id="rb-form-summary" novalidate>
                <div class="form-group">
                    <textarea id="rb-s-content" rows="6" data-field="content"
                              placeholder="Write a brief professional summary highlighting your key qualifications and career goals...">${escapeHtml(content)}</textarea>
                    <div class="rb__char-count">
                        <span id="rb-s-charcount">${charCount}</span> characters
                    </div>
                </div>
                <button type="button" class="btn btn--ghost btn--sm" id="rb-btn-ai-summary">
                    ✨ Improve with AI
                </button>
            </form>
        </div>`;
    },

    /* --- Experience --- */
    renderExperience() {
        const entries = this.data.experience || [];
        return this._renderListSection('Experience', 'experience', entries, entry => {
            const expanded = this._expandedEntries.has(`experience-${entry.id}`);
            return `
            <div class="rb__entry ${expanded ? 'rb__entry--expanded' : ''}" data-entry-id="${entry.id}" data-section="experience">
                <div class="rb__entry-header" data-toggle-entry="experience-${entry.id}">
                    <span class="rb__entry-drag" title="Drag to reorder">⠿</span>
                    <div class="rb__entry-summary">
                        <strong>${escapeHtml(entry.position || entry.company || 'New Experience')}</strong>
                        ${entry.company && entry.position ? `<span class="rb__entry-sub">${escapeHtml(entry.company)}</span>` : ''}
                    </div>
                    <div class="rb__entry-actions">
                        <button class="btn btn--xs btn--ghost btn--danger-text" data-delete-entry="${entry.id}" data-section="experience" aria-label="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                        <span class="rb__entry-chevron">${expanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                <div class="rb__entry-body" ${expanded ? '' : 'style="display:none"'}>
                    <div class="rb__form-grid">
                        <div class="form-group">
                            <label>Company</label>
                            <input type="text" data-field="company" value="${escapeHtml(entry.company || '')}" placeholder="Acme Corp" />
                        </div>
                        <div class="form-group">
                            <label>Position</label>
                            <input type="text" data-field="position" value="${escapeHtml(entry.position || '')}" placeholder="Software Engineer" />
                        </div>
                        <div class="form-group">
                            <label>Location</label>
                            <input type="text" data-field="location" value="${escapeHtml(entry.location || '')}" placeholder="San Francisco, CA" />
                        </div>
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="month" data-field="start_date" value="${escapeHtml(entry.start_date || '')}" />
                        </div>
                        <div class="form-group">
                            <label>End Date</label>
                            <input type="month" data-field="end_date" value="${escapeHtml(entry.end_date || '')}"
                                   ${entry.is_current ? 'disabled' : ''} />
                            <label class="checkbox-label rb__present-check">
                                <input type="checkbox" data-field="is_current" ${entry.is_current ? 'checked' : ''} />
                                <span>Present</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-group rb__form-full">
                        <label>Description</label>
                        <textarea rows="5" data-field="description" placeholder="• Led a team of 5 engineers...&#10;• Improved system performance by 40%...">${escapeHtml(entry.description || '')}</textarea>
                    </div>
                </div>
            </div>`;
        });
    },

    /* --- Education --- */
    renderEducation() {
        const entries = this.data.education || [];
        return this._renderListSection('Education', 'education', entries, entry => {
            const expanded = this._expandedEntries.has(`education-${entry.id}`);
            return `
            <div class="rb__entry ${expanded ? 'rb__entry--expanded' : ''}" data-entry-id="${entry.id}" data-section="education">
                <div class="rb__entry-header" data-toggle-entry="education-${entry.id}">
                    <span class="rb__entry-drag" title="Drag to reorder">⠿</span>
                    <div class="rb__entry-summary">
                        <strong>${escapeHtml(entry.institution || 'New Education')}</strong>
                        ${entry.degree ? `<span class="rb__entry-sub">${escapeHtml(entry.degree)}${entry.field ? ` in ${escapeHtml(entry.field)}` : ''}</span>` : ''}
                    </div>
                    <div class="rb__entry-actions">
                        <button class="btn btn--xs btn--ghost btn--danger-text" data-delete-entry="${entry.id}" data-section="education" aria-label="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                        <span class="rb__entry-chevron">${expanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                <div class="rb__entry-body" ${expanded ? '' : 'style="display:none"'}>
                    <div class="rb__form-grid">
                        <div class="form-group">
                            <label>Institution</label>
                            <input type="text" data-field="institution" value="${escapeHtml(entry.institution || '')}" placeholder="MIT" />
                        </div>
                        <div class="form-group">
                            <label>Degree</label>
                            <input type="text" data-field="degree" value="${escapeHtml(entry.degree || '')}" placeholder="Bachelor of Science" />
                        </div>
                        <div class="form-group">
                            <label>Field of Study</label>
                            <input type="text" data-field="field" value="${escapeHtml(entry.field || '')}" placeholder="Computer Science" />
                        </div>
                        <div class="form-group">
                            <label>Location</label>
                            <input type="text" data-field="location" value="${escapeHtml(entry.location || '')}" placeholder="Cambridge, MA" />
                        </div>
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="month" data-field="start_date" value="${escapeHtml(entry.start_date || '')}" />
                        </div>
                        <div class="form-group">
                            <label>End Date</label>
                            <input type="month" data-field="end_date" value="${escapeHtml(entry.end_date || '')}" />
                        </div>
                        <div class="form-group">
                            <label>GPA</label>
                            <input type="text" data-field="gpa" value="${escapeHtml(entry.gpa || '')}" placeholder="3.9" />
                        </div>
                    </div>
                    <div class="form-group rb__form-full">
                        <label>Description</label>
                        <textarea rows="3" data-field="description" placeholder="Dean's List, relevant coursework...">${escapeHtml(entry.description || '')}</textarea>
                    </div>
                </div>
            </div>`;
        });
    },

    /* --- Skills --- */
    renderSkills() {
        const entries = this.data.skills || [];
        const count = entries.length;
        return `
        <div class="rb__section">
            <div class="rb__section-header-row">
                <div>
                    <h2 class="rb__section-title">Skills</h2>
                    <p class="rb__section-desc">${count} skill${count !== 1 ? 's' : ''} added</p>
                </div>
                <button class="btn btn--primary btn--sm" data-add-section="skills">+ Add Skill</button>
            </div>
            <div class="rb__skills-grid">
                ${entries.map(entry => `
                    <div class="rb__skill-card" data-entry-id="${entry.id}" data-section="skills">
                        <button class="rb__skill-delete" data-delete-entry="${entry.id}" data-section="skills" aria-label="Remove skill">&times;</button>
                        <div class="form-group">
                            <input type="text" data-field="name" value="${escapeHtml(entry.name || '')}" placeholder="Skill name" />
                        </div>
                        <div class="form-group">
                            <select data-field="level">
                                <option value="" ${!entry.level ? 'selected' : ''}>Level</option>
                                <option value="Beginner" ${entry.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
                                <option value="Intermediate" ${entry.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                                <option value="Advanced" ${entry.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
                                <option value="Expert" ${entry.level === 'Expert' ? 'selected' : ''}>Expert</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <input type="text" data-field="category" value="${escapeHtml(entry.category || '')}" placeholder="Category" />
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    /* --- Projects --- */
    renderProjects() {
        const entries = this.data.projects || [];
        return this._renderListSection('Projects', 'projects', entries, entry => {
            const expanded = this._expandedEntries.has(`projects-${entry.id}`);
            return `
            <div class="rb__entry ${expanded ? 'rb__entry--expanded' : ''}" data-entry-id="${entry.id}" data-section="projects">
                <div class="rb__entry-header" data-toggle-entry="projects-${entry.id}">
                    <span class="rb__entry-drag" title="Drag to reorder">⠿</span>
                    <div class="rb__entry-summary">
                        <strong>${escapeHtml(entry.name || 'New Project')}</strong>
                        ${entry.url ? `<span class="rb__entry-sub">${escapeHtml(entry.url)}</span>` : ''}
                    </div>
                    <div class="rb__entry-actions">
                        <button class="btn btn--xs btn--ghost btn--danger-text" data-delete-entry="${entry.id}" data-section="projects" aria-label="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                        <span class="rb__entry-chevron">${expanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                <div class="rb__entry-body" ${expanded ? '' : 'style="display:none"'}>
                    <div class="rb__form-grid">
                        <div class="form-group">
                            <label>Project Name</label>
                            <input type="text" data-field="name" value="${escapeHtml(entry.name || '')}" placeholder="My App" />
                        </div>
                        <div class="form-group">
                            <label>URL</label>
                            <input type="url" data-field="url" value="${escapeHtml(entry.url || '')}" placeholder="https://..." />
                        </div>
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="month" data-field="start_date" value="${escapeHtml(entry.start_date || '')}" />
                        </div>
                        <div class="form-group">
                            <label>End Date</label>
                            <input type="month" data-field="end_date" value="${escapeHtml(entry.end_date || '')}" />
                        </div>
                        <div class="form-group rb__form-full">
                            <label>Technologies</label>
                            <input type="text" data-field="technologies" value="${escapeHtml(entry.technologies || '')}" placeholder="React, Node.js, PostgreSQL" />
                        </div>
                    </div>
                    <div class="form-group rb__form-full">
                        <label>Description</label>
                        <textarea rows="4" data-field="description" placeholder="Describe what you built and the impact...">${escapeHtml(entry.description || '')}</textarea>
                    </div>
                </div>
            </div>`;
        });
    },

    /* --- Certifications --- */
    renderCertifications() {
        const entries = this.data.certifications || [];
        return this._renderListSection('Certifications', 'certifications', entries, entry => {
            const expanded = this._expandedEntries.has(`certifications-${entry.id}`);
            return `
            <div class="rb__entry ${expanded ? 'rb__entry--expanded' : ''}" data-entry-id="${entry.id}" data-section="certifications">
                <div class="rb__entry-header" data-toggle-entry="certifications-${entry.id}">
                    <span class="rb__entry-drag" title="Drag to reorder">⠿</span>
                    <div class="rb__entry-summary">
                        <strong>${escapeHtml(entry.name || 'New Certification')}</strong>
                        ${entry.issuer ? `<span class="rb__entry-sub">${escapeHtml(entry.issuer)}</span>` : ''}
                    </div>
                    <div class="rb__entry-actions">
                        <button class="btn btn--xs btn--ghost btn--danger-text" data-delete-entry="${entry.id}" data-section="certifications" aria-label="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                        <span class="rb__entry-chevron">${expanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                <div class="rb__entry-body" ${expanded ? '' : 'style="display:none"'}>
                    <div class="rb__form-grid">
                        <div class="form-group">
                            <label>Certification Name</label>
                            <input type="text" data-field="name" value="${escapeHtml(entry.name || '')}" placeholder="AWS Solutions Architect" />
                        </div>
                        <div class="form-group">
                            <label>Issuer</label>
                            <input type="text" data-field="issuer" value="${escapeHtml(entry.issuer || '')}" placeholder="Amazon Web Services" />
                        </div>
                        <div class="form-group">
                            <label>Date Obtained</label>
                            <input type="month" data-field="date_obtained" value="${escapeHtml(entry.date_obtained || '')}" />
                        </div>
                        <div class="form-group">
                            <label>Expiry Date</label>
                            <input type="month" data-field="expiry_date" value="${escapeHtml(entry.expiry_date || '')}" />
                        </div>
                        <div class="form-group">
                            <label>Credential ID</label>
                            <input type="text" data-field="credential_id" value="${escapeHtml(entry.credential_id || '')}" placeholder="ABC123XYZ" />
                        </div>
                        <div class="form-group">
                            <label>Credential URL</label>
                            <input type="url" data-field="url" value="${escapeHtml(entry.url || '')}" placeholder="https://..." />
                        </div>
                    </div>
                </div>
            </div>`;
        });
    },

    /* --- Awards --- */
    renderAwards() {
        const entries = this.data.awards || [];
        return this._renderListSection('Awards', 'awards', entries, entry => {
            const expanded = this._expandedEntries.has(`awards-${entry.id}`);
            return `
            <div class="rb__entry ${expanded ? 'rb__entry--expanded' : ''}" data-entry-id="${entry.id}" data-section="awards">
                <div class="rb__entry-header" data-toggle-entry="awards-${entry.id}">
                    <span class="rb__entry-drag" title="Drag to reorder">⠿</span>
                    <div class="rb__entry-summary">
                        <strong>${escapeHtml(entry.title || 'New Award')}</strong>
                        ${entry.issuer ? `<span class="rb__entry-sub">${escapeHtml(entry.issuer)}</span>` : ''}
                    </div>
                    <div class="rb__entry-actions">
                        <button class="btn btn--xs btn--ghost btn--danger-text" data-delete-entry="${entry.id}" data-section="awards" aria-label="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                        <span class="rb__entry-chevron">${expanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                <div class="rb__entry-body" ${expanded ? '' : 'style="display:none"'}>
                    <div class="rb__form-grid">
                        <div class="form-group">
                            <label>Title</label>
                            <input type="text" data-field="title" value="${escapeHtml(entry.title || '')}" placeholder="Employee of the Year" />
                        </div>
                        <div class="form-group">
                            <label>Issuer</label>
                            <input type="text" data-field="issuer" value="${escapeHtml(entry.issuer || '')}" placeholder="Acme Corp" />
                        </div>
                        <div class="form-group">
                            <label>Date Received</label>
                            <input type="month" data-field="date_received" value="${escapeHtml(entry.date_received || '')}" />
                        </div>
                    </div>
                    <div class="form-group rb__form-full">
                        <label>Description</label>
                        <textarea rows="3" data-field="description" placeholder="What was the award for?">${escapeHtml(entry.description || '')}</textarea>
                    </div>
                </div>
            </div>`;
        });
    },

    /* --- Languages --- */
    renderLanguages() {
        const entries = this.data.languages || [];
        const count = entries.length;
        return `
        <div class="rb__section">
            <div class="rb__section-header-row">
                <div>
                    <h2 class="rb__section-title">Languages</h2>
                    <p class="rb__section-desc">${count} language${count !== 1 ? 's' : ''} added</p>
                </div>
                <button class="btn btn--primary btn--sm" data-add-section="languages">+ Add Language</button>
            </div>
            <div class="rb__skills-grid">
                ${entries.map(entry => `
                    <div class="rb__skill-card" data-entry-id="${entry.id}" data-section="languages">
                        <button class="rb__skill-delete" data-delete-entry="${entry.id}" data-section="languages" aria-label="Remove language">&times;</button>
                        <div class="form-group">
                            <input type="text" data-field="name" value="${escapeHtml(entry.name || '')}" placeholder="Language" />
                        </div>
                        <div class="form-group">
                            <select data-field="proficiency">
                                <option value="" ${!entry.proficiency ? 'selected' : ''}>Proficiency</option>
                                <option value="Native" ${entry.proficiency === 'Native' ? 'selected' : ''}>Native</option>
                                <option value="Fluent" ${entry.proficiency === 'Fluent' ? 'selected' : ''}>Fluent</option>
                                <option value="Advanced" ${entry.proficiency === 'Advanced' ? 'selected' : ''}>Advanced</option>
                                <option value="Conversational" ${entry.proficiency === 'Conversational' ? 'selected' : ''}>Conversational</option>
                                <option value="Basic" ${entry.proficiency === 'Basic' ? 'selected' : ''}>Basic</option>
                            </select>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    /* --- Volunteer --- */
    renderVolunteer() {
        const entries = this.data.volunteer || [];
        return this._renderListSection('Volunteer Experience', 'volunteer', entries, entry => {
            const expanded = this._expandedEntries.has(`volunteer-${entry.id}`);
            return `
            <div class="rb__entry ${expanded ? 'rb__entry--expanded' : ''}" data-entry-id="${entry.id}" data-section="volunteer">
                <div class="rb__entry-header" data-toggle-entry="volunteer-${entry.id}">
                    <span class="rb__entry-drag" title="Drag to reorder">⠿</span>
                    <div class="rb__entry-summary">
                        <strong>${escapeHtml(entry.organization || 'New Volunteer')}</strong>
                        ${entry.role ? `<span class="rb__entry-sub">${escapeHtml(entry.role)}</span>` : ''}
                    </div>
                    <div class="rb__entry-actions">
                        <button class="btn btn--xs btn--ghost btn--danger-text" data-delete-entry="${entry.id}" data-section="volunteer" aria-label="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                        <span class="rb__entry-chevron">${expanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                <div class="rb__entry-body" ${expanded ? '' : 'style="display:none"'}>
                    <div class="rb__form-grid">
                        <div class="form-group">
                            <label>Organization</label>
                            <input type="text" data-field="organization" value="${escapeHtml(entry.organization || '')}" placeholder="Red Cross" />
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <input type="text" data-field="role" value="${escapeHtml(entry.role || '')}" placeholder="Volunteer Coordinator" />
                        </div>
                        <div class="form-group">
                            <label>Location</label>
                            <input type="text" data-field="location" value="${escapeHtml(entry.location || '')}" placeholder="Local Chapter" />
                        </div>
                        <div class="form-group">
                            <label>Start Date</label>
                            <input type="month" data-field="start_date" value="${escapeHtml(entry.start_date || '')}" />
                        </div>
                        <div class="form-group">
                            <label>End Date</label>
                            <input type="month" data-field="end_date" value="${escapeHtml(entry.end_date || '')}" />
                        </div>
                    </div>
                    <div class="form-group rb__form-full">
                        <label>Description</label>
                        <textarea rows="3" data-field="description" placeholder="Describe your volunteer work...">${escapeHtml(entry.description || '')}</textarea>
                    </div>
                </div>
            </div>`;
        });
    },

    /* --- References --- */
    renderReferences() {
        const entries = this.data.references || [];
        return this._renderListSection('References', 'references', entries, entry => {
            const expanded = this._expandedEntries.has(`references-${entry.id}`);
            return `
            <div class="rb__entry ${expanded ? 'rb__entry--expanded' : ''}" data-entry-id="${entry.id}" data-section="references">
                <div class="rb__entry-header" data-toggle-entry="references-${entry.id}">
                    <span class="rb__entry-drag" title="Drag to reorder">⠿</span>
                    <div class="rb__entry-summary">
                        <strong>${escapeHtml(entry.name || 'New Reference')}</strong>
                        ${entry.company ? `<span class="rb__entry-sub">${escapeHtml(entry.position || '')} at ${escapeHtml(entry.company)}</span>` : ''}
                    </div>
                    <div class="rb__entry-actions">
                        <button class="btn btn--xs btn--ghost btn--danger-text" data-delete-entry="${entry.id}" data-section="references" aria-label="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                        <span class="rb__entry-chevron">${expanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                <div class="rb__entry-body" ${expanded ? '' : 'style="display:none"'}>
                    <div class="rb__form-grid">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" data-field="name" value="${escapeHtml(entry.name || '')}" placeholder="John Smith" />
                        </div>
                        <div class="form-group">
                            <label>Position</label>
                            <input type="text" data-field="position" value="${escapeHtml(entry.position || '')}" placeholder="CTO" />
                        </div>
                        <div class="form-group">
                            <label>Company</label>
                            <input type="text" data-field="company" value="${escapeHtml(entry.company || '')}" placeholder="Acme Corp" />
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" data-field="email" value="${escapeHtml(entry.email || '')}" placeholder="john@acme.com" />
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" data-field="phone" value="${escapeHtml(entry.phone || '')}" placeholder="+1 (555) 987-6543" />
                        </div>
                        <div class="form-group">
                            <label>Relationship</label>
                            <input type="text" data-field="relationship" value="${escapeHtml(entry.relationship || '')}" placeholder="Former Manager" />
                        </div>
                    </div>
                </div>
            </div>`;
        });
    },

    /* --- Custom Sections --- */
    renderCustom() {
        const entries = this.data.custom_sections || [];
        return this._renderListSection('Custom Sections', 'custom', entries, entry => {
            const expanded = this._expandedEntries.has(`custom-${entry.id}`);
            return `
            <div class="rb__entry ${expanded ? 'rb__entry--expanded' : ''}" data-entry-id="${entry.id}" data-section="custom">
                <div class="rb__entry-header" data-toggle-entry="custom-${entry.id}">
                    <span class="rb__entry-drag" title="Drag to reorder">⠿</span>
                    <div class="rb__entry-summary">
                        <strong>${escapeHtml(entry.title || 'New Section')}</strong>
                    </div>
                    <div class="rb__entry-actions">
                        <button class="btn btn--xs btn--ghost btn--danger-text" data-delete-entry="${entry.id}" data-section="custom" aria-label="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                        <span class="rb__entry-chevron">${expanded ? '▲' : '▼'}</span>
                    </div>
                </div>
                <div class="rb__entry-body" ${expanded ? '' : 'style="display:none"'}>
                    <div class="form-group">
                        <label>Section Title</label>
                        <input type="text" data-field="title" value="${escapeHtml(entry.title || '')}" placeholder="Publications" />
                    </div>
                    <div class="form-group">
                        <label>Content</label>
                        <textarea rows="6" data-field="content" placeholder="Add your content here...">${escapeHtml(entry.content || '')}</textarea>
                    </div>
                </div>
            </div>`;
        });
    },

    /* ========================================================
       Helper: render a generic list section wrapper
       ======================================================== */
    _renderListSection(title, sectionKey, entries, renderEntry) {
        return `
        <div class="rb__section">
            <div class="rb__section-header-row">
                <div>
                    <h2 class="rb__section-title">${escapeHtml(title)}</h2>
                    <p class="rb__section-desc">${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}</p>
                </div>
                <button class="btn btn--primary btn--sm" data-add-section="${sectionKey}">+ Add ${escapeHtml(title.replace(/s$/, '').replace(/ Experience$/, ''))}</button>
            </div>
            <div class="rb__entries-list" data-section-list="${sectionKey}">
                ${entries.length ? entries.map(renderEntry).join('') : `<p class="rb__empty-msg">No ${title.toLowerCase()} added yet. Click the button above to add one.</p>`}
            </div>
        </div>`;
    },

    /* ========================================================
       CRUD Operations
       ======================================================== */
    async addEntry(section) {
        this._showSaveStatus('saving');
        try {
            const res = await API.post(`/api/resumes/${this.resumeId}/${section}`, {});
            const entry = res.data;

            const dataKey = section === 'custom' ? 'custom_sections' : section;
            if (!Array.isArray(this.data[dataKey])) this.data[dataKey] = [];
            this.data[dataKey].push(entry);

            this._expandedEntries.add(`${section}-${entry.id}`);

            this._showSaveStatus('saved');
            this.goToStep(this.currentStep);
            this._refreshPreview();

            requestAnimationFrame(() => {
                const newEl = document.querySelector(`[data-entry-id="${entry.id}"][data-section="${section}"]`);
                if (newEl) newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        } catch (err) {
            Toast.error(err.message || 'Failed to add entry');
            this._showSaveStatus('');
        }
    },

    async updateEntry(section, entryId, data) {
        this._showSaveStatus('saving');
        try {
            const res = await API.put(`/api/resumes/${this.resumeId}/${section}/${entryId}`, data);
            const updated = res.data;

            const dataKey = section === 'custom' ? 'custom_sections' : section;
            const arr = this.data[dataKey] || [];
            const idx = arr.findIndex(e => e.id == entryId);
            if (idx !== -1) arr[idx] = { ...arr[idx], ...updated };

            this._showSaveStatus('saved');
            this._refreshPreview();
        } catch (err) {
            Toast.error(err.message || 'Failed to save');
            this._showSaveStatus('');
        }
    },

    async deleteEntry(section, entryId) {
        Modal.confirm('Delete this entry? This cannot be undone.', async () => {
            this._showSaveStatus('saving');
            try {
                await API.del(`/api/resumes/${this.resumeId}/${section}/${entryId}`);

                const dataKey = section === 'custom' ? 'custom_sections' : section;
                this.data[dataKey] = (this.data[dataKey] || []).filter(e => e.id != entryId);
                this._expandedEntries.delete(`${section}-${entryId}`);

                this._showSaveStatus('saved');
                Toast.success('Entry deleted');
                this.goToStep(this.currentStep);
                this._refreshPreview();
            } catch (err) {
                Toast.error(err.message || 'Failed to delete');
                this._showSaveStatus('');
            }
        });
    },

    async reorderEntries(section, orderedIds) {
        this._showSaveStatus('saving');
        try {
            await API.post(`/api/resumes/${this.resumeId}/reorder`, {
                section_order: this.data.section_order || this.steps,
                entries: { [section]: orderedIds },
            });

            const dataKey = section === 'custom' ? 'custom_sections' : section;
            const arr = this.data[dataKey] || [];
            const reordered = orderedIds.map(id => arr.find(e => e.id == id)).filter(Boolean);
            this.data[dataKey] = reordered;

            this._showSaveStatus('saved');
            this._refreshPreview();
        } catch (err) {
            Toast.error(err.message || 'Failed to reorder');
            this._showSaveStatus('');
        }
    },

    /* ========================================================
       Auto-save & save status
       ======================================================== */
    scheduleAutoSave(section, data) {
        clearTimeout(this.autoSaveTimer);
        this._showSaveStatus('saving');
        this.autoSaveTimer = setTimeout(() => this.saveSection(section, data), 500);
    },

    async saveSection(section, data) {
        this._showSaveStatus('saving');
        try {
            if (section === 'personal') {
                const res = await API.put(`/api/resumes/${this.resumeId}/personal`, data);
                this.data.personal = { ...this.data.personal, ...res.data };
            } else if (section === 'summary') {
                const res = await API.put(`/api/resumes/${this.resumeId}/summary`, data);
                this.data.summary = { ...this.data.summary, ...res.data };
            } else if (section === 'title') {
                const res = await API.put(`/api/resumes/${this.resumeId}`, data);
                this.data.title = res.data.title || this.data.title;
            }
            this._showSaveStatus('saved');
            this._refreshPreview();
        } catch (err) {
            Toast.error(err.message || 'Failed to save');
            this._showSaveStatus('');
        }
    },

    _showSaveStatus(status) {
        const indicator = $('#rb-save-indicator');
        if (!indicator) return;
        clearTimeout(this._saveIndicatorTimer);

        if (status === 'saving') {
            indicator.textContent = 'Saving...';
            indicator.className = 'rb__save-indicator rb__save-indicator--saving';
        } else if (status === 'saved') {
            indicator.textContent = 'Saved ✓';
            indicator.className = 'rb__save-indicator rb__save-indicator--saved';
            this._saveIndicatorTimer = setTimeout(() => {
                indicator.textContent = '';
                indicator.className = 'rb__save-indicator';
            }, 3000);
        } else {
            indicator.textContent = '';
            indicator.className = 'rb__save-indicator';
        }
    },

    /* ========================================================
       Preview rendering
       ======================================================== */
    renderPreview() {
        switch (this.template) {
            case 'professional': return this._templateProfessional();
            case 'modern':       return this._templateModern();
            default:             return this._templateMinimal();
        }
    },

    _refreshPreview() {
        const paper = $('#rb-preview-paper');
        if (!paper) return;
        paper.innerHTML = this.renderPreview();
        this._scalePreview();
    },

    _scalePreview() {
        const container = document.querySelector('.rb__preview');
        const paper = $('#rb-preview-paper');
        if (!container || !paper) return;

        const containerWidth = container.clientWidth - 32;
        const paperWidth = 816;
        const scale = Math.min(1, containerWidth / paperWidth);
        paper.style.transform = `scale(${scale})`;
        paper.style.transformOrigin = 'top left';
        this._previewScale = scale;

        const paperHeight = 1056;
        container.style.minHeight = `${paperHeight * scale + 32}px`;
    },

    /* --------------------------------------------------------
       Preview helpers
       -------------------------------------------------------- */
    _previewPersonal() {
        return this.data.personal || {};
    },

    _previewFullName() {
        const p = this._previewPersonal();
        return [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Your Name';
    },

    _previewContactLine() {
        const p = this._previewPersonal();
        return [p.email, p.phone, p.location].filter(Boolean).join('  •  ');
    },

    _previewLinks() {
        const p = this._previewPersonal();
        return [p.website, p.linkedin, p.github].filter(Boolean);
    },

    _formatDateRange(start, end, isCurrent) {
        const fmt = d => {
            if (!d) return '';
            const parts = d.split('-');
            if (parts.length >= 2) {
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return `${months[parseInt(parts[1], 10) - 1] || ''} ${parts[0]}`;
            }
            return d;
        };
        const s = fmt(start);
        const e = isCurrent ? 'Present' : fmt(end);
        if (s && e) return `${s} – ${e}`;
        if (s) return s;
        if (e) return e;
        return '';
    },

    _descriptionToBullets(desc) {
        if (!desc) return '';
        const lines = desc.split('\n').map(l => l.replace(/^[\s•\-*]+/, '').trim()).filter(Boolean);
        if (!lines.length) return '';
        return `<ul class="rv-bullets">${lines.map(l => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`;
    },

    /* ========================================================
       Template: Minimal
       ======================================================== */
    _templateMinimal() {
        const p = this._previewPersonal();
        const color = this.accentColor;
        const summary = this.data.summary?.content || '';
        const experience = this.data.experience || [];
        const education = this.data.education || [];
        const skills = this.data.skills || [];
        const projects = this.data.projects || [];
        const certifications = this.data.certifications || [];
        const awards = this.data.awards || [];
        const languages = this.data.languages || [];
        const volunteer = this.data.volunteer || [];
        const references = this.data.references || [];
        const custom = this.data.custom_sections || [];

        const sectionHeader = title => `<div class="rv-section-header" style="border-bottom:1px solid #d1d5db;margin:14px 0 8px;padding-bottom:4px;"><strong style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:${color}">${escapeHtml(title)}</strong></div>`;

        let html = `<div class="rv rv--minimal" style="font-family:'Inter',system-ui,sans-serif;font-size:11px;color:#1f2937;padding:40px 48px;line-height:1.5;">`;

        html += `<div style="text-align:left;margin-bottom:8px;">
            <div style="font-size:24px;font-weight:700;color:#111827;">${escapeHtml(this._previewFullName())}</div>
            ${p.job_title ? `<div style="font-size:13px;color:${color};margin-top:2px;">${escapeHtml(p.job_title)}</div>` : ''}
            <div style="font-size:10px;color:#6b7280;margin-top:4px;">${escapeHtml(this._previewContactLine())}</div>
            ${this._previewLinks().length ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">${this._previewLinks().map(l => escapeHtml(l)).join('  •  ')}</div>` : ''}
        </div>`;

        if (summary) {
            html += sectionHeader('Summary');
            html += `<p style="margin:0;font-size:11px;color:#374151;">${escapeHtml(summary)}</p>`;
        }

        if (experience.length) {
            html += sectionHeader('Experience');
            experience.forEach(e => {
                html += `<div style="margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong style="font-size:11px;">${escapeHtml(e.position || '')}</strong>
                        <span style="font-size:10px;color:#6b7280;">${this._formatDateRange(e.start_date, e.end_date, e.is_current)}</span>
                    </div>
                    <div style="font-size:11px;font-style:italic;color:#4b5563;">${escapeHtml(e.company || '')}${e.location ? `, ${escapeHtml(e.location)}` : ''}</div>
                    ${this._descriptionToBullets(e.description)}
                </div>`;
            });
        }

        if (education.length) {
            html += sectionHeader('Education');
            education.forEach(e => {
                html += `<div style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong style="font-size:11px;">${escapeHtml(e.institution || '')}</strong>
                        <span style="font-size:10px;color:#6b7280;">${this._formatDateRange(e.start_date, e.end_date)}</span>
                    </div>
                    <div style="font-size:11px;color:#4b5563;">${escapeHtml(e.degree || '')}${e.field ? ` in ${escapeHtml(e.field)}` : ''}${e.gpa ? ` — GPA: ${escapeHtml(e.gpa)}` : ''}</div>
                    ${e.description ? `<p style="margin:2px 0 0;font-size:10px;color:#6b7280;">${escapeHtml(e.description)}</p>` : ''}
                </div>`;
            });
        }

        if (skills.length) {
            html += sectionHeader('Skills');
            html += `<p style="margin:0;font-size:11px;color:#374151;">${skills.map(s => escapeHtml(s.name || '')).filter(Boolean).join(', ')}</p>`;
        }

        if (projects.length) {
            html += sectionHeader('Projects');
            projects.forEach(pr => {
                html += `<div style="margin-bottom:8px;">
                    <strong style="font-size:11px;">${escapeHtml(pr.name || '')}</strong>
                    ${pr.technologies ? `<span style="font-size:10px;color:#6b7280;"> — ${escapeHtml(pr.technologies)}</span>` : ''}
                    ${pr.url ? `<div style="font-size:10px;color:${color};">${escapeHtml(pr.url)}</div>` : ''}
                    ${pr.description ? `<p style="margin:2px 0 0;font-size:10px;color:#4b5563;">${escapeHtml(pr.description)}</p>` : ''}
                </div>`;
            });
        }

        if (certifications.length) {
            html += sectionHeader('Certifications');
            certifications.forEach(c => {
                html += `<div style="margin-bottom:6px;">
                    <strong style="font-size:11px;">${escapeHtml(c.name || '')}</strong>
                    ${c.issuer ? `<span style="font-size:10px;color:#6b7280;"> — ${escapeHtml(c.issuer)}</span>` : ''}
                    ${c.date_obtained ? `<span style="font-size:10px;color:#6b7280;"> (${escapeHtml(c.date_obtained)})</span>` : ''}
                </div>`;
            });
        }

        if (awards.length) {
            html += sectionHeader('Awards');
            awards.forEach(a => {
                html += `<div style="margin-bottom:6px;">
                    <strong style="font-size:11px;">${escapeHtml(a.title || '')}</strong>
                    ${a.issuer ? `<span style="font-size:10px;color:#6b7280;"> — ${escapeHtml(a.issuer)}</span>` : ''}
                    ${a.description ? `<p style="margin:2px 0 0;font-size:10px;color:#4b5563;">${escapeHtml(a.description)}</p>` : ''}
                </div>`;
            });
        }

        if (languages.length) {
            html += sectionHeader('Languages');
            html += `<p style="margin:0;font-size:11px;color:#374151;">${languages.map(l => `${escapeHtml(l.name || '')}${l.proficiency ? ` (${escapeHtml(l.proficiency)})` : ''}`).filter(Boolean).join(', ')}</p>`;
        }

        if (volunteer.length) {
            html += sectionHeader('Volunteer Experience');
            volunteer.forEach(v => {
                html += `<div style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong style="font-size:11px;">${escapeHtml(v.role || '')} — ${escapeHtml(v.organization || '')}</strong>
                        <span style="font-size:10px;color:#6b7280;">${this._formatDateRange(v.start_date, v.end_date)}</span>
                    </div>
                    ${v.description ? `<p style="margin:2px 0 0;font-size:10px;color:#4b5563;">${escapeHtml(v.description)}</p>` : ''}
                </div>`;
            });
        }

        if (references.length) {
            html += sectionHeader('References');
            references.forEach(r => {
                html += `<div style="margin-bottom:6px;">
                    <strong style="font-size:11px;">${escapeHtml(r.name || '')}</strong>
                    ${r.position || r.company ? `<span style="font-size:10px;color:#6b7280;"> — ${escapeHtml(r.position || '')}${r.company ? ` at ${escapeHtml(r.company)}` : ''}</span>` : ''}
                    ${r.email || r.phone ? `<div style="font-size:10px;color:#6b7280;">${[r.email, r.phone].filter(Boolean).map(escapeHtml).join(' • ')}</div>` : ''}
                </div>`;
            });
        }

        custom.forEach(c => {
            if (c.title || c.content) {
                html += sectionHeader(c.title || 'Custom');
                html += `<p style="margin:0;font-size:11px;color:#374151;">${escapeHtml(c.content || '')}</p>`;
            }
        });

        html += '</div>';
        return html;
    },

    /* ========================================================
       Template: Professional (two-column)
       ======================================================== */
    _templateProfessional() {
        const p = this._previewPersonal();
        const color = this.accentColor;
        const summary = this.data.summary?.content || '';
        const experience = this.data.experience || [];
        const education = this.data.education || [];
        const skills = this.data.skills || [];
        const projects = this.data.projects || [];
        const certifications = this.data.certifications || [];
        const awards = this.data.awards || [];
        const languages = this.data.languages || [];
        const volunteer = this.data.volunteer || [];
        const references = this.data.references || [];
        const custom = this.data.custom_sections || [];

        const sideHeader = title => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#fff;margin:14px 0 6px;opacity:0.9;">${escapeHtml(title)}</div>`;
        const mainHeader = title => `<div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#111827;border-left:3px solid ${color};padding-left:8px;margin:16px 0 8px;">${escapeHtml(title)}</div>`;

        let sidebar = `<div style="background:${color};color:#fff;padding:32px 20px;width:30%;min-height:100%;box-sizing:border-box;">`;
        sidebar += `<div style="font-size:20px;font-weight:700;margin-bottom:2px;">${escapeHtml(this._previewFullName())}</div>`;
        sidebar += p.job_title ? `<div style="font-size:11px;opacity:0.85;margin-bottom:12px;">${escapeHtml(p.job_title)}</div>` : '<div style="margin-bottom:12px;"></div>';

        sidebar += sideHeader('Contact');
        [p.email, p.phone, p.location].filter(Boolean).forEach(val => {
            sidebar += `<div style="font-size:10px;margin-bottom:3px;opacity:0.9;">${escapeHtml(val)}</div>`;
        });
        this._previewLinks().forEach(l => {
            sidebar += `<div style="font-size:9px;margin-bottom:3px;word-break:break-all;opacity:0.8;">${escapeHtml(l)}</div>`;
        });

        if (skills.length) {
            sidebar += sideHeader('Skills');
            skills.forEach(s => {
                sidebar += `<div style="font-size:10px;margin-bottom:3px;">${escapeHtml(s.name || '')}${s.level ? ` <span style="opacity:0.7;font-size:9px;">(${escapeHtml(s.level)})</span>` : ''}</div>`;
            });
        }

        if (languages.length) {
            sidebar += sideHeader('Languages');
            languages.forEach(l => {
                sidebar += `<div style="font-size:10px;margin-bottom:3px;">${escapeHtml(l.name || '')}${l.proficiency ? ` <span style="opacity:0.7;font-size:9px;">(${escapeHtml(l.proficiency)})</span>` : ''}</div>`;
            });
        }

        if (education.length) {
            sidebar += sideHeader('Education');
            education.forEach(e => {
                sidebar += `<div style="margin-bottom:8px;">
                    <div style="font-size:10px;font-weight:600;">${escapeHtml(e.institution || '')}</div>
                    <div style="font-size:9px;opacity:0.85;">${escapeHtml(e.degree || '')}${e.field ? ` in ${escapeHtml(e.field)}` : ''}</div>
                    <div style="font-size:9px;opacity:0.7;">${this._formatDateRange(e.start_date, e.end_date)}</div>
                    ${e.gpa ? `<div style="font-size:9px;opacity:0.7;">GPA: ${escapeHtml(e.gpa)}</div>` : ''}
                </div>`;
            });
        }

        if (certifications.length) {
            sidebar += sideHeader('Certifications');
            certifications.forEach(c => {
                sidebar += `<div style="margin-bottom:6px;">
                    <div style="font-size:10px;font-weight:600;">${escapeHtml(c.name || '')}</div>
                    ${c.issuer ? `<div style="font-size:9px;opacity:0.8;">${escapeHtml(c.issuer)}</div>` : ''}
                </div>`;
            });
        }

        sidebar += '</div>';

        let main = `<div style="padding:32px 28px;width:70%;box-sizing:border-box;">`;

        if (summary) {
            main += mainHeader('Summary');
            main += `<p style="margin:0;font-size:11px;color:#374151;line-height:1.6;">${escapeHtml(summary)}</p>`;
        }

        if (experience.length) {
            main += mainHeader('Experience');
            experience.forEach(e => {
                main += `<div style="margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong style="font-size:11px;">${escapeHtml(e.position || '')}</strong>
                        <span style="font-size:10px;color:#6b7280;">${this._formatDateRange(e.start_date, e.end_date, e.is_current)}</span>
                    </div>
                    <div style="font-size:11px;font-style:italic;color:${color};">${escapeHtml(e.company || '')}${e.location ? `, ${escapeHtml(e.location)}` : ''}</div>
                    ${this._descriptionToBullets(e.description)}
                </div>`;
            });
        }

        if (projects.length) {
            main += mainHeader('Projects');
            projects.forEach(pr => {
                main += `<div style="margin-bottom:10px;">
                    <strong style="font-size:11px;">${escapeHtml(pr.name || '')}</strong>
                    ${pr.technologies ? `<span style="font-size:10px;color:#6b7280;"> — ${escapeHtml(pr.technologies)}</span>` : ''}
                    ${pr.url ? `<div style="font-size:10px;color:${color};">${escapeHtml(pr.url)}</div>` : ''}
                    ${pr.description ? `<p style="margin:2px 0 0;font-size:10px;color:#4b5563;">${escapeHtml(pr.description)}</p>` : ''}
                </div>`;
            });
        }

        if (awards.length) {
            main += mainHeader('Awards');
            awards.forEach(a => {
                main += `<div style="margin-bottom:6px;">
                    <strong style="font-size:11px;">${escapeHtml(a.title || '')}</strong>
                    ${a.issuer ? ` — <span style="font-size:10px;color:#6b7280;">${escapeHtml(a.issuer)}</span>` : ''}
                    ${a.description ? `<p style="margin:2px 0 0;font-size:10px;color:#4b5563;">${escapeHtml(a.description)}</p>` : ''}
                </div>`;
            });
        }

        if (volunteer.length) {
            main += mainHeader('Volunteer');
            volunteer.forEach(v => {
                main += `<div style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong style="font-size:11px;">${escapeHtml(v.role || '')} — ${escapeHtml(v.organization || '')}</strong>
                        <span style="font-size:10px;color:#6b7280;">${this._formatDateRange(v.start_date, v.end_date)}</span>
                    </div>
                    ${v.description ? `<p style="margin:2px 0 0;font-size:10px;color:#4b5563;">${escapeHtml(v.description)}</p>` : ''}
                </div>`;
            });
        }

        if (references.length) {
            main += mainHeader('References');
            references.forEach(r => {
                main += `<div style="margin-bottom:6px;">
                    <strong style="font-size:11px;">${escapeHtml(r.name || '')}</strong>
                    ${r.position || r.company ? ` — <span style="font-size:10px;color:#6b7280;">${escapeHtml(r.position || '')}${r.company ? ` at ${escapeHtml(r.company)}` : ''}</span>` : ''}
                    ${r.email || r.phone ? `<div style="font-size:10px;color:#6b7280;">${[r.email, r.phone].filter(Boolean).map(escapeHtml).join(' • ')}</div>` : ''}
                </div>`;
            });
        }

        custom.forEach(c => {
            if (c.title || c.content) {
                main += mainHeader(c.title || 'Custom');
                main += `<p style="margin:0;font-size:11px;color:#374151;">${escapeHtml(c.content || '')}</p>`;
            }
        });

        main += '</div>';

        return `<div class="rv rv--professional" style="font-family:'Inter',system-ui,sans-serif;font-size:11px;display:flex;min-height:1056px;color:#1f2937;line-height:1.5;">${sidebar}${main}</div>`;
    },

    /* ========================================================
       Template: Modern
       ======================================================== */
    _templateModern() {
        const p = this._previewPersonal();
        const color = this.accentColor;
        const summary = this.data.summary?.content || '';
        const experience = this.data.experience || [];
        const education = this.data.education || [];
        const skills = this.data.skills || [];
        const projects = this.data.projects || [];
        const certifications = this.data.certifications || [];
        const awards = this.data.awards || [];
        const languages = this.data.languages || [];
        const volunteer = this.data.volunteer || [];
        const references = this.data.references || [];
        const custom = this.data.custom_sections || [];

        const sectionHeader = title => `<div style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding:4px 14px;border-radius:12px;margin:16px 0 10px;">${escapeHtml(title)}</div>`;

        let html = `<div class="rv rv--modern" style="font-family:'Inter',system-ui,sans-serif;font-size:11px;color:#1f2937;padding:36px 44px;line-height:1.5;">`;

        html += `<div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:28px;font-weight:700;color:${color};">${escapeHtml(this._previewFullName())}</div>
            ${p.job_title ? `<div style="font-size:13px;color:#4b5563;margin-top:4px;">${escapeHtml(p.job_title)}</div>` : ''}
            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:10px;">
                ${[p.email, p.phone, p.location].filter(Boolean).map(v =>
                    `<span style="font-size:10px;background:#f3f4f6;color:#374151;padding:3px 10px;border-radius:10px;">${escapeHtml(v)}</span>`
                ).join('')}
                ${this._previewLinks().map(l =>
                    `<span style="font-size:10px;background:#f3f4f6;color:#374151;padding:3px 10px;border-radius:10px;">${escapeHtml(l)}</span>`
                ).join('')}
            </div>
        </div>`;

        if (summary) {
            html += `<div style="text-align:center;">${sectionHeader('Summary')}</div>`;
            html += `<p style="margin:0;font-size:11px;color:#374151;text-align:center;max-width:560px;margin:0 auto;">${escapeHtml(summary)}</p>`;
        }

        if (experience.length) {
            html += sectionHeader('Experience');
            experience.forEach(e => {
                html += `<div style="margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong style="font-size:12px;color:${color};">${escapeHtml(e.position || '')}</strong>
                        <span style="font-size:10px;color:#9ca3af;background:#f9fafb;padding:2px 8px;border-radius:8px;">${this._formatDateRange(e.start_date, e.end_date, e.is_current)}</span>
                    </div>
                    <div style="font-size:11px;color:#4b5563;">${escapeHtml(e.company || '')}${e.location ? ` — ${escapeHtml(e.location)}` : ''}</div>
                    ${this._descriptionToBullets(e.description)}
                </div>`;
            });
        }

        if (education.length) {
            html += sectionHeader('Education');
            education.forEach(e => {
                html += `<div style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong style="font-size:11px;">${escapeHtml(e.institution || '')}</strong>
                        <span style="font-size:10px;color:#9ca3af;">${this._formatDateRange(e.start_date, e.end_date)}</span>
                    </div>
                    <div style="font-size:11px;color:#4b5563;">${escapeHtml(e.degree || '')}${e.field ? ` in ${escapeHtml(e.field)}` : ''}${e.gpa ? ` — GPA: ${escapeHtml(e.gpa)}` : ''}</div>
                </div>`;
            });
        }

        if (skills.length) {
            html += sectionHeader('Skills');
            html += `<div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${skills.map(s => `<span style="font-size:10px;background:#f3f4f6;color:#374151;padding:4px 12px;border-radius:10px;border:1px solid #e5e7eb;">${escapeHtml(s.name || '')}${s.level ? ` <span style="color:#9ca3af;font-size:9px;">· ${escapeHtml(s.level)}</span>` : ''}</span>`).join('')}
            </div>`;
        }

        if (projects.length) {
            html += sectionHeader('Projects');
            projects.forEach(pr => {
                html += `<div style="margin-bottom:10px;">
                    <strong style="font-size:11px;color:${color};">${escapeHtml(pr.name || '')}</strong>
                    ${pr.technologies ? `<span style="font-size:10px;color:#6b7280;"> — ${escapeHtml(pr.technologies)}</span>` : ''}
                    ${pr.url ? `<div style="font-size:10px;color:${color};">${escapeHtml(pr.url)}</div>` : ''}
                    ${pr.description ? `<p style="margin:2px 0 0;font-size:10px;color:#4b5563;">${escapeHtml(pr.description)}</p>` : ''}
                </div>`;
            });
        }

        if (certifications.length) {
            html += sectionHeader('Certifications');
            certifications.forEach(c => {
                html += `<div style="margin-bottom:6px;">
                    <strong style="font-size:11px;">${escapeHtml(c.name || '')}</strong>
                    ${c.issuer ? ` — <span style="font-size:10px;color:#6b7280;">${escapeHtml(c.issuer)}</span>` : ''}
                </div>`;
            });
        }

        if (awards.length) {
            html += sectionHeader('Awards');
            awards.forEach(a => {
                html += `<div style="margin-bottom:6px;">
                    <strong style="font-size:11px;">${escapeHtml(a.title || '')}</strong>
                    ${a.issuer ? ` — <span style="font-size:10px;color:#6b7280;">${escapeHtml(a.issuer)}</span>` : ''}
                </div>`;
            });
        }

        if (languages.length) {
            html += sectionHeader('Languages');
            html += `<div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${languages.map(l => `<span style="font-size:10px;background:#f3f4f6;color:#374151;padding:4px 12px;border-radius:10px;">${escapeHtml(l.name || '')}${l.proficiency ? ` · ${escapeHtml(l.proficiency)}` : ''}</span>`).join('')}
            </div>`;
        }

        if (volunteer.length) {
            html += sectionHeader('Volunteer');
            volunteer.forEach(v => {
                html += `<div style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;">
                        <strong style="font-size:11px;">${escapeHtml(v.role || '')} — ${escapeHtml(v.organization || '')}</strong>
                        <span style="font-size:10px;color:#9ca3af;">${this._formatDateRange(v.start_date, v.end_date)}</span>
                    </div>
                    ${v.description ? `<p style="margin:2px 0 0;font-size:10px;color:#4b5563;">${escapeHtml(v.description)}</p>` : ''}
                </div>`;
            });
        }

        if (references.length) {
            html += sectionHeader('References');
            references.forEach(r => {
                html += `<div style="margin-bottom:6px;">
                    <strong style="font-size:11px;">${escapeHtml(r.name || '')}</strong>
                    ${r.position || r.company ? ` — <span style="font-size:10px;color:#6b7280;">${escapeHtml(r.position || '')}${r.company ? ` at ${escapeHtml(r.company)}` : ''}</span>` : ''}
                </div>`;
            });
        }

        custom.forEach(c => {
            if (c.title || c.content) {
                html += sectionHeader(c.title || 'Custom');
                html += `<p style="margin:0;font-size:11px;color:#374151;">${escapeHtml(c.content || '')}</p>`;
            }
        });

        html += '</div>';
        return html;
    },

    /* ========================================================
       Export PDF
       ======================================================== */
    async exportPDF() {
        const previewHtml = this.renderPreview();
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            Toast.error('Pop-up blocked. Please allow pop-ups for this site.');
            return;
        }

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${escapeHtml(this.data.title || 'Resume')} — JobCollar</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: letter; margin: 0; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .rv-bullets { margin: 4px 0 0 16px; padding: 0; }
        .rv-bullets li { margin-bottom: 2px; font-size: 10px; color: #374151; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>${previewHtml}</body>
</html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    },

    /* ========================================================
       ATS Check
       ======================================================== */
    async checkATS() {
        this._openSlideOver('ATS Compatibility Check', '<div class="rb__loading">Analyzing your resume...</div>');
        try {
            const res = await API.post('/api/ats/check', { resume_id: this.resumeId });
            const d = res.data;
            this._renderSlideOverBody(this._buildATSPanel(d));
        } catch (err) {
            this._renderSlideOverBody(`<div class="rb__error-msg">Failed to run ATS check. ${escapeHtml(err.message || '')}</div>`);
        }
    },

    _buildATSPanel(d) {
        const scoreColor = d.score >= 70 ? '#22c55e' : d.score >= 40 ? '#f59e0b' : '#ef4444';

        let html = `<div class="rb__ats-panel">`;

        html += `<div class="rb__gauge">
            <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="${scoreColor}" stroke-width="10"
                        stroke-dasharray="${Math.PI * 100}" stroke-dashoffset="${Math.PI * 100 * (1 - d.score / 100)}"
                        transform="rotate(-90 60 60)" stroke-linecap="round"/>
                <text x="60" y="60" text-anchor="middle" dominant-baseline="central" font-size="28" font-weight="700" fill="${scoreColor}">${d.score}</text>
            </svg>
            <div class="rb__gauge-label">ATS Score</div>
        </div>`;

        if (d.checks) {
            const checkLabels = {
                section_completeness: 'Section Completeness',
                action_verbs: 'Action Verbs',
                numbers: 'Quantified Achievements',
                length: 'Resume Length',
                keyword_density: 'Keyword Density',
                formatting: 'Formatting',
                readability: 'Readability',
            };
            html += '<div class="rb__checks">';
            for (const [key, check] of Object.entries(d.checks)) {
                const label = checkLabels[key] || key;
                const barColor = check.pass ? '#22c55e' : check.score >= 40 ? '#f59e0b' : '#ef4444';
                html += `
                <div class="rb__check-row">
                    <div class="rb__check-label">
                        <span>${escapeHtml(label)}</span>
                        <span class="rb__check-score">${check.score}%</span>
                    </div>
                    <div class="rb__check-bar">
                        <div class="rb__check-bar-fill" style="width:${check.score}%;background:${barColor}"></div>
                    </div>
                </div>`;
            }
            html += '</div>';
        }

        if (d.suggestions?.length) {
            html += '<div class="rb__suggestions"><h3>Suggestions</h3><ul>';
            d.suggestions.forEach(s => {
                html += `<li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ${escapeHtml(s)}
                </li>`;
            });
            html += '</ul></div>';
        }

        html += '</div>';
        return html;
    },

    /* ========================================================
       Score Check
       ======================================================== */
    async checkScore() {
        this._openSlideOver('Resume Quality Score', '<div class="rb__loading">Calculating your score...</div>');
        try {
            const res = await API.post('/api/score/check', { resume_id: this.resumeId });
            const d = res.data;
            this._renderSlideOverBody(this._buildScorePanel(d));
        } catch (err) {
            this._renderSlideOverBody(`<div class="rb__error-msg">Failed to check score. ${escapeHtml(err.message || '')}</div>`);
        }
    },

    _buildScorePanel(d) {
        const scoreColor = d.score >= 70 ? '#22c55e' : d.score >= 40 ? '#f59e0b' : '#ef4444';

        let html = `<div class="rb__ats-panel">`;

        html += `<div class="rb__gauge">
            <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="${scoreColor}" stroke-width="10"
                        stroke-dasharray="${Math.PI * 100}" stroke-dashoffset="${Math.PI * 100 * (1 - d.score / 100)}"
                        transform="rotate(-90 60 60)" stroke-linecap="round"/>
                <text x="60" y="60" text-anchor="middle" dominant-baseline="central" font-size="28" font-weight="700" fill="${scoreColor}">${d.score}</text>
            </svg>
            <div class="rb__gauge-label">Quality Score</div>
        </div>`;

        if (d.breakdown) {
            const breakdownLabels = {
                completeness: 'Completeness',
                achievements: 'Achievements',
                keywords: 'Keywords & Skills',
                formatting: 'Formatting',
                length: 'Length',
            };
            html += '<div class="rb__checks">';
            for (const [key, section] of Object.entries(d.breakdown)) {
                const label = breakdownLabels[key] || key;
                const barColor = section.score >= 70 ? '#22c55e' : section.score >= 40 ? '#f59e0b' : '#ef4444';
                html += `
                <div class="rb__check-row">
                    <div class="rb__check-label">
                        <span>${escapeHtml(label)}</span>
                        <span class="rb__check-score">${section.score}%</span>
                    </div>
                    <div class="rb__check-bar">
                        <div class="rb__check-bar-fill" style="width:${section.score}%;background:${barColor}"></div>
                    </div>
                </div>`;
            }
            html += '</div>';
        }

        if (d.suggestions?.length) {
            html += '<div class="rb__suggestions"><h3>Suggestions</h3><ul>';
            d.suggestions.forEach(s => {
                html += `<li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    ${escapeHtml(s)}
                </li>`;
            });
            html += '</ul></div>';
        }

        html += '</div>';
        return html;
    },

    /* ========================================================
       Template & color switchers
       ======================================================== */
    changeTemplate(template) {
        this.template = template;
        this.data.template = template;
        API.put(`/api/resumes/${this.resumeId}`, { template }).catch(() => {});
        this._refreshPreview();
    },

    changeColor(color) {
        this.accentColor = color;
        this.data.color = color;
        API.put(`/api/resumes/${this.resumeId}`, { color }).catch(() => {});

        document.querySelectorAll('.rb__color-swatch').forEach(swatch => {
            swatch.classList.toggle('rb__color-swatch--active', swatch.dataset.color === color);
        });

        this._refreshPreview();
    },

    /* ========================================================
       Slide-over panel (ATS / Score)
       ======================================================== */
    _openSlideOver(title, bodyHtml) {
        const slideover = $('#rb-slideover');
        const titleEl = $('#rb-slideover-title');
        const bodyEl = $('#rb-slideover-body');
        if (!slideover) return;

        titleEl.textContent = title;
        bodyEl.innerHTML = bodyHtml;
        slideover.classList.add('rb__slideover--open');
        slideover.setAttribute('aria-hidden', 'false');
    },

    _closeSlideOver() {
        const slideover = $('#rb-slideover');
        if (!slideover) return;
        slideover.classList.remove('rb__slideover--open');
        slideover.setAttribute('aria-hidden', 'true');
    },

    _renderSlideOverBody(html) {
        const body = $('#rb-slideover-body');
        if (body) body.innerHTML = html;
    },

    /* ========================================================
       Event binding: header
       ======================================================== */
    _bindHeaderEvents() {
        const titleInput = $('#rb-title');
        if (titleInput) {
            const debouncedSaveTitle = debounce(value => {
                this.saveSection('title', { title: value });
            }, 800);

            titleInput.addEventListener('input', e => {
                debouncedSaveTitle(e.target.value.trim());
            });

            titleInput.addEventListener('blur', () => {
                const value = titleInput.value.trim();
                if (value) this.saveSection('title', { title: value });
            });
        }

        const templateSelect = $('#rb-template-select');
        if (templateSelect) {
            templateSelect.addEventListener('change', e => this.changeTemplate(e.target.value));
        }

        const colorPicker = $('#rb-color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('click', e => {
                const swatch = e.target.closest('[data-color]');
                if (swatch) this.changeColor(swatch.dataset.color);
            });
        }

        const atsBtn = $('#rb-btn-ats');
        if (atsBtn) atsBtn.addEventListener('click', () => this.checkATS());

        const scoreBtn = $('#rb-btn-score');
        if (scoreBtn) scoreBtn.addEventListener('click', () => this.checkScore());

        const exportBtn = $('#rb-btn-export');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportPDF());

        const previewToggle = $('#rb-preview-toggle');
        if (previewToggle) {
            previewToggle.addEventListener('click', () => {
                this._mobilePreviewOpen = !this._mobilePreviewOpen;
                const preview = $('#rb-preview');
                if (preview) {
                    preview.classList.toggle('rb__preview--open', this._mobilePreviewOpen);
                    if (this._mobilePreviewOpen) this._scalePreview();
                }
            });
        }

        const slideoverClose = $('#rb-slideover-close');
        if (slideoverClose) slideoverClose.addEventListener('click', () => this._closeSlideOver());

        const slideoverBackdrop = $('#rb-slideover-backdrop');
        if (slideoverBackdrop) slideoverBackdrop.addEventListener('click', () => this._closeSlideOver());
    },

    /* ========================================================
       Event binding: step navigation
       ======================================================== */
    _bindStepNavEvents() {
        document.querySelectorAll('.rb__step[data-step-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.goToStep(parseInt(btn.dataset.stepIndex, 10));
            });
        });
    },

    /* ========================================================
       Event binding: editor panel
       ======================================================== */
    _bindEditorEvents() {
        const prevBtn = $('#rb-btn-prev');
        if (prevBtn) prevBtn.addEventListener('click', () => this.goToStep(this.currentStep - 1));

        const nextBtn = $('#rb-btn-next');
        if (nextBtn) nextBtn.addEventListener('click', () => this.goToStep(this.currentStep + 1));

        const step = this.steps[this.currentStep];

        if (step === 'personal') {
            this._bindPersonalAutoSave();
        } else if (step === 'summary') {
            this._bindSummaryAutoSave();
        } else if (step === 'skills' || step === 'languages') {
            this._bindCompactAutoSave(step);
        } else {
            this._bindListAutoSave(step);
        }

        this._bindAddButtons();
        this._bindDeleteButtons();
        this._bindToggleEntries();
        this._bindAIButton();
    },

    /* --------------------------------------------------------
       Personal auto-save: each input field saves on blur
       -------------------------------------------------------- */
    _bindPersonalAutoSave() {
        const form = $('#rb-form-personal');
        if (!form) return;

        const debouncedSave = debounce(() => {
            const data = {};
            form.querySelectorAll('[data-field]').forEach(input => {
                data[input.dataset.field] = input.value.trim();
            });
            this.saveSection('personal', data);
        }, 500);

        form.querySelectorAll('input[data-field]').forEach(input => {
            input.addEventListener('input', debouncedSave);
            input.addEventListener('blur', () => {
                clearTimeout(this.autoSaveTimer);
                const data = {};
                form.querySelectorAll('[data-field]').forEach(el => {
                    data[el.dataset.field] = el.value.trim();
                });
                this.saveSection('personal', data);
            });
        });
    },

    /* --------------------------------------------------------
       Summary auto-save: textarea saves on input (debounced)
       -------------------------------------------------------- */
    _bindSummaryAutoSave() {
        const textarea = $('#rb-s-content');
        if (!textarea) return;

        const charCountEl = $('#rb-s-charcount');
        const debouncedSave = debounce(() => {
            this.saveSection('summary', { content: textarea.value });
        }, 1000);

        textarea.addEventListener('input', () => {
            if (charCountEl) charCountEl.textContent = textarea.value.length;
            debouncedSave();
        });

        textarea.addEventListener('blur', () => {
            this.saveSection('summary', { content: textarea.value });
        });
    },

    /* --------------------------------------------------------
       Compact section auto-save (skills, languages)
       -------------------------------------------------------- */
    _bindCompactAutoSave(section) {
        const cards = document.querySelectorAll(`.rb__skill-card[data-section="${section}"]`);
        cards.forEach(card => {
            const entryId = card.dataset.entryId;
            const debouncedUpdate = debounce(() => {
                const data = {};
                card.querySelectorAll('[data-field]').forEach(el => {
                    data[el.dataset.field] = el.value;
                });
                this.updateEntry(section, entryId, data);
            }, 500);

            card.querySelectorAll('input[data-field], select[data-field]').forEach(el => {
                el.addEventListener('input', debouncedUpdate);
                el.addEventListener('change', debouncedUpdate);
                el.addEventListener('blur', () => {
                    const data = {};
                    card.querySelectorAll('[data-field]').forEach(f => {
                        data[f.dataset.field] = f.value;
                    });
                    this.updateEntry(section, entryId, data);
                });
            });
        });
    },

    /* --------------------------------------------------------
       List section auto-save (experience, education, etc.)
       -------------------------------------------------------- */
    _bindListAutoSave(section) {
        const entries = document.querySelectorAll(`.rb__entry[data-section="${section}"]`);
        entries.forEach(entryEl => {
            const entryId = entryEl.dataset.entryId;

            const debouncedUpdate = debounce(() => {
                const data = {};
                entryEl.querySelectorAll('[data-field]').forEach(el => {
                    if (el.type === 'checkbox') {
                        data[el.dataset.field] = el.checked ? 1 : 0;
                    } else {
                        data[el.dataset.field] = el.value;
                    }
                });
                this.updateEntry(section, entryId, data);
            }, 500);

            entryEl.querySelectorAll('input[data-field], textarea[data-field], select[data-field]').forEach(el => {
                el.addEventListener('input', debouncedUpdate);
                el.addEventListener('change', e => {
                    if (el.type === 'checkbox' && el.dataset.field === 'is_current') {
                        const endDateInput = entryEl.querySelector('input[data-field="end_date"]');
                        if (endDateInput) {
                            endDateInput.disabled = el.checked;
                            if (el.checked) endDateInput.value = '';
                        }
                    }
                    debouncedUpdate();
                });
                el.addEventListener('blur', () => {
                    const data = {};
                    entryEl.querySelectorAll('[data-field]').forEach(f => {
                        if (f.type === 'checkbox') {
                            data[f.dataset.field] = f.checked ? 1 : 0;
                        } else {
                            data[f.dataset.field] = f.value;
                        }
                    });
                    this.updateEntry(section, entryId, data);
                });
            });
        });
    },

    /* --------------------------------------------------------
       Add entry buttons
       -------------------------------------------------------- */
    _bindAddButtons() {
        document.querySelectorAll('[data-add-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addEntry(btn.dataset.addSection);
            });
        });
    },

    /* --------------------------------------------------------
       Delete entry buttons
       -------------------------------------------------------- */
    _bindDeleteButtons() {
        document.querySelectorAll('[data-delete-entry]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this.deleteEntry(btn.dataset.section, btn.dataset.deleteEntry);
            });
        });
    },

    /* --------------------------------------------------------
       Toggle (expand/collapse) entries
       -------------------------------------------------------- */
    _bindToggleEntries() {
        document.querySelectorAll('[data-toggle-entry]').forEach(header => {
            header.addEventListener('click', e => {
                if (e.target.closest('[data-delete-entry]')) return;

                const key = header.dataset.toggleEntry;
                const entryEl = header.closest('.rb__entry');
                const body = entryEl?.querySelector('.rb__entry-body');
                const chevron = entryEl?.querySelector('.rb__entry-chevron');
                if (!body) return;

                const isExpanded = this._expandedEntries.has(key);
                if (isExpanded) {
                    this._expandedEntries.delete(key);
                    body.style.display = 'none';
                    entryEl.classList.remove('rb__entry--expanded');
                    if (chevron) chevron.textContent = '▼';
                } else {
                    this._expandedEntries.add(key);
                    body.style.display = '';
                    entryEl.classList.add('rb__entry--expanded');
                    if (chevron) chevron.textContent = '▲';
                }
            });
        });
    },

    /* --------------------------------------------------------
       AI button (stub)
       -------------------------------------------------------- */
    _bindAIButton() {
        const aiBtn = $('#rb-btn-ai-summary');
        if (aiBtn) {
            aiBtn.addEventListener('click', () => {
                Toast.info('AI features coming soon');
            });
        }
    },
};
