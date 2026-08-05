(function() {
    'use strict';

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                var navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                var top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    // Navbar background change on scroll
    var navbar = document.querySelector('.navbar');
    if (navbar) {
        var updateNavbar = function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
                navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                navbar.style.background = 'rgba(255,255,255,0.98)';
            } else {
                navbar.classList.remove('scrolled');
                navbar.style.boxShadow = 'none';
                navbar.style.background = 'rgba(255,255,255,0.95)';
            }
        };
        window.addEventListener('scroll', updateNavbar, { passive: true });
        updateNavbar();
    }

    // Template cards click → navigate to /register
    document.querySelectorAll('.template-card').forEach(function(card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            window.location.href = '/register';
        });
    });

    // Animate elements on scroll into view with Intersection Observer
    var observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    };

    var animateObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                animateObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    var animateElements = document.querySelectorAll(
        '.feature-card, .template-card, .testimonial-card, .cta-section'
    );
    animateElements.forEach(function(el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)';
        animateObserver.observe(el);
    });

    // Add .visible class styles
    var style = document.createElement('style');
    style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(style);

    // Stagger animation for grids
    document.querySelectorAll('.features-grid, .templates-grid, .testimonials-grid').forEach(function(grid) {
        var children = grid.children;
        for (var i = 0; i < children.length; i++) {
            children[i].style.transitionDelay = (i * 0.1) + 's';
        }
    });

    // Mobile nav toggle (hamburger)
    var navActions = document.querySelector('.navbar-actions');
    var navLinks = document.querySelector('.navbar-links');

    var hamburger = document.createElement('button');
    hamburger.className = 'mobile-nav-toggle';
    hamburger.setAttribute('aria-label', 'Toggle navigation');
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    hamburger.style.cssText = 'display:none;flex-direction:column;gap:4px;background:none;border:none;cursor:pointer;padding:8px;z-index:101;';
    var spans = hamburger.querySelectorAll('span');
    spans.forEach(function(s) {
        s.style.cssText = 'display:block;width:20px;height:2px;background:var(--color-gray-700);border-radius:2px;transition:all 0.3s;';
    });

    var navContainer = document.querySelector('.navbar-container');
    if (navContainer) {
        navContainer.appendChild(hamburger);
    }

    var mobileMenuOpen = false;
    hamburger.addEventListener('click', function() {
        mobileMenuOpen = !mobileMenuOpen;
        if (navLinks) {
            navLinks.style.display = mobileMenuOpen ? 'flex' : '';
            navLinks.style.flexDirection = mobileMenuOpen ? 'column' : '';
            navLinks.style.position = mobileMenuOpen ? 'absolute' : '';
            navLinks.style.top = mobileMenuOpen ? '100%' : '';
            navLinks.style.left = mobileMenuOpen ? '0' : '';
            navLinks.style.right = mobileMenuOpen ? '0' : '';
            navLinks.style.background = mobileMenuOpen ? '#fff' : '';
            navLinks.style.padding = mobileMenuOpen ? '1rem 1.5rem' : '';
            navLinks.style.boxShadow = mobileMenuOpen ? '0 4px 12px rgba(0,0,0,0.1)' : '';
            navLinks.style.borderTop = mobileMenuOpen ? '1px solid var(--color-gray-200)' : '';
        }
        if (navActions) {
            navActions.style.display = mobileMenuOpen ? 'flex' : '';
            navActions.style.flexDirection = mobileMenuOpen ? 'column' : '';
            navActions.style.position = mobileMenuOpen ? 'absolute' : '';
            navActions.style.top = mobileMenuOpen ? (navLinks ? navLinks.offsetHeight + 60 + 'px' : '100%') : '';
            navActions.style.left = mobileMenuOpen ? '0' : '';
            navActions.style.right = mobileMenuOpen ? '0' : '';
            navActions.style.background = mobileMenuOpen ? '#fff' : '';
            navActions.style.padding = mobileMenuOpen ? '1rem 1.5rem' : '';
        }
        spans[0].style.transform = mobileMenuOpen ? 'rotate(45deg) translate(4px, 4px)' : '';
        spans[1].style.opacity = mobileMenuOpen ? '0' : '1';
        spans[2].style.transform = mobileMenuOpen ? 'rotate(-45deg) translate(4px, -4px)' : '';
    });

    // Show hamburger on mobile via media query check
    var mobileQuery = window.matchMedia('(max-width: 768px)');
    function handleMobileChange(mq) {
        hamburger.style.display = mq.matches ? 'flex' : 'none';
        if (!mq.matches && navLinks) {
            navLinks.style.cssText = '';
            if (navActions) navActions.style.cssText = '';
            mobileMenuOpen = false;
            spans[0].style.transform = '';
            spans[1].style.opacity = '1';
            spans[2].style.transform = '';
        }
    }
    mobileQuery.addEventListener('change', handleMobileChange);
    handleMobileChange(mobileQuery);

    // Hero CTA click → navigate to /register
    var heroCTA = document.querySelector('.hero-actions .btn-primary');
    if (heroCTA && !heroCTA.getAttribute('href')) {
        heroCTA.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/register';
        });
    }

    // Template filter functionality (for /templates page)
    var filterBtns = document.querySelectorAll('.filter-btn');
    var templateCards = document.querySelectorAll('.template-card[data-category]');

    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var filter = this.getAttribute('data-filter');
            filterBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');

            templateCards.forEach(function(card) {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = '';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(12px)';
                    requestAnimationFrame(function() {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Parallax-like subtle effect on hero section
    var heroSection = document.querySelector('.hero');
    if (heroSection) {
        var heroImage = document.querySelector('.hero-image-placeholder');
        if (heroImage) {
            window.addEventListener('scroll', function() {
                var scrolled = window.scrollY;
                if (scrolled < 600) {
                    heroImage.style.transform = 'translateY(' + (scrolled * 0.05) + 'px)';
                }
            }, { passive: true });
        }
    }

    // Counter animation for stats if present
    document.querySelectorAll('[data-count]').forEach(function(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var observer = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
                var current = 0;
                var step = Math.ceil(target / 40);
                var timer = setInterval(function() {
                    current += step;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = current.toLocaleString();
                }, 30);
                observer.unobserve(el);
            }
        });
        observer.observe(el);
    });
})();
