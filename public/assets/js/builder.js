(function() {
    'use strict';

    var RESUME_ID = window.__RESUME_ID__;
    var CSRF_TOKEN = window.__CSRF_TOKEN__ || '';

    if (!RESUME_ID) return;

    function api(method, url, data) {
        var opts = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': CSRF_TOKEN,
                'Accept': 'application/json',
            },
            credentials: 'same-origin',
        };
        if (data && method !== 'GET') {
            opts.body = JSON.stringify(data);
        }
        return fetch(url, opts).then(function(res) {
            return res.json().then(function(json) {
                if (!res.ok) throw { status: res.status, message: json.error || 'Request failed' };
                return json;
            });
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function loadResume() {
        api('GET', '/api/resumes/' + RESUME_ID)
            .then(function(res) {
                renderBuilder(res.data);
            })
            .catch(function(err) {
                document.getElementById('builder-content').innerHTML =
                    '<div class="loading-state">Error: ' + escapeHtml(err.message) + '</div>';
            });
    }

    function renderBuilder(resume) {
        var titleEl = document.getElementById('resume-title');
        if (titleEl) titleEl.textContent = resume.title;

        var container = document.getElementById('builder-content');
        var html = '';

        // Personal section
        var p = resume.personal || {};
        html += '<section class="builder-section" data-section="personal">';
        html += '<h2>Personal Information</h2>';
        html += '<div class="builder-form-grid">';
        html += fieldHtml('first_name', 'First Name', p.first_name);
        html += fieldHtml('last_name', 'Last Name', p.last_name);
        html += fieldHtml('email', 'Email', p.email);
        html += fieldHtml('phone', 'Phone', p.phone);
        html += fieldHtml('location', 'Location', p.location);
        html += fieldHtml('job_title', 'Job Title', p.job_title);
        html += fieldHtml('website', 'Website', p.website);
        html += fieldHtml('linkedin', 'LinkedIn', p.linkedin);
        html += fieldHtml('github', 'GitHub', p.github);
        html += '</div>';
        html += '<button class="btn btn-primary" onclick="savePersonal()">Save Personal Info</button>';
        html += '</section>';

        // Summary section
        var s = resume.summary || {};
        html += '<section class="builder-section" data-section="summary">';
        html += '<h2>Professional Summary</h2>';
        html += '<textarea id="summary-content" class="form-input" rows="6" placeholder="Write your professional summary...">' + escapeHtml(s.content) + '</textarea>';
        html += '<button class="btn btn-primary" style="margin-top:1rem;" onclick="saveSummary()">Save Summary</button>';
        html += '</section>';

        // Experience section
        html += '<section class="builder-section" data-section="experience">';
        html += '<h2>Experience</h2>';
        if (resume.experience && resume.experience.length > 0) {
            resume.experience.forEach(function(exp) {
                html += '<div class="entry-card" data-id="' + exp.id + '">';
                html += '<strong>' + escapeHtml(exp.position) + '</strong> at ' + escapeHtml(exp.company);
                html += '<div class="entry-meta">' + escapeHtml(exp.start_date) + ' - ' + (exp.is_current ? 'Present' : escapeHtml(exp.end_date)) + '</div>';
                html += '<p>' + escapeHtml(exp.description) + '</p>';
                html += '<button class="btn btn-ghost btn-sm" onclick="deleteEntry(\'experience\', ' + exp.id + ')">Delete</button>';
                html += '</div>';
            });
        }
        html += '<button class="btn btn-outline" onclick="addEntry(\'experience\')">+ Add Experience</button>';
        html += '</section>';

        // Education section
        html += '<section class="builder-section" data-section="education">';
        html += '<h2>Education</h2>';
        if (resume.education && resume.education.length > 0) {
            resume.education.forEach(function(edu) {
                html += '<div class="entry-card" data-id="' + edu.id + '">';
                html += '<strong>' + escapeHtml(edu.degree) + '</strong> - ' + escapeHtml(edu.institution);
                html += '<div class="entry-meta">' + escapeHtml(edu.field_of_study) + ' | ' + escapeHtml(edu.start_date) + ' - ' + escapeHtml(edu.end_date) + '</div>';
                html += '<button class="btn btn-ghost btn-sm" onclick="deleteEntry(\'education\', ' + edu.id + ')">Delete</button>';
                html += '</div>';
            });
        }
        html += '<button class="btn btn-outline" onclick="addEntry(\'education\')">+ Add Education</button>';
        html += '</section>';

        // Skills section
        html += '<section class="builder-section" data-section="skills">';
        html += '<h2>Skills</h2>';
        if (resume.skills && resume.skills.length > 0) {
            html += '<div class="skills-list">';
            resume.skills.forEach(function(skill) {
                html += '<span class="skill-tag">' + escapeHtml(skill.name) + ' <small>(' + escapeHtml(skill.level) + ')</small>';
                html += ' <button class="skill-remove" onclick="deleteEntry(\'skills\', ' + skill.id + ')">&times;</button>';
                html += '</span>';
            });
            html += '</div>';
        }
        html += '<button class="btn btn-outline" onclick="addEntry(\'skills\')">+ Add Skill</button>';
        html += '</section>';

        container.innerHTML = html;
    }

    function fieldHtml(name, label, value) {
        return '<div class="form-group"><label class="form-label">' + label + '</label>' +
               '<input type="text" class="form-input" name="' + name + '" value="' + escapeHtml(value) + '"></div>';
    }

    // Global functions for onclick handlers
    window.savePersonal = function() {
        var section = document.querySelector('[data-section="personal"]');
        var inputs = section.querySelectorAll('.form-input');
        var data = {};
        inputs.forEach(function(input) {
            data[input.name] = input.value;
        });
        api('PUT', '/api/resumes/' + RESUME_ID + '/personal', data)
            .then(function() { alert('Personal info saved!'); })
            .catch(function(err) { alert(err.message); });
    };

    window.saveSummary = function() {
        var content = document.getElementById('summary-content').value;
        api('PUT', '/api/resumes/' + RESUME_ID + '/summary', { content: content })
            .then(function() { alert('Summary saved!'); })
            .catch(function(err) { alert(err.message); });
    };

    window.addEntry = function(section) {
        var data = {};
        if (section === 'experience') {
            data = { company: prompt('Company:') || '', position: prompt('Position:') || '' };
        } else if (section === 'education') {
            data = { institution: prompt('Institution:') || '', degree: prompt('Degree:') || '' };
        } else if (section === 'skills') {
            data = { name: prompt('Skill name:') || '', level: prompt('Level (beginner/intermediate/advanced/expert):') || 'intermediate' };
        } else {
            data = { name: prompt('Name:') || '' };
        }

        if (!data.company && !data.institution && !data.name) return;

        api('POST', '/api/resumes/' + RESUME_ID + '/' + section, data)
            .then(function() { loadResume(); })
            .catch(function(err) { alert(err.message); });
    };

    window.deleteEntry = function(section, entryId) {
        if (!confirm('Delete this entry?')) return;
        api('DELETE', '/api/resumes/' + RESUME_ID + '/' + section + '/' + entryId)
            .then(function() { loadResume(); })
            .catch(function(err) { alert(err.message); });
    };

    // Add builder-specific styles
    var style = document.createElement('style');
    style.textContent = [
        '.builder-section { background:#fff; border:1px solid #e5e7eb; border-radius:0.75rem; padding:1.5rem; margin-bottom:1.5rem; }',
        '.builder-section h2 { font-size:1.125rem; font-weight:600; margin-bottom:1rem; }',
        '.builder-form-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:1rem; margin-bottom:1rem; }',
        '.entry-card { padding:1rem; border:1px solid #e5e7eb; border-radius:0.5rem; margin-bottom:0.75rem; }',
        '.entry-meta { font-size:0.8125rem; color:#6b7280; margin:0.25rem 0; }',
        '.skills-list { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem; }',
        '.skill-tag { display:inline-flex; align-items:center; gap:0.25rem; padding:0.375rem 0.75rem; background:#dbeafe; color:#1d4ed8; border-radius:9999px; font-size:0.8125rem; }',
        '.skill-remove { background:none; border:none; color:#1d4ed8; cursor:pointer; font-size:1rem; padding:0 0.25rem; }',
        '.btn-sm { padding:0.25rem 0.5rem; font-size:0.75rem; }',
    ].join('\n');
    document.head.appendChild(style);

    // Load on ready
    loadResume();
})();
