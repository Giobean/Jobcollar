(function() {
    'use strict';

    // ==========================================
    // UTILITIES
    // ==========================================

    function $(sel, ctx) {
        return (ctx || document).querySelector(sel);
    }

    function $$(sel, ctx) {
        return Array.from((ctx || document).querySelectorAll(sel));
    }

    function escapeHtml(str) {
        if (str == null) return '';
        var div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function formatDate(str) {
        if (!str) return '';
        var d = new Date(str);
        if (isNaN(d.getTime())) return str;
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    function timeAgo(str) {
        if (!str) return '';
        var d = new Date(str);
        if (isNaN(d.getTime())) return str;
        var now = Date.now();
        var diff = Math.floor((now - d.getTime()) / 1000);

        if (diff < 0) return 'just now';
        if (diff < 60) return 'just now';
        if (diff < 120) return '1 minute ago';
        if (diff < 3600) {
            var mins = Math.floor(diff / 60);
            return mins + ' minutes ago';
        }
        if (diff < 7200) return '1 hour ago';
        if (diff < 86400) {
            var hrs = Math.floor(diff / 3600);
            return hrs + ' hours ago';
        }
        if (diff < 172800) return 'yesterday';
        if (diff < 2592000) {
            var days = Math.floor(diff / 86400);
            return days + ' days ago';
        }
        if (diff < 5184000) return '1 month ago';
        if (diff < 31536000) {
            var mons = Math.floor(diff / 2592000);
            return mons + ' months ago';
        }
        if (diff < 63072000) return '1 year ago';
        var yrs = Math.floor(diff / 31536000);
        return yrs + ' years ago';
    }

    function debounce(fn, ms) {
        var timer = null;
        return function() {
            var args = arguments;
            var ctx = this;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(ctx, args); }, ms);
        };
    }

    function throttle(fn, ms) {
        var last = 0;
        return function() {
            var now = Date.now();
            if (now - last >= ms) {
                last = now;
                fn.apply(this, arguments);
            }
        };
    }

    function navigate(url) {
        window.location.href = url;
    }

    function generateId() {
        return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function truncate(str, len) {
        if (!str || str.length <= len) return str || '';
        return str.substring(0, len) + '...';
    }

    function clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function getInitials(name) {
        if (!name) return 'U';
        var parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0][0].toUpperCase();
    }

    function createElement(tag, attrs, children) {
        var el = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function(key) {
                if (key === 'style' && typeof attrs[key] === 'object') {
                    Object.assign(el.style, attrs[key]);
                } else if (key === 'className') {
                    el.className = attrs[key];
                } else if (key.startsWith('on')) {
                    el.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
                } else {
                    el.setAttribute(key, attrs[key]);
                }
            });
        }
        if (children) {
            if (typeof children === 'string') {
                el.innerHTML = children;
            } else if (Array.isArray(children)) {
                children.forEach(function(child) {
                    if (typeof child === 'string') {
                        el.appendChild(document.createTextNode(child));
                    } else if (child) {
                        el.appendChild(child);
                    }
                });
            }
        }
        return el;
    }

    // ==========================================
    // API MODULE
    // ==========================================

    var API = {
        csrfToken: '',
        baseUrl: '',
        pendingRequests: 0,

        init: function() {
            this.csrfToken = window.__CSRF_TOKEN__ || '';
            var meta = document.querySelector('meta[name="csrf-token"]');
            if (meta && !this.csrfToken) {
                this.csrfToken = meta.getAttribute('content') || '';
            }
        },

        request: function(method, url, data, options) {
            options = options || {};
            var fullUrl = this.baseUrl + url;

            var headers = {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': API.csrfToken,
                'Accept': 'application/json'
            };

            if (options.headers) {
                Object.assign(headers, options.headers);
            }

            var opts = {
                method: method,
                headers: headers,
                credentials: 'same-origin'
            };

            if (data && method !== 'GET') {
                opts.body = JSON.stringify(data);
            }

            if (data && method === 'GET') {
                var params = new URLSearchParams();
                Object.keys(data).forEach(function(key) {
                    if (data[key] != null) params.append(key, data[key]);
                });
                var qs = params.toString();
                if (qs) fullUrl += '?' + qs;
            }

            API.pendingRequests++;

            return fetch(fullUrl, opts)
                .then(function(res) {
                    API.pendingRequests--;

                    if (res.status === 401) {
                        navigate('/login');
                        return Promise.reject({ status: 401, message: 'Session expired. Please login again.' });
                    }

                    if (res.status === 403) {
                        return Promise.reject({ status: 403, message: 'Access denied.' });
                    }

                    if (res.status === 404) {
                        return Promise.reject({ status: 404, message: 'Resource not found.' });
                    }

                    if (res.status === 429) {
                        return Promise.reject({ status: 429, message: 'Too many requests. Please try again later.' });
                    }

                    if (res.status === 500) {
                        return Promise.reject({ status: 500, message: 'Server error. Please try again.' });
                    }

                    var contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return res.json().then(function(json) {
                            if (!res.ok) {
                                var err = { status: res.status, message: json.error || 'Request failed' };
                                return Promise.reject(err);
                            }
                            return json;
                        });
                    }

                    if (!res.ok) {
                        return Promise.reject({ status: res.status, message: 'Request failed' });
                    }
                    return { data: null, status: res.status };
                })
                .catch(function(err) {
                    if (API.pendingRequests > 0) API.pendingRequests--;
                    if (err && err.status) throw err;
                    throw { status: 0, message: 'Network error. Check your connection.' };
                });
        },

        get: function(url, params) {
            return API.request('GET', url, params);
        },

        post: function(url, data) {
            return API.request('POST', url, data);
        },

        put: function(url, data) {
            return API.request('PUT', url, data);
        },

        del: function(url, data) {
            return API.request('DELETE', url, data);
        },

        upload: function(url, formData) {
            var opts = {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': API.csrfToken,
                    'Accept': 'application/json'
                },
                credentials: 'same-origin',
                body: formData
            };
            return fetch(url, opts).then(function(res) {
                return res.json().then(function(json) {
                    if (!res.ok) throw { status: res.status, message: json.error || 'Upload failed' };
                    return json;
                });
            });
        }
    };

    // ==========================================
    // TOAST MODULE
    // ==========================================

    var Toast = {
        container: null,
        queue: [],
        maxVisible: 5,

        getContainer: function() {
            if (!this.container || !document.body.contains(this.container)) {
                this.container = document.getElementById('toast-container');
                if (!this.container) {
                    this.container = document.createElement('div');
                    this.container.id = 'toast-container';
                    this.container.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:10000;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;max-width:380px;width:calc(100% - 3rem);';
                    document.body.appendChild(this.container);
                }
            }
            return this.container;
        },

        show: function(msg, type, duration) {
            type = type || 'info';
            duration = duration || 4000;

            var container = this.getContainer();
            var visibleToasts = container.children.length;

            if (visibleToasts >= this.maxVisible) {
                var oldest = container.firstChild;
                if (oldest) this.dismiss(oldest);
            }

            var toast = document.createElement('div');
            toast.className = 'toast toast-' + type;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');

            var colors = {
                success: { bg: '#ecfdf5', border: '#059669', text: '#065f46', icon: '✓' },
                error: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', icon: '✕' },
                warning: { bg: '#fffbeb', border: '#d97706', text: '#92400e', icon: '⚠' },
                info: { bg: '#eff6ff', border: '#2563eb', text: '#1e40af', icon: 'ℹ' }
            };
            var c = colors[type] || colors.info;

            toast.style.cssText = [
                'pointer-events:auto',
                'display:flex',
                'align-items:center',
                'gap:0.75rem',
                'padding:0.875rem 1.25rem',
                'background:' + c.bg,
                'border:1px solid ' + c.border + '33',
                'border-left:4px solid ' + c.border,
                'border-radius:0.5rem',
                'box-shadow:0 4px 12px rgba(0,0,0,0.08)',
                'transform:translateX(120%)',
                'transition:transform 0.3s cubic-bezier(0.4,0,0.2,1),opacity 0.3s',
                'font-size:0.875rem',
                'color:' + c.text
            ].join(';') + ';';

            var iconSpan = '<span style="font-size:1.125rem;flex-shrink:0;line-height:1;">' + c.icon + '</span>';
            var msgSpan = '<span style="flex:1;line-height:1.4;">' + escapeHtml(msg) + '</span>';
            var closeBtn = '<button style="background:none;border:none;cursor:pointer;font-size:1.25rem;color:' + c.text + ';opacity:0.6;padding:0 0.25rem;line-height:1;" aria-label="Close">&times;</button>';

            toast.innerHTML = iconSpan + msgSpan + closeBtn;

            var self = this;
            toast.querySelector('button').addEventListener('click', function() {
                self.dismiss(toast);
            });

            container.appendChild(toast);

            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    toast.style.transform = 'translateX(0)';
                });
            });

            var dismissTimeout = setTimeout(function() {
                self.dismiss(toast);
            }, duration);

            toast._dismissTimeout = dismissTimeout;
        },

        dismiss: function(toastEl) {
            if (!toastEl || toastEl._dismissed) return;
            toastEl._dismissed = true;
            clearTimeout(toastEl._dismissTimeout);
            toastEl.style.transform = 'translateX(120%)';
            toastEl.style.opacity = '0';
            toastEl.style.marginTop = '-' + toastEl.offsetHeight + 'px';
            setTimeout(function() {
                if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
            }, 300);
        },

        success: function(msg, duration) { this.show(msg, 'success', duration); },
        error: function(msg, duration) { this.show(msg, 'error', duration || 6000); },
        warning: function(msg, duration) { this.show(msg, 'warning', duration || 5000); },
        info: function(msg, duration) { this.show(msg, 'info', duration); },

        clear: function() {
            var container = this.getContainer();
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
    };

    // ==========================================
    // MODAL MODULE
    // ==========================================

    var Modal = {
        overlay: null,
        isOpen: false,
        stack: [],

        open: function(opts) {
            opts = opts || {};
            var title = opts.title || '';
            var content = opts.content || '';
            var actions = opts.actions || '';
            var size = opts.size || 'md';
            var closable = opts.closable !== false;

            this.close();

            var sizes = { sm: '380px', md: '480px', lg: '640px', xl: '800px', full: '95vw' };
            var maxWidth = sizes[size] || sizes.md;

            var overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            if (title) overlay.setAttribute('aria-label', title);
            overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(0,0,0,0);transition:background 0.2s;backdrop-filter:blur(0px);';

            var modal = document.createElement('div');
            modal.className = 'modal-dialog';
            modal.style.cssText = 'background:#fff;border-radius:0.75rem;box-shadow:0 20px 60px rgba(0,0,0,0.2);max-width:' + maxWidth + ';width:100%;max-height:85vh;display:flex;flex-direction:column;transform:scale(0.95) translateY(10px);opacity:0;transition:transform 0.25s cubic-bezier(0.4,0,0.2,1),opacity 0.2s;';

            var html = '';

            if (title) {
                html += '<div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;flex-shrink:0;">';
                html += '<h3 style="font-size:1.125rem;font-weight:600;margin:0;color:#111827;">' + escapeHtml(title) + '</h3>';
                if (closable) {
                    html += '<button class="modal-close-btn" style="background:none;border:none;cursor:pointer;font-size:1.5rem;color:#6b7280;padding:0.25rem;line-height:1;border-radius:0.25rem;transition:background 0.15s;" aria-label="Close" onmouseenter="this.style.background=\'#f3f4f6\'" onmouseleave="this.style.background=\'none\'">&times;</button>';
                }
                html += '</div>';
            }

            html += '<div class="modal-body" style="padding:1.5rem;overflow-y:auto;flex:1;">' + content + '</div>';

            if (actions) {
                html += '<div class="modal-actions" style="display:flex;justify-content:flex-end;gap:0.75rem;padding:1rem 1.5rem;border-top:1px solid #e5e7eb;flex-shrink:0;">' + actions + '</div>';
            }

            modal.innerHTML = html;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            this.overlay = overlay;
            this.isOpen = true;

            requestAnimationFrame(function() {
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.backdropFilter = 'blur(2px)';
                modal.style.transform = 'scale(1) translateY(0)';
                modal.style.opacity = '1';
            });

            var self = this;

            if (closable) {
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay) self.close();
                });

                var closeBtn = modal.querySelector('.modal-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', function() { self.close(); });
                }
            }

            this._escHandler = function(e) {
                if (e.key === 'Escape' && closable) self.close();
            };
            document.addEventListener('keydown', this._escHandler);

            var firstInput = modal.querySelector('input, textarea, select, button:not(.modal-close-btn)');
            if (firstInput) {
                setTimeout(function() { firstInput.focus(); }, 100);
            }

            return modal;
        },

        close: function() {
            if (this.overlay) {
                var ov = this.overlay;
                var dialog = ov.querySelector('.modal-dialog');
                ov.style.background = 'rgba(0,0,0,0)';
                ov.style.backdropFilter = 'blur(0px)';
                if (dialog) {
                    dialog.style.transform = 'scale(0.95) translateY(10px)';
                    dialog.style.opacity = '0';
                }
                setTimeout(function() {
                    if (ov.parentNode) ov.parentNode.removeChild(ov);
                }, 250);
                this.overlay = null;
                this.isOpen = false;
                document.body.style.overflow = '';
            }
            if (this._escHandler) {
                document.removeEventListener('keydown', this._escHandler);
                this._escHandler = null;
            }
        },

        confirm: function(msg, onConfirm, opts) {
            opts = opts || {};
            var title = opts.title || 'Confirm';
            var confirmText = opts.confirmText || 'Confirm';
            var cancelText = opts.cancelText || 'Cancel';
            var danger = opts.danger || false;
            var onCancel = opts.onCancel || null;

            var btnClass = danger ? 'btn btn-danger' : 'btn btn-primary';
            var content = '<p style="color:#4b5563;font-size:0.9375rem;line-height:1.6;margin:0;">' + escapeHtml(msg) + '</p>';
            var actions = '<button class="btn btn-ghost modal-cancel-btn">' + escapeHtml(cancelText) + '</button>' +
                '<button class="' + btnClass + ' modal-confirm-btn">' + escapeHtml(confirmText) + '</button>';

            var modal = this.open({ title: title, content: content, actions: actions, size: 'sm' });
            var self = this;

            var confirmBtn = modal.querySelector('.modal-confirm-btn');
            var cancelBtn = modal.querySelector('.modal-cancel-btn');

            if (confirmBtn) {
                confirmBtn.addEventListener('click', function() {
                    self.close();
                    if (onConfirm) onConfirm();
                });
                setTimeout(function() { confirmBtn.focus(); }, 100);
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function() {
                    self.close();
                    if (onCancel) onCancel();
                });
            }
        },

        prompt: function(msg, opts) {
            opts = opts || {};
            var title = opts.title || 'Input';
            var placeholder = opts.placeholder || '';
            var defaultValue = opts.defaultValue || '';
            var confirmText = opts.confirmText || 'OK';
            var onConfirm = opts.onConfirm;
            var inputType = opts.inputType || 'text';

            var content = '';
            if (msg) {
                content += '<p style="color:#4b5563;font-size:0.9375rem;margin:0 0 1rem;">' + escapeHtml(msg) + '</p>';
            }
            content += '<input type="' + inputType + '" class="form-input modal-prompt-input" value="' + escapeHtml(defaultValue) + '" placeholder="' + escapeHtml(placeholder) + '">';

            var actions = '<button class="btn btn-ghost modal-cancel-btn">Cancel</button>' +
                '<button class="btn btn-primary modal-confirm-btn">' + escapeHtml(confirmText) + '</button>';

            var modal = this.open({ title: title, content: content, actions: actions, size: 'sm' });
            var self = this;

            var input = modal.querySelector('.modal-prompt-input');
            var confirmBtn = modal.querySelector('.modal-confirm-btn');
            var cancelBtn = modal.querySelector('.modal-cancel-btn');

            if (input) {
                input.focus();
                input.select();
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        self.close();
                        if (onConfirm) onConfirm(input.value);
                    }
                });
            }

            if (confirmBtn) {
                confirmBtn.addEventListener('click', function() {
                    self.close();
                    if (onConfirm) onConfirm(input ? input.value : '');
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function() { self.close(); });
            }
        },

        alert: function(msg, opts) {
            opts = opts || {};
            var title = opts.title || 'Notice';
            var content = '<p style="color:#4b5563;font-size:0.9375rem;line-height:1.6;margin:0;">' + escapeHtml(msg) + '</p>';
            var actions = '<button class="btn btn-primary modal-ok-btn">OK</button>';

            var modal = this.open({ title: title, content: content, actions: actions, size: 'sm' });
            var self = this;

            var okBtn = modal.querySelector('.modal-ok-btn');
            if (okBtn) {
                okBtn.addEventListener('click', function() { self.close(); });
                setTimeout(function() { okBtn.focus(); }, 100);
            }
        }
    };

    // ==========================================
    // THEME MODULE
    // ==========================================

    var Theme = {
        current: 'light',
        storageKey: 'jc-theme',

        init: function() {
            var saved = localStorage.getItem(this.storageKey);
            if (saved && (saved === 'light' || saved === 'dark')) {
                this.current = saved;
            } else {
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.current = prefersDark ? 'dark' : 'light';
            }
            this.apply();

            var self = this;
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                    if (!localStorage.getItem(self.storageKey)) {
                        self.current = e.matches ? 'dark' : 'light';
                        self.apply();
                    }
                });
            }
        },

        set: function(theme) {
            if (theme !== 'light' && theme !== 'dark') return;
            this.current = theme;
            localStorage.setItem(this.storageKey, theme);
            this.apply();
        },

        toggle: function() {
            this.set(this.current === 'dark' ? 'light' : 'dark');
            return this.current;
        },

        apply: function() {
            document.documentElement.setAttribute('data-theme', this.current);
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                meta.setAttribute('content', this.current === 'dark' ? '#1f2937' : '#ffffff');
            }
        },

        get: function() {
            return this.current;
        }
    };

    // ==========================================
    // LAYOUT MODULE
    // ==========================================

    var Layout = {
        sidebarOpen: false,
        sidebarEl: null,
        toggleEl: null,

        init: function() {
            this.sidebarEl = $('.sidebar');
            this.setupMobileToggle();
            this.setupActiveLink();
            this.setupLogout();
            this.setupSidebarHover();
            this.setupKeyboardShortcuts();
        },

        setupMobileToggle: function() {
            if (!this.sidebarEl) return;

            var existing = $('.mobile-sidebar-toggle');
            if (existing) existing.remove();

            var toggle = document.createElement('button');
            toggle.className = 'mobile-sidebar-toggle';
            toggle.setAttribute('aria-label', 'Toggle sidebar');
            toggle.innerHTML = '<span style="font-size:1.25rem;">&#9776;</span>';
            toggle.style.cssText = 'display:none;position:fixed;top:0.875rem;left:0.875rem;z-index:60;background:#fff;color:var(--color-gray-700);border:1px solid var(--color-gray-200);border-radius:0.5rem;padding:0.5rem 0.625rem;font-size:1rem;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:all 0.2s;';

            document.body.appendChild(toggle);
            this.toggleEl = toggle;

            var self = this;
            toggle.addEventListener('click', function(e) {
                e.stopPropagation();
                self.toggleSidebar();
            });

            document.addEventListener('click', function(e) {
                if (self.sidebarOpen && self.sidebarEl && !self.sidebarEl.contains(e.target) && e.target !== toggle) {
                    self.closeSidebar();
                }
            });

            var mq = window.matchMedia('(max-width: 768px)');
            var handleChange = function(e) {
                toggle.style.display = e.matches ? 'block' : 'none';
                if (!e.matches) {
                    self.closeSidebar();
                    self.sidebarEl.style.display = '';
                    self.sidebarEl.style.transform = '';
                } else {
                    self.sidebarEl.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';
                    self.sidebarEl.style.transform = 'translateX(-100%)';
                }
            };
            mq.addEventListener('change', handleChange);
            handleChange(mq);
        },

        toggleSidebar: function() {
            if (this.sidebarOpen) {
                this.closeSidebar();
            } else {
                this.openSidebar();
            }
        },

        openSidebar: function() {
            this.sidebarOpen = true;
            if (this.sidebarEl) {
                this.sidebarEl.style.display = 'flex';
                this.sidebarEl.style.transform = 'translateX(0)';
            }
            if (this.toggleEl) {
                this.toggleEl.innerHTML = '<span style="font-size:1.25rem;">&times;</span>';
            }
        },

        closeSidebar: function() {
            this.sidebarOpen = false;
            var mq = window.matchMedia('(max-width: 768px)');
            if (this.sidebarEl && mq.matches) {
                this.sidebarEl.style.transform = 'translateX(-100%)';
            }
            if (this.toggleEl) {
                this.toggleEl.innerHTML = '<span style="font-size:1.25rem;">&#9776;</span>';
            }
        },

        setupActiveLink: function() {
            var path = window.location.pathname;
            $$('.sidebar-link[href]').forEach(function(link) {
                var href = link.getAttribute('href');
                if (!href) return;
                link.classList.remove('active');
                if (href === path) {
                    link.classList.add('active');
                } else if (href !== '/' && href !== '/dashboard' && path.startsWith(href)) {
                    link.classList.add('active');
                }
            });
        },

        setupLogout: function() {
            var logoutBtn = $('#logout-btn');
            if (!logoutBtn) return;

            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                Modal.confirm(
                    'Are you sure you want to log out?',
                    function() {
                        API.post('/api/auth/logout', {})
                            .then(function() { navigate('/login'); })
                            .catch(function() { navigate('/login'); });
                    },
                    { title: 'Log Out', confirmText: 'Log Out', cancelText: 'Stay' }
                );
            });
        },

        setupSidebarHover: function() {
            $$('.sidebar-link').forEach(function(link) {
                link.addEventListener('mouseenter', function() {
                    if (!this.classList.contains('active')) {
                        this.style.transform = 'translateX(3px)';
                    }
                });
                link.addEventListener('mouseleave', function() {
                    this.style.transform = '';
                });
            });
        },

        setupKeyboardShortcuts: function() {
            document.addEventListener('keydown', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
                if (e.target.isContentEditable) return;

                if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    var searchInput = $('.search-input');
                    if (searchInput) searchInput.focus();
                }
            });
        },

        showNotification: function(text, type) {
            Toast.show(text, type || 'info');
        }
    };

    // ==========================================
    // DASHBOARD MODULE
    // ==========================================

    var Dashboard = {
        data: null,
        loading: false,

        init: function() {
            this.load();
            this.setupCreateButton();
        },

        load: function() {
            var container = $('#dashboard-content');
            if (!container) return;
            this.loading = true;

            container.innerHTML = this.renderSkeleton();

            var self = this;
            API.get('/api/dashboard')
                .then(function(res) {
                    self.data = res.data;
                    self.loading = false;
                    container.innerHTML = self.render(res.data);
                    self.attachEvents();
                    self.animateIn();
                })
                .catch(function(err) {
                    self.loading = false;
                    container.innerHTML = '<div class="loading-state" style="padding:3rem;text-align:center;">' +
                        '<div style="font-size:2rem;margin-bottom:1rem;">⚠</div>' +
                        '<p style="color:var(--color-danger);margin-bottom:1rem;font-weight:500;">Error loading dashboard</p>' +
                        '<p style="color:var(--color-gray-500);font-size:0.875rem;margin-bottom:1.5rem;">' + escapeHtml(err.message) + '</p>' +
                        '<button class="btn btn-outline" onclick="Dashboard.load()">Try Again</button></div>';
                });
        },

        renderSkeleton: function() {
            var html = '<div style="animation:pulse 1.5s ease-in-out infinite;">';
            html += '<div style="display:flex;gap:1.5rem;margin-bottom:2rem;flex-wrap:wrap;">';
            html += '<div style="background:#fff;border:1px solid var(--color-gray-200);border-radius:0.75rem;padding:1.5rem;min-width:200px;flex:1;max-width:280px;">';
            html += '<div style="width:3rem;height:2rem;background:var(--color-gray-100);border-radius:4px;margin-bottom:0.75rem;"></div>';
            html += '<div style="width:6rem;height:0.875rem;background:var(--color-gray-100);border-radius:4px;"></div>';
            html += '</div></div>';
            html += '<div style="width:10rem;height:1.25rem;background:var(--color-gray-100);border-radius:4px;margin-bottom:1.25rem;"></div>';
            html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;">';
            for (var i = 0; i < 3; i++) {
                html += '<div style="background:#fff;border:1px solid var(--color-gray-200);border-radius:0.75rem;padding:1.5rem;height:140px;">';
                html += '<div style="width:70%;height:1rem;background:var(--color-gray-100);border-radius:4px;margin-bottom:0.75rem;"></div>';
                html += '<div style="width:5rem;height:1.25rem;background:var(--color-gray-100);border-radius:9999px;margin-bottom:0.75rem;"></div>';
                html += '<div style="width:40%;height:0.75rem;background:var(--color-gray-100);border-radius:4px;"></div>';
                html += '</div>';
            }
            html += '</div></div>';
            return html;
        },

        render: function(data) {
            var user = window.__USER__;
            var greeting = this.getGreeting();
            var html = '';

            // Welcome message
            html += '<div style="margin-bottom:2rem;">';
            html += '<h2 style="font-size:1.25rem;font-weight:600;color:var(--color-gray-800);margin-bottom:0.25rem;">' + greeting + (user && user.name ? ', ' + escapeHtml(user.name.split(' ')[0]) : '') + '</h2>';
            html += '<p style="font-size:0.875rem;color:var(--color-gray-500);">Here\'s an overview of your resume portfolio.</p>';
            html += '</div>';

            // Stats row
            html += '<div style="display:flex;gap:1.5rem;margin-bottom:2.5rem;flex-wrap:wrap;">';
            html += this.renderStatCard('Total Resumes', data.total_resumes, '📄', 'var(--color-primary)');
            html += '</div>';

            // Recent resumes
            if (data.recent_resumes && data.recent_resumes.length > 0) {
                html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">';
                html += '<h2 style="font-size:1.125rem;font-weight:600;color:var(--color-gray-800);">Recent Resumes</h2>';
                html += '</div>';
                html += '<div class="resume-grid">';

                data.recent_resumes.forEach(function(resume, idx) {
                    html += '<div class="resume-card dashboard-card" data-resume-id="' + escapeHtml(String(resume.id)) + '" style="display:flex;flex-direction:column;justify-content:space-between;opacity:0;transform:translateY(12px);transition:opacity 0.3s,transform 0.3s;transition-delay:' + (idx * 0.05) + 's;">';
                    html += '<div>';
                    html += '<div class="resume-card-title">' + escapeHtml(resume.title) + '</div>';
                    if (resume.template) {
                        html += '<span style="display:inline-block;font-size:0.6875rem;font-weight:500;color:var(--color-primary);background:var(--color-primary-light);padding:0.2rem 0.5rem;border-radius:9999px;margin:0.5rem 0;">' + escapeHtml(capitalize(resume.template)) + '</span>';
                    }
                    html += '<div class="resume-card-meta" title="' + escapeHtml(formatDate(resume.last_edited_at)) + '">Updated ' + escapeHtml(timeAgo(resume.last_edited_at)) + '</div>';
                    if (resume.score) {
                        html += '<div class="resume-card-score" style="margin-top:0.5rem;">Score: ' + escapeHtml(String(resume.score)) + '/100</div>';
                    }
                    html += '</div>';
                    html += '<div style="display:flex;gap:0.5rem;margin-top:1rem;padding-top:0.75rem;border-top:1px solid var(--color-gray-100);">';
                    html += '<a href="/resumes/' + escapeHtml(String(resume.id)) + '" class="btn btn-primary" style="font-size:0.75rem;padding:0.375rem 0.75rem;flex:1;justify-content:center;">Edit</a>';
                    html += '<button class="btn btn-ghost delete-resume-btn" data-id="' + escapeHtml(String(resume.id)) + '" data-title="' + escapeHtml(resume.title) + '" style="font-size:0.75rem;padding:0.375rem 0.75rem;color:var(--color-danger);">Delete</button>';
                    html += '</div>';
                    html += '</div>';
                });

                html += '</div>';
            } else {
                html += '<div style="text-align:center;padding:4rem 2rem;background:#fff;border:2px dashed var(--color-gray-200);border-radius:0.75rem;">';
                html += '<div style="font-size:3.5rem;margin-bottom:1.5rem;">📝</div>';
                html += '<h3 style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem;color:var(--color-gray-800);">No resumes yet</h3>';
                html += '<p style="color:var(--color-gray-500);margin-bottom:1.5rem;max-width:400px;margin-left:auto;margin-right:auto;">Create your first resume and start building your professional profile. Choose from beautiful templates.</p>';
                html += '<button class="btn btn-primary btn-lg create-first-resume-btn">Create My First Resume</button>';
                html += '</div>';
            }

            return html;
        },

        renderStatCard: function(label, value, icon, color) {
            return '<div style="background:#fff;border:1px solid var(--color-gray-200);border-radius:0.75rem;padding:1.5rem;min-width:200px;flex:1;max-width:280px;transition:box-shadow 0.2s,transform 0.2s;" onmouseenter="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.06)\';this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.boxShadow=\'none\';this.style.transform=\'\'">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">' +
                '<span style="font-size:2rem;font-weight:700;color:' + color + ';">' + escapeHtml(String(value || 0)) + '</span>' +
                '<span style="font-size:1.5rem;">' + icon + '</span>' +
                '</div>' +
                '<div style="font-size:0.8125rem;color:var(--color-gray-500);font-weight:500;">' + escapeHtml(label) + '</div>' +
                '</div>';
        },

        getGreeting: function() {
            var hour = new Date().getHours();
            if (hour < 12) return 'Good morning';
            if (hour < 17) return 'Good afternoon';
            return 'Good evening';
        },

        animateIn: function() {
            setTimeout(function() {
                $$('.dashboard-card').forEach(function(card) {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            }, 50);
        },

        attachEvents: function() {
            var self = this;

            $$('.delete-resume-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var id = this.getAttribute('data-id');
                    var title = this.getAttribute('data-title') || 'this resume';
                    self.deleteResume(id, title);
                });
            });

            var firstBtn = $('.create-first-resume-btn');
            if (firstBtn) {
                firstBtn.addEventListener('click', function() {
                    self.createResume();
                });
            }
        },

        createResume: function() {
            var content = '<div class="form-group" style="margin-bottom:1rem;">';
            content += '<label class="form-label">Resume Title</label>';
            content += '<input type="text" class="form-input" id="new-resume-title" placeholder="e.g. Software Engineer Resume" value="My Resume" autofocus>';
            content += '</div>';
            content += '<div class="form-group" style="margin-bottom:0;">';
            content += '<label class="form-label">Template</label>';
            content += '<select class="form-input" id="new-resume-template">';
            content += '<option value="professional">Professional</option>';
            content += '<option value="modern">Modern</option>';
            content += '<option value="minimal">Minimal</option>';
            content += '</select>';
            content += '</div>';

            var actions = '<button class="btn btn-ghost modal-cancel-action">Cancel</button>';
            actions += '<button class="btn btn-primary modal-create-action">Create Resume</button>';

            var modal = Modal.open({ title: 'Create New Resume', content: content, actions: actions, size: 'sm' });

            var input = modal.querySelector('#new-resume-title');
            var templateSelect = modal.querySelector('#new-resume-template');
            if (input) {
                input.focus();
                input.select();
            }

            var createBtn = modal.querySelector('.modal-create-action');
            var cancelBtn = modal.querySelector('.modal-cancel-action');

            function doCreate() {
                var title = input ? input.value.trim() : 'My Resume';
                var template = templateSelect ? templateSelect.value : 'professional';
                if (!title) {
                    Toast.error('Please enter a title');
                    return;
                }
                createBtn.disabled = true;
                createBtn.textContent = 'Creating...';

                API.post('/api/resumes', { title: title, template: template })
                    .then(function(res) {
                        Modal.close();
                        Toast.success('Resume created!');
                        navigate('/resumes/' + res.data.id);
                    })
                    .catch(function(err) {
                        Toast.error(err.message);
                        createBtn.disabled = false;
                        createBtn.textContent = 'Create Resume';
                    });
            }

            if (createBtn) createBtn.addEventListener('click', doCreate);
            if (cancelBtn) cancelBtn.addEventListener('click', function() { Modal.close(); });
            if (input) input.addEventListener('keydown', function(e) { if (e.key === 'Enter') doCreate(); });
        },

        deleteResume: function(id, title) {
            Modal.confirm(
                'Are you sure you want to delete "' + (title || 'this resume') + '"? This action cannot be undone.',
                function() {
                    API.del('/api/resumes/' + id)
                        .then(function() {
                            Toast.success('Resume deleted');
                            Dashboard.load();
                        })
                        .catch(function(err) {
                            Toast.error(err.message);
                        });
                },
                { title: 'Delete Resume', confirmText: 'Delete', danger: true }
            );
        },

        setupCreateButton: function() {
            var btn = $('#create-resume-btn');
            if (btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    Dashboard.createResume();
                });
            }
        }
    };

    // ==========================================
    // SETTINGS MODULE
    // ==========================================

    var SettingsPage = {
        activeTab: 'profile',
        tabs: ['profile', 'password', 'preferences', 'account'],

        init: function() {
            this.setupTabs();
            this.setupProfileForm();
            this.setupPasswordForm();
            this.setupPreferences();
            this.setupDeleteAccount();
            this.setupFormValidation();
        },

        setupTabs: function() {
            var sections = $$('.settings-section');
            if (sections.length < 2) return;

            var settingsContent = $('#settings-content');
            if (!settingsContent) return;

            var tabNav = document.createElement('div');
            tabNav.className = 'settings-tabs';
            tabNav.style.cssText = 'display:flex;gap:0.25rem;margin-bottom:1.5rem;background:var(--color-gray-100);padding:0.25rem;border-radius:0.5rem;max-width:600px;';

            var tabConfigs = [
                { id: 'profile-section', label: 'Profile' },
                { id: 'password-section', label: 'Password' },
                { id: 'preferences-section', label: 'Preferences' },
                { id: 'danger-section', label: 'Account' }
            ];

            var self = this;
            tabConfigs.forEach(function(tab, i) {
                var section = document.getElementById(tab.id);
                if (!section) return;
                var btn = document.createElement('button');
                btn.className = 'settings-tab-btn' + (i === 0 ? ' active' : '');
                btn.textContent = tab.label;
                btn.setAttribute('data-target', tab.id);
                btn.style.cssText = 'flex:1;padding:0.5rem 1rem;border:none;background:' + (i === 0 ? '#fff' : 'transparent') + ';border-radius:0.375rem;font-size:0.8125rem;font-weight:500;cursor:pointer;color:' + (i === 0 ? 'var(--color-gray-800)' : 'var(--color-gray-500)') + ';transition:all 0.2s;' + (i === 0 ? 'box-shadow:0 1px 2px rgba(0,0,0,0.05);' : '');

                btn.addEventListener('click', function() {
                    $$('.settings-tab-btn').forEach(function(b) {
                        b.classList.remove('active');
                        b.style.background = 'transparent';
                        b.style.color = 'var(--color-gray-500)';
                        b.style.boxShadow = 'none';
                    });
                    this.classList.add('active');
                    this.style.background = '#fff';
                    this.style.color = 'var(--color-gray-800)';
                    this.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';

                    sections.forEach(function(s) { s.style.display = 'none'; });
                    var target = document.getElementById(this.getAttribute('data-target'));
                    if (target) {
                        target.style.display = '';
                        target.style.animation = 'fadeIn 0.2s ease';
                    }
                });

                tabNav.appendChild(btn);

                if (i > 0) section.style.display = 'none';
            });

            var sectionsContainer = settingsContent.querySelector('.settings-sections');
            if (sectionsContainer) {
                sectionsContainer.insertBefore(tabNav, sectionsContainer.firstChild);
            }
        },

        setupProfileForm: function() {
            var form = $('#profile-form');
            if (!form) return;

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                var name = form.querySelector('[name="name"]').value.trim();
                var email = form.querySelector('[name="email"]').value.trim();

                if (!name) {
                    Toast.error('Name is required');
                    return;
                }
                if (!email || !isValidEmail(email)) {
                    Toast.error('Please enter a valid email address');
                    return;
                }

                var btn = form.querySelector('button[type="submit"]');
                var originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Saving...';

                API.put('/api/settings/profile', { name: name, email: email })
                    .then(function(res) {
                        Toast.success(res.data.message || 'Profile updated successfully');
                        btn.disabled = false;
                        btn.textContent = originalText;

                        if (res.data.profile) {
                            var nameEl = $('.user-name');
                            var emailEl = $('.user-email');
                            var avatar = $('.user-avatar');
                            if (nameEl) nameEl.textContent = res.data.profile.name || '';
                            if (emailEl) emailEl.textContent = res.data.profile.email || '';
                            if (avatar) avatar.textContent = getInitials(res.data.profile.name);
                        }
                    })
                    .catch(function(err) {
                        Toast.error(err.message);
                        btn.disabled = false;
                        btn.textContent = originalText;
                    });
            });
        },

        setupPasswordForm: function() {
            var form = $('#password-form');
            if (!form) return;

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                var current = form.querySelector('[name="current_password"]').value;
                var password = form.querySelector('[name="password"]').value;
                var confirm = form.querySelector('[name="password_confirmation"]').value;

                if (!current) {
                    Toast.error('Current password is required');
                    return;
                }
                if (!password) {
                    Toast.error('New password is required');
                    return;
                }
                if (password.length < 8) {
                    Toast.error('New password must be at least 8 characters');
                    return;
                }
                if (password !== confirm) {
                    Toast.error('New passwords do not match');
                    return;
                }

                var btn = form.querySelector('button[type="submit"]');
                var originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Changing...';

                API.put('/api/settings/password', {
                    current_password: current,
                    password: password,
                    password_confirmation: confirm
                })
                .then(function(res) {
                    Toast.success(res.data.message || 'Password changed successfully');
                    form.reset();
                    btn.disabled = false;
                    btn.textContent = originalText;
                })
                .catch(function(err) {
                    Toast.error(err.message);
                    btn.disabled = false;
                    btn.textContent = originalText;
                });
            });
        },

        setupPreferences: function() {
            var dangerSection = $('#danger-section');
            if (!dangerSection) return;

            var existing = $('#preferences-section');
            if (!existing) {
                var section = document.createElement('section');
                section.className = 'settings-section';
                section.id = 'preferences-section';
                section.style.display = 'none';

                section.innerHTML = '<h2>Preferences</h2>' +
                    '<form id="preferences-form" class="settings-form">' +
                    '<div class="form-group">' +
                    '<label class="form-label">Theme</label>' +
                    '<div style="display:flex;gap:0.75rem;">' +
                    '<label style="flex:1;display:flex;align-items:center;gap:0.75rem;padding:1rem;border:2px solid ' + (Theme.current === 'light' ? 'var(--color-primary)' : 'var(--color-gray-200)') + ';border-radius:0.5rem;cursor:pointer;transition:border-color 0.2s;" class="theme-option" data-theme="light">' +
                    '<input type="radio" name="theme" value="light"' + (Theme.current === 'light' ? ' checked' : '') + ' style="accent-color:var(--color-primary);">' +
                    '<div><div style="font-weight:500;font-size:0.875rem;">Light</div><div style="font-size:0.75rem;color:var(--color-gray-500);">Clean and bright</div></div>' +
                    '</label>' +
                    '<label style="flex:1;display:flex;align-items:center;gap:0.75rem;padding:1rem;border:2px solid ' + (Theme.current === 'dark' ? 'var(--color-primary)' : 'var(--color-gray-200)') + ';border-radius:0.5rem;cursor:pointer;transition:border-color 0.2s;" class="theme-option" data-theme="dark">' +
                    '<input type="radio" name="theme" value="dark"' + (Theme.current === 'dark' ? ' checked' : '') + ' style="accent-color:var(--color-primary);">' +
                    '<div><div style="font-weight:500;font-size:0.875rem;">Dark</div><div style="font-size:0.75rem;color:var(--color-gray-500);">Easy on the eyes</div></div>' +
                    '</label>' +
                    '</div>' +
                    '</div>' +
                    '<button type="submit" class="btn btn-primary">Save Preferences</button>' +
                    '</form>';

                dangerSection.parentNode.insertBefore(section, dangerSection);
            }

            $$('.theme-option').forEach(function(opt) {
                opt.addEventListener('click', function() {
                    var theme = this.getAttribute('data-theme');
                    Theme.set(theme);
                    $$('.theme-option').forEach(function(o) {
                        o.style.borderColor = o.getAttribute('data-theme') === theme ? 'var(--color-primary)' : 'var(--color-gray-200)';
                    });
                });
            });

            var prefForm = $('#preferences-form');
            if (prefForm) {
                prefForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    var theme = Theme.current;
                    var btn = prefForm.querySelector('button[type="submit"]');
                    var originalText = btn.textContent;
                    btn.disabled = true;
                    btn.textContent = 'Saving...';

                    API.put('/api/settings/preferences', { theme: theme })
                        .then(function(res) {
                            Toast.success(res.data.message || 'Preferences saved');
                            btn.disabled = false;
                            btn.textContent = originalText;
                        })
                        .catch(function(err) {
                            Toast.error(err.message);
                            btn.disabled = false;
                            btn.textContent = originalText;
                        });
                });
            }
        },

        setupDeleteAccount: function() {
            var btn = $('#delete-account-btn');
            if (!btn) return;

            btn.addEventListener('click', function() {
                Modal.confirm(
                    'Are you sure you want to delete your account? All your resumes and data will be permanently deleted. This action cannot be undone.',
                    function() {
                        setTimeout(function() {
                            var content = '<div class="form-group" style="margin-bottom:0;">';
                            content += '<p style="color:var(--color-danger);font-size:0.8125rem;margin-bottom:1rem;">⚠ This is your final confirmation. Enter your password to permanently delete your account.</p>';
                            content += '<label class="form-label">Password</label>';
                            content += '<input type="password" class="form-input" id="delete-account-password" placeholder="Enter your password">';
                            content += '</div>';

                            var actions = '<button class="btn btn-ghost modal-cancel-action">Cancel</button>';
                            actions += '<button class="btn btn-danger modal-delete-action">Permanently Delete Account</button>';

                            var modal = Modal.open({ title: 'Final Confirmation', content: content, actions: actions, size: 'sm' });

                            var passInput = modal.querySelector('#delete-account-password');
                            var deleteBtn = modal.querySelector('.modal-delete-action');
                            var cancelBtn = modal.querySelector('.modal-cancel-action');

                            if (passInput) passInput.focus();

                            if (deleteBtn) {
                                deleteBtn.addEventListener('click', function() {
                                    var password = passInput ? passInput.value : '';
                                    if (!password) {
                                        Toast.error('Password is required');
                                        return;
                                    }
                                    deleteBtn.disabled = true;
                                    deleteBtn.textContent = 'Deleting...';

                                    API.del('/api/settings/account', { password: password })
                                        .then(function() {
                                            Modal.close();
                                            Toast.success('Account deleted. Goodbye!');
                                            setTimeout(function() { navigate('/'); }, 1500);
                                        })
                                        .catch(function(err) {
                                            Toast.error(err.message);
                                            deleteBtn.disabled = false;
                                            deleteBtn.textContent = 'Permanently Delete Account';
                                        });
                                });
                            }
                            if (cancelBtn) {
                                cancelBtn.addEventListener('click', function() { Modal.close(); });
                            }
                            if (passInput) {
                                passInput.addEventListener('keydown', function(e) {
                                    if (e.key === 'Enter') deleteBtn.click();
                                });
                            }
                        }, 300);
                    },
                    { title: 'Delete Account', confirmText: 'Yes, Delete My Account', danger: true }
                );
            });
        },

        setupFormValidation: function() {
            $$('.settings-form .form-input').forEach(function(input) {
                input.addEventListener('focus', function() {
                    this.style.borderColor = 'var(--color-primary)';
                    this.style.boxShadow = '0 0 0 3px var(--color-primary-light)';
                });
                input.addEventListener('blur', function() {
                    this.style.borderColor = '';
                    this.style.boxShadow = '';
                });
            });
        }
    };

    // ==========================================
    // AUTH FORMS (Login, Register, Forgot Password)
    // ==========================================

    var AuthForms = {
        init: function() {
            this.setupLogin();
            this.setupRegister();
            this.setupForgotPassword();
            this.setupPasswordToggle();
        },

        showMessage: function(formId, message, type) {
            var form = document.getElementById(formId);
            if (!form) return;
            var el = form.querySelector('.form-message');
            if (!el) {
                el = document.createElement('div');
                el.className = 'form-message';
                var btn = form.querySelector('button[type="submit"]');
                if (btn) {
                    form.insertBefore(el, btn);
                } else {
                    form.appendChild(el);
                }
            }
            el.textContent = message;
            el.className = 'form-message ' + type;
        },

        clearMessages: function() {
            $$('.form-message').forEach(function(el) {
                el.className = 'form-message';
                el.textContent = '';
            });
            $$('.form-error').forEach(function(el) { el.textContent = ''; });
            $$('.form-input.error').forEach(function(el) { el.classList.remove('error'); });
        },

        setupLogin: function() {
            var form = $('#login-form');
            if (!form) return;

            var self = this;
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                self.clearMessages();

                var email = form.querySelector('[name="email"]').value.trim();
                var password = form.querySelector('[name="password"]').value;
                var remember = form.querySelector('[name="remember"]');
                remember = remember ? remember.checked : false;

                if (!email) {
                    self.showMessage('login-form', 'Email is required', 'error');
                    form.querySelector('[name="email"]').focus();
                    return;
                }
                if (!isValidEmail(email)) {
                    self.showMessage('login-form', 'Please enter a valid email', 'error');
                    form.querySelector('[name="email"]').focus();
                    return;
                }
                if (!password) {
                    self.showMessage('login-form', 'Password is required', 'error');
                    form.querySelector('[name="password"]').focus();
                    return;
                }

                var btn = form.querySelector('button[type="submit"]');
                var originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Signing in...';

                API.post('/api/auth/login', { email: email, password: password, remember: remember })
                    .then(function() {
                        navigate('/dashboard');
                    })
                    .catch(function(err) {
                        self.showMessage('login-form', err.message, 'error');
                        btn.disabled = false;
                        btn.textContent = originalText;
                        form.querySelector('[name="password"]').value = '';
                        form.querySelector('[name="password"]').focus();
                    });
            });
        },

        setupRegister: function() {
            var form = $('#register-form');
            if (!form) return;

            var self = this;
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                self.clearMessages();

                var name = form.querySelector('[name="name"]').value.trim();
                var email = form.querySelector('[name="email"]').value.trim();
                var password = form.querySelector('[name="password"]').value;
                var passwordConfirmation = form.querySelector('[name="password_confirmation"]').value;

                if (!name) {
                    self.showMessage('register-form', 'Full name is required', 'error');
                    return;
                }
                if (!email || !isValidEmail(email)) {
                    self.showMessage('register-form', 'Please enter a valid email address', 'error');
                    return;
                }
                if (!password || password.length < 8) {
                    self.showMessage('register-form', 'Password must be at least 8 characters', 'error');
                    return;
                }
                if (password !== passwordConfirmation) {
                    self.showMessage('register-form', 'Passwords do not match', 'error');
                    return;
                }

                var btn = form.querySelector('button[type="submit"]');
                var originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Creating account...';

                API.post('/api/auth/register', {
                    name: name,
                    email: email,
                    password: password,
                    password_confirmation: passwordConfirmation
                })
                .then(function() {
                    navigate('/dashboard');
                })
                .catch(function(err) {
                    self.showMessage('register-form', err.message, 'error');
                    btn.disabled = false;
                    btn.textContent = originalText;
                });
            });
        },

        setupForgotPassword: function() {
            var form = $('#forgot-password-form');
            if (!form) return;

            var self = this;
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                self.clearMessages();

                var email = form.querySelector('[name="email"]').value.trim();
                if (!email || !isValidEmail(email)) {
                    self.showMessage('forgot-password-form', 'Please enter a valid email address', 'error');
                    return;
                }

                var btn = form.querySelector('button[type="submit"]');
                var originalText = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Sending...';

                API.post('/api/auth/forgot-password', { email: email })
                    .then(function(res) {
                        self.showMessage('forgot-password-form', (res.data && res.data.message) || 'If an account exists with that email, a reset link has been sent.', 'success');
                        btn.disabled = false;
                        btn.textContent = originalText;
                    })
                    .catch(function(err) {
                        self.showMessage('forgot-password-form', err.message, 'error');
                        btn.disabled = false;
                        btn.textContent = originalText;
                    });
            });
        },

        setupPasswordToggle: function() {
            $$('input[type="password"]').forEach(function(input) {
                var wrapper = input.parentElement;
                if (!wrapper || wrapper.querySelector('.password-toggle')) return;

                wrapper.style.position = 'relative';
                var toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'password-toggle';
                toggle.setAttribute('aria-label', 'Toggle password visibility');
                toggle.innerHTML = '👁';
                toggle.style.cssText = 'position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:0.875rem;padding:0.25rem;opacity:0.5;transition:opacity 0.2s;';

                toggle.addEventListener('click', function() {
                    var isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    this.innerHTML = isPassword ? '🙈' : '👁';
                });

                toggle.addEventListener('mouseenter', function() { this.style.opacity = '1'; });
                toggle.addEventListener('mouseleave', function() { this.style.opacity = '0.5'; });

                wrapper.appendChild(toggle);
                input.style.paddingRight = '2.5rem';
            });
        }
    };

    // ==========================================
    // PAGE ROUTER
    // ==========================================

    var PageRouter = {
        currentPage: null,

        init: function() {
            this.currentPage = document.body.getAttribute('data-page');

            switch (this.currentPage) {
                case 'dashboard':
                    Layout.init();
                    Dashboard.init();
                    break;
                case 'settings':
                    Layout.init();
                    SettingsPage.init();
                    break;
                case 'builder':
                    Layout.init();
                    break;
                default:
                    break;
            }
        }
    };

    // ==========================================
    // APP INITIALIZATION
    // ==========================================

    var App = {
        user: null,
        version: '1.0.0',

        init: function() {
            API.init();
            Theme.init();

            this.user = window.__USER__ || null;

            AuthForms.init();
            PageRouter.init();

            this.injectStyles();
            this.setupGlobalErrorHandler();
        },

        injectStyles: function() {
            if (document.getElementById('jc-app-styles')) return;
            var style = document.createElement('style');
            style.id = 'jc-app-styles';
            style.textContent = [
                '@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}',
                '@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
                '@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}',
                '@keyframes scaleIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}',
                '.settings-tab-btn:hover{background:#f9fafb!important;}',
                '.settings-tab-btn.active:hover{background:#fff!important;}',
                '[data-theme="dark"]{--color-gray-50:#111827;--color-gray-100:#1f2937;--color-gray-200:#374151;--color-gray-300:#4b5563;--color-gray-400:#6b7280;--color-gray-500:#9ca3af;--color-gray-600:#d1d5db;--color-gray-700:#e5e7eb;--color-gray-800:#f3f4f6;--color-gray-900:#f9fafb;}',
                '[data-theme="dark"] body{background:#111827;color:#f3f4f6;}',
                '[data-theme="dark"] .sidebar{background:#0f172a;}',
                '[data-theme="dark"] .main-content{background:#111827;}',
                '[data-theme="dark"] .resume-card,[data-theme="dark"] .settings-section,[data-theme="dark"] .stat-card{background:#1f2937;border-color:#374151;}',
                '[data-theme="dark"] .form-input{background:#1f2937;border-color:#374151;color:#f3f4f6;}',
                '[data-theme="dark"] .modal-dialog{background:#1f2937;}'
            ].join('\n');
            document.head.appendChild(style);
        },

        setupGlobalErrorHandler: function() {
            window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.status === 401) return;
                console.error('Unhandled promise rejection:', e.reason);
            });
        }
    };

    // ==========================================
    // EXPOSE GLOBALS
    // ==========================================

    window.$ = $;
    window.$$ = $$;
    window.escapeHtml = escapeHtml;
    window.formatDate = formatDate;
    window.timeAgo = timeAgo;
    window.debounce = debounce;
    window.throttle = throttle;
    window.navigate = navigate;
    window.generateId = generateId;
    window.capitalize = capitalize;
    window.truncate = truncate;
    window.getInitials = getInitials;
    window.isValidEmail = isValidEmail;
    window.API = API;
    window.Toast = Toast;
    window.Modal = Modal;
    window.Theme = Theme;
    window.Layout = Layout;
    window.Dashboard = Dashboard;
    window.SettingsPage = SettingsPage;
    window.App = App;

    // ==========================================
    // BOOT
    // ==========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { App.init(); });
    } else {
        App.init();
    }

})();
