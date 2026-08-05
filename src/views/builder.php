<?php
$csrfToken = Auth::generateCsrfToken();
$user = Auth::user();
$resumeId = $params['id'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Builder - JobCollar</title>
    <link rel="icon" href="/assets/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body class="app-page" data-page="builder">
    <div class="app-layout">
        <aside class="sidebar">
            <div class="sidebar-brand">
                <a href="/dashboard">
                    <span class="brand-icon">&#9679;</span>
                    <span class="brand-text">JobCollar</span>
                </a>
            </div>
            <nav class="sidebar-nav">
                <a href="/dashboard" class="sidebar-link" data-nav="dashboard">
                    <span class="sidebar-icon">&#9632;</span>
                    <span>Dashboard</span>
                </a>
                <a href="/templates" class="sidebar-link" data-nav="templates">
                    <span class="sidebar-icon">&#9898;</span>
                    <span>Templates</span>
                </a>
                <a href="/settings" class="sidebar-link" data-nav="settings">
                    <span class="sidebar-icon">&#9881;</span>
                    <span>Settings</span>
                </a>
            </nav>
            <div class="sidebar-footer">
                <div class="sidebar-user">
                    <div class="user-avatar"><?= strtoupper(substr($user['name'] ?? 'U', 0, 1)) ?></div>
                    <div class="user-info">
                        <span class="user-name"><?= htmlspecialchars($user['name'] ?? '') ?></span>
                        <span class="user-email"><?= htmlspecialchars($user['email'] ?? '') ?></span>
                    </div>
                </div>
                <button id="logout-btn" class="sidebar-link logout-link">
                    <span class="sidebar-icon">&#10132;</span>
                    <span>Logout</span>
                </button>
            </div>
        </aside>

        <main class="main-content builder-content">
            <div class="builder-header">
                <a href="/dashboard" class="btn btn-ghost">&larr; Back</a>
                <h1 id="resume-title">Loading...</h1>
                <div class="builder-actions">
                    <button id="save-resume-btn" class="btn btn-primary">Save</button>
                </div>
            </div>
            <div class="builder-body" id="builder-content">
                <div class="loading-state">Loading resume...</div>
            </div>
        </main>
    </div>

    <script>
        window.__USER__ = <?= json_encode($user, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;
        window.__CSRF_TOKEN__ = "<?= htmlspecialchars($csrfToken) ?>";
        window.__RESUME_ID__ = "<?= htmlspecialchars($resumeId) ?>";
    </script>
    <script src="/assets/js/app.js"></script>
    <script src="/assets/js/builder.js"></script>
</body>
</html>
