"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { AggregatedJob, JobsResponse } from "@/lib/jobSources";

const TRADE_CATEGORIES = [
  "Electrical",
  "Plumbing",
  "HVAC",
  "Welding",
  "Automotive",
  "Construction",
  "Manufacturing",
  "FieldService",
  "Energy",
  "Healthcare",
  "Logistics",
  "Safety"
];

const QUICK_SEARCHES = ["electrician", "hvac", "welder", "diesel mechanic", "cdl driver", "cnc machinist"];

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "arbeitnow", label: "Arbeitnow" },
  { value: "remotive", label: "Remotive" },
  { value: "remoteok", label: "RemoteOK" },
  { value: "themuse", label: "The Muse" },
  { value: "greenhouse", label: "Company ATS" },
  { value: "smartrecruiters", label: "Trade employer feeds" }
];

const LOCATION_OPTIONS = [
  { value: "", label: "All locations" },
  { value: "Remote", label: "Remote" },
  { value: "Alabama", label: "Alabama" },
  { value: "Alaska", label: "Alaska" },
  { value: "Arizona", label: "Arizona" },
  { value: "Arkansas", label: "Arkansas" },
  { value: "California", label: "California" },
  { value: "Colorado", label: "Colorado" },
  { value: "Connecticut", label: "Connecticut" },
  { value: "Delaware", label: "Delaware" },
  { value: "Florida", label: "Florida" },
  { value: "Georgia", label: "Georgia" },
  { value: "Hawaii", label: "Hawaii" },
  { value: "Idaho", label: "Idaho" },
  { value: "Illinois", label: "Illinois" },
  { value: "Indiana", label: "Indiana" },
  { value: "Iowa", label: "Iowa" },
  { value: "Kansas", label: "Kansas" },
  { value: "Kentucky", label: "Kentucky" },
  { value: "Louisiana", label: "Louisiana" },
  { value: "Maine", label: "Maine" },
  { value: "Maryland", label: "Maryland" },
  { value: "Massachusetts", label: "Massachusetts" },
  { value: "Michigan", label: "Michigan" },
  { value: "Minnesota", label: "Minnesota" },
  { value: "Mississippi", label: "Mississippi" },
  { value: "Missouri", label: "Missouri" },
  { value: "Montana", label: "Montana" },
  { value: "Nebraska", label: "Nebraska" },
  { value: "Nevada", label: "Nevada" },
  { value: "New Hampshire", label: "New Hampshire" },
  { value: "New Jersey", label: "New Jersey" },
  { value: "New Mexico", label: "New Mexico" },
  { value: "New York", label: "New York" },
  { value: "North Carolina", label: "North Carolina" },
  { value: "North Dakota", label: "North Dakota" },
  { value: "Ohio", label: "Ohio" },
  { value: "Oklahoma", label: "Oklahoma" },
  { value: "Oregon", label: "Oregon" },
  { value: "Pennsylvania", label: "Pennsylvania" },
  { value: "Rhode Island", label: "Rhode Island" },
  { value: "South Carolina", label: "South Carolina" },
  { value: "South Dakota", label: "South Dakota" },
  { value: "Tennessee", label: "Tennessee" },
  { value: "Texas", label: "Texas" },
  { value: "Utah", label: "Utah" },
  { value: "Vermont", label: "Vermont" },
  { value: "Virginia", label: "Virginia" },
  { value: "Washington", label: "Washington" },
  { value: "West Virginia", label: "West Virginia" },
  { value: "Wisconsin", label: "Wisconsin" },
  { value: "Wyoming", label: "Wyoming" }
];

const PAGE_SIZE = 30;

