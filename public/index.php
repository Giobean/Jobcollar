<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/src/bootstrap.php';
require_once dirname(__DIR__) . '/src/JobRepository.php';

$repo = new JobRepository(db());
$trades = load_trades();
$stats = $repo->stats();
$facets = $repo->facets();
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="JobCollar aggregates real skilled-trade and blue-collar jobs framed as durable, AI-proof careers.">
    <title>JobCollar - AI-proof blue-collar jobs</title>
    <link rel="stylesheet" href="/assets/app.css">
    <script>
        window.JobCollar = {
            trades: <?= json_encode($trades, JSON_UNESCAPED_SLASHES) ?>,
            initialStats: <?= json_encode($stats, JSON_UNESCAPED_SLASHES) ?>,
            initialFacets: <?= json_encode($facets, JSON_UNESCAPED_SLASHES) ?>
        };
    </script>
</head>
<body>
    <header class="site-header">
        <div class="ticker" aria-label="Site positioning">
            <span>AI-proof careers</span>
            <span>Live public job aggregation</span>
            <span>No RemoteOK listings</span>
            <span>Skilled trades first</span>
        </div>
        <div class="hero">
            <a class="brand" href="/" aria-label="JobCollar home">
                <span class="brand-mark">JC</span>
                <span>
                    <strong>JobCollar</strong>
                    <small>Blue-collar jobs that robots still need humans for</small>
                </span>
            </a>
            <div class="hero-copy">
                <p class="eyebrow">Real jobs. Tough work. Durable careers.</p>
                <h1>The RemoteOK-style board for skilled trades and AI-resistant work.</h1>
                <p>
                    Find current public job listings for construction, logistics, utilities, manufacturing,
                    repair, public service, food production, and other hands-on careers.
                </p>
            </div>
            <aside class="stats-card" aria-label="Job board stats">
                <strong id="activeJobs"><?= number_format((int)$stats['active_jobs']) ?></strong>
                <span>active AI-proof jobs</span>
                <small id="refreshStamp">
                    <?= $stats['refreshed_at'] ? 'Updated ' . htmlspecialchars((string)$stats['refreshed_at'], ENT_QUOTES) : 'Waiting for first sync' ?>
                </small>
            </aside>
        </div>
    </header>

    <main>
        <section class="filters" aria-label="Job filters">
            <form id="jobFilters" class="filter-grid">
                <label>
                    <span>Search</span>
                    <input name="q" type="search" placeholder="welder, lineman, CDL, HVAC..." autocomplete="off">
                </label>
                <label>
                    <span>Category</span>
                    <select name="category" id="categoryFilter">
                        <option value="">All blue-collar categories</option>
                        <?php foreach (array_keys($trades) as $category): ?>
                            <option value="<?= htmlspecialchars($category, ENT_QUOTES) ?>"><?= htmlspecialchars($category) ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
                <label>
                    <span>Trade</span>
                    <select name="trade" id="tradeFilter">
                        <option value="">All trades</option>
                    </select>
                </label>
                <label>
                    <span>Location</span>
                    <input name="location" type="search" placeholder="city, state, country" autocomplete="off">
                </label>
                <label>
                    <span>AI-proof score</span>
                    <select name="min_ai_score">
                        <option value="">Any score</option>
                        <option value="70">70+</option>
                        <option value="80">80+</option>
                        <option value="90">90+</option>
                    </select>
                </label>
                <button type="submit">Find jobs</button>
            </form>
            <div class="quick-filters" id="quickFilters" aria-label="Quick trade filters"></div>
        </section>

        <section class="board-shell">
            <div class="board-topline">
                <div>
                    <p class="eyebrow">Live job feed</p>
                    <h2>Newest skilled-trade openings</h2>
                </div>
                <div class="feed-meta">
                    <span id="resultCount">Loading jobs...</span>
                    <span>Auto-loads as you scroll</span>
                </div>
            </div>
            <div id="jobList" class="job-list" aria-live="polite"></div>
            <div id="sentinel" class="sentinel">
                <span class="loader"></span>
                <span id="sentinelText">Loading more jobs...</span>
            </div>
        </section>

        <section class="operator-notes">
            <div>
                <p class="eyebrow">MVP operations</p>
                <h2>Built for a $5/mo stack</h2>
                <p>
                    This MVP uses Nginx, vanilla PHP, vanilla CSS/JS, SQLite, Python sync workers,
                    and Cron. Add more public sources in <code>data/sources.json</code>; the worker
                    upserts fresh jobs and expires listings that disappear from their source.
                </p>
            </div>
            <ul>
                <li>Free public data sources only; RemoteOK is intentionally excluded.</li>
                <li>SQLite keeps deployment simple on a small VPS.</li>
                <li>Cron can run the sync worker every 15 minutes for near-real-time updates.</li>
                <li>OpenFreeMap, Stripe, xAI, and R2 can be added as paid modules later.</li>
            </ul>
        </section>
    </main>

    <footer>
        <strong>JobCollar.com</strong>
        <span>Hands-on work. Human advantage.</span>
    </footer>

    <script src="/assets/app.js" defer></script>
</body>
</html>
