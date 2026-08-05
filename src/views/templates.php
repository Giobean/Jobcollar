<?php $isLoggedIn = Auth::check(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Browse professional resume templates. ATS-friendly designs for every career.">
    <title>Resume Templates - JobCollar</title>
    <link rel="icon" href="/assets/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body class="landing-page templates-page">
    <nav class="navbar">
        <div class="container navbar-container">
            <a href="/" class="navbar-brand">
                <span class="brand-icon">&#9679;</span>
                <span class="brand-text">JobCollar</span>
            </a>
            <div class="navbar-links">
                <a href="/templates" class="nav-link active">Templates</a>
                <a href="/#pricing" class="nav-link">Pricing</a>
            </div>
            <div class="navbar-actions">
                <?php if ($isLoggedIn): ?>
                    <a href="/dashboard" class="btn btn-primary">Dashboard</a>
                <?php else: ?>
                    <a href="/login" class="btn btn-ghost">Login</a>
                    <a href="/register" class="btn btn-primary">Create Resume</a>
                <?php endif; ?>
            </div>
        </div>
    </nav>

    <section class="templates-hero">
        <div class="container">
            <h1 class="section-title">Choose your template</h1>
            <p class="section-subtitle">All templates are ATS-optimized, professionally designed, and fully customizable.</p>
        </div>
    </section>

    <section class="templates-gallery">
        <div class="container">
            <div class="templates-filter">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="professional">Professional</button>
                <button class="filter-btn" data-filter="creative">Creative</button>
                <button class="filter-btn" data-filter="simple">Simple</button>
            </div>

            <div class="templates-grid templates-grid-large">
                <div class="template-card" data-category="professional">
                    <div class="template-preview template-professional">
                        <div class="template-overlay">
                            <a href="<?= $isLoggedIn ? '/dashboard' : '/register' ?>" class="btn btn-primary">Use Template</a>
                        </div>
                    </div>
                    <div class="template-info">
                        <h3 class="template-name">Professional</h3>
                        <p class="template-desc">Clean, traditional layout perfect for corporate roles and established industries.</p>
                        <span class="template-tag">Most Popular</span>
                    </div>
                </div>

                <div class="template-card" data-category="creative">
                    <div class="template-preview template-modern">
                        <div class="template-overlay">
                            <a href="<?= $isLoggedIn ? '/dashboard' : '/register' ?>" class="btn btn-primary">Use Template</a>
                        </div>
                    </div>
                    <div class="template-info">
                        <h3 class="template-name">Modern</h3>
                        <p class="template-desc">Contemporary design with bold accents. Great for tech, marketing, and media roles.</p>
                        <span class="template-tag">Trending</span>
                    </div>
                </div>

                <div class="template-card" data-category="simple">
                    <div class="template-preview template-minimal">
                        <div class="template-overlay">
                            <a href="<?= $isLoggedIn ? '/dashboard' : '/register' ?>" class="btn btn-primary">Use Template</a>
                        </div>
                    </div>
                    <div class="template-info">
                        <h3 class="template-name">Minimal</h3>
                        <p class="template-desc">Less is more. Maximum readability with elegant whitespace and typography.</p>
                        <span class="template-tag">Editor's Pick</span>
                    </div>
                </div>

                <div class="template-card" data-category="professional">
                    <div class="template-preview template-executive">
                        <div class="template-overlay">
                            <a href="<?= $isLoggedIn ? '/dashboard' : '/register' ?>" class="btn btn-primary">Use Template</a>
                        </div>
                    </div>
                    <div class="template-info">
                        <h3 class="template-name">Executive</h3>
                        <p class="template-desc">Sophisticated layout for senior management and C-suite professionals.</p>
                        <span class="template-tag">Premium</span>
                    </div>
                </div>

                <div class="template-card" data-category="creative">
                    <div class="template-preview template-creative">
                        <div class="template-overlay">
                            <a href="<?= $isLoggedIn ? '/dashboard' : '/register' ?>" class="btn btn-primary">Use Template</a>
                        </div>
                    </div>
                    <div class="template-info">
                        <h3 class="template-name">Creative</h3>
                        <p class="template-desc">Stand out with unique layouts and visual elements. Ideal for designers and artists.</p>
                        <span class="template-tag">Bold</span>
                    </div>
                </div>

                <div class="template-card" data-category="professional">
                    <div class="template-preview template-technical">
                        <div class="template-overlay">
                            <a href="<?= $isLoggedIn ? '/dashboard' : '/register' ?>" class="btn btn-primary">Use Template</a>
                        </div>
                    </div>
                    <div class="template-info">
                        <h3 class="template-name">Technical</h3>
                        <p class="template-desc">Structured layout optimized for engineering roles. Highlights skills and projects.</p>
                        <span class="template-tag">Developer Favorite</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="cta-section">
        <div class="container cta-container">
            <h2 class="cta-title">Ready to create your resume?</h2>
            <p class="cta-subtitle">Pick a template and start customizing. It takes less than 10 minutes.</p>
            <a href="<?= $isLoggedIn ? '/dashboard' : '/register' ?>" class="btn btn-primary btn-lg">Get Started</a>
        </div>
    </section>

    <footer class="footer">
        <div class="container footer-container">
            <div class="footer-bottom">
                <p>&copy; <?= date('Y') ?> JobCollar. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="/assets/js/landing.js"></script>
</body>
</html>
