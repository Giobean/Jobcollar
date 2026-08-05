<?php $csrfToken = Auth::generateCsrfToken(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Account - JobCollar</title>
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
                <h1 class="auth-title">Create your account</h1>
                <p class="auth-subtitle">Start building your professional resume in minutes.</p>
            </div>

            <form id="register-form" class="auth-form" novalidate>
                <input type="hidden" name="_csrf" value="<?= htmlspecialchars($csrfToken) ?>">

                <div class="form-group">
                    <label for="name" class="form-label">Full name</label>
                    <input type="text" id="name" name="name" class="form-input" placeholder="John Doe" required autocomplete="name">
                    <span class="form-error" data-field="name"></span>
                </div>

                <div class="form-group">
                    <label for="email" class="form-label">Email address</label>
                    <input type="email" id="email" name="email" class="form-input" placeholder="you@example.com" required autocomplete="email">
                    <span class="form-error" data-field="email"></span>
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password" class="form-input" placeholder="At least 8 characters" required autocomplete="new-password">
                    <span class="form-error" data-field="password"></span>
                </div>

                <div class="form-group">
                    <label for="password_confirmation" class="form-label">Confirm password</label>
                    <input type="password" id="password_confirmation" name="password_confirmation" class="form-input" placeholder="Repeat your password" required autocomplete="new-password">
                    <span class="form-error" data-field="password_confirmation"></span>
                </div>

                <button type="submit" class="btn btn-primary btn-block">Create Account</button>

                <div class="form-message" id="form-message"></div>
            </form>

            <div class="auth-footer">
                <p>Already have an account? <a href="/login" class="form-link">Sign in</a></p>
            </div>
        </div>
    </div>

    <script>window.__CSRF_TOKEN__ = "<?= htmlspecialchars($csrfToken) ?>";</script>
    <script src="/assets/js/app.js"></script>
</body>
</html>
