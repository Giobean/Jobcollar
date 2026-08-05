/* ============================================================
   JobCollar — Vanilla ES2023 Single-Page Application
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   §0  Utility Functions
   ------------------------------------------------------------ */

function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function navigate(url) { window.location.href = url; }

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    if (Number.isNaN(then)) return dateStr;
    const seconds = Math.floor((now - then) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
}

function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function truncate(str, len = 80) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
}

function formatSalary(min, max) {
    const fmt = n => {
        if (!n) return null;
        return '$' + Number(n).toLocaleString('en-US');
    };
    const a = fmt(min);
    const b = fmt(max);
    if (a && b) return `${a} – ${b}`;
    if (a) return `${a}+`;
    if (b) return `Up to ${b}`;
    return '';
}

function initials(name) {
    if (!name) return '?';
    return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function skeleton(count = 3) {
    return `<div class="skeleton-group" aria-busy="true" aria-label="Loading">${
        Array.from({ length: count }, () => '<div class="skeleton-line"></div>').join('')
    }</div>`;
}

/* ------------------------------------------------------------
   §1  API Helper
   ------------------------------------------------------------ */

const API = {
    async request(method, url, data = null) {
        const opts = {
            method,
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'same-origin',
        };

        if (App.csrfToken) {
            opts.headers['X-CSRF-Token'] = App.csrfToken;
        }

        if (data !== null) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(data);
        }

        try {
            const res = await fetch(url, opts);
            const json = await res.json();

            if (json.csrf_token || json?.data?.csrf_token) {
                App.csrfToken = json.csrf_token || json.data.csrf_token;
            }

            if (!res.ok) {
                const msg = json.error || json.message || `Request failed (${res.status})`;
                throw { status: res.status, message: msg, errors: json.errors || null, response: json };
            }

            return json;
        } catch (err) {
            if (err.status) throw err;
            Toast.error('Network error. Please check your connection.');
            throw { status: 0, message: 'Network error', errors: null };
        }
    },

    get(url) { return this.request('GET', url); },
    post(url, data) { return this.request('POST', url, data); },
    put(url, data) { return this.request('PUT', url, data); },
    del(url) { return this.request('DELETE', url, {}); },
};

/* ------------------------------------------------------------
   §2  Toast Notifications
   ------------------------------------------------------------ */

const Toast = {
    _container: null,

    _ensureContainer() {
        if (!this._container) {
            this._container = document.getElementById('toast-container');
            if (!this._container) {
                this._container = document.createElement('div');
                this._container.id = 'toast-container';
                this._container.setAttribute('role', 'status');
                this._container.setAttribute('aria-live', 'polite');
                document.body.appendChild(this._container);
            }
        }
        return this._container;
    },

    show(message, type = 'info', duration = 4000) {
        const container = this._ensureContainer();
        const icons = {
            success: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
            error: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
            warning: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
            info: '<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>',
        };

        const el = document.createElement('div');
        el.className = `toast toast--${type}`;
        el.setAttribute('role', 'alert');
        el.innerHTML = `
            <span class="toast__icon">${icons[type] || icons.info}</span>
            <span class="toast__message">${escapeHtml(message)}</span>
            <button class="toast__close" aria-label="Dismiss">&times;</button>
        `;

        el.querySelector('.toast__close').addEventListener('click', () => this._dismiss(el));

        container.appendChild(el);
        requestAnimationFrame(() => el.classList.add('toast--visible'));

        if (duration > 0) {
            setTimeout(() => this._dismiss(el), duration);
        }
    },

    _dismiss(el) {
        el.classList.remove('toast--visible');
        el.classList.add('toast--exit');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        setTimeout(() => el.remove(), 500);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error', 6000); },
    info(msg) { this.show(msg, 'info'); },
    warning(msg) { this.show(msg, 'warning', 5000); },
};

/* ------------------------------------------------------------
   §3  Theme Manager
   ------------------------------------------------------------ */

const Theme = {
    _mediaQuery: null,

    init() {
        this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const stored = localStorage.getItem('jc-theme');
        const theme = stored || App.user?.theme || 'system';
        this.apply(theme);
        this._mediaQuery.addEventListener('change', () => {
            if ((localStorage.getItem('jc-theme') || 'system') === 'system') {
                this.apply('system');
            }
        });
    },

    set(theme) {
        localStorage.setItem('jc-theme', theme);
        this.apply(theme);
    },

    toggle() {
        const current = localStorage.getItem('jc-theme') || 'system';
        const order = ['light', 'dark', 'system'];
        const next = order[(order.indexOf(current) + 1) % order.length];
        this.set(next);
        Toast.info(`Theme: ${next}`);
    },

    apply(theme) {
        const root = document.documentElement;
        let resolved = theme;
        if (theme === 'system') {
            resolved = this._mediaQuery?.matches ? 'dark' : 'light';
        }
        root.setAttribute('data-theme', resolved);
        root.classList.toggle('dark', resolved === 'dark');
        App.theme = theme;
    },
};

/* ------------------------------------------------------------
   §4  Modal
   ------------------------------------------------------------ */

const Modal = {
    _overlay: null,
    _onKeyDown: null,

    open({ title = '', content = '', actions = [], size = 'md' } = {}) {
        this.close();

        const sizeClass = `modal--${size}`;
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        if (title) overlay.setAttribute('aria-label', title);

        const actionsHtml = actions.map((a, i) =>
            `<button class="btn ${escapeHtml(a.class || 'btn--secondary')}" data-action-idx="${i}">${escapeHtml(a.label)}</button>`
        ).join('');

        overlay.innerHTML = `
            <div class="modal ${sizeClass}">
                ${title ? `<header class="modal__header"><h2 class="modal__title">${escapeHtml(title)}</h2><button class="modal__close" aria-label="Close modal">&times;</button></header>` : ''}
                <div class="modal__body">${content}</div>
                ${actionsHtml ? `<footer class="modal__footer">${actionsHtml}</footer>` : ''}
            </div>
        `;

        overlay.addEventListener('click', e => {
            if (e.target === overlay) this.close();
        });

        const closeBtn = overlay.querySelector('.modal__close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());

        actions.forEach((a, i) => {
            const btn = overlay.querySelector(`[data-action-idx="${i}"]`);
            if (btn && a.onClick) btn.addEventListener('click', a.onClick);
        });

        this._onKeyDown = e => {
            if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this._onKeyDown);

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('modal-overlay--visible'));
        this._overlay = overlay;

        const firstFocusable = overlay.querySelector('button, input, select, textarea, [tabindex]');
        if (firstFocusable) firstFocusable.focus();
    },

    close() {
        if (!this._overlay) return;
        this._overlay.classList.remove('modal-overlay--visible');
        this._overlay.addEventListener('transitionend', () => this._overlay?.remove(), { once: true });
        setTimeout(() => this._overlay?.remove(), 300);
        this._overlay = null;
        if (this._onKeyDown) {
            document.removeEventListener('keydown', this._onKeyDown);
            this._onKeyDown = null;
        }
    },

    confirm(message, onConfirm) {
        this.open({
            title: 'Confirm',
            content: `<p>${escapeHtml(message)}</p>`,
            size: 'sm',
            actions: [
                { label: 'Cancel', class: 'btn--secondary', onClick: () => this.close() },
                { label: 'Confirm', class: 'btn--danger', onClick: () => { this.close(); onConfirm(); } },
            ],
        });
    },
};

/* ------------------------------------------------------------
   §5  Sidebar Layout (shared by authenticated pages)
   ------------------------------------------------------------ */

const Layout = {
    render(pageContent, activePage = '') {
        const user = App.user;
        const avatarText = user ? initials(user.name) : '?';
        const userName = user ? escapeHtml(user.name) : 'User';
        const userEmail = user ? escapeHtml(user.email) : '';

        const navItems = [
            { href: '/dashboard',    icon: Layout._icons.dashboard,    label: 'Dashboard',     key: 'dashboard' },
            { href: '/dashboard',    icon: Layout._icons.resumes,      label: 'Resumes',        key: 'resumes' },
            { href: '/applications', icon: Layout._icons.applications, label: 'Applications',   key: 'applications' },
            { href: '#',             icon: Layout._icons.coverLetters, label: 'Cover Letters',  key: 'cover-letters', soon: true },
            { href: '#',             icon: Layout._icons.analytics,    label: 'Analytics',      key: 'analytics',     soon: true },
            { href: '/settings',     icon: Layout._icons.settings,     label: 'Settings',       key: 'settings' },
        ];

        const navHtml = navItems.map(item => {
            const active = item.key === activePage ? 'sidebar__link--active' : '';
            const disabled = item.soon ? 'sidebar__link--disabled' : '';
            const badge = item.soon ? '<span class="badge badge--soon">Soon</span>' : '';
            const href = item.soon ? 'javascript:void(0)' : item.href;
            return `<a href="${href}" class="sidebar__link ${active} ${disabled}" ${item.soon ? 'aria-disabled="true"' : ''}>
                ${item.icon}<span>${item.label}</span>${badge}
            </a>`;
        }).join('');

        return `
        <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
            <div class="sidebar__top">
                <a href="/dashboard" class="sidebar__logo" aria-label="JobCollar home">
                    <span class="logo-mark">JC</span>
                    <span class="logo-text">JobCollar</span>
                </a>
            </div>
            <nav class="sidebar__nav">${navHtml}</nav>
            <div class="sidebar__bottom">
                <div class="sidebar__user">
                    <div class="avatar" aria-hidden="true">${avatarText}</div>
                    <div class="sidebar__user-info">
                        <span class="sidebar__user-name">${userName}</span>
                        <span class="sidebar__user-email">${userEmail}</span>
                    </div>
                </div>
                <button class="sidebar__logout" id="btn-logout" aria-label="Log out">
                    ${Layout._icons.logout}
                </button>
            </div>
        </aside>
        <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">${Layout._icons.menu}</button>
        <main class="main-content" id="main-content" role="main">${pageContent}</main>`;
    },

    bindEvents() {
        const toggle = $('#sidebar-toggle');
        const sidebar = $('#sidebar');
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('sidebar--open');
            });

            document.addEventListener('click', e => {
                if (sidebar.classList.contains('sidebar--open') &&
                    !sidebar.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
                    sidebar.classList.remove('sidebar--open');
                }
            });
        }

        const logoutBtn = $('#btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await API.post('/api/auth/logout', {});
                } catch (_) { /* proceed anyway */ }
                navigate('/login');
            });
        }
    },

    _icons: {
        dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
        resumes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        applications: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
        coverLetters: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
        analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09c-.658.003-1.25.396-1.51 1z"/></svg>',
        logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
        menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    },
};