export default function Home() {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const requestKey = useMemo(() => {
    const params = new URLSearchParams();

    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (source) params.set("source", source);
    if (remoteOnly) params.set("remote", "true");
    params.set("limit", "1000");

    return params.toString();
  }, [query, category, location, source, remoteOnly]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/jobs?${requestKey}`, {
      signal: controller.signal,
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Job feed failed with ${response.status}`);
        }

        return (await response.json()) as JobsResponse;
      })
      .then((payload) => {
        setData(payload);
        setError("");
        setLoadedRequestKey(requestKey);
        setVisibleCount(PAGE_SIZE);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unable to load jobs");
        setLoadedRequestKey(requestKey);
      });

    return () => controller.abort();
  }, [requestKey]);

  const jobs = data?.jobs ?? [];
  const loading = loadedRequestKey !== requestKey;
  const visibleJobs = jobs.slice(0, visibleCount);
  const hasMore = visibleCount < jobs.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery.trim());
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setLocation("");
    setCategory("");
    setSource("");
    setRemoteOnly(false);
  }

  return (
    <main>
      <SiteHeader />

      <section className="board-shell">
        <div className="board-main">
          <form className="search-bar" onSubmit={submitSearch}>
            <label>
              <span>Search trade, license, or keyword</span>
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                placeholder="electrician, CDL driver, HVAC, CNA..."
              />
            </label>
            <label>
              <span>Location</span>
              <select value={location} onChange={(event) => setLocation(event.target.value)}>
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Source</span>
              <select value={source} onChange={(event) => setSource(event.target.value)}>
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Find jobs</button>
          </form>

          <div className="quick-row">
            <div className="quick-scroll" aria-label="Quick searches">
              {QUICK_SEARCHES.map((item) => (
                <button
                  key={item}
                  className={query === item ? "chip active" : "chip"}
                  onClick={() => {
                    setDraftQuery(item);
                    setQuery(item);
                  }}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="remote-toggle">
              <input
                checked={remoteOnly}
                onChange={(event) => setRemoteOnly(event.target.checked)}
                type="checkbox"
              />
              Remote-capable only
            </label>
          </div>

          <div className="category-strip" aria-label="Trade categories">
            <button className={!category ? "category-pill active" : "category-pill"} onClick={() => setCategory("")}>
              All trades
            </button>
            {TRADE_CATEGORIES.map((item) => (
              <button
                key={item}
                className={category === item ? "category-pill active" : "category-pill"}
                onClick={() => setCategory(item)}
              >
                {formatCategory(item)}
              </button>
            ))}
          </div>

          <div className="board-toolbar">
            <div>
              <strong>{loading ? "Loading jobs..." : `${jobs.length} jobs`}</strong>
              <span>
                {query || category || location || source
                  ? ` Filtered by ${[query, category && formatCategory(category), location, source].filter(Boolean).join(", ")}`
                  : ""}
              </span>
            </div>
            <button className="text-button" onClick={clearFilters} type="button">
              Reset
            </button>
          </div>

          {error ? <ErrorState message={error} /> : null}
          {!error && loading ? <LoadingRows /> : null}
          {!error && !loading && jobs.length === 0 ? <EmptyState /> : null}
          {!error && !loading && jobs.length > 0 ? (
            <>
              <JobList jobs={visibleJobs} />
              {hasMore ? (
                <div className="load-more-wrap">
                  <button className="load-more-btn" onClick={loadMore} type="button">
                    Show more jobs ({jobs.length - visibleCount} remaining)
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#">
        <span className="brand-mark">JC</span>
        <span>
          <strong>JobCollar</strong>
          <small>real trade jobs</small>
        </span>
      </a>
      <nav aria-label="Primary">
        <a href="#jobs">Jobs</a>
        <a className="post-job-btn" href="/post">Post a job</a>
      </nav>
    </header>
  );
}

function JobList({ jobs }: { jobs: AggregatedJob[] }) {
  return (
    <section className="job-list" id="jobs" aria-label="Job listings">
      {jobs.map((job) => (
        <article className="job-row" key={job.id}>
          <div className="date-block">
            <span>{postedDay(job.postedAt)}</span>
            <small>{postedMonth(job.postedAt)}</small>
          </div>
          <div className="company-avatar" aria-hidden="true">
            {job.companyInitials}
          </div>
          <div className="job-content">
            <div className="job-title-line">
              <a href={job.url} target="_blank" rel="noreferrer">
                {job.title}
              </a>
              <span className="source-pill">{job.sourceName}</span>
            </div>
            <div className="job-meta">
              <strong>{job.company}</strong>
              <span>{job.location}</span>
              <span>{job.employmentType}</span>
              {job.salary ? <span>{job.salary}</span> : null}
            </div>
            <p>{job.description || "Public listing with details available on the source job board."}</p>
            <div className="tag-row">
              <span className="trade-tag">{formatCategory(job.tradeCategory)}</span>
              {job.remote ? <span>remote-capable</span> : null}
              {job.tags.slice(0, 5).map((tag) => (
                <span key={`${job.id}-${tag}`}>{tag}</span>
              ))}
            </div>
          </div>
          <a className="apply-button" href={job.url} target="_blank" rel="noreferrer">
            Apply
          </a>
        </article>
      ))}
    </section>
  );
}

function LoadingRows() {
  return (
    <section className="job-list" aria-label="Loading jobs">
      {Array.from({ length: 7 }, (_, index) => (
        <article className="job-row skeleton" key={index}>
          <div />
          <div />
          <div />
        </article>
      ))}
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-card">
      <strong>Live sources did not respond.</strong>
      <p>{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="state-card">
      <strong>No live public matches for those filters.</strong>
      <p>Try a broader trade keyword, remove the location filter, or switch back to all sources.</p>
    </div>
  );
}

function formatCategory(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function postedDay(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "NEW" : date.toLocaleDateString("en-US", { day: "2-digit" });
}

function postedMonth(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "LIVE" : date.toLocaleDateString("en-US", { month: "short" });
}
