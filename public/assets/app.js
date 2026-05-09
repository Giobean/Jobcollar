(function () {
    const state = {
        offset: 0,
        limit: 25,
        loading: false,
        hasMore: true,
        firstLoad: true,
        activeQuickTrade: ''
    };

    const form = document.getElementById('jobFilters');
    const list = document.getElementById('jobList');
    const resultCount = document.getElementById('resultCount');
    const sentinel = document.getElementById('sentinel');
    const sentinelText = document.getElementById('sentinelText');
    const activeJobs = document.getElementById('activeJobs');
    const refreshStamp = document.getElementById('refreshStamp');
    const categoryFilter = document.getElementById('categoryFilter');
    const tradeFilter = document.getElementById('tradeFilter');
    const quickFilters = document.getElementById('quickFilters');

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[char];
        });
    }

    function params(reset) {
        const data = new FormData(form);
        const query = new URLSearchParams();
        data.forEach((value, key) => {
            if (value) query.set(key, value);
        });
        query.set('limit', state.limit);
        query.set('offset', reset ? 0 : state.offset);
        return query;
    }

    function populateTradeOptions() {
        const selectedCategory = categoryFilter.value;
        const currentTrade = tradeFilter.value;
        const options = ['<option value="">All trades</option>'];
        const categories = selectedCategory
            ? { [selectedCategory]: window.JobCollar.trades[selectedCategory] || [] }
            : window.JobCollar.trades;

        Object.entries(categories).forEach(([category, trades]) => {
            trades.forEach((trade) => {
                options.push(`<option value="${escapeHtml(trade)}">${escapeHtml(trade)} (${escapeHtml(category)})</option>`);
            });
        });

        tradeFilter.innerHTML = options.join('');
        if ([...tradeFilter.options].some((option) => option.value === currentTrade)) {
            tradeFilter.value = currentTrade;
        }
    }

    function renderQuickFilters(facets) {
        const trades = (facets.trades || []).slice(0, 14);
        if (!trades.length) {
            quickFilters.innerHTML = Object.values(window.JobCollar.trades)
                .flat()
                .slice(0, 12)
                .map((trade) => `<button type="button" data-trade="${escapeHtml(trade)}">${escapeHtml(trade)}</button>`)
                .join('');
            return;
        }

        quickFilters.innerHTML = trades.map((item) => {
            const active = item.trade === state.activeQuickTrade ? ' is-active' : '';
            return `<button type="button" class="${active}" data-trade="${escapeHtml(item.trade)}">${escapeHtml(item.trade)} <span>${item.total}</span></button>`;
        }).join('');
    }

    function jobCard(job) {
        const tags = [job.category, job.trade].concat(job.tags || []).slice(0, 6);
        const salary = job.salary_text || formatSalary(job);
        const posted = job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recently seen';

        return `
            <a class="job-card" href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer">
                <div>
                    <div class="job-title">
                        <h3>${escapeHtml(job.title)}</h3>
                        <span class="pill hot">${escapeHtml(job.ai_proof_notes || 'AI-resistant')}</span>
                    </div>
                    <p class="job-company">${escapeHtml(job.company)} - ${escapeHtml(job.location || 'Location not listed')}</p>
                    <p class="job-description">${escapeHtml(job.description || 'Open this listing for the full job description and application details.')}</p>
                    <div class="job-tags">
                        ${tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
                <div class="job-side">
                    <span class="score">${escapeHtml(job.ai_proof_score)}%</span>
                    <span>${escapeHtml(salary || 'Pay not listed')}</span>
                    <span class="job-source">${escapeHtml(job.source_name)} - ${escapeHtml(posted)}</span>
                </div>
            </a>
        `;
    }

    function formatSalary(job) {
        if (job.salary_min && job.salary_max) {
            return `$${Math.round(job.salary_min).toLocaleString()}-$${Math.round(job.salary_max).toLocaleString()}`;
        }
        if (job.salary_min) {
            return `$${Math.round(job.salary_min).toLocaleString()}+`;
        }
        return '';
    }

    async function loadJobs(reset) {
        if (state.loading || (!state.hasMore && !reset)) return;

        state.loading = true;
        sentinel.hidden = false;
        sentinelText.textContent = reset ? 'Loading jobs...' : 'Loading more jobs...';

        try {
            const response = await fetch(`/api/jobs.php?${params(reset).toString()}`);
            const payload = await response.json();
            if (!payload.ok) throw new Error(payload.error || 'Failed to load jobs');

            const results = payload.results;
            if (reset) {
                list.innerHTML = '';
                state.offset = 0;
            }

            if (payload.stats) {
                activeJobs.textContent = Number(payload.stats.active_jobs || 0).toLocaleString();
                refreshStamp.textContent = payload.stats.refreshed_at
                    ? `Updated ${new Date(payload.stats.refreshed_at).toLocaleString()}`
                    : 'Waiting for first sync';
            }

            if (payload.facets) renderQuickFilters(payload.facets);

            if (!results.jobs.length && state.offset === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <h3>No active jobs match this search yet.</h3>
                        <p class="muted">Run <code>python3 scripts/fetch_jobs.py</code> from the server or loosen your filters.</p>
                    </div>
                `;
            } else {
                list.insertAdjacentHTML('beforeend', results.jobs.map(jobCard).join(''));
            }

            state.offset += results.jobs.length;
            state.hasMore = Boolean(results.has_more);
            resultCount.textContent = `${Number(results.total || 0).toLocaleString()} matching jobs`;
            sentinelText.textContent = state.hasMore ? 'Scroll for more jobs...' : 'You reached the end of current listings.';
            sentinel.querySelector('.loader').style.display = state.hasMore ? 'inline-block' : 'none';
        } catch (error) {
            sentinelText.textContent = error.message;
        } finally {
            state.firstLoad = false;
            state.loading = false;
        }
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        state.offset = 0;
        state.hasMore = true;
        state.activeQuickTrade = tradeFilter.value;
        loadJobs(true);
    });

    form.addEventListener('input', function (event) {
        if (event.target === categoryFilter) populateTradeOptions();
    });

    quickFilters.addEventListener('click', function (event) {
        const button = event.target.closest('button[data-trade]');
        if (!button) return;
        const trade = button.getAttribute('data-trade');
        tradeFilter.value = state.activeQuickTrade === trade ? '' : trade;
        state.activeQuickTrade = tradeFilter.value;
        form.requestSubmit();
    });

    const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadJobs(false);
    }, { rootMargin: '650px' });

    populateTradeOptions();
    renderQuickFilters(window.JobCollar.initialFacets || {});
    observer.observe(sentinel);
    loadJobs(true);
})();