/* ------------------------------------------------------------
   §6  Auth Pages  (login / register / forgot-password)
   ------------------------------------------------------------ */

const AuthPages = {
    _logoHtml() {
        return `
        <div class="auth-brand">
            <span class="logo-mark logo-mark--lg">JC</span>
            <span class="auth-brand__name">JobCollar</span>
            <p class="auth-brand__tagline">Your career, collared.</p>
        </div>`;
    },

    loginInit() {
        const app = $('#app');
        app.innerHTML = `
        <div class="auth-page">
            <div class="auth-card">
                ${this._logoHtml()}
                <h1 class="auth-card__title">Welcome back</h1>
                <form id="login-form" class="auth-form" novalidate>
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input type="email" id="login-email" name="email" autocomplete="email" required placeholder="you@example.com" />
                        <span class="form-error" id="login-email-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <div class="input-password-wrap">
                            <input type="password" id="login-password" name="password" autocomplete="current-password" required placeholder="Enter your password" />
                            <button type="button" class="password-toggle" data-target="login-password" aria-label="Show password">${AuthPages._eyeIcon()}</button>
                        </div>
                        <span class="form-error" id="login-password-error"></span>
                    </div>
                    <div class="form-row form-row--between">
                        <label class="checkbox-label">
                            <input type="checkbox" name="remember" id="login-remember" />
                            <span>Remember me</span>
                        </label>
                        <a href="/forgot-password" class="link-small">Forgot password?</a>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" id="login-submit">Sign In</button>
                    <p class="auth-card__footer">Don&rsquo;t have an account? <a href="/register">Create one</a></p>
                </form>
            </div>
        </div>`;

        this._bindPasswordToggles();
        $('#login-form').addEventListener('submit', async e => {
            e.preventDefault();
            const btn = $('#login-submit');
            const email = $('#login-email').value.trim();
            const password = $('#login-password').value;
            const remember = $('#login-remember').checked;

            AuthPages._clearErrors(['login-email-error', 'login-password-error']);
            let valid = true;
            if (!email) { AuthPages._showFieldError('login-email-error', 'Email is required'); valid = false; }
            if (!password) { AuthPages._showFieldError('login-password-error', 'Password is required'); valid = false; }
            if (!valid) return;

            btn.disabled = true;
            btn.textContent = 'Signing in...';
            try {
                const res = await API.post('/api/auth/login', { email, password, remember });
                if (res.data?.csrf_token) App.csrfToken = res.data.csrf_token;
                navigate('/dashboard');
            } catch (err) {
                if (err.errors) {
                    if (err.errors.email) AuthPages._showFieldError('login-email-error', err.errors.email);
                    if (err.errors.password) AuthPages._showFieldError('login-password-error', err.errors.password);
                }
                if (err.message && !err.errors) Toast.error(err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        });
    },

    registerInit() {
        const app = $('#app');
        app.innerHTML = `
        <div class="auth-page">
            <div class="auth-card">
                ${this._logoHtml()}
                <h1 class="auth-card__title">Create your account</h1>
                <form id="register-form" class="auth-form" novalidate>
                    <div class="form-group">
                        <label for="reg-name">Full Name</label>
                        <input type="text" id="reg-name" name="name" autocomplete="name" required placeholder="Jane Doe" />
                        <span class="form-error" id="reg-name-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="reg-email">Email</label>
                        <input type="email" id="reg-email" name="email" autocomplete="email" required placeholder="you@example.com" />
                        <span class="form-error" id="reg-email-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="reg-password">Password</label>
                        <div class="input-password-wrap">
                            <input type="password" id="reg-password" name="password" autocomplete="new-password" required placeholder="Min 8 characters" />
                            <button type="button" class="password-toggle" data-target="reg-password" aria-label="Show password">${AuthPages._eyeIcon()}</button>
                        </div>
                        <span class="form-error" id="reg-password-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="reg-password-confirm">Confirm Password</label>
                        <div class="input-password-wrap">
                            <input type="password" id="reg-password-confirm" name="password_confirmation" autocomplete="new-password" required placeholder="Re-enter password" />
                            <button type="button" class="password-toggle" data-target="reg-password-confirm" aria-label="Show password">${AuthPages._eyeIcon()}</button>
                        </div>
                        <span class="form-error" id="reg-password-confirm-error"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" id="reg-submit">Create Account</button>
                    <p class="auth-card__footer">Already have an account? <a href="/login">Sign in</a></p>
                </form>
            </div>
        </div>`;

        this._bindPasswordToggles();
        $('#register-form').addEventListener('submit', async e => {
            e.preventDefault();
            const btn = $('#reg-submit');
            const name = $('#reg-name').value.trim();
            const email = $('#reg-email').value.trim();
            const password = $('#reg-password').value;
            const passwordConfirm = $('#reg-password-confirm').value;

            AuthPages._clearErrors(['reg-name-error', 'reg-email-error', 'reg-password-error', 'reg-password-confirm-error']);
            let valid = true;
            if (!name || name.length < 2) { AuthPages._showFieldError('reg-name-error', 'Name must be at least 2 characters'); valid = false; }
            if (!email) { AuthPages._showFieldError('reg-email-error', 'Email is required'); valid = false; }
            if (!password || password.length < 8) { AuthPages._showFieldError('reg-password-error', 'Password must be at least 8 characters'); valid = false; }
            if (password !== passwordConfirm) { AuthPages._showFieldError('reg-password-confirm-error', 'Passwords do not match'); valid = false; }
            if (!valid) return;

            btn.disabled = true;
            btn.textContent = 'Creating account...';
            try {
                const res = await API.post('/api/auth/register', { name, email, password, password_confirmation: passwordConfirm });
                if (res.data?.csrf_token) App.csrfToken = res.data.csrf_token;
                Toast.success('Account created!');
                navigate('/dashboard');
            } catch (err) {
                if (err.errors) {
                    if (err.errors.name) AuthPages._showFieldError('reg-name-error', err.errors.name);
                    if (err.errors.email) AuthPages._showFieldError('reg-email-error', err.errors.email);
                    if (err.errors.password) AuthPages._showFieldError('reg-password-error', err.errors.password);
                }
                if (err.message && !err.errors) Toast.error(err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        });
    },

    forgotPasswordInit() {
        const app = $('#app');
        app.innerHTML = `
        <div class="auth-page">
            <div class="auth-card">
                ${this._logoHtml()}
                <h1 class="auth-card__title">Reset your password</h1>
                <p class="auth-card__subtitle">Enter your email and we&rsquo;ll send you a reset link.</p>
                <form id="forgot-form" class="auth-form" novalidate>
                    <div class="form-group">
                        <label for="forgot-email">Email</label>
                        <input type="email" id="forgot-email" name="email" autocomplete="email" required placeholder="you@example.com" />
                        <span class="form-error" id="forgot-email-error"></span>
                    </div>
                    <button type="submit" class="btn btn--primary btn--full" id="forgot-submit">Send Reset Link</button>
                    <p class="auth-card__footer"><a href="/login">&larr; Back to login</a></p>
                </form>
                <div id="forgot-success" class="auth-success" style="display:none;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <h2>Check your email</h2>
                    <p>If an account exists with that email, we&rsquo;ve sent a password reset link.</p>
                    <a href="/login" class="btn btn--secondary">Back to Login</a>
                </div>
            </div>
        </div>`;

        $('#forgot-form').addEventListener('submit', async e => {
            e.preventDefault();
            const btn = $('#forgot-submit');
            const email = $('#forgot-email').value.trim();
            AuthPages._clearErrors(['forgot-email-error']);
            if (!email) { AuthPages._showFieldError('forgot-email-error', 'Email is required'); return; }

            btn.disabled = true;
            btn.textContent = 'Sending...';
            try {
                await API.post('/api/auth/forgot-password', { email });
                $('#forgot-form').style.display = 'none';
                $('#forgot-success').style.display = 'flex';
            } catch (err) {
                if (err.errors?.email) AuthPages._showFieldError('forgot-email-error', err.errors.email);
                else Toast.error(err.message || 'Something went wrong');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Send Reset Link';
            }
        });
    },

    _eyeIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    },

    _bindPasswordToggles() {
        $$('.password-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById(btn.dataset.target);
                if (!input) return;
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            });
        });
    },

    _showFieldError(id, msg) {
        const el = document.getElementById(id);
        if (el) { el.textContent = msg; el.style.display = 'block'; }
    },

    _clearErrors(ids) {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent = ''; el.style.display = 'none'; }
        });
    },
};

