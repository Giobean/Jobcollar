(function() {
    'use strict';

    const CSRF_TOKEN = window.__CSRF_TOKEN__ || '';

    function api(method, url, data) {
        const opts = {
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
                if (!res.ok) {
                    throw { status: res.status, message: json.error || 'Request failed' };
                }
                return json;
            });
        });
    }

    function showMessage(formId, message, type) {
        var el = document.getElementById('form-message');
        if (!el) {
            el = document.querySelector('#' + formId + ' .form-message') || document.getElementById('form-message');
        }
        if (el) {
            el.textContent = message;
            el.className = 'form-message ' + type;
        }
    }

    function clearMessages() {
        var msgs = document.querySelectorAll('.form-message');
        msgs.forEach(function(el) {
            el.className = 'form-message';
            el.textContent = '';
        });
        var errors = document.querySelectorAll('.form-error');
        errors.forEach(function(el) { el.textContent = ''; });
    }

    // Login form
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            clearMessages();
            var email = loginForm.querySelector('[name="email"]').value;
            var password = loginForm.querySelector('[name="password"]').value;
            var remember = loginForm.querySelector('[name="remember"]');
            remember = remember ? remember.checked : false;

            api('POST', '/api/auth/login', { email: email, password: password, remember: remember })
                .then(function() {
                    window.location.href = '/dashboard';
                })
                .catch(function(err) {
                    showMessage('login-form', err.message, 'error');
                });
        });
    }

    // Register form
    var registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            clearMessages();
            var name = registerForm.querySelector('[name="name"]').value;
            var email = registerForm.querySelector('[name="email"]').value;
            var password = registerForm.querySelector('[name="password"]').value;
            var passwordConfirmation = registerForm.querySelector('[name="password_confirmation"]').value;

            api('POST', '/api/auth/register', {
                name: name,
                email: email,
                password: password,
                password_confirmation: passwordConfirmation
            })
            .then(function() {
                window.location.href = '/dashboard';
            })
            .catch(function(err) {
                showMessage('register-form', err.message, 'error');
            });
        });
    }

    // Forgot password form
    var forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            clearMessages();
            var email = forgotForm.querySelector('[name="email"]').value;

            api('POST', '/api/auth/forgot-password', { email: email })
                .then(function(res) {
                    showMessage('forgot-password-form', res.data.message, 'success');
                })
                .catch(function(err) {
                    showMessage('forgot-password-form', err.message, 'error');
                });
        });
    }

    // Logout button
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            api('POST', '/api/auth/logout', {})
                .then(function() {
                    window.location.href = '/login';
                })
                .catch(function() {
                    window.location.href = '/login';
                });
        });
    }

    // Dashboard page
    var page = document.body.getAttribute('data-page');
    if (page === 'dashboard') {
        loadDashboard();
    }

    function loadDashboard() {
        api('GET', '/api/dashboard')
            .then(function(res) {
                var data = res.data;
                var container = document.getElementById('dashboard-content');
                if (!container) return;

                var html = '<div class="dashboard-stats">';
                html += '<div class="stat-card"><span class="stat-value">' + data.total_resumes + '</span><span class="stat-label">Total Resumes</span></div>';
                html += '</div>';

                if (data.recent_resumes && data.recent_resumes.length > 0) {
                    html += '<h2 style="margin: 2rem 0 1rem; font-size: 1.125rem;">Recent Resumes</h2>';
                    html += '<div class="resume-grid">';
                    data.recent_resumes.forEach(function(resume) {
                        html += '<a href="/resumes/' + resume.id + '" class="resume-card">';
                        html += '<div class="resume-card-title">' + escapeHtml(resume.title) + '</div>';
                        html += '<div class="resume-card-meta">Last edited: ' + formatDate(resume.last_edited_at) + '</div>';
                        if (resume.score) {
                            html += '<div class="resume-card-score">Score: ' + resume.score + '/100</div>';
                        }
                        html += '</a>';
                    });
                    html += '</div>';
                } else {
                    html += '<div style="text-align:center; padding:3rem; color:#6b7280;">';
                    html += '<p>No resumes yet. Create your first one!</p>';
                    html += '</div>';
                }

                container.innerHTML = html;
            })
            .catch(function() {
                var container = document.getElementById('dashboard-content');
                if (container) container.innerHTML = '<p>Error loading dashboard.</p>';
            });
    }

    // Create resume button
    var createBtn = document.getElementById('create-resume-btn');
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            var title = prompt('Resume title:', 'My Resume');
            if (title) {
                api('POST', '/api/resumes', { title: title })
                    .then(function(res) {
                        window.location.href = '/resumes/' + res.data.id;
                    })
                    .catch(function(err) {
                        alert(err.message);
                    });
            }
        });
    }

    // Settings page
    if (page === 'settings') {
        var profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var name = profileForm.querySelector('[name="name"]').value;
                var email = profileForm.querySelector('[name="email"]').value;
                api('PUT', '/api/settings/profile', { name: name, email: email })
                    .then(function() { alert('Profile updated.'); })
                    .catch(function(err) { alert(err.message); });
            });
        }

        var passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var current = passwordForm.querySelector('[name="current_password"]').value;
                var password = passwordForm.querySelector('[name="password"]').value;
                var confirm = passwordForm.querySelector('[name="password_confirmation"]').value;
                api('PUT', '/api/settings/password', {
                    current_password: current,
                    password: password,
                    password_confirmation: confirm
                })
                .then(function() {
                    alert('Password changed.');
                    passwordForm.reset();
                })
                .catch(function(err) { alert(err.message); });
            });
        }

        var deleteBtn = document.getElementById('delete-account-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                var password = prompt('Enter your password to confirm account deletion:');
                if (password) {
                    if (confirm('Are you sure? This cannot be undone.')) {
                        api('DELETE', '/api/settings/account', { password: password })
                            .then(function() { window.location.href = '/'; })
                            .catch(function(err) { alert(err.message); });
                    }
                }
            });
        }
    }

    // Helpers
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
})();
