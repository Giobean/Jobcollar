<?php $csrfToken = Auth::generateCsrfToken(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - JobCollar</title>
    <link rel="icon" href="/assets/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <a href="/" class="auth-logo">
                    <span class="brand-icon">&#9679;</span>
                    <span class="brand-text">JobCollar</span>
                </a>
                <h1 class="auth-title">Reset your password</h1>
                <p class="auth-subtitle">Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            <form id="forgot-password-form" class="auth-form" novalidate>
                <input type="hidden" name="_csrf" value="<?= htmlspecialchars($csrfToken) ?>">

                <div class="form-group">
                    <label for="email" class="form-label">Email address</label>
                    <input type="email" id="email" name="email" class="form-input" placeholder="you@example.com" required autocomplete="email">
                    <span class="form-error" data-field="email"></span>
                </div>

                <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>

                <div class="form-message" id="form-message"></div>
            </form>

            <div class="auth-footer">
                <p>Remember your password? <a href="/login" class="form-link">Sign in</a></p>
            </div>
        </div>
    </div>

    <script>window.__CSRF_TOKEN__ = "<?= htmlspecialchars($csrfToken) ?>";</script>
    <script src="/assets/js/app.js"></script>
</body>
</html>