/* ------------------------------------------------------------
   §7  Dashboard
   ------------------------------------------------------------ */

const Dashboard = {
    async init() {
        const app = $('#app');
        app.innerHTML = Layout.render(`
            <div class="page-header">
                <h1 class="page-title">Dashboard</h1>
                <a href="/resumes" class="btn btn--primary">+ New Resume</a>
            </div>
            <div id="dashboard-content">${skeleton(6)}</div>
        `, 'dashboard');
        Layout.bindEvents();

        try {
            const res = await API.get('/api/dashboard');
            this.render(res.data);
        } catch (err) {
            $('#dashboard-content').innerHTML = `<div class="empty-state"><p>Failed to load dashboard. <button class="btn btn--secondary" onclick="Dashboard.init()">Retry</button></p></div>`;
        }
    },

    render(data) {
        const container = $('#dashboard-content');
        if (!container) return;

        const score = data.resume_score != null ? data.resume_score : '—';
        const hasResumes = data.recent_resumes?.length > 0;
        const hasApps = data.recent_applications?.length > 0;

        container.innerHTML = `
        <section class="stats-row" aria-label="Statistics">
            ${this._statCard('Applications', data.total_applications, 'briefcase')}
            ${this._statCard('Interviews', data.total_interviews, 'users')}
            ${this._statCard('Offers', data.total_offers, 'award')}
            ${this._statCard('Resume Score', score, 'star')}
        </section>

        <div class="dashboard-grid">
            <section class="card" aria-label="Recent Resumes">
                <header class="card__header">
                    <h2 class="card__title">Recent Resumes</h2>
                    <span class="card__count">${data.total_resumes ?? 0} total</span>
                </header>
                <div class="card__body">
                    ${hasResumes ? data.recent_resumes.map(r => this._resumeCard(r)).join('') : this._emptyResumes()}
                </div>
            </section>

            <section class="card" aria-label="Recent Applications">
                <header class="card__header">
                    <h2 class="card__title">Recent Applications</h2>
                </header>
                <div class="card__body">
                    ${hasApps ? data.recent_applications.map(a => this._appCard(a)).join('') : this._emptyApps()}
                </div>
            </section>
        </div>`;

        container.querySelectorAll('[data-delete-resume]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                const id = btn.dataset.deleteResume;
                Modal.confirm('Delete this resume? This cannot be undone.', async () => {
                    try {
                        await API.del(`/api/resumes/${id}`);
                        Toast.success('Resume deleted');
                        Dashboard.init();
                    } catch (err) {
                        Toast.error(err.message || 'Failed to delete resume');
                    }
                });
            });
        });
    },

    _statCard(label, value, icon) {
        const icons = {
            briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
            users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
            award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
            star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        };
        return `
        <div class="stat-card">
            <div class="stat-card__icon">${icons[icon] || ''}</div>
            <div class="stat-card__info">
                <span class="stat-card__value">${escapeHtml(String(value))}</span>
                <span class="stat-card__label">${escapeHtml(label)}</span>
            </div>
        </div>`;
    },

    _resumeCard(r) {
        const scoreBadge = r.resume_score != null
            ? `<span class="badge badge--score">${escapeHtml(String(r.resume_score))}%</span>`
            : '';
        return `
        <div class="list-item">
            <div class="list-item__info">
                <a href="/resumes/${encodeURIComponent(r.id)}" class="list-item__title">${escapeHtml(r.title)}</a>
                <span class="list-item__meta">${timeAgo(r.updated_at)} ${scoreBadge}</span>
            </div>
            <div class="list-item__actions">
                <a href="/resumes/${encodeURIComponent(r.id)}" class="btn btn--sm btn--ghost" aria-label="Edit resume">Edit</a>
                <button class="btn btn--sm btn--ghost btn--danger-text" data-delete-resume="${encodeURIComponent(r.id)}" aria-label="Delete resume">Delete</button>
            </div>
        </div>`;
    },

    _appCard(a) {
        const statusBadge = a.status_name
            ? `<span class="badge" style="background:${escapeHtml(a.status_color || '#6b7280')};color:#fff">${escapeHtml(a.status_name)}</span>`
            : '';
        return `
        <div class="list-item">
            <div class="list-item__info">
                <span class="list-item__title">${escapeHtml(a.company)}</span>
                <span class="list-item__meta">${escapeHtml(a.position)} &middot; ${formatDate(a.date_applied)} ${statusBadge}</span>
            </div>
        </div>`;
    },

    _emptyResumes() {
        return `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No resumes yet</p>
            <a href="/resumes" class="btn btn--primary">Create your first resume</a>
        </div>`;
    },

    _emptyApps() {
        return `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
            <p>No applications tracked yet</p>
            <a href="/applications" class="btn btn--secondary">Track your first application</a>
        </div>`;
    },
};

