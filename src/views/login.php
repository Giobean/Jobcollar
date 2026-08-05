<?php $csrfToken = Auth::generateCsrfToken(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - JobCollar</title>
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
                <h1 class="auth-title">Welcome back</h1>
                <p class="auth-subtitle">Sign in to your account to continue building your resume.</p>
            </div>

            <form id="login-form" class="auth-form" novalidate>
                <input type="hidden" name="_csrf" value="<?= htmlspecialchars($csrfToken) ?>">

                <div class="form-group">
                    <label for="email" class="form-label">Email address</label>
                    <input type="email" id="email" name="email" class="form-input" placeholder="you@example.com" required autocomplete="email">
                    <span class="form-error" data-field="email"></span>
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password" class="form-input" placeholder="Enter your password" required autocomplete="current-password">
                    <span class="form-error" data-field="password"></span>
                </div>

                <div class="form-row">
                    <label class="form-checkbox">
                        <input type="checkbox" name="remember" value="1">
                        <span>Remember me</span>
                    </label>
                    <a href="/forgot-password" class="form-link">Forgot password?</a>
                </div>

                <button type="submit" class="btn btn-primary btn-block">Sign In</button>

                <div class="form-message" id="form-message"></div>
            </form>

            <div class="auth-footer">
                <p>Don't have an account? <a href="/register" class="form-link">Sign up</a></p>
            </div>
        </div>
    </div>

    <script>window.__CSRF_TOKEN__ = "<?= htmlspecialchars($csrfToken) ?>";</script>
    <script src="/assets/js/app.js"></script>
</body>
</html>
