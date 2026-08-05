<?php
$csrfToken = Auth::generateCsrfToken();
$user = Auth::user();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - JobCollar</title>
    <link rel="icon" href="/assets/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body class="app-page" data-page="settings">
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
                <a href="/settings" class="sidebar-link active" data-nav="settings">
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
                <h1>Settings</h1>
            </div>
            <div class="main-body" id="settings-content">
                <div class="settings-sections">
                    <section class="settings-section" id="profile-section">
                        <h2>Profile</h2>
                        <form id="profile-form" class="settings-form">
                            <div class="form-group">
                                <label for="settings-name" class="form-label">Full name</label>
                                <input type="text" id="settings-name" name="name" class="form-input" value="<?= htmlspecialchars($user['name'] ?? '') ?>">
                            </div>
                            <div class="form-group">
                                <label for="settings-email" class="form-label">Email address</label>
                                <input type="email" id="settings-email" name="email" class="form-input" value="<?= htmlspecialchars($user['email'] ?? '') ?>">
                            </div>
                            <button type="submit" class="btn btn-primary">Update Profile</button>
                        </form>
                    </section>

                    <section class="settings-section" id="password-section">
                        <h2>Change Password</h2>
                        <form id="password-form" class="settings-form">
                            <div class="form-group">
                                <label for="current-password" class="form-label">Current password</label>
                                <input type="password" id="current-password" name="current_password" class="form-input">
                            </div>
                            <div class="form-group">
                                <label for="new-password" class="form-label">New password</label>
                                <input type="password" id="new-password" name="password" class="form-input">
                            </div>
                            <div class="form-group">
                                <label for="confirm-password" class="form-label">Confirm new password</label>
                                <input type="password" id="confirm-password" name="password_confirmation" class="form-input">
                            </div>
                            <button type="submit" class="btn btn-primary">Change Password</button>
                        </form>
                    </section>

                    <section class="settings-section settings-danger" id="danger-section">
                        <h2>Danger Zone</h2>
                        <p>Once you delete your account, there is no going back. Please be certain.</p>
                        <button id="delete-account-btn" class="btn btn-danger">Delete Account</button>
                    </section>
                </div>
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