/* ------------------------------------------------------------
   §8  Settings Page
   ------------------------------------------------------------ */

const SettingsPage = {
    _data: null,
    _activeTab: 'profile',

    async init() {
        const app = $('#app');
        app.innerHTML = Layout.render(`
            <div class="page-header">
                <h1 class="page-title">Settings</h1>
            </div>
            <div id="settings-content">${skeleton(4)}</div>
        `, 'settings');
        Layout.bindEvents();

        try {
            const res = await API.get('/api/settings');
            this._data = res.data;
            this.render(res.data);
        } catch (err) {
            $('#settings-content').innerHTML = `<div class="empty-state"><p>Failed to load settings. <button class="btn btn--secondary" onclick="SettingsPage.init()">Retry</button></p></div>`;
        }
    },

    render(data) {
        const container = $('#settings-content');
        if (!container) return;

        const user = data.user || App.user || {};
        const currentTheme = user.theme || localStorage.getItem('jc-theme') || 'system';
        const autosave = user.autosave != null ? !!user.autosave : true;

        container.innerHTML = `
        <div class="settings-tabs" role="tablist" aria-label="Settings sections">
            <button class="tab ${this._activeTab === 'profile' ? 'tab--active' : ''}" data-tab="profile" role="tab" aria-selected="${this._activeTab === 'profile'}">Profile</button>
            <button class="tab ${this._activeTab === 'security' ? 'tab--active' : ''}" data-tab="security" role="tab" aria-selected="${this._activeTab === 'security'}">Security</button>
            <button class="tab ${this._activeTab === 'preferences' ? 'tab--active' : ''}" data-tab="preferences" role="tab" aria-selected="${this._activeTab === 'preferences'}">Preferences</button>
            <button class="tab ${this._activeTab === 'danger' ? 'tab--active' : ''}" data-tab="danger" role="tab" aria-selected="${this._activeTab === 'danger'}">Danger Zone</button>
        </div>

        <div class="settings-panels">
            <!-- Profile -->
            <div class="settings-panel ${this._activeTab === 'profile' ? '' : 'hidden'}" id="panel-profile" role="tabpanel">
                <form id="form-profile" class="settings-form" novalidate>
                    <div class="form-group">
                        <label for="settings-name">Full Name</label>
                        <input type="text" id="settings-name" value="${escapeHtml(user.name)}" required />
                        <span class="form-error" id="settings-name-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="settings-email">Email</label>
                        <input type="email" id="settings-email" value="${escapeHtml(user.email)}" required />
                        <span class="form-error" id="settings-email-error"></span>
                    </div>
                    <button type="submit" class="btn btn--primary">Save Changes</button>
                </form>
            </div>

            <!-- Security -->
            <div class="settings-panel ${this._activeTab === 'security' ? '' : 'hidden'}" id="panel-security" role="tabpanel">
                <form id="form-password" class="settings-form" novalidate>
                    <div class="form-group">
                        <label for="pw-current">Current Password</label>
                        <input type="password" id="pw-current" required autocomplete="current-password" />
                        <span class="form-error" id="pw-current-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="pw-new">New Password</label>
                        <input type="password" id="pw-new" required autocomplete="new-password" placeholder="Min 8 characters" />
                        <span class="form-error" id="pw-new-error"></span>
                    </div>
                    <div class="form-group">
                        <label for="pw-confirm">Confirm New Password</label>
                        <input type="password" id="pw-confirm" required autocomplete="new-password" />
                        <span class="form-error" id="pw-confirm-error"></span>
                    </div>
                    <button type="submit" class="btn btn--primary">Update Password</button>
                </form>
            </div>

            <!-- Preferences -->
            <div class="settings-panel ${this._activeTab === 'preferences' ? '' : 'hidden'}" id="panel-preferences" role="tabpanel">
                <form id="form-preferences" class="settings-form" novalidate>
                    <div class="form-group">
                        <label for="pref-theme">Theme</label>
                        <select id="pref-theme">
                            <option value="system" ${currentTheme === 'system' ? 'selected' : ''}>System</option>
                            <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="pref-autosave" ${autosave ? 'checked' : ''} />
                            <span>Autosave resumes while editing</span>
                        </label>
                    </div>
                    <button type="submit" class="btn btn--primary">Save Preferences</button>
                </form>
            </div>

            <!-- Danger Zone -->
            <div class="settings-panel ${this._activeTab === 'danger' ? '' : 'hidden'}" id="panel-danger" role="tabpanel">
                <div class="danger-zone">
                    <h3>Delete Account</h3>
                    <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <button class="btn btn--danger" id="btn-delete-account">Delete My Account</button>
                </div>
            </div>
        </div>`;

        this._bindTabs(container);
        this._bindProfileForm();
        this._bindPasswordForm();
        this._bindPreferencesForm();
        this._bindDeleteAccount();
    },

    _bindTabs(container) {
        container.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                this._activeTab = target;
                container.querySelectorAll('.tab').forEach(t => {
                    t.classList.toggle('tab--active', t.dataset.tab === target);
                    t.setAttribute('aria-selected', t.dataset.tab === target);
                });
                container.querySelectorAll('.settings-panel').forEach(p => {
                    p.classList.toggle('hidden', p.id !== `panel-${target}`);
                });
            });
        });
    },

    _bindProfileForm() {
        const form = $('#form-profile');
        if (!form) return;
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const name = $('#settings-name').value.trim();
            const email = $('#settings-email').value.trim();
            AuthPages._clearErrors(['settings-name-error', 'settings-email-error']);

            let valid = true;
            if (!name || name.length < 2) { AuthPages._showFieldError('settings-name-error', 'Name must be at least 2 characters'); valid = false; }
            if (!email) { AuthPages._showFieldError('settings-email-error', 'Email is required'); valid = false; }
            if (!valid) return;

            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Saving...';
            try {
                const res = await API.put('/api/settings/profile', { name, email });
                if (res.data) App.user = res.data;
                Toast.success('Profile updated');
            } catch (err) {
                if (err.errors) {
                    if (err.errors.name) AuthPages._showFieldError('settings-name-error', err.errors.name);
                    if (err.errors.email) AuthPages._showFieldError('settings-email-error', err.errors.email);
                } else {
                    Toast.error(err.message || 'Failed to update profile');
                }
            } finally {
                btn.disabled = false;
                btn.textContent = 'Save Changes';
            }
        });
    },

    _bindPasswordForm() {
        const form = $('#form-password');
        if (!form) return;
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const current = $('#pw-current').value;
            const next = $('#pw-new').value;
            const confirm = $('#pw-confirm').value;
            AuthPages._clearErrors(['pw-current-error', 'pw-new-error', 'pw-confirm-error']);

            let valid = true;
            if (!current) { AuthPages._showFieldError('pw-current-error', 'Current password is required'); valid = false; }
            if (!next || next.length < 8) { AuthPages._showFieldError('pw-new-error', 'Must be at least 8 characters'); valid = false; }
            if (next !== confirm) { AuthPages._showFieldError('pw-confirm-error', 'Passwords do not match'); valid = false; }
            if (!valid) return;

            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Updating...';
            try {
                await API.put('/api/settings/password', { current_password: current, password: next, password_confirmation: confirm });
                Toast.success('Password updated');
                form.reset();
            } catch (err) {
                Toast.error(err.message || 'Failed to update password');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Update Password';
            }
        });
    },

    _bindPreferencesForm() {
        const form = $('#form-preferences');
        if (!form) return;
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const theme = $('#pref-theme').value;
            const autosave = $('#pref-autosave').checked;

            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Saving...';
            try {
                await API.put('/api/settings/preferences', { theme, autosave });
                Theme.set(theme);
                Toast.success('Preferences saved');
            } catch (err) {
                Toast.error(err.message || 'Failed to save preferences');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Save Preferences';
            }
        });
    },

    _bindDeleteAccount() {
        const btn = $('#btn-delete-account');
        if (!btn) return;
        btn.addEventListener('click', () => {
            Modal.confirm('Are you sure you want to permanently delete your account? All your data will be lost.', async () => {
                try {
                    await API.del('/api/settings/account');
                    Toast.info('Account deleted');
                    navigate('/login');
                } catch (err) {
                    Toast.error(err.message || 'Failed to delete account');
                }
            });
        });
    },
};

