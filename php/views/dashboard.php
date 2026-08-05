<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - JobCollar</title>
    <link rel="stylesheet" href="/assets/css/app.css">
    <meta name="csrf-token" content="<?= htmlspecialchars($csrfToken) ?>">
    <script>window.__USER__ = <?= json_encode($user, JSON_HEX_TAG) ?>;</script>
</head>
<body>
    <div id="app" data-page="dashboard"></div>
    <script src="/assets/js/app.js"></script>
</body>
</html>
