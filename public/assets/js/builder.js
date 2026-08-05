(function() {
    'use strict';

    var RESUME_ID = window.__RESUME_ID__;
    if (!RESUME_ID) return;

    // ==========================================
    // RESUME BUILDER
    // ==========================================

    var ResumeBuilder = {
        resumeId: RESUME_ID,
        data: null,
        currentStep: 0,
        steps: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'languages', 'volunteer', 'references'],
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
            references: 'References'
        },
        stepIcons: {
            personal: '👤',
            summary: '📝',
            experience: '💼',
            education: '🎓',
            skills: '⚡',
            projects: '🚀',
            certifications: '📜',
            awards: '🏆',
            languages: '🌐',
            volunteer: '❤',
            references: '📋'
        },
        autoSaveTimeout: null,
        saveState: 'idle',
        isMobile: window.innerWidth < 1024,
        showPreviewMobile: false,
        expandedEntries: {},

        // ------------------------------------------
        // INITIALIZATION
        // ------------------------------------------

        init: function() {
            var self = this;
            this.isMobile = window.innerWidth < 1024;

            window.addEventListener('resize', debounce(function() {
                var wasMobile = self.isMobile;
                self.isMobile = window.innerWidth < 1024;
                if (wasMobile !== self.isMobile) {
                    self.renderLayout();
                    self.renderStep();
                    self.renderPreview();
                }
            }, 300));

            this.load();
        },

        load: function() {
            var self = this;

            API.get('/api/resumes/' + this.resumeId)
                .then(function(res) {
                    self.data = res.data;
                    self.initExpandedState();
                    self.renderLayout();
                    self.renderStep();
                    self.renderPreview();
                })
                .catch(function(err) {
                    var mainContent = document.querySelector('.main-content');
                    if (mainContent) {
                        mainContent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;padding:2rem;">' +
                            '<div style="text-align:center;max-width:400px;">' +
                            '<div style="font-size:3rem;margin-bottom:1rem;">😕</div>' +
                            '<h2 style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem;">Failed to load resume</h2>' +
                            '<p style="color:var(--color-gray-500);margin-bottom:1.5rem;">' + escapeHtml(err.message) + '</p>' +
                            '<a href="/dashboard" class="btn btn-primary">Back to Dashboard</a>' +
                            '</div></div>';
                    }
                });
        },

        initExpandedState: function() {
            var self = this;
            this.steps.forEach(function(step) {
                var items = self.data[step];
                if (Array.isArray(items)) {
                    items.forEach(function(item) {
                        if (item && item.id) {
                            self.expandedEntries[step + '_' + item.id] = false;
                        }
                    });
                }
            });
        },

        // ------------------------------------------
        // LAYOUT RENDERING
        // ------------------------------------------

        renderLayout: function() {
            var mainContent = document.querySelector('.main-content');
            if (!mainContent) return;

            mainContent.innerHTML = '';
            mainContent.className = 'main-content builder-content';
            mainContent.style.cssText = 'padding:0;display:flex;flex-direction:column;height:100vh;overflow:hidden;margin-left:260px;';

            // Check mobile
            if (this.isMobile) {
                mainContent.style.marginLeft = '0';
            }

            // Top bar
            var topBar = document.createElement('div');
            topBar.className = 'builder-topbar';
            topBar.style.cssText = 'display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1.25rem;border-bottom:1px solid var(--color-gray-200);background:#fff;flex-shrink:0;min-height:56px;';

            var html = '';
            html += '<a href="/dashboard" class="btn btn-ghost" style="font-size:0.8125rem;padding:0.375rem 0.625rem;flex-shrink:0;">&larr; Back</a>';
            html += '<input type="text" class="builder-title-input" value="' + escapeHtml(this.data.title || 'Untitled') + '" style="flex:1;border:1px solid transparent;font-size:1rem;font-weight:600;padding:0.375rem 0.625rem;border-radius:0.375rem;background:transparent;outline:none;min-width:0;transition:border-color 0.2s,background 0.2s;" onfocus="this.style.borderColor=\'var(--color-gray-300)\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'" />';
            html += '<span class="save-indicator" style="font-size:0.75rem;color:var(--color-success);white-space:nowrap;flex-shrink:0;">✓ Saved</span>';

            if (this.isMobile) {
                html += '<button class="btn btn-outline mobile-preview-toggle" style="font-size:0.75rem;padding:0.375rem 0.625rem;flex-shrink:0;">' + (this.showPreviewMobile ? '✏ Edit' : '👁 Preview') + '</button>';
            }

            html += '<select class="template-select" style="padding:0.375rem 0.625rem;border:1px solid var(--color-gray-300);border-radius:0.375rem;font-size:0.8125rem;background:#fff;cursor:pointer;flex-shrink:0;">';
            html += '<option value="minimal"' + (this.data.template === 'minimal' ? ' selected' : '') + '>Minimal</option>';
            html += '<option value="professional"' + ((this.data.template === 'professional' || !this.data.template) ? ' selected' : '') + '>Professional</option>';
            html += '<option value="modern"' + (this.data.template === 'modern' ? ' selected' : '') + '>Modern</option>';
            html += '</select>';
            html += '<button class="btn btn-primary export-pdf-btn" style="font-size:0.8125rem;padding:0.5rem 0.875rem;flex-shrink:0;">Export PDF</button>';

            topBar.innerHTML = html;
            mainContent.appendChild(topBar);

            // Progress indicator
            var progress = document.createElement('div');
            progress.className = 'builder-progress';
            progress.style.cssText = 'padding:0.625rem 1.25rem;border-bottom:1px solid var(--color-gray-200);background:#fff;flex-shrink:0;overflow-x:auto;-webkit-overflow-scrolling:touch;';
            progress.innerHTML = this.renderProgress();
            mainContent.appendChild(progress);

            // Two-panel body
            var body = document.createElement('div');
            body.className = 'builder-body';
            body.style.cssText = 'display:flex;flex:1;overflow:hidden;';

            if (this.isMobile && this.showPreviewMobile) {
                body.innerHTML = '<div class="builder-preview-panel" style="flex:1;overflow-y:auto;padding:1.5rem;background:var(--color-gray-100);display:flex;justify-content:center;align-items:flex-start;"></div>';
            } else if (this.isMobile) {
                body.innerHTML = '<div class="builder-form-panel" style="flex:1;overflow-y:auto;padding:1.5rem;"></div>';
            } else {
                body.innerHTML = '<div class="builder-form-panel" style="flex:1;overflow-y:auto;padding:2rem 1.5rem;min-width:0;max-width:680px;"></div>' +
                    '<div class="builder-preview-panel" style="flex:1;overflow-y:auto;padding:1.5rem;background:var(--color-gray-100);border-left:1px solid var(--color-gray-200);display:flex;justify-content:center;align-items:flex-start;"></div>';
            }

            mainContent.appendChild(body);

            this.attachTopBarEvents();
        },

        attachTopBarEvents: function() {
            var self = this;

            var titleInput = document.querySelector('.builder-title-input');
            if (titleInput) {
                titleInput.addEventListener('change', function() {
                    var title = this.value.trim() || 'Untitled';
                    self.data.title = title;
                    self.setSaveState('saving');
                    API.put('/api/resumes/' + self.resumeId, { title: title })
                        .then(function() { self.setSaveState('saved'); })
                        .catch(function() { self.setSaveState('error'); });
                });
                titleInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') this.blur();
                });
            }

            var templateSelect = document.querySelector('.template-select');
            if (templateSelect) {
                templateSelect.addEventListener('change', function() {
                    self.data.template = this.value;
                    self.setSaveState('saving');
                    API.put('/api/resumes/' + self.resumeId, { template: this.value })
                        .then(function() {
                            self.setSaveState('saved');
                            self.renderPreview();
                        })
                        .catch(function() { self.setSaveState('error'); });
                });
            }

            var exportBtn = document.querySelector('.export-pdf-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', function() { self.exportPDF(); });
            }

            var mobileToggle = document.querySelector('.mobile-preview-toggle');
            if (mobileToggle) {
                mobileToggle.addEventListener('click', function() {
                    self.showPreviewMobile = !self.showPreviewMobile;
                    self.renderLayout();
                    if (self.showPreviewMobile) {
                        self.renderPreview();
                    } else {
                        self.renderStep();
                    }
                });
            }

            this.attachProgressEvents();
        },

        attachProgressEvents: function() {
            var self = this;
            var dots = document.querySelectorAll('.progress-step');
            dots.forEach(function(dot) {
                dot.addEventListener('click', function() {
                    var idx = parseInt(this.getAttribute('data-step'), 10);
                    self.goToStep(idx);
                });
            });
        },

        // ------------------------------------------
        // PROGRESS INDICATOR
        // ------------------------------------------

        renderProgress: function() {
            var html = '<div style="display:flex;align-items:center;gap:0.125rem;min-width:max-content;">';
            var self = this;
            this.steps.forEach(function(step, i) {
                var isCurrent = i === self.currentStep;
                var isComplete = self.isStepComplete(step);
                var bg = isCurrent ? 'var(--color-primary)' : (isComplete ? 'var(--color-success)' : 'var(--color-gray-200)');
                var color = (isCurrent || isComplete) ? '#fff' : 'var(--color-gray-500)';
                var size = isCurrent ? '30px' : '26px';
                var label = isComplete ? '✓' : String(i + 1);
                var cursor = 'cursor:pointer;';
                var hoverEffect = 'transition:all 0.2s;';

                html += '<div class="progress-step" data-step="' + i + '" title="' + escapeHtml(self.stepLabels[step]) + '" style="display:flex;flex-direction:column;align-items:center;' + cursor + 'padding:0.25rem 0.5rem;' + hoverEffect + '">';
                html += '<div style="width:' + size + ';height:' + size + ';border-radius:50%;background:' + bg + ';color:' + color + ';display:flex;align-items:center;justify-content:center;font-size:' + (isComplete ? '0.75rem' : '0.6875rem') + ';font-weight:600;transition:all 0.2s;' + (isCurrent ? 'box-shadow:0 0 0 3px var(--color-primary-light);' : '') + '">' + label + '</div>';
                if (isCurrent) {
                    html += '<span style="font-size:0.625rem;color:var(--color-primary);font-weight:600;margin-top:0.25rem;white-space:nowrap;">' + escapeHtml(self.stepLabels[step]) + '</span>';
                }
                html += '</div>';

                if (i < self.steps.length - 1) {
                    var lineColor = isComplete ? 'var(--color-success)' : 'var(--color-gray-200)';
                    html += '<div style="width:1rem;height:2px;background:' + lineColor + ';flex-shrink:0;border-radius:1px;"></div>';
                }
            });
            html += '</div>';
            return html;
        },

        isStepComplete: function(step) {
            if (!this.data) return false;
            switch (step) {
                case 'personal':
                    var p = this.data.personal || {};
                    return !!(p.first_name && p.last_name);
                case 'summary':
                    var s = this.data.summary || {};
                    return !!(s.content && s.content.trim().length > 10);
                case 'experience':
                    return !!(this.data.experience && this.data.experience.length > 0 && this.data.experience[0].company);
                case 'education':
                    return !!(this.data.education && this.data.education.length > 0 && this.data.education[0].institution);
                case 'skills':
                    return !!(this.data.skills && this.data.skills.length > 0 && this.data.skills[0].name);
                case 'projects':
                    return !!(this.data.projects && this.data.projects.length > 0);
                case 'certifications':
                    return !!(this.data.certifications && this.data.certifications.length > 0);
                case 'awards':
                    return !!(this.data.awards && this.data.awards.length > 0);
                case 'languages':
                    return !!(this.data.languages && this.data.languages.length > 0);
                case 'volunteer':
                    return !!(this.data.volunteer && this.data.volunteer.length > 0);
                case 'references':
                    return !!(this.data.references && this.data.references.length > 0);
                default:
                    return false;
            }
        },

        // ------------------------------------------
        // SAVE STATE
        // ------------------------------------------

        setSaveState: function(state) {
            this.saveState = state;
            var el = document.querySelector('.save-indicator');
            if (!el) return;
            switch (state) {
                case 'saving':
                    el.innerHTML = '<span style="display:inline-block;animation:pulse 1s ease-in-out infinite;">Saving...</span>';
                    el.style.color = 'var(--color-gray-500)';
                    break;
                case 'saved':
                    el.textContent = '✓ All changes saved';
                    el.style.color = 'var(--color-success)';
                    break;
                case 'error':
                    el.textContent = '✕ Save failed';
                    el.style.color = 'var(--color-danger)';
                    break;
                default:
                    el.textContent = '';
            }
        },

        // ------------------------------------------
        // NAVIGATION
        // ------------------------------------------

        goToStep: function(idx) {
            if (idx < 0 || idx >= this.steps.length) return;
            this.currentStep = idx;
            this.refreshUI();
        },

        refreshUI: function() {
            var progress = document.querySelector('.builder-progress');
            if (progress) progress.innerHTML = this.renderProgress();
            this.attachProgressEvents();
            this.renderStep();
        },

        // ------------------------------------------
        // STEP RENDERING DISPATCHER
        // ------------------------------------------

        renderStep: function() {
            var panel = document.querySelector('.builder-form-panel');
            if (!panel) return;

            var step = this.steps[this.currentStep];
            var html = '';

            // Step header with icon
            html += '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;">';
            html += '<span style="font-size:1.5rem;">' + (this.stepIcons[step] || '') + '</span>';
            html += '<div>';
            html += '<h2 style="font-size:1.25rem;font-weight:600;margin:0;">' + escapeHtml(this.stepLabels[step]) + '</h2>';
            html += '<p style="font-size:0.8125rem;color:var(--color-gray-500);margin:0.125rem 0 0;">Step ' + (this.currentStep + 1) + ' of ' + this.steps.length + '</p>';
            html += '</div></div>';

            switch (step) {
                case 'personal': html += this.renderPersonalForm(); break;
                case 'summary': html += this.renderSummaryForm(); break;
                case 'experience': html += this.renderExperienceForm(); break;
                case 'education': html += this.renderEducationForm(); break;
                case 'skills': html += this.renderSkillsForm(); break;
                case 'projects': html += this.renderProjectsForm(); break;
                case 'certifications': html += this.renderCertificationsForm(); break;
                case 'awards': html += this.renderAwardsForm(); break;
                case 'languages': html += this.renderLanguagesForm(); break;
                case 'volunteer': html += this.renderVolunteerForm(); break;
                case 'references': html += this.renderReferencesForm(); break;
            }

            // Navigation buttons
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--color-gray-200);">';
            if (this.currentStep > 0) {
                html += '<button class="btn btn-ghost nav-prev" style="gap:0.375rem;"><span>←</span> Previous</button>';
            } else {
                html += '<div></div>';
            }
            html += '<span style="font-size:0.75rem;color:var(--color-gray-400);">' + (this.currentStep + 1) + ' / ' + this.steps.length + '</span>';
            if (this.currentStep < this.steps.length - 1) {
                html += '<button class="btn btn-primary nav-next" style="gap:0.375rem;">Next <span>→</span></button>';
            } else {
                html += '<button class="btn btn-primary nav-finish" style="gap:0.375rem;">✓ Finish</button>';
            }
            html += '</div>';

            panel.innerHTML = html;
            this.attachStepEvents(step);
            panel.scrollTop = 0;
        },

        attachStepEvents: function(step) {
            var self = this;

            var prevBtn = document.querySelector('.nav-prev');
            var nextBtn = document.querySelector('.nav-next');
            var finishBtn = document.querySelector('.nav-finish');

            if (prevBtn) prevBtn.addEventListener('click', function() { self.goToStep(self.currentStep - 1); });
            if (nextBtn) nextBtn.addEventListener('click', function() { self.goToStep(self.currentStep + 1); });
            if (finishBtn) finishBtn.addEventListener('click', function() {
                Toast.success('Resume complete! Use Export PDF to download.');
            });

            switch (step) {
                case 'personal': this.attachPersonalEvents(); break;
                case 'summary': this.attachSummaryEvents(); break;
                case 'experience': this.attachListEvents('experience'); break;
                case 'education': this.attachListEvents('education'); break;
                case 'skills': this.attachSkillsEvents(); break;
                case 'projects': this.attachListEvents('projects'); break;
                case 'certifications': this.attachListEvents('certifications'); break;
                case 'awards': this.attachListEvents('awards'); break;
                case 'languages': this.attachLanguagesEvents(); break;
                case 'volunteer': this.attachListEvents('volunteer'); break;
                case 'references': this.attachListEvents('references'); break;
            }
        },

        // ------------------------------------------
        // PERSONAL INFO FORM
        // ------------------------------------------

        renderPersonalForm: function() {
            var p = this.data.personal || {};
            var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">';
            html += this.inputField('first_name', 'First Name', p.first_name, 'John');
            html += this.inputField('last_name', 'Last Name', p.last_name, 'Doe');
            html += this.inputField('email', 'Email', p.email, 'john@example.com');
            html += this.inputField('phone', 'Phone', p.phone, '+1 (555) 123-4567');
            html += this.inputField('location', 'Location', p.location, 'San Francisco, CA');
            html += this.inputField('website', 'Website', p.website, 'https://johndoe.com');
            html += this.inputField('linkedin', 'LinkedIn', p.linkedin, 'linkedin.com/in/johndoe');
            html += this.inputField('github', 'GitHub', p.github, 'github.com/johndoe');
            html += '</div>';
            html += '<div style="margin-top:1rem;">';
            html += this.inputField('job_title', 'Job Title', p.job_title, 'Senior Software Engineer');
            html += '</div>';
            return html;
        },

        attachPersonalEvents: function() {
            var self = this;
            var panel = document.querySelector('.builder-form-panel');
            if (!panel) return;
            var inputs = panel.querySelectorAll('.form-input');
            var saveDebounced = debounce(function() { self.savePersonal(); }, 800);
            inputs.forEach(function(input) { input.addEventListener('input', saveDebounced); });
        },

        savePersonal: function() {
            var self = this;
            var panel = document.querySelector('.builder-form-panel');
            if (!panel) return;
            var inputs = panel.querySelectorAll('.form-input');
            var data = {};
            inputs.forEach(function(input) {
                if (input.name) data[input.name] = input.value;
            });

            this.data.personal = Object.assign(this.data.personal || {}, data);
            this.setSaveState('saving');

            API.put('/api/resumes/' + this.resumeId + '/personal', data)
                .then(function(res) {
                    self.data.personal = res.data;
                    self.setSaveState('saved');
                    self.renderPreview();
                    self.updateProgressIndicator();
                })
                .catch(function() { self.setSaveState('error'); });
        },

        // ------------------------------------------
        // SUMMARY FORM
        // ------------------------------------------

        renderSummaryForm: function() {
            var s = this.data.summary || {};
            var content = s.content || '';
            var html = '<div class="form-group">';
            html += '<label class="form-label">Write a brief professional summary that highlights your key achievements, skills, and career goals.</label>';
            html += '<textarea class="form-input summary-textarea" name="content" rows="6" placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications. Passionate about clean code, performance optimization, and mentoring junior developers..." style="resize:vertical;min-height:150px;font-size:0.9375rem;line-height:1.7;">' + escapeHtml(content) + '</textarea>';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;">';
            html += '<span style="font-size:0.75rem;color:var(--color-gray-400);">Tip: Keep it between 50-200 words for best results.</span>';
            html += '<span class="char-counter" style="font-size:0.75rem;color:var(--color-gray-400);">' + content.length + ' characters</span>';
            html += '</div>';
            html += '</div>';
            return html;
        },

        attachSummaryEvents: function() {
            var self = this;
            var textarea = document.querySelector('.summary-textarea');
            var counter = document.querySelector('.char-counter');
            if (!textarea) return;

            var saveDebounced = debounce(function() { self.saveSummary(); }, 800);

            textarea.addEventListener('input', function() {
                if (counter) counter.textContent = this.value.length + ' characters';
                saveDebounced();
            });
        },

        saveSummary: function() {
            var self = this;
            var textarea = document.querySelector('.summary-textarea');
            var content = textarea ? textarea.value : '';

            if (!this.data.summary) this.data.summary = {};
            this.data.summary.content = content;
            this.setSaveState('saving');

            API.put('/api/resumes/' + this.resumeId + '/summary', { content: content })
                .then(function(res) {
                    self.data.summary = res.data;
                    self.setSaveState('saved');
                    self.renderPreview();
                    self.updateProgressIndicator();
                })
                .catch(function() { self.setSaveState('error'); });
        },

        // ------------------------------------------
        // LIST SECTION FORMS
        // ------------------------------------------

        renderExperienceForm: function() {
            return this.renderListSection('experience', this.data.experience || [], [
                { name: 'company', label: 'Company', placeholder: 'Google, Inc.' },
                { name: 'position', label: 'Position', placeholder: 'Senior Software Engineer' },
                { name: 'location', label: 'Location', placeholder: 'Mountain View, CA', half: true },
                { name: 'start_date', label: 'Start Date', placeholder: '2020-01', type: 'month', half: true },
                { name: 'end_date', label: 'End Date', placeholder: '2023-06', type: 'month', half: true },
                { name: 'is_current', label: 'I currently work here', type: 'checkbox', half: true },
                { name: 'description', label: 'Description', placeholder: 'Led development of microservices architecture serving 10M+ daily users. Reduced page load times by 40% through optimization initiatives.', type: 'textarea' }
            ]);
        },

        renderEducationForm: function() {
            return this.renderListSection('education', this.data.education || [], [
                { name: 'institution', label: 'Institution', placeholder: 'Stanford University' },
                { name: 'degree', label: 'Degree', placeholder: 'Bachelor of Science' },
                { name: 'field_of_study', label: 'Field of Study', placeholder: 'Computer Science', half: true },
                { name: 'location', label: 'Location', placeholder: 'Stanford, CA', half: true },
                { name: 'start_date', label: 'Start Date', placeholder: '2016-09', type: 'month', half: true },
                { name: 'end_date', label: 'End Date', placeholder: '2020-06', type: 'month', half: true },
                { name: 'gpa', label: 'GPA', placeholder: '3.85/4.0', half: true },
                { name: 'description', label: 'Description', placeholder: 'Relevant coursework, honors, activities...', type: 'textarea' }
            ]);
        },

        renderProjectsForm: function() {
            return this.renderListSection('projects', this.data.projects || [], [
                { name: 'name', label: 'Project Name', placeholder: 'Open Source Contribution' },
                { name: 'url', label: 'URL', placeholder: 'https://github.com/project' },
                { name: 'technologies', label: 'Technologies', placeholder: 'React, TypeScript, Node.js, PostgreSQL' },
                { name: 'start_date', label: 'Start Date', placeholder: '2022-01', type: 'month', half: true },
                { name: 'end_date', label: 'End Date', placeholder: '2022-06', type: 'month', half: true },
                { name: 'description', label: 'Description', placeholder: 'Built a real-time collaboration platform...', type: 'textarea' }
            ]);
        },

        renderCertificationsForm: function() {
            return this.renderListSection('certifications', this.data.certifications || [], [
                { name: 'name', label: 'Certification Name', placeholder: 'AWS Solutions Architect Professional' },
                { name: 'issuer', label: 'Issuer', placeholder: 'Amazon Web Services' },
                { name: 'date_issued', label: 'Date Obtained', placeholder: '2023-03', type: 'month', half: true },
                { name: 'date_expires', label: 'Expiry Date', placeholder: '2026-03', type: 'month', half: true },
                { name: 'credential_id', label: 'Credential ID', placeholder: 'AWS-SAP-12345', half: true },
                { name: 'url', label: 'Verification URL', placeholder: 'https://verify.aws/...', half: true }
            ]);
        },

        renderAwardsForm: function() {
            return this.renderListSection('awards', this.data.awards || [], [
                { name: 'title', label: 'Award Title', placeholder: 'Innovation Award 2023' },
                { name: 'issuer', label: 'Issuer', placeholder: 'Company or Organization' },
                { name: 'date', label: 'Date', placeholder: '2023-06', type: 'month', half: true },
                { name: 'description', label: 'Description', placeholder: 'Recognized for leading the platform migration...', type: 'textarea' }
            ]);
        },

        renderVolunteerForm: function() {
            return this.renderListSection('volunteer', this.data.volunteer || [], [
                { name: 'organization', label: 'Organization', placeholder: 'Code for America' },
                { name: 'role', label: 'Role', placeholder: 'Lead Developer' },
                { name: 'location', label: 'Location', placeholder: 'San Francisco, CA', half: true },
                { name: 'start_date', label: 'Start Date', placeholder: '2021-01', type: 'month', half: true },
                { name: 'end_date', label: 'End Date', placeholder: '2022-12', type: 'month', half: true },
                { name: 'is_current', label: 'Currently volunteering here', type: 'checkbox', half: true },
                { name: 'description', label: 'Description', placeholder: 'Built tools helping local communities access government services...', type: 'textarea' }
            ]);
        },

        renderReferencesForm: function() {
            return this.renderListSection('references', this.data.references || [], [
                { name: 'name', label: 'Full Name', placeholder: 'Jane Smith' },
                { name: 'position', label: 'Position', placeholder: 'Engineering Manager' },
                { name: 'company', label: 'Company', placeholder: 'Google' },
                { name: 'email', label: 'Email', placeholder: 'jane.smith@example.com', half: true },
                { name: 'phone', label: 'Phone', placeholder: '+1 (555) 987-6543', half: true },
                { name: 'relationship', label: 'Relationship', placeholder: 'Direct manager for 3 years' }
            ]);
        },

        renderListSection: function(section, entries, fields) {
            var html = '';
            html += '<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:1rem;">';
            html += '<button class="btn btn-primary add-entry-btn" data-section="' + section + '" style="font-size:0.8125rem;">+ Add ' + escapeHtml(this.singularName(section)) + '</button>';
            html += '</div>';

            if (entries.length === 0) {
                html += '<div style="text-align:center;padding:3rem 2rem;border:2px dashed var(--color-gray-200);border-radius:0.75rem;background:var(--color-gray-50);">';
                html += '<div style="font-size:2rem;margin-bottom:0.75rem;">' + (this.stepIcons[section] || '📋') + '</div>';
                html += '<p style="color:var(--color-gray-500);margin:0;">No entries yet. Click the button above to add one.</p>';
                html += '</div>';
            } else {
                var self = this;
                entries.forEach(function(entry) {
                    html += self.renderEntryCard(section, entry, fields);
                });
            }

            return html;
        },

        renderEntryCard: function(section, entry, fields) {
            var headerText = this.getEntryHeaderText(section, entry);
            var subtext = this.getEntrySubtext(section, entry);
            var key = section + '_' + entry.id;
            var isExpanded = this.expandedEntries[key] === true;

            var html = '<div class="entry-card" data-entry-id="' + escapeHtml(String(entry.id)) + '" data-section="' + section + '" style="background:#fff;border:1px solid var(--color-gray-200);border-radius:0.75rem;margin-bottom:0.75rem;overflow:hidden;transition:box-shadow 0.2s;">';

            // Header
            html += '<div class="entry-header" style="display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1.25rem;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background=\'var(--color-gray-50)\'" onmouseleave="this.style.background=\'transparent\'">';
            html += '<div style="flex:1;min-width:0;">';
            html += '<div style="font-weight:500;font-size:0.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--color-gray-800);">' + escapeHtml(headerText || 'New Entry') + '</div>';
            if (!isExpanded && subtext) {
                html += '<div style="font-size:0.75rem;color:var(--color-gray-400);margin-top:0.125rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(subtext) + '</div>';
            }
            html += '</div>';
            html += '<div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;margin-left:0.75rem;">';
            html += '<button class="delete-entry-btn" data-id="' + escapeHtml(String(entry.id)) + '" data-section="' + section + '" style="background:none;border:none;cursor:pointer;color:var(--color-gray-300);font-size:1.25rem;padding:0.25rem 0.375rem;border-radius:0.25rem;transition:all 0.15s;line-height:1;" title="Delete" onmouseenter="this.style.color=\'var(--color-danger)\';this.style.background=\'#fef2f2\'" onmouseleave="this.style.color=\'var(--color-gray-300)\';this.style.background=\'none\'">×</button>';
            html += '<span class="collapse-icon" style="font-size:0.625rem;color:var(--color-gray-400);transition:transform 0.2s;transform:rotate(' + (isExpanded ? '180' : '0') + 'deg);">▼</span>';
            html += '</div></div>';

            // Body
            html += '<div class="entry-body" style="' + (isExpanded ? 'padding:1.25rem;max-height:2000px;border-top:1px solid var(--color-gray-100);' : 'padding:0 1.25rem;max-height:0;') + 'overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease;">';
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">';

            var self = this;
            fields.forEach(function(f) {
                var value = entry[f.name] != null ? entry[f.name] : '';
                if (f.type === 'checkbox') {
                    html += '<div class="form-group" style="' + (f.half ? '' : 'grid-column:1/-1;') + 'display:flex;align-items:center;gap:0.5rem;margin-bottom:0;">';
                    html += '<input type="checkbox" name="' + f.name + '" ' + (value ? 'checked' : '') + ' style="width:1rem;height:1rem;accent-color:var(--color-primary);cursor:pointer;" id="cb_' + entry.id + '_' + f.name + '">';
                    html += '<label for="cb_' + entry.id + '_' + f.name + '" class="form-label" style="margin:0;cursor:pointer;">' + escapeHtml(f.label) + '</label>';
                    html += '</div>';
                } else if (f.type === 'textarea') {
                    html += '<div class="form-group" style="grid-column:1/-1;">';
                    html += '<label class="form-label">' + escapeHtml(f.label) + '</label>';
                    html += '<textarea class="form-input" name="' + f.name + '" rows="4" placeholder="' + escapeHtml(f.placeholder || '') + '" style="resize:vertical;min-height:80px;">' + escapeHtml(String(value)) + '</textarea>';
                    html += '</div>';
                } else {
                    var gridStyle = f.half ? '' : 'grid-column:1/-1;';
                    html += '<div class="form-group" style="' + gridStyle + '">';
                    html += '<label class="form-label">' + escapeHtml(f.label) + '</label>';
                    html += '<input type="' + (f.type || 'text') + '" class="form-input" name="' + f.name + '" value="' + escapeHtml(String(value)) + '" placeholder="' + escapeHtml(f.placeholder || '') + '">';
                    html += '</div>';
                }
            });

            html += '</div></div></div>';
            return html;
        },

        getEntryHeaderText: function(section, entry) {
            switch (section) {
                case 'experience':
                    if (entry.position && entry.company) return entry.position + ' at ' + entry.company;
                    return entry.position || entry.company || 'New Experience';
                case 'education':
                    if (entry.degree && entry.institution) return entry.degree + ' – ' + entry.institution;
                    return entry.institution || entry.degree || 'New Education';
                case 'projects': return entry.name || 'New Project';
                case 'certifications': return entry.name || 'New Certification';
                case 'awards': return entry.title || 'New Award';
                case 'volunteer':
                    if (entry.role && entry.organization) return entry.role + ' at ' + entry.organization;
                    return entry.role || entry.organization || 'New Volunteer';
                case 'references': return entry.name || 'New Reference';
                default: return 'Entry';
            }
        },

        getEntrySubtext: function(section, entry) {
            switch (section) {
                case 'experience':
                case 'volunteer':
                    var dates = '';
                    if (entry.start_date) dates = entry.start_date;
                    if (entry.is_current) dates += ' – Present';
                    else if (entry.end_date) dates += ' – ' + entry.end_date;
                    if (entry.location) return (dates ? dates + ' · ' : '') + entry.location;
                    return dates;
                case 'education':
                    return entry.field_of_study || '';
                case 'certifications':
                    return entry.issuer || '';
                case 'awards':
                    return entry.issuer || '';
                case 'projects':
                    return entry.technologies || '';
                case 'references':
                    return (entry.position || '') + (entry.company ? ' at ' + entry.company : '');
                default:
                    return '';
            }
        },

        singularName: function(section) {
            var map = { experience: 'Experience', education: 'Education', skills: 'Skill', projects: 'Project', certifications: 'Certification', awards: 'Award', languages: 'Language', volunteer: 'Volunteer', references: 'Reference' };
            return map[section] || 'Entry';
        },

        attachListEvents: function(section) {
            var self = this;

            var addBtn = document.querySelector('.add-entry-btn[data-section="' + section + '"]');
            if (addBtn) {
                addBtn.addEventListener('click', function() { self.addEntry(section); });
            }

            document.querySelectorAll('.delete-entry-btn[data-section="' + section + '"]').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.deleteEntry(section, this.getAttribute('data-id'));
                });
            });

            document.querySelectorAll('.entry-card[data-section="' + section + '"] .entry-header').forEach(function(header) {
                header.addEventListener('click', function(e) {
                    if (e.target.closest('.delete-entry-btn')) return;
                    var card = this.closest('.entry-card');
                    var entryId = card.getAttribute('data-entry-id');
                    var body = card.querySelector('.entry-body');
                    var icon = card.querySelector('.collapse-icon');
                    var key = section + '_' + entryId;
                    var isOpen = self.expandedEntries[key];

                    if (isOpen) {
                        body.style.maxHeight = '0';
                        body.style.padding = '0 1.25rem';
                        body.style.borderTop = 'none';
                        icon.style.transform = 'rotate(0deg)';
                        self.expandedEntries[key] = false;
                    } else {
                        body.style.maxHeight = '2000px';
                        body.style.padding = '1.25rem';
                        body.style.borderTop = '1px solid var(--color-gray-100)';
                        icon.style.transform = 'rotate(180deg)';
                        self.expandedEntries[key] = true;
                    }
                });
            });

            document.querySelectorAll('.entry-card[data-section="' + section + '"] .form-input, .entry-card[data-section="' + section + '"] textarea').forEach(function(input) {
                input.addEventListener('blur', function() {
                    var card = this.closest('.entry-card');
                    if (card) self.saveEntry(section, card.getAttribute('data-entry-id'), card);
                });
            });

            document.querySelectorAll('.entry-card[data-section="' + section + '"] input[type="checkbox"]').forEach(function(cb) {
                cb.addEventListener('change', function() {
                    var card = this.closest('.entry-card');
                    if (card) self.saveEntry(section, card.getAttribute('data-entry-id'), card);
                });
            });
        },

        addEntry: function(section) {
            var self = this;
            this.setSaveState('saving');

            var defaultData = {};
            switch (section) {
                case 'experience': defaultData = { company: '', position: '' }; break;
                case 'education': defaultData = { institution: '', degree: '' }; break;
                case 'projects': defaultData = { name: '' }; break;
                case 'certifications': defaultData = { name: '' }; break;
                case 'awards': defaultData = { title: '' }; break;
                case 'volunteer': defaultData = { organization: '', role: '' }; break;
                case 'references': defaultData = { name: '' }; break;
                default: defaultData = {}; break;
            }

            API.post('/api/resumes/' + this.resumeId + '/' + section, defaultData)
                .then(function(res) {
                    if (!self.data[section]) self.data[section] = [];
                    self.data[section].push(res.data);
                    var key = section + '_' + res.data.id;
                    self.expandedEntries[key] = true;
                    self.setSaveState('saved');
                    self.renderStep();
                    self.renderPreview();
                    self.updateProgressIndicator();

                    setTimeout(function() {
                        var panel = document.querySelector('.builder-form-panel');
                        var cards = panel.querySelectorAll('.entry-card[data-section="' + section + '"]');
                        var lastCard = cards[cards.length - 1];
                        if (lastCard) lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                })
                .catch(function(err) {
                    self.setSaveState('error');
                    Toast.error(err.message || 'Failed to add entry');
                });
        },

        saveEntry: function(section, entryId, card) {
            var self = this;
            var data = {};

            card.querySelectorAll('.form-input, textarea').forEach(function(input) {
                if (input.name) data[input.name] = input.value;
            });
            card.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
                if (cb.name) data[cb.name] = cb.checked ? 1 : 0;
            });

            this.setSaveState('saving');
            API.put('/api/resumes/' + this.resumeId + '/' + section + '/' + entryId, data)
                .then(function(res) {
                    var arr = self.data[section] || [];
                    for (var i = 0; i < arr.length; i++) {
                        if (String(arr[i].id) === String(entryId)) {
                            arr[i] = Object.assign(arr[i], res.data);
                            break;
                        }
                    }
                    self.setSaveState('saved');
                    self.renderPreview();
                    self.updateProgressIndicator();
                })
                .catch(function() { self.setSaveState('error'); });
        },

        deleteEntry: function(section, entryId) {
            var self = this;
            Modal.confirm('Are you sure you want to delete this entry?', function() {
                self.setSaveState('saving');
                API.del('/api/resumes/' + self.resumeId + '/' + section + '/' + entryId)
                    .then(function() {
                        self.data[section] = (self.data[section] || []).filter(function(e) {
                            return String(e.id) !== String(entryId);
                        });
                        delete self.expandedEntries[section + '_' + entryId];
                        self.setSaveState('saved');
                        self.renderStep();
                        self.renderPreview();
                        self.updateProgressIndicator();
                        Toast.success('Entry deleted');
                    })
                    .catch(function(err) {
                        self.setSaveState('error');
                        Toast.error(err.message || 'Failed to delete');
                    });
            }, { title: 'Delete Entry', confirmText: 'Delete', danger: true });
        },

        // ------------------------------------------
        // SKILLS FORM
        // ------------------------------------------

        renderSkillsForm: function() {
            var skills = this.data.skills || [];
            var html = '<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:1rem;">';
            html += '<button class="btn btn-primary add-skill-btn" style="font-size:0.8125rem;">+ Add Skill</button>';
            html += '</div>';

            if (skills.length === 0) {
                html += '<div style="text-align:center;padding:3rem 2rem;border:2px dashed var(--color-gray-200);border-radius:0.75rem;background:var(--color-gray-50);">';
                html += '<div style="font-size:2rem;margin-bottom:0.75rem;">⚡</div>';
                html += '<p style="color:var(--color-gray-500);margin:0;">Add your technical and professional skills.</p>';
                html += '</div>';
            } else {
                html += '<div class="skills-list-builder" style="display:flex;flex-direction:column;gap:0.5rem;">';
                skills.forEach(function(skill) {
                    html += '<div class="skill-row" data-id="' + escapeHtml(String(skill.id)) + '" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;background:#fff;border:1px solid var(--color-gray-200);border-radius:0.5rem;transition:border-color 0.15s;" onmouseenter="this.style.borderColor=\'var(--color-gray-300)\'" onmouseleave="this.style.borderColor=\'var(--color-gray-200)\'">';
                    html += '<input type="text" class="form-input skill-name" name="name" value="' + escapeHtml(skill.name || '') + '" placeholder="e.g. JavaScript, Project Management..." style="flex:1;">';
                    html += '<select class="form-input skill-level" name="level" style="width:140px;flex-shrink:0;">';
                    ['Beginner', 'Intermediate', 'Advanced', 'Expert'].forEach(function(lv) {
                        html += '<option value="' + lv.toLowerCase() + '"' + ((skill.level || '').toLowerCase() === lv.toLowerCase() ? ' selected' : '') + '>' + lv + '</option>';
                    });
                    html += '</select>';
                    html += '<button class="delete-skill-btn" data-id="' + escapeHtml(String(skill.id)) + '" style="background:none;border:none;cursor:pointer;color:var(--color-gray-300);font-size:1.25rem;padding:0.25rem 0.375rem;border-radius:0.25rem;transition:all 0.15s;line-height:1;" title="Remove" onmouseenter="this.style.color=\'var(--color-danger)\'" onmouseleave="this.style.color=\'var(--color-gray-300)\'">×</button>';
                    html += '</div>';
                });
                html += '</div>';
            }

            return html;
        },

        attachSkillsEvents: function() {
            var self = this;

            var addBtn = document.querySelector('.add-skill-btn');
            if (addBtn) {
                addBtn.addEventListener('click', function() {
                    self.setSaveState('saving');
                    API.post('/api/resumes/' + self.resumeId + '/skills', { name: '', level: 'intermediate' })
                        .then(function(res) {
                            if (!self.data.skills) self.data.skills = [];
                            self.data.skills.push(res.data);
                            self.setSaveState('saved');
                            self.renderStep();
                            self.renderPreview();
                            self.updateProgressIndicator();
                            setTimeout(function() {
                                var rows = document.querySelectorAll('.skill-row');
                                var last = rows[rows.length - 1];
                                if (last) last.querySelector('.skill-name').focus();
                            }, 50);
                        })
                        .catch(function(err) { self.setSaveState('error'); Toast.error(err.message); });
                });
            }

            document.querySelectorAll('.delete-skill-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = this.getAttribute('data-id');
                    self.setSaveState('saving');
                    API.del('/api/resumes/' + self.resumeId + '/skills/' + id)
                        .then(function() {
                            self.data.skills = (self.data.skills || []).filter(function(s) { return String(s.id) !== id; });
                            self.setSaveState('saved');
                            self.renderStep();
                            self.renderPreview();
                            self.updateProgressIndicator();
                        })
                        .catch(function() { self.setSaveState('error'); });
                });
            });

            document.querySelectorAll('.skill-row .form-input').forEach(function(input) {
                input.addEventListener('change', function() {
                    var row = this.closest('.skill-row');
                    var id = row.getAttribute('data-id');
                    var name = row.querySelector('.skill-name').value;
                    var level = row.querySelector('.skill-level').value;

                    self.setSaveState('saving');
                    API.put('/api/resumes/' + self.resumeId + '/skills/' + id, { name: name, level: level })
                        .then(function(res) {
                            var arr = self.data.skills || [];
                            for (var i = 0; i < arr.length; i++) {
                                if (String(arr[i].id) === id) { arr[i] = Object.assign(arr[i], res.data); break; }
                            }
                            self.setSaveState('saved');
                            self.renderPreview();
                        })
                        .catch(function() { self.setSaveState('error'); });
                });
            });
        },

        // ------------------------------------------
        // LANGUAGES FORM
        // ------------------------------------------

        renderLanguagesForm: function() {
            var langs = this.data.languages || [];
            var html = '<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:1rem;">';
            html += '<button class="btn btn-primary add-language-btn" style="font-size:0.8125rem;">+ Add Language</button>';
            html += '</div>';

            if (langs.length === 0) {
                html += '<div style="text-align:center;padding:3rem 2rem;border:2px dashed var(--color-gray-200);border-radius:0.75rem;background:var(--color-gray-50);">';
                html += '<div style="font-size:2rem;margin-bottom:0.75rem;">🌐</div>';
                html += '<p style="color:var(--color-gray-500);margin:0;">Add languages you speak.</p>';
                html += '</div>';
            } else {
                html += '<div class="languages-list-builder" style="display:flex;flex-direction:column;gap:0.5rem;">';
                langs.forEach(function(lang) {
                    html += '<div class="language-row" data-id="' + escapeHtml(String(lang.id)) + '" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;background:#fff;border:1px solid var(--color-gray-200);border-radius:0.5rem;transition:border-color 0.15s;" onmouseenter="this.style.borderColor=\'var(--color-gray-300)\'" onmouseleave="this.style.borderColor=\'var(--color-gray-200)\'">';
                    html += '<input type="text" class="form-input lang-name" name="language" value="' + escapeHtml(lang.language || '') + '" placeholder="e.g. English, Spanish..." style="flex:1;">';
                    html += '<select class="form-input lang-proficiency" name="proficiency" style="width:160px;flex-shrink:0;">';
                    ['Native', 'Fluent', 'Advanced', 'Conversational', 'Basic'].forEach(function(lv) {
                        html += '<option value="' + lv.toLowerCase() + '"' + ((lang.proficiency || '').toLowerCase() === lv.toLowerCase() ? ' selected' : '') + '>' + lv + '</option>';
                    });
                    html += '</select>';
                    html += '<button class="delete-language-btn" data-id="' + escapeHtml(String(lang.id)) + '" style="background:none;border:none;cursor:pointer;color:var(--color-gray-300);font-size:1.25rem;padding:0.25rem 0.375rem;border-radius:0.25rem;transition:all 0.15s;line-height:1;" title="Remove" onmouseenter="this.style.color=\'var(--color-danger)\'" onmouseleave="this.style.color=\'var(--color-gray-300)\'">×</button>';
                    html += '</div>';
                });
                html += '</div>';
            }
            return html;
        },

        attachLanguagesEvents: function() {
            var self = this;

            var addBtn = document.querySelector('.add-language-btn');
            if (addBtn) {
                addBtn.addEventListener('click', function() {
                    self.setSaveState('saving');
                    API.post('/api/resumes/' + self.resumeId + '/languages', { language: '', proficiency: 'conversational' })
                        .then(function(res) {
                            if (!self.data.languages) self.data.languages = [];
                            self.data.languages.push(res.data);
                            self.setSaveState('saved');
                            self.renderStep();
                            self.renderPreview();
                            self.updateProgressIndicator();
                            setTimeout(function() {
                                var rows = document.querySelectorAll('.language-row');
                                var last = rows[rows.length - 1];
                                if (last) last.querySelector('.lang-name').focus();
                            }, 50);
                        })
                        .catch(function(err) { self.setSaveState('error'); Toast.error(err.message); });
                });
            }

            document.querySelectorAll('.delete-language-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = this.getAttribute('data-id');
                    self.setSaveState('saving');
                    API.del('/api/resumes/' + self.resumeId + '/languages/' + id)
                        .then(function() {
                            self.data.languages = (self.data.languages || []).filter(function(l) { return String(l.id) !== id; });
                            self.setSaveState('saved');
                            self.renderStep();
                            self.renderPreview();
                            self.updateProgressIndicator();
                        })
                        .catch(function() { self.setSaveState('error'); });
                });
            });

            document.querySelectorAll('.language-row .form-input').forEach(function(input) {
                input.addEventListener('change', function() {
                    var row = this.closest('.language-row');
                    var id = row.getAttribute('data-id');
                    var language = row.querySelector('.lang-name').value;
                    var proficiency = row.querySelector('.lang-proficiency').value;

                    self.setSaveState('saving');
                    API.put('/api/resumes/' + self.resumeId + '/languages/' + id, { language: language, proficiency: proficiency })
                        .then(function(res) {
                            var arr = self.data.languages || [];
                            for (var i = 0; i < arr.length; i++) {
                                if (String(arr[i].id) === id) { arr[i] = Object.assign(arr[i], res.data); break; }
                            }
                            self.setSaveState('saved');
                            self.renderPreview();
                        })
                        .catch(function() { self.setSaveState('error'); });
                });
            });
        },

        // ------------------------------------------
        // HELPER: Input Field
        // ------------------------------------------

        inputField: function(name, label, value, placeholder) {
            return '<div class="form-group">' +
                '<label class="form-label">' + escapeHtml(label) + '</label>' +
                '<input type="text" class="form-input" name="' + name + '" value="' + escapeHtml(value || '') + '" placeholder="' + escapeHtml(placeholder || '') + '">' +
                '</div>';
        },

        // ------------------------------------------
        // PROGRESS UPDATE
        // ------------------------------------------

        updateProgressIndicator: function() {
            var progress = document.querySelector('.builder-progress');
            if (progress) {
                progress.innerHTML = this.renderProgress();
                this.attachProgressEvents();
            }
        },

        // ------------------------------------------
        // LIVE PREVIEW
        // ------------------------------------------

        renderPreview: function() {
            var panel = document.querySelector('.builder-preview-panel');
            if (!panel) return;

            var template = this.data.template || 'professional';
            var resumeHtml = '';

            switch (template) {
                case 'minimal': resumeHtml = Templates.minimal(this.data); break;
                case 'professional': resumeHtml = Templates.professional(this.data); break;
                case 'modern': resumeHtml = Templates.modern(this.data); break;
                default: resumeHtml = Templates.professional(this.data);
            }

            var paperWidthMm = 210;
            var pxPerMm = 3.7795;
            var paperPx = paperWidthMm * pxPerMm;
            var panelWidth = panel.offsetWidth - 48;
            var scale = Math.min(panelWidth / paperPx, 0.85);

            var containerStyle = [
                'transform-origin:top center',
                'transform:scale(' + scale.toFixed(4) + ')',
                'width:' + paperPx + 'px',
                'min-height:' + Math.round(297 * pxPerMm) + 'px',
                'background:#fff',
                'box-shadow:0 4px 24px rgba(0,0,0,0.12)',
                'border-radius:2px',
                'overflow:hidden'
            ].join(';');

            panel.innerHTML = '<div class="preview-container" style="' + containerStyle + '">' + resumeHtml + '</div>';

            var container = panel.querySelector('.preview-container');
            if (container) {
                var scaledHeight = container.scrollHeight * scale;
                panel.style.minHeight = (scaledHeight + 48) + 'px';
            }
        },

        // ------------------------------------------
        // EXPORT PDF
        // ------------------------------------------

        exportPDF: function() {
            var template = this.data.template || 'professional';
            var resumeHtml = '';

            switch (template) {
                case 'minimal': resumeHtml = Templates.minimal(this.data); break;
                case 'professional': resumeHtml = Templates.professional(this.data); break;
                case 'modern': resumeHtml = Templates.modern(this.data); break;
                default: resumeHtml = Templates.professional(this.data);
            }

            var printWindow = window.open('', '_blank');
            if (!printWindow) {
                Toast.error('Please allow popups to export your resume as PDF');
                return;
            }

            var doc = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
            doc += '<title>' + escapeHtml(this.data.title || 'Resume') + ' - JobCollar</title>';
            doc += '<style>';
            doc += '@page{margin:0;size:A4;}';
            doc += '*{margin:0;padding:0;box-sizing:border-box;}';
            doc += 'html,body{width:210mm;min-height:297mm;}';
            doc += 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;}';
            doc += '@media print{body{width:210mm;}}';
            doc += '</style>';
            doc += '</head><body>' + resumeHtml + '</body></html>';

            printWindow.document.write(doc);
            printWindow.document.close();

            printWindow.onload = function() {
                setTimeout(function() {
                    printWindow.focus();
                    printWindow.print();
                }, 300);
            };

            Toast.info('Print dialog will open in the new window. Choose "Save as PDF" to export.');
        }
    };

    // ==========================================
    // TEMPLATE RENDERERS
    // ==========================================

    var Templates = {

        formatDateRange: function(start, end, isCurrent) {
            var s = start || '';
            var e = isCurrent ? 'Present' : (end || '');
            if (!s && !e) return '';
            if (s && !e) return s;
            if (!s && e) return e;
            return s + ' – ' + e;
        },

        has: function(arr) {
            return arr && arr.length > 0;
        },

        // ------------------------------------------
        // MINIMAL TEMPLATE
        // ------------------------------------------

        minimal: function(data) {
            var p = data.personal || {};
            var html = '<div style="padding:52px 60px;font-family:Georgia,\'Times New Roman\',serif;font-size:10.5px;line-height:1.55;color:#2d2d2d;">';

            var name = ((p.first_name || '') + ' ' + (p.last_name || '')).trim();
            if (name) {
                html += '<div style="text-align:center;margin-bottom:6px;">';
                html += '<h1 style="font-size:24px;font-weight:400;letter-spacing:1.5px;margin:0;text-transform:uppercase;">' + escapeHtml(name) + '</h1>';
                if (p.job_title) html += '<div style="font-size:12px;color:#666;margin-top:6px;letter-spacing:0.5px;">' + escapeHtml(p.job_title) + '</div>';
                html += '</div>';
            }

            var contacts = [];
            if (p.email) contacts.push(escapeHtml(p.email));
            if (p.phone) contacts.push(escapeHtml(p.phone));
            if (p.location) contacts.push(escapeHtml(p.location));
            if (p.linkedin) contacts.push(escapeHtml(p.linkedin));
            if (p.website) contacts.push(escapeHtml(p.website));
            if (p.github) contacts.push(escapeHtml(p.github));
            if (contacts.length) {
                html += '<div style="text-align:center;font-size:9.5px;color:#777;margin:8px 0 24px;letter-spacing:0.3px;">' + contacts.join(' &ensp;|&ensp; ') + '</div>';
            } else {
                html += '<div style="margin-bottom:24px;"></div>';
            }

            var sectionHeader = function(title) {
                return '<h2 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #ddd;padding-bottom:5px;margin-bottom:10px;color:#333;">' + title + '</h2>';
            };

            if (data.summary && data.summary.content) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('Professional Summary');
                html += '<p style="margin:0;color:#444;text-align:justify;">' + escapeHtml(data.summary.content) + '</p></div>';
            }

            if (this.has(data.experience)) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('Experience');
                data.experience.forEach(function(exp) {
                    html += '<div style="margin-bottom:12px;">';
                    html += '<div style="display:flex;justify-content:space-between;align-items:baseline;">';
                    html += '<strong style="font-size:11px;">' + escapeHtml(exp.company || '') + '</strong>';
                    html += '<span style="font-size:9.5px;color:#888;">' + escapeHtml(Templates.formatDateRange(exp.start_date, exp.end_date, exp.is_current)) + '</span>';
                    html += '</div>';
                    html += '<div style="font-style:italic;color:#555;margin-top:1px;">' + escapeHtml(exp.position || '') + (exp.location ? ' · ' + escapeHtml(exp.location) : '') + '</div>';
                    if (exp.description) html += '<p style="margin:4px 0 0;color:#444;">' + escapeHtml(exp.description) + '</p>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.education)) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('Education');
                data.education.forEach(function(edu) {
                    html += '<div style="margin-bottom:10px;">';
                    html += '<div style="display:flex;justify-content:space-between;align-items:baseline;">';
                    html += '<strong style="font-size:11px;">' + escapeHtml(edu.institution || '') + '</strong>';
                    html += '<span style="font-size:9.5px;color:#888;">' + escapeHtml(Templates.formatDateRange(edu.start_date, edu.end_date, edu.is_current)) + '</span>';
                    html += '</div>';
                    var deg = (edu.degree || '') + (edu.field_of_study ? ' in ' + edu.field_of_study : '');
                    if (deg) html += '<div style="color:#555;">' + escapeHtml(deg) + '</div>';
                    if (edu.gpa) html += '<div style="font-size:9.5px;color:#888;">GPA: ' + escapeHtml(edu.gpa) + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.skills)) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('Skills');
                var sn = data.skills.map(function(s) { return s.name; }).filter(Boolean);
                html += '<p style="margin:0;color:#444;">' + sn.map(escapeHtml).join(' &ensp;&bull;&ensp; ') + '</p></div>';
            }

            if (this.has(data.projects)) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('Projects');
                data.projects.forEach(function(proj) {
                    html += '<div style="margin-bottom:8px;"><strong>' + escapeHtml(proj.name || '') + '</strong>';
                    if (proj.technologies) html += ' <span style="font-size:9.5px;color:#888;">(' + escapeHtml(proj.technologies) + ')</span>';
                    if (proj.description) html += '<p style="margin:2px 0 0;color:#444;">' + escapeHtml(proj.description) + '</p>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.certifications)) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('Certifications');
                data.certifications.forEach(function(c) {
                    html += '<div style="margin-bottom:5px;"><strong>' + escapeHtml(c.name || '') + '</strong>';
                    if (c.issuer) html += ' – ' + escapeHtml(c.issuer);
                    if (c.date_issued) html += ' <span style="color:#888;font-size:9.5px;">(' + escapeHtml(c.date_issued) + ')</span>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.awards)) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('Awards');
                data.awards.forEach(function(a) {
                    html += '<div style="margin-bottom:5px;"><strong>' + escapeHtml(a.title || '') + '</strong>';
                    if (a.issuer) html += ' – ' + escapeHtml(a.issuer);
                    if (a.date) html += ' <span style="color:#888;font-size:9.5px;">(' + escapeHtml(a.date) + ')</span>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.languages)) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('Languages');
                var ls = data.languages.map(function(l) { return (l.language || '') + (l.proficiency ? ' (' + l.proficiency + ')' : ''); }).filter(Boolean);
                html += '<p style="margin:0;color:#444;">' + ls.map(escapeHtml).join(' &ensp;&bull;&ensp; ') + '</p></div>';
            }

            if (this.has(data.volunteer)) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('Volunteer');
                data.volunteer.forEach(function(v) {
                    html += '<div style="margin-bottom:8px;"><strong>' + escapeHtml(v.organization || '') + '</strong> – ' + escapeHtml(v.role || '');
                    html += ' <span style="font-size:9.5px;color:#888;">' + escapeHtml(Templates.formatDateRange(v.start_date, v.end_date, v.is_current)) + '</span>';
                    if (v.description) html += '<p style="margin:2px 0 0;color:#444;">' + escapeHtml(v.description) + '</p>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.references)) {
                html += '<div style="margin-bottom:20px;">' + sectionHeader('References');
                data.references.forEach(function(r) {
                    html += '<div style="margin-bottom:6px;"><strong>' + escapeHtml(r.name || '') + '</strong>';
                    if (r.position || r.company) html += ' – ' + escapeHtml((r.position || '') + (r.company ? ' at ' + r.company : ''));
                    var rc = []; if (r.email) rc.push(r.email); if (r.phone) rc.push(r.phone);
                    if (rc.length) html += '<div style="font-size:9.5px;color:#888;">' + rc.map(escapeHtml).join(' | ') + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            html += '</div>';
            return html;
        },

        // ------------------------------------------
        // PROFESSIONAL TEMPLATE
        // ------------------------------------------

        professional: function(data) {
            var p = data.personal || {};
            var accent = '#2563eb';
            var html = '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:10.5px;line-height:1.5;color:#2d2d2d;">';

            var name = ((p.first_name || '') + ' ' + (p.last_name || '')).trim();

            // Header
            html += '<div style="padding:44px 48px 28px;background:linear-gradient(135deg,#f8fafc 0%,#eef2ff 100%);border-bottom:3px solid ' + accent + ';">';
            html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:2rem;">';
            html += '<div style="flex:1;">';
            if (name) html += '<h1 style="font-size:26px;font-weight:700;margin:0 0 4px;color:#111827;letter-spacing:-0.3px;">' + escapeHtml(name) + '</h1>';
            if (p.job_title) html += '<div style="font-size:13px;color:#4b5563;font-weight:500;">' + escapeHtml(p.job_title) + '</div>';
            html += '</div>';
            html += '<div style="text-align:right;font-size:10px;color:#6b7280;line-height:1.9;">';
            if (p.email) html += '<div>' + escapeHtml(p.email) + '</div>';
            if (p.phone) html += '<div>' + escapeHtml(p.phone) + '</div>';
            if (p.location) html += '<div>' + escapeHtml(p.location) + '</div>';
            if (p.linkedin) html += '<div>' + escapeHtml(p.linkedin) + '</div>';
            if (p.website) html += '<div>' + escapeHtml(p.website) + '</div>';
            if (p.github) html += '<div>' + escapeHtml(p.github) + '</div>';
            html += '</div></div></div>';

            html += '<div style="padding:28px 48px 44px;">';

            var secHead = function(title) {
                return '<h2 style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#111827;padding-left:14px;border-left:4px solid ' + accent + ';margin-bottom:12px;">' + title + '</h2>';
            };

            if (data.summary && data.summary.content) {
                html += '<div style="margin-bottom:22px;">' + secHead('Summary');
                html += '<p style="margin:0;color:#4b5563;padding-left:18px;line-height:1.65;">' + escapeHtml(data.summary.content) + '</p></div>';
            }

            if (this.has(data.experience)) {
                html += '<div style="margin-bottom:22px;">' + secHead('Experience');
                data.experience.forEach(function(exp) {
                    html += '<div style="margin-bottom:14px;padding-left:18px;">';
                    html += '<div style="display:flex;justify-content:space-between;align-items:baseline;">';
                    html += '<div><strong style="font-size:11.5px;color:#111827;">' + escapeHtml(exp.company || '') + '</strong> <span style="color:#6b7280;">· ' + escapeHtml(exp.position || '') + '</span></div>';
                    html += '<span style="font-size:9.5px;color:#9ca3af;white-space:nowrap;margin-left:1rem;">' + escapeHtml(Templates.formatDateRange(exp.start_date, exp.end_date, exp.is_current)) + '</span>';
                    html += '</div>';
                    if (exp.location) html += '<div style="font-size:9.5px;color:#9ca3af;margin-top:1px;">' + escapeHtml(exp.location) + '</div>';
                    if (exp.description) html += '<p style="margin:5px 0 0;color:#4b5563;line-height:1.6;">' + escapeHtml(exp.description) + '</p>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.education)) {
                html += '<div style="margin-bottom:22px;">' + secHead('Education');
                data.education.forEach(function(edu) {
                    html += '<div style="margin-bottom:12px;padding-left:18px;">';
                    html += '<div style="display:flex;justify-content:space-between;align-items:baseline;">';
                    html += '<strong style="color:#111827;">' + escapeHtml(edu.institution || '') + '</strong>';
                    html += '<span style="font-size:9.5px;color:#9ca3af;">' + escapeHtml(Templates.formatDateRange(edu.start_date, edu.end_date, edu.is_current)) + '</span>';
                    html += '</div>';
                    var deg = (edu.degree || '') + (edu.field_of_study ? ' in ' + edu.field_of_study : '');
                    if (deg) html += '<div style="color:#6b7280;">' + escapeHtml(deg) + '</div>';
                    if (edu.gpa) html += '<div style="font-size:9.5px;color:#9ca3af;">GPA: ' + escapeHtml(edu.gpa) + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.skills)) {
                html += '<div style="margin-bottom:22px;">' + secHead('Skills');
                html += '<div style="padding-left:18px;display:flex;flex-wrap:wrap;gap:6px;">';
                data.skills.forEach(function(s) {
                    if (s.name) html += '<span style="display:inline-block;padding:3px 10px;background:#eef2ff;color:#4338ca;border-radius:12px;font-size:9.5px;font-weight:500;">' + escapeHtml(s.name) + '</span>';
                });
                html += '</div></div>';
            }

            if (this.has(data.projects)) {
                html += '<div style="margin-bottom:22px;">' + secHead('Projects');
                data.projects.forEach(function(proj) {
                    html += '<div style="margin-bottom:10px;padding-left:18px;">';
                    html += '<strong>' + escapeHtml(proj.name || '') + '</strong>';
                    if (proj.url) html += ' <span style="font-size:9.5px;color:#9ca3af;">(' + escapeHtml(proj.url) + ')</span>';
                    if (proj.technologies) html += '<div style="font-size:9.5px;color:' + accent + ';margin-top:1px;">' + escapeHtml(proj.technologies) + '</div>';
                    if (proj.description) html += '<p style="margin:3px 0 0;color:#4b5563;">' + escapeHtml(proj.description) + '</p>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.certifications)) { html += '<div style="margin-bottom:22px;">' + secHead('Certifications'); data.certifications.forEach(function(c) { html += '<div style="margin-bottom:5px;padding-left:18px;"><strong>' + escapeHtml(c.name || '') + '</strong>'; if (c.issuer) html += ' – ' + escapeHtml(c.issuer); if (c.date_issued) html += ' <span style="color:#9ca3af;font-size:9.5px;">(' + escapeHtml(c.date_issued) + ')</span>'; html += '</div>'; }); html += '</div>'; }
            if (this.has(data.awards)) { html += '<div style="margin-bottom:22px;">' + secHead('Awards'); data.awards.forEach(function(a) { html += '<div style="margin-bottom:5px;padding-left:18px;"><strong>' + escapeHtml(a.title || '') + '</strong>'; if (a.issuer) html += ' – ' + escapeHtml(a.issuer); if (a.date) html += ' <span style="color:#9ca3af;font-size:9.5px;">(' + escapeHtml(a.date) + ')</span>'; if (a.description) html += '<p style="margin:2px 0 0;color:#4b5563;">' + escapeHtml(a.description) + '</p>'; html += '</div>'; }); html += '</div>'; }
            if (this.has(data.languages)) { html += '<div style="margin-bottom:22px;">' + secHead('Languages'); html += '<div style="padding-left:18px;">'; data.languages.forEach(function(l) { if (l.language) html += '<span style="display:inline-block;margin-right:18px;">' + escapeHtml(l.language) + (l.proficiency ? ' <span style="color:#9ca3af;font-size:9.5px;">(' + escapeHtml(l.proficiency) + ')</span>' : '') + '</span>'; }); html += '</div></div>'; }
            if (this.has(data.volunteer)) { html += '<div style="margin-bottom:22px;">' + secHead('Volunteer'); data.volunteer.forEach(function(v) { html += '<div style="margin-bottom:8px;padding-left:18px;"><strong>' + escapeHtml(v.organization || '') + '</strong> – ' + escapeHtml(v.role || ''); if (v.start_date || v.end_date) html += ' <span style="font-size:9.5px;color:#9ca3af;">(' + escapeHtml(Templates.formatDateRange(v.start_date, v.end_date, v.is_current)) + ')</span>'; if (v.description) html += '<p style="margin:2px 0 0;color:#4b5563;">' + escapeHtml(v.description) + '</p>'; html += '</div>'; }); html += '</div>'; }
            if (this.has(data.references)) { html += '<div style="margin-bottom:22px;">' + secHead('References'); data.references.forEach(function(r) { html += '<div style="margin-bottom:6px;padding-left:18px;"><strong>' + escapeHtml(r.name || '') + '</strong>'; if (r.position || r.company) html += ' – ' + escapeHtml((r.position || '') + (r.company ? ' at ' + r.company : '')); var rc = []; if (r.email) rc.push(r.email); if (r.phone) rc.push(r.phone); if (rc.length) html += '<div style="font-size:9.5px;color:#9ca3af;">' + rc.map(escapeHtml).join(' | ') + '</div>'; html += '</div>'; }); html += '</div>'; }

            html += '</div></div>';
            return html;
        },

        // ------------------------------------------
        // MODERN TEMPLATE
        // ------------------------------------------

        modern: function(data) {
            var p = data.personal || {};
            var accent = '#6366f1';
            var accentBg = accent + '14';
            var html = '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:10.5px;line-height:1.5;color:#2d2d2d;">';

            var name = ((p.first_name || '') + ' ' + (p.last_name || '')).trim();

            // Centered header
            html += '<div style="padding:48px 48px 24px;text-align:center;">';
            if (name) html += '<h1 style="font-size:28px;font-weight:700;color:' + accent + ';margin:0 0 6px;letter-spacing:-0.5px;">' + escapeHtml(name) + '</h1>';
            if (p.job_title) html += '<div style="font-size:13px;color:#6b7280;margin-bottom:12px;">' + escapeHtml(p.job_title) + '</div>';

            var contacts = [];
            if (p.email) contacts.push(escapeHtml(p.email));
            if (p.phone) contacts.push(escapeHtml(p.phone));
            if (p.location) contacts.push(escapeHtml(p.location));
            if (p.linkedin) contacts.push(escapeHtml(p.linkedin));
            if (p.website) contacts.push(escapeHtml(p.website));
            if (p.github) contacts.push(escapeHtml(p.github));
            if (contacts.length) {
                html += '<div style="font-size:9.5px;color:#9ca3af;">' + contacts.join(' &ensp;&bull;&ensp; ') + '</div>';
            }
            html += '</div>';

            html += '<div style="padding:0 48px 44px;">';

            var secHead = function(title) {
                return '<h2 style="font-size:11px;font-weight:700;display:inline-block;padding:4px 14px;background:' + accentBg + ';color:' + accent + ';border-radius:4px;margin-bottom:12px;letter-spacing:0.3px;">' + title + '</h2>';
            };

            if (data.summary && data.summary.content) {
                html += '<div style="margin-bottom:24px;">' + secHead('Summary');
                html += '<p style="margin:0;color:#4b5563;line-height:1.7;">' + escapeHtml(data.summary.content) + '</p></div>';
            }

            if (this.has(data.experience)) {
                html += '<div style="margin-bottom:24px;">' + secHead('Experience');
                data.experience.forEach(function(exp) {
                    html += '<div style="margin-bottom:14px;padding-left:4px;">';
                    html += '<div style="display:flex;justify-content:space-between;align-items:baseline;">';
                    html += '<div><strong style="font-size:11.5px;color:#111827;">' + escapeHtml(exp.position || '') + '</strong> <span style="color:#9ca3af;">at</span> <span style="color:#6b7280;">' + escapeHtml(exp.company || '') + '</span></div>';
                    html += '<span style="font-size:9.5px;color:#9ca3af;white-space:nowrap;">' + escapeHtml(Templates.formatDateRange(exp.start_date, exp.end_date, exp.is_current)) + '</span>';
                    html += '</div>';
                    if (exp.location) html += '<div style="font-size:9.5px;color:#d1d5db;">' + escapeHtml(exp.location) + '</div>';
                    if (exp.description) html += '<p style="margin:5px 0 0;color:#4b5563;line-height:1.6;">' + escapeHtml(exp.description) + '</p>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.education)) {
                html += '<div style="margin-bottom:24px;">' + secHead('Education');
                data.education.forEach(function(edu) {
                    html += '<div style="margin-bottom:12px;padding-left:4px;">';
                    html += '<div style="display:flex;justify-content:space-between;align-items:baseline;">';
                    html += '<strong style="color:#111827;">' + escapeHtml(edu.institution || '') + '</strong>';
                    html += '<span style="font-size:9.5px;color:#9ca3af;">' + escapeHtml(Templates.formatDateRange(edu.start_date, edu.end_date, edu.is_current)) + '</span>';
                    html += '</div>';
                    var deg = (edu.degree || '') + (edu.field_of_study ? ' in ' + edu.field_of_study : '');
                    if (deg) html += '<div style="color:#6b7280;">' + escapeHtml(deg) + '</div>';
                    if (edu.gpa) html += '<div style="font-size:9.5px;color:#9ca3af;">GPA: ' + escapeHtml(edu.gpa) + '</div>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.skills)) {
                html += '<div style="margin-bottom:24px;">' + secHead('Skills');
                html += '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:4px;">';
                data.skills.forEach(function(s) {
                    if (s.name) html += '<span style="display:inline-block;padding:4px 12px;background:#f9fafb;color:#374151;border-radius:20px;font-size:9.5px;font-weight:500;border:1px solid #e5e7eb;">' + escapeHtml(s.name) + '</span>';
                });
                html += '</div></div>';
            }

            if (this.has(data.projects)) {
                html += '<div style="margin-bottom:24px;">' + secHead('Projects');
                data.projects.forEach(function(proj) {
                    html += '<div style="margin-bottom:10px;padding-left:4px;">';
                    html += '<strong>' + escapeHtml(proj.name || '') + '</strong>';
                    if (proj.url) html += ' <span style="font-size:9.5px;color:#9ca3af;">(' + escapeHtml(proj.url) + ')</span>';
                    if (proj.technologies) html += '<div style="font-size:9.5px;color:' + accent + ';margin-top:1px;">' + escapeHtml(proj.technologies) + '</div>';
                    if (proj.description) html += '<p style="margin:3px 0 0;color:#4b5563;">' + escapeHtml(proj.description) + '</p>';
                    html += '</div>';
                });
                html += '</div>';
            }

            if (this.has(data.certifications)) { html += '<div style="margin-bottom:24px;">' + secHead('Certifications'); data.certifications.forEach(function(c) { html += '<div style="margin-bottom:5px;padding-left:4px;"><strong>' + escapeHtml(c.name || '') + '</strong>'; if (c.issuer) html += ' – ' + escapeHtml(c.issuer); if (c.date_issued) html += ' <span style="color:#9ca3af;font-size:9.5px;">(' + escapeHtml(c.date_issued) + ')</span>'; html += '</div>'; }); html += '</div>'; }
            if (this.has(data.awards)) { html += '<div style="margin-bottom:24px;">' + secHead('Awards'); data.awards.forEach(function(a) { html += '<div style="margin-bottom:5px;padding-left:4px;"><strong>' + escapeHtml(a.title || '') + '</strong>'; if (a.issuer) html += ' – ' + escapeHtml(a.issuer); if (a.date) html += ' <span style="color:#9ca3af;font-size:9.5px;">(' + escapeHtml(a.date) + ')</span>'; if (a.description) html += '<p style="margin:2px 0 0;color:#4b5563;">' + escapeHtml(a.description) + '</p>'; html += '</div>'; }); html += '</div>'; }
            if (this.has(data.languages)) { html += '<div style="margin-bottom:24px;">' + secHead('Languages'); html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">'; data.languages.forEach(function(l) { if (l.language) html += '<span style="display:inline-block;padding:3px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;font-size:9.5px;">' + escapeHtml(l.language) + (l.proficiency ? ' · ' + escapeHtml(l.proficiency) : '') + '</span>'; }); html += '</div></div>'; }
            if (this.has(data.volunteer)) { html += '<div style="margin-bottom:24px;">' + secHead('Volunteer'); data.volunteer.forEach(function(v) { html += '<div style="margin-bottom:8px;padding-left:4px;"><strong>' + escapeHtml(v.role || '') + '</strong> at ' + escapeHtml(v.organization || ''); if (v.start_date || v.end_date) html += ' <span style="font-size:9.5px;color:#9ca3af;">(' + escapeHtml(Templates.formatDateRange(v.start_date, v.end_date, v.is_current)) + ')</span>'; if (v.description) html += '<p style="margin:2px 0 0;color:#4b5563;">' + escapeHtml(v.description) + '</p>'; html += '</div>'; }); html += '</div>'; }
            if (this.has(data.references)) { html += '<div style="margin-bottom:24px;">' + secHead('References'); data.references.forEach(function(r) { html += '<div style="margin-bottom:6px;padding-left:4px;"><strong>' + escapeHtml(r.name || '') + '</strong>'; if (r.position || r.company) html += ' – ' + escapeHtml((r.position || '') + (r.company ? ' at ' + r.company : '')); var rc = []; if (r.email) rc.push(r.email); if (r.phone) rc.push(r.phone); if (rc.length) html += '<div style="font-size:9.5px;color:#9ca3af;">' + rc.map(escapeHtml).join(' | ') + '</div>'; html += '</div>'; }); html += '</div>'; }

            html += '</div></div>';
            return html;
        }
    };

    // ==========================================
    // EXPOSE & BOOT
    // ==========================================

    window.ResumeBuilder = ResumeBuilder;
    window.Templates = Templates;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { ResumeBuilder.init(); });
    } else {
        ResumeBuilder.init();
    }

})();