/* ------------------------------------------------------------
   §9  Applications (Kanban + List)
   ------------------------------------------------------------ */

const Applications = {
    _applications: [],
    _statuses: [],
    _view: 'kanban',
    _search: '',
    _dragData: null,

    async init() {
        const app = $('#app');
        app.innerHTML = Layout.render(`
            <div class="page-header">
                <h1 class="page-title">Applications</h1>
                <button class="btn btn--primary" id="btn-add-app">+ Add Application</button>
            </div>
            <div id="app-toolbar" class="toolbar">
                <div class="toolbar__left">
                    <input type="search" id="app-search" class="input-search" placeholder="Search company, position..." aria-label="Search applications" />
                </div>
                <div class="toolbar__right">
                    <button class="btn btn--ghost btn--sm view-toggle" data-view="kanban" aria-label="Kanban view" title="Kanban view">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>
                    </button>
                    <button class="btn btn--ghost btn--sm view-toggle" data-view="list" aria-label="List view" title="List view">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    </button>
                </div>
            </div>
            <div id="app-content">${skeleton(5)}</div>
        `, 'applications');
        Layout.bindEvents();

        this._bindToolbar();

        try {
            const [appRes, settingsRes] = await Promise.all([
                API.get('/api/applications'),
                API.get('/api/settings'),
            ]);
            this._applications = appRes.data || [];
            this._statuses = settingsRes.data?.statuses || [];
            this.renderCurrentView();
        } catch (err) {
            $('#app-content').innerHTML = `<div class="empty-state"><p>Failed to load applications. <button class="btn btn--secondary" onclick="Applications.init()">Retry</button></p></div>`;
        }
    },

    renderCurrentView() {
        const filtered = this._filteredApps();
        if (this._view === 'kanban') {
            this.renderKanban(filtered, this._statuses);
        } else {
            this.renderList(filtered);
        }
        this._updateViewToggle();
    },

    _filteredApps() {
        if (!this._search) return this._applications;
        const q = this._search.toLowerCase();
        return this._applications.filter(a =>
            (a.company || '').toLowerCase().includes(q) ||
            (a.position || '').toLowerCase().includes(q) ||
            (a.location || '').toLowerCase().includes(q)
        );
    },

    renderKanban(applications, statuses) {
        const container = $('#app-content');
        if (!container) return;

        if (!statuses.length && !applications.length) {
            container.innerHTML = this._emptyState();
            return;
        }

        const noStatusCol = { id: null, name: 'No Status', color: '#9ca3af' };
        const columns = [...statuses];
        const noStatusApps = applications.filter(a => !a.status_id);
        if (noStatusApps.length) columns.unshift(noStatusCol);

        container.innerHTML = `
        <div class="kanban" role="region" aria-label="Application kanban board">
            ${columns.map(col => {
                const colApps = col.id === null
                    ? noStatusApps
                    : applications.filter(a => a.status_id == col.id);
                return `
                <div class="kanban__column" data-status-id="${col.id ?? ''}" aria-label="${escapeHtml(col.name)} column">
                    <header class="kanban__column-header" style="border-top-color:${escapeHtml(col.color)}">
                        <span class="kanban__column-title">${escapeHtml(col.name)}</span>
                        <span class="kanban__column-count">${colApps.length}</span>
                    </header>
                    <div class="kanban__cards" data-status-id="${col.id ?? ''}"
                         ondragover="event.preventDefault();this.classList.add('kanban__cards--drag-over')"
                         ondragleave="this.classList.remove('kanban__cards--drag-over')"
                         ondrop="Applications._handleDrop(event, '${col.id ?? ''}');this.classList.remove('kanban__cards--drag-over')">
                        ${colApps.map(a => this._kanbanCard(a)).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>`;

        this._bindCardEvents(container);
    },

    renderList(applications) {
        const container = $('#app-content');
        if (!container) return;

        if (!applications.length) {
            container.innerHTML = this._emptyState();
            return;
        }

        container.innerHTML = `
        <div class="app-list" role="list" aria-label="Applications list">
            <div class="app-list__header">
                <span class="app-list__col app-list__col--company">Company</span>
                <span class="app-list__col app-list__col--position">Position</span>
                <span class="app-list__col app-list__col--status">Status</span>
                <span class="app-list__col app-list__col--date">Applied</span>
                <span class="app-list__col app-list__col--salary">Salary</span>
                <span class="app-list__col app-list__col--actions"></span>
            </div>
            ${applications.map(a => `
            <div class="app-list__row" role="listitem" data-app-id="${a.id}">
                <span class="app-list__col app-list__col--company">${escapeHtml(a.company)}</span>
                <span class="app-list__col app-list__col--position">${escapeHtml(a.position)}</span>
                <span class="app-list__col app-list__col--status">
                    ${a.status_name ? `<span class="badge" style="background:${escapeHtml(a.status_color || '#6b7280')};color:#fff">${escapeHtml(a.status_name)}</span>` : '<span class="text-muted">—</span>'}
                </span>
                <span class="app-list__col app-list__col--date">${formatDate(a.date_applied)}</span>
                <span class="app-list__col app-list__col--salary">${formatSalary(a.salary_min, a.salary_max) || '<span class="text-muted">—</span>'}</span>
                <span class="app-list__col app-list__col--actions">
                    <button class="btn btn--sm btn--ghost" data-edit-app="${a.id}" aria-label="Edit application">Edit</button>
                    <button class="btn btn--sm btn--ghost" data-archive-app="${a.id}" aria-label="Archive application">Archive</button>
                    <button class="btn btn--sm btn--ghost btn--danger-text" data-delete-app="${a.id}" aria-label="Delete application">Delete</button>
                </span>
            </div>`).join('')}
        </div>`;

        this._bindCardEvents(container);
    },

    _kanbanCard(a) {
        const salary = formatSalary(a.salary_min, a.salary_max);
        return `
        <div class="kanban__card" draggable="true" data-app-id="${a.id}"
             ondragstart="Applications._handleDragStart(event, ${a.id})">
            <div class="kanban__card-company">${escapeHtml(a.company)}</div>
            <div class="kanban__card-position">${escapeHtml(a.position)}</div>
            ${salary ? `<div class="kanban__card-salary">${salary}</div>` : ''}
            <div class="kanban__card-date">${formatDate(a.date_applied)}</div>
            <div class="kanban__card-actions">
                <button class="btn btn--xs btn--ghost" data-edit-app="${a.id}" aria-label="Edit">Edit</button>
                <button class="btn btn--xs btn--ghost btn--danger-text" data-delete-app="${a.id}" aria-label="Delete">Del</button>
            </div>
        </div>`;
    },

    _emptyState() {
        return `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
            <p>No applications found</p>
            <button class="btn btn--primary" onclick="Applications.addApplication()">Add your first application</button>
        </div>`;
    },

    _bindToolbar() {
        const addBtn = $('#btn-add-app');
        if (addBtn) addBtn.addEventListener('click', () => this.addApplication());

        const searchInput = $('#app-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(e => {
                this._search = e.target.value.trim();
                this.renderCurrentView();
            }, 250));
        }

        $$('.view-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                this._view = btn.dataset.view;
                this.renderCurrentView();
            });
        });
    },

    _updateViewToggle() {
        $$('.view-toggle').forEach(btn => {
            btn.classList.toggle('btn--active', btn.dataset.view === this._view);
        });
    },

    _bindCardEvents(container) {
        container.querySelectorAll('[data-edit-app]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this.editApplication(parseInt(btn.dataset.editApp, 10));
            });
        });
        container.querySelectorAll('[data-delete-app]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.deleteApp, 10);
                Modal.confirm('Delete this application?', async () => {
                    try {
                        await API.del(`/api/applications/${id}`);
                        this._applications = this._applications.filter(a => a.id !== id);
                        this.renderCurrentView();
                        Toast.success('Application deleted');
                    } catch (err) {
                        Toast.error(err.message || 'Failed to delete');
                    }
                });
            });
        });
        container.querySelectorAll('[data-archive-app]').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.archiveApp, 10);
                try {
                    const res = await API.put(`/api/applications/${id}/archive`, {});
                    const updated = res.data;
                    if (updated.is_archived) {
                        this._applications = this._applications.filter(a => a.id !== id);
                        Toast.info('Application archived');
                    } else {
                        const idx = this._applications.findIndex(a => a.id === id);
                        if (idx !== -1) this._applications[idx] = updated;
                        Toast.info('Application unarchived');
                    }
                    this.renderCurrentView();
                } catch (err) {
                    Toast.error(err.message || 'Failed to archive');
                }
            });
        });
    },

    _handleDragStart(event, appId) {
        event.dataTransfer.setData('text/plain', String(appId));
        event.dataTransfer.effectAllowed = 'move';
    },

    async _handleDrop(event, statusId) {
        event.preventDefault();
        const appId = parseInt(event.dataTransfer.getData('text/plain'), 10);
        const resolvedStatusId = statusId === '' || statusId === 'null' ? null : parseInt(statusId, 10);

        try {
            const res = await API.put(`/api/applications/${appId}`, { status_id: resolvedStatusId });
            const idx = this._applications.findIndex(a => a.id === appId);
            if (idx !== -1) {
                this._applications[idx] = res.data;
            }
            this.renderCurrentView();
        } catch (err) {
            Toast.error(err.message || 'Failed to update status');
        }
    },

    async updateStatus(id, statusId) {
        try {
            const res = await API.put(`/api/applications/${id}`, { status_id: statusId });
            const idx = this._applications.findIndex(a => a.id === id);
            if (idx !== -1) this._applications[idx] = res.data;
            this.renderCurrentView();
        } catch (err) {
            Toast.error(err.message || 'Failed to update status');
        }
    },

    addApplication() {
        this._openAppModal(null);
    },

    editApplication(id) {
        const app = this._applications.find(a => a.id === id);
        if (!app) return;
        this._openAppModal(app);
    },

    _openAppModal(existing) {
        const isEdit = !!existing;
        const title = isEdit ? 'Edit Application' : 'Add Application';
        const a = existing || {};

        const statusOptions = this._statuses.map(s =>
            `<option value="${s.id}" ${a.status_id == s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
        ).join('');

        const content = `
        <form id="app-modal-form" class="modal-form" novalidate>
            <div class="form-row form-row--2col">
                <div class="form-group">
                    <label for="app-company">Company *</label>
                    <input type="text" id="app-company" value="${escapeHtml(a.company || '')}" required />
                </div>
                <div class="form-group">
                    <label for="app-position">Position *</label>
                    <input type="text" id="app-position" value="${escapeHtml(a.position || '')}" required />
                </div>
            </div>
            <div class="form-row form-row--2col">
                <div class="form-group">
                    <label for="app-location">Location</label>
                    <input type="text" id="app-location" value="${escapeHtml(a.location || '')}" />
                </div>
                <div class="form-group">
                    <label for="app-work-type">Work Type</label>
                    <select id="app-work-type">
                        <option value="onsite" ${a.work_type === 'onsite' ? 'selected' : ''}>On-site</option>
                        <option value="remote" ${a.work_type === 'remote' ? 'selected' : ''}>Remote</option>
                        <option value="hybrid" ${a.work_type === 'hybrid' ? 'selected' : ''}>Hybrid</option>
                    </select>
                </div>
            </div>
            <div class="form-row form-row--2col">
                <div class="form-group">
                    <label for="app-salary-min">Salary Min</label>
                    <input type="number" id="app-salary-min" value="${a.salary_min ?? ''}" placeholder="e.g. 80000" />
                </div>
                <div class="form-group">
                    <label for="app-salary-max">Salary Max</label>
                    <input type="number" id="app-salary-max" value="${a.salary_max ?? ''}" placeholder="e.g. 120000" />
                </div>
            </div>
            <div class="form-row form-row--2col">
                <div class="form-group">
                    <label for="app-status">Status</label>
                    <select id="app-status">
                        <option value="">— None —</option>
                        ${statusOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="app-date">Date Applied</label>
                    <input type="date" id="app-date" value="${a.date_applied || new Date().toISOString().slice(0, 10)}" />
                </div>
            </div>
            <div class="form-group">
                <label for="app-url">Job URL</label>
                <input type="url" id="app-url" value="${escapeHtml(a.url || '')}" placeholder="https://..." />
            </div>
            <div class="form-row form-row--2col">
                <div class="form-group">
                    <label for="app-recruiter">Recruiter Name</label>
                    <input type="text" id="app-recruiter" value="${escapeHtml(a.recruiter_name || '')}" />
                </div>
                <div class="form-group">
                    <label for="app-recruiter-email">Recruiter Email</label>
                    <input type="email" id="app-recruiter-email" value="${escapeHtml(a.recruiter_email || '')}" />
                </div>
            </div>
            <div class="form-group">
                <label for="app-notes">Notes</label>
                <textarea id="app-notes" rows="3">${escapeHtml(a.notes || '')}</textarea>
            </div>
        </form>`;

        Modal.open({
            title,
            content,
            size: 'lg',
            actions: [
                { label: 'Cancel', class: 'btn--secondary', onClick: () => Modal.close() },
                {
                    label: isEdit ? 'Save Changes' : 'Add Application',
                    class: 'btn--primary',
                    onClick: () => this._submitAppModal(existing?.id ?? null),
                },
            ],
        });
    },

    async _submitAppModal(id) {
        const company = $('#app-company')?.value.trim();
        const position = $('#app-position')?.value.trim();
        if (!company || !position) {
            Toast.warning('Company and Position are required');
            return;
        }

        const payload = {
            company,
            position,
            location: $('#app-location')?.value.trim() || '',
            work_type: $('#app-work-type')?.value || 'onsite',
            salary_min: $('#app-salary-min')?.value ? parseInt($('#app-salary-min').value, 10) : null,
            salary_max: $('#app-salary-max')?.value ? parseInt($('#app-salary-max').value, 10) : null,
            status_id: $('#app-status')?.value ? parseInt($('#app-status').value, 10) : null,
            date_applied: $('#app-date')?.value || new Date().toISOString().slice(0, 10),
            url: $('#app-url')?.value.trim() || '',
            recruiter_name: $('#app-recruiter')?.value.trim() || '',
            recruiter_email: $('#app-recruiter-email')?.value.trim() || '',
            notes: $('#app-notes')?.value.trim() || '',
        };

        try {
            if (id) {
                const res = await API.put(`/api/applications/${id}`, payload);
                const idx = this._applications.findIndex(a => a.id === id);
                if (idx !== -1) this._applications[idx] = res.data;
                Toast.success('Application updated');
            } else {
                const res = await API.post('/api/applications', payload);
                this._applications.unshift(res.data);
                Toast.success('Application added');
            }
            Modal.close();
            this.renderCurrentView();
        } catch (err) {
            Toast.error(err.message || 'Failed to save application');
        }
    },
};

/* ------------------------------------------------------------
   §10  Resume Builder — loaded from /js/resume-builder.js
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   §11  Command Palette
   ------------------------------------------------------------ */

const CommandPalette = {
    _overlay: null,
    _onKeyDown: null,

    commands: [
        { name: 'New Resume',       action: () => navigate('/resumes'),       shortcut: 'N',     category: 'Navigation' },
        { name: 'Dashboard',        action: () => navigate('/dashboard'),     shortcut: null,    category: 'Navigation' },
        { name: 'Applications',     action: () => navigate('/applications'),  shortcut: null,    category: 'Navigation' },
        { name: 'Settings',         action: () => navigate('/settings'),      shortcut: null,    category: 'Navigation' },
        { name: 'Toggle Theme',     action: () => Theme.toggle(),             shortcut: null,    category: 'Actions' },
        { name: 'Logout',           action: async () => {
            try { await API.post('/api/auth/logout', {}); } catch (_) {}
            navigate('/login');
        }, shortcut: null, category: 'Actions' },
    ],

    open() {
        if (this._overlay) return;

        const overlay = document.createElement('div');
        overlay.className = 'palette-overlay';
        overlay.innerHTML = `
        <div class="palette" role="dialog" aria-label="Command palette">
            <input type="text" class="palette__input" placeholder="Type a command..." aria-label="Search commands" autofocus />
            <div class="palette__results" role="listbox"></div>
        </div>`;

        overlay.addEventListener('click', e => {
            if (e.target === overlay) this.close();
        });

        this._overlay = overlay;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('palette-overlay--visible'));

        const input = overlay.querySelector('.palette__input');
        input.focus();
        this._renderResults('');

        input.addEventListener('input', e => this._renderResults(e.target.value));

        this._onKeyDown = e => {
            if (e.key === 'Escape') {
                this.close();
                return;
            }
            if (e.key === 'Enter') {
                const active = overlay.querySelector('.palette__item--active');
                if (active) {
                    const idx = parseInt(active.dataset.idx, 10);
                    this.execute(this._filtered[idx]);
                }
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const items = [...overlay.querySelectorAll('.palette__item')];
                if (!items.length) return;
                const current = items.findIndex(i => i.classList.contains('palette__item--active'));
                items.forEach(i => i.classList.remove('palette__item--active'));
                let next;
                if (e.key === 'ArrowDown') {
                    next = current < items.length - 1 ? current + 1 : 0;
                } else {
                    next = current > 0 ? current - 1 : items.length - 1;
                }
                items[next].classList.add('palette__item--active');
                items[next].scrollIntoView({ block: 'nearest' });
            }
        };
        document.addEventListener('keydown', this._onKeyDown);
    },

    close() {
        if (!this._overlay) return;
        this._overlay.classList.remove('palette-overlay--visible');
        setTimeout(() => this._overlay?.remove(), 200);
        this._overlay = null;
        if (this._onKeyDown) {
            document.removeEventListener('keydown', this._onKeyDown);
            this._onKeyDown = null;
        }
    },

    _filtered: [],

    _renderResults(query) {
        const results = this._overlay?.querySelector('.palette__results');
        if (!results) return;

        const q = query.toLowerCase().trim();
        this._filtered = q
            ? this.commands.filter(c => c.name.toLowerCase().includes(q))
            : [...this.commands];

        if (!this._filtered.length) {
            results.innerHTML = '<div class="palette__empty">No commands found</div>';
            return;
        }

        results.innerHTML = this._filtered.map((c, i) => `
            <div class="palette__item ${i === 0 ? 'palette__item--active' : ''}" data-idx="${i}" role="option">
                <span class="palette__item-name">${escapeHtml(c.name)}</span>
                ${c.shortcut ? `<kbd class="palette__kbd">${escapeHtml(c.shortcut)}</kbd>` : ''}
            </div>
        `).join('');

        results.querySelectorAll('.palette__item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.idx, 10);
                this.execute(this._filtered[idx]);
            });
            item.addEventListener('mouseenter', () => {
                results.querySelectorAll('.palette__item').forEach(i => i.classList.remove('palette__item--active'));
                item.classList.add('palette__item--active');
            });
        });
    },

    search(query) {
        if (!this._overlay) this.open();
        const input = this._overlay?.querySelector('.palette__input');
        if (input) {
            input.value = query;
            this._renderResults(query);
        }
    },

    execute(command) {
        if (!command) return;
        this.close();
        command.action();
    },
};

