<?php
$csrfToken = Auth::generateCsrfToken();
$user = Auth::user();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - JobCollar</title>
    <link rel="icon" href="/assets/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body class="app-page" data-page="dashboard">
    <div class="app-layout">
        <aside class="sidebar">
            <div class="sidebar-brand">
                <a href="/dashboard">
                    <span class="brand-icon">&#9679;</span>
                    <span class="brand-text">JobCollar</span>
                </a>
            </div>
            <nav class="sidebar-nav">
                <a href="/dashboard" class="sidebar-link active" data-nav="dashboard">
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

        <main class="main-content">
            <div class="main-header">
                <h1>Dashboard</h1>
                <button id="create-resume-btn" class="btn btn-primary">New Resume</button>
            </div>
            <div class="main-body" id="dashboard-content">
                <div class="loading-state">Loading...</div>
            </div>
        </main>
    </div>

    <script>
        window.__USER__ = <?= json_encode($user, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;
        window.__CSRF_TOKEN__ = "<?= htmlspecialchars($csrfToken) ?>";
    </script>
    <script src="/assets/js/app.js"></script>
</body>
</html>