/* ------------------------------------------------------------
   §12  Keyboard Shortcuts
   ------------------------------------------------------------ */

const Shortcuts = {
    init() {
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable) {
                if (e.key === 'Escape') {
                    Modal.close();
                    CommandPalette.close();
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                CommandPalette.open();
                return;
            }

            if (e.key === 'Escape') {
                Modal.close();
                CommandPalette.close();
                return;
            }

            const page = $('#app')?.dataset.page;
            if (e.key === 'n' || e.key === 'N') {
                if (page === 'dashboard') {
                    e.preventDefault();
                    navigate('/resumes');
                }
            }
        });
    },
};

/* ------------------------------------------------------------
   §13  Page Router
   ------------------------------------------------------------ */

const PageRouter = {
    init() {
        const appEl = $('#app');
        const page = appEl?.dataset.page;
        if (!page) return;

        switch (page) {
            case 'login':
                AuthPages.loginInit();
                break;
            case 'register':
                AuthPages.registerInit();
                break;
            case 'forgot-password':
                AuthPages.forgotPasswordInit();
                break;
            case 'dashboard':
                Dashboard.init();
                break;
            case 'resume-builder': {
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                const resumeId = pathParts.length >= 2 ? pathParts[1] : null;
                ResumeBuilder.init(resumeId);
                break;
            }
            case 'applications':
                Applications.init();
                break;
            case 'settings':
                SettingsPage.init();
                break;
            default:
                if (appEl) {
                    appEl.innerHTML = `<div class="empty-state"><h2>Page not found</h2><a href="/dashboard" class="btn btn--primary">Go to Dashboard</a></div>`;
                }
        }
    },
};

/* ------------------------------------------------------------
   §14  App Core
   ------------------------------------------------------------ */

const App = {
    csrfToken: null,
    user: null,
    theme: 'system',

    init() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) this.csrfToken = meta.getAttribute('content');

        if (window.__USER__) {
            this.user = window.__USER__;
        }

        Theme.init();
        Shortcuts.init();
        PageRouter.init();
    },
};

/* ------------------------------------------------------------
   §15  Bootstrap
   ------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => App.init());
