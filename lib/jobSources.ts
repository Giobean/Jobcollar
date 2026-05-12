export type JobSourceId = "remotive" | "arbeitnow" | "remoteok" | "themuse" | "greenhouse" | "smartrecruiters";

export type JobSourceStatus = {
  id: JobSourceId;
  name: string;
  url: string;
  count: number;
  ok: boolean;
  error?: string;
};

export type AggregatedJob = {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  source: JobSourceId;
  sourceName: string;
  sourceUrl: string;
  url: string;
  location: string;
  remote: boolean;
  employmentType: string;
  salary: string;
  postedAt: string;
  tags: string[];
  tradeCategory: string;
  description: string;
  score: number;
};

export type AggregateOptions = {
  q?: string;
  category?: string;
  location?: string;
  remote?: boolean;
  source?: string;
  limit?: number;
};

export type JobsResponse = {
  jobs: AggregatedJob[];
  fetchedAt: string;
  query: {
    q: string;
    category: string;
    location: string;
    remote: boolean;
    source: string;
  };
  sources: JobSourceStatus[];
  stats: {
    total: number;
    categories: Record<string, number>;
    locations: string[];
    remote: number;
    failedSources: number;
    liveSources: number;
  };
};

type RawJob = Omit<AggregatedJob, "id" | "companyInitials" | "tradeCategory" | "score"> & {
  externalId: string;
};

const SOURCE_META: Record<JobSourceId, Omit<JobSourceStatus, "count" | "ok" | "error">> = {
  remotive: {
    id: "remotive",
    name: "Remotive",
    url: "https://remotive.com"
  },
  arbeitnow: {
    id: "arbeitnow",
    name: "Arbeitnow",
    url: "https://www.arbeitnow.com"
  },
  remoteok: {
    id: "remoteok",
    name: "RemoteOK",
    url: "https://remoteok.com"
  },
  themuse: {
    id: "themuse",
    name: "The Muse",
    url: "https://www.themuse.com"
  },
  greenhouse: {
    id: "greenhouse",
    name: "Direct hire",
    url: "https://www.greenhouse.com"
  },
  smartrecruiters: {
    id: "smartrecruiters",
    name: "Direct hire",
    url: "https://www.smartrecruiters.com"
  }
};

const TRADE_KEYWORDS: Record<string, string[]> = {
  Electrical: ["electrician", "electrical", "low voltage", "lineman", "lineworker", "substation"],
  Plumbing: ["plumber", "plumbing", "pipefitter", "steamfitter", "sprinkler fitter"],
  HVAC: ["hvac", "refrigeration", "boiler", "chiller", "heating", "ventilation"],
  Welding: ["welder", "welding", "fabricator", "metal fabricator", "ironworker"],
  Automotive: ["mechanic", "diesel", "automotive", "fleet", "collision", "body shop", "service advisor", "tire"],
  Construction: [
    "construction",
    "carpenter",
    "mason",
    "roofer",
    "drywall",
    "concrete",
    "foreman",
    "superintendent",
    "site lead"
  ],
  Manufacturing: [
    "manufacturing",
    "machinist",
    "cnc",
    "machine operator",
    "assembler",
    "millwright",
    "maintenance",
    "quality inspector",
    "production coordinator",
    "production technician"
  ],
  FieldService: ["field service", "installer", "installation", "repair technician", "service technician", "maintenance technician"],
  Energy: ["solar", "wind", "battery", "utility", "renewable", "power plant", "oilfield", "gas technician"],
  Healthcare: ["nurse", "rn", "lpn", "cna", "caregiver", "medical assistant", "dental hygienist", "paramedic", "emt"],
  CDLTrucking: [
    "truck driver",
    "cdl",
    "otr",
    "over the road",
    "class a",
    "class b",
    "semi driver",
    "tractor trailer",
    "freight",
    "long haul",
    "local driver",
    "regional driver",
    "tanker driver",
    "flatbed driver",
    "reefer",
    "dry van",
    "ltl",
    "linehaul",
    "dockworker",
    "yard jockey",
    "trailer mechanic",
    "delivery",
    "warehouse",
    "forklift",
    "logistics",
    "dispatcher",
    "equipment operator",
    "shipping",
    "receiving"
  ],
  Safety: ["fire alarm", "security technician", "alarm technician", "elevator", "inspection technician"]
};

const DEFAULT_SEARCH_TERMS = [
  "electrician",
  "plumber",
  "welder",
  "hvac",
  "mechanic",
  "construction",
  "field service technician",
  "maintenance technician",
  "cnc machinist",
  "cdl driver",
  "nurse",
  "solar installer",
  "carpenter",
  "diesel technician",
  "forklift operator",
  "warehouse",
  "lineman",
  "pipefitter",
  "millwright",
  "boiler technician",
  "roofer",
  "concrete",
  "ironworker",
  "elevator technician",
  "fire alarm technician",
  "caregiver",
  "paramedic",
  "dispatcher",
  "installer",
  "machine operator",
  "truck driver",
  "cdl driver class a",
  "otr driver",
  "freight driver",
  "tanker driver",
  "flatbed driver",
  "local truck driver",
  "regional truck driver"
];

const ALL_KEYWORDS = Object.values(TRADE_KEYWORDS).flat();
const HANDS_ON_TITLE_TERMS = [
  "apprentice",
  "assembler",
  "automotive",
  "boiler",
  "caregiver",
  "carpenter",
  "cdl",
  "chiller",
  "cnc",
  "concrete",
  "construction",
  "custodian",
  "diesel",
  "dispatcher",
  "driver",
  "drywall",
  "electrician",
  "elevator",
  "emt",
  "fabricator",
  "field",
  "fire alarm",
  "forklift",
  "foreman",
  "helper",
  "home health",
  "hvac",
  "inspector",
  "installer",
  "ironworker",
  "journeyman",
  "laborer",
  "lineman",
  "lpn",
  "machinist",
  "maintenance",
  "manufacturing",
  "mason",
  "mechanic",
  "medical assistant",
  "millwright",
  "nurse",
  "operator",
  "painter",
  "paramedic",
  "pipefitter",
  "plumber",
  "production",
  "quality",
  "refrigeration",
  "repair",
  "rigger",
  "roofer",
  "scaffolding",
  "service advisor",
  "solar",
  "sprinkler",
  "steamfitter",
  "superintendent",
  "tanker",
  "technician",
  "tire",
  "tractor",
  "truck",
  "trucker",
  "warehouse",
  "welder",
  "winder",
  "yard jockey"
];
const KNOWLEDGE_WORK_TITLE_TERMS = [
  "account executive",
  "analyst",
  "analytics engineer",
  "backend",
  "business development",
  "business analyst",
  "coordinator",
  "customer success",
  "data scientist",
  "designer",
  "director",
  "developer",
  "engineer",
  "finance",
  "head of",
  "frontend",
  "legal",
  "machine learning",
  "marketing",
  "manager",
  "operations manager",
  "product engineer",
  "product manager",
  "project coordinator",
  "program manager",
  "sales",
  "software",
  "technical writer"
];
const PRACTICAL_ROLE_TERMS = [
  "alarm technician",
  "apprentice",
  "assembler",
  "automotive technician",
  "battery service",
  "boiler",
  "caregiver",
  "carpenter",
  "cdl",
  "concrete",
  "construction",
  "diesel",
  "driver",
  "electrician",
  "elevator",
  "emt",
  "equipment operator",
  "fabricator",
  "field service",
  "forklift",
  "home health",
  "hvac",
  "inspector",
  "installer",
  "ironworker",
  "journeyman",
  "laborer",
  "lineman",
  "lpn",
  "machinist",
  "maintenance",
  "mason",
  "mechanic",
  "medical assistant",
  "millwright",
  "nurse",
  "operator",
  "painter",
  "paramedic",
  "pipefitter",
  "plumber",
  "refrigeration",
  "repair technician",
  "rigger",
  "roofer",
  "service advisor",
  "service technician",
  "solar",
  "sprinkler",
  "superintendent",
  "tanker",
  "technician",
  "tire",
  "tractor",
  "truck",
  "trucker",
  "warehouse",
  "welder",
  "yard jockey"
];

const GREENHOUSE_BOARDS = [
  { board: "andurilindustries", company: "Anduril Industries" },
  { board: "redwoodmaterials", company: "Redwood Materials" },
  { board: "lucidmotors", company: "Lucid Motors" },
  { board: "samsara", company: "Samsara" },
  { board: "verkada", company: "Verkada" },
  { board: "heartaerospace", company: "Heart Aerospace" },
  { board: "chargepoint", company: "ChargePoint" },
  { board: "hyliion", company: "Hyliion" },
  { board: "silananotechnologies", company: "Sila Nanotechnologies" },
  { board: "flexport", company: "Flexport" },
  { board: "nuro", company: "Nuro" },
  { board: "waymo", company: "Waymo" },
  { board: "kodiak", company: "Kodiak Robotics" },
  { board: "coreweave", company: "CoreWeave" },
  { board: "bayada", company: "BAYADA Home Health Care" },
  { board: "motional", company: "Motional" },
  { board: "uberfreight", company: "Uber Freight" },
  { board: "gomotive", company: "Motive (KeepTruckin)" },
  { board: "platformscience", company: "Platform Science" },
  { board: "torcrobotics", company: "Torc Robotics" }
];

const SMART_RECRUITERS_COMPANIES = [
  "ChristianBrothersAutomotive",
  "MonroInc",
  "SonicAutomotive",
  "BoschGroup",
  "Sodexo",
  "Securitas",
  "CINTASCorporation",
  "SwiftTransportation"
];

export async function aggregateJobs(options: AggregateOptions): Promise<JobsResponse> {
  const q = clean(options.q ?? "");
  const category = clean(options.category ?? "");
  const location = clean(options.location ?? "");
  const source = clean(options.source ?? "");
  const remote = Boolean(options.remote);
  const limit = Math.min(Math.max(options.limit ?? 300, 1), 1000);
  const searchTerms = q ? [q] : DEFAULT_SEARCH_TERMS;

  const sourceFetchers: Array<Promise<SourceResult>> = [
    fetchRemotiveJobs(searchTerms),
    fetchArbeitnowJobs(),
    fetchRemoteOkJobs(),
    fetchMuseJobs(searchTerms),
    fetchGreenhouseJobs(),
    fetchSmartRecruitersJobs()
  ];

  const results = await Promise.all(sourceFetchers);
  const sources = results.map(({ id, jobs, error }) => ({
    ...SOURCE_META[id],
    count: jobs.length,
    ok: !error,
    error
  }));

  const wantedSource = source.toLowerCase();
  const normalized = results
    .flatMap((result) => result.jobs)
    .filter((job) => !wantedSource || job.source === wantedSource)
    .map(scoreAndCategorize)
    .filter((job): job is AggregatedJob => Boolean(job))
    .filter((job) => matchesUserFilters(job, { q, category, location, remote }));

  const jobs = dedupeJobs(normalized)
    .sort((a, b) => b.score - a.score || dateValue(b.postedAt) - dateValue(a.postedAt))
    .slice(0, limit);

  return {
    jobs,
    fetchedAt: new Date().toISOString(),
    query: { q, category, location, remote, source },
    sources,
    stats: {
      total: jobs.length,
      categories: countBy(jobs, "tradeCategory"),
      locations: topLocations(jobs),
      remote: jobs.filter((job) => job.remote).length,
      failedSources: sources.filter((item) => !item.ok).length,
      liveSources: sources.filter((item) => item.ok).length
    }
  };
}

type SourceResult = {
  id: JobSourceId;
  jobs: RawJob[];
  error?: string;
};

async function fetchRemotiveJobs(searchTerms: string[]): Promise<SourceResult> {
  const id: JobSourceId = "remotive";
  try {
    const jobsByTerm = await Promise.all(
      searchTerms.slice(0, 20).map(async (term) => {
        const data = await fetchJson<RemotiveResponse>(
          `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(term)}&limit=50`
        );

        return (data.jobs ?? []).map((job) => ({
          externalId: String(job.id),
          title: clean(job.title),
          company: clean(job.company_name),
          source: id,
          sourceName: SOURCE_META[id].name,
          sourceUrl: SOURCE_META[id].url,
          url: clean(job.url),
          location: clean(job.candidate_required_location) || "Remote",
          remote: true,
          employmentType: clean(job.job_type) || "Remote",
          salary: clean(job.salary),
          postedAt: clean(job.publication_date),
          tags: uniqueStrings([...(job.tags ?? []), "remote"]),
          description: stripHtml(clean(job.description))
        }));
      })
    );

    return { id, jobs: jobsByTerm.flat().filter(hasRequiredFields) };
  } catch (error) {
    return failedSource(id, error);
  }
}

async function fetchArbeitnowJobs(): Promise<SourceResult> {
  const id: JobSourceId = "arbeitnow";
  try {
    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map((page) =>
        fetchJson<ArbeitnowResponse>(`https://www.arbeitnow.com/api/job-board-api?page=${page}`)
      )
    );

    const jobs = pages.flatMap((data) =>
      (data.data ?? []).map((job) => ({
        externalId: clean(job.slug) || clean(job.url),
        title: clean(job.title),
        company: clean(job.company_name),
        source: id,
        sourceName: SOURCE_META[id].name,
        sourceUrl: SOURCE_META[id].url,
        url: clean(job.url),
        location: clean(job.location) || (job.remote ? "Remote" : "Location not listed"),
        remote: Boolean(job.remote),
        employmentType: uniqueStrings(job.job_types ?? []).join(", ") || "Not listed",
        salary: "",
        postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : "",
        tags: uniqueStrings([...(job.tags ?? []), ...(job.job_types ?? [])]),
        description: stripHtml(clean(job.description))
      }))
    );

    return { id, jobs: jobs.filter(hasRequiredFields) };
  } catch (error) {
    return failedSource(id, error);
  }
}

async function fetchRemoteOkJobs(): Promise<SourceResult> {
  const id: JobSourceId = "remoteok";
  try {
    const data = await fetchJson<RemoteOkJob[]>("https://remoteok.com/api", {
      headers: {
        "User-Agent": "JobCollar.com public job aggregator",
        Accept: "application/json"
      }
    });

    const jobs = data
      .filter((job) => typeof job === "object" && "position" in job)
      .map((job) => ({
        externalId: String(job.id ?? job.slug ?? job.url),
        title: clean(job.position),
        company: clean(job.company),
        source: id,
        sourceName: SOURCE_META[id].name,
        sourceUrl: SOURCE_META[id].url,
        url: clean(job.url) || `https://remoteok.com/remote-jobs/${job.id ?? ""}`,
        location: clean(job.location) || "Remote",
        remote: true,
        employmentType: "Remote",
        salary: formatSalary(job.salary_min, job.salary_max),
        postedAt: clean(job.date),
        tags: uniqueStrings([...(job.tags ?? []), "remote"]),
        description: stripHtml(clean(job.description))
      }));

    return { id, jobs: jobs.filter(hasRequiredFields) };
  } catch (error) {
    return failedSource(id, error);
  }
}

async function fetchMuseJobs(searchTerms: string[]): Promise<SourceResult> {
  const id: JobSourceId = "themuse";
  try {
    const museQueries = searchTerms.slice(0, 12);
    const requests = museQueries.flatMap((term) =>
      [1, 2, 3].map((page) =>
        fetchJson<MuseResponse>(
          `https://www.themuse.com/api/public/jobs?page=${page}&descending=true&search=${encodeURIComponent(term)}`
        )
      )
    );

    const pages = await Promise.all(requests);

    const jobs = pages.flatMap((page) =>
      (page.results ?? []).map((job) => ({
        externalId: String(job.id),
        title: clean(job.name),
        company: clean(job.company?.name),
        source: id,
        sourceName: SOURCE_META[id].name,
        sourceUrl: SOURCE_META[id].url,
        url: clean(job.refs?.landing_page),
        location: uniqueStrings((job.locations ?? []).map((item) => item.name)).join(", ") || "Location not listed",
        remote: (job.locations ?? []).some((item) => /remote/i.test(item.name)),
        employmentType: uniqueStrings((job.levels ?? []).map((item) => item.name)).join(", ") || "Not listed",
        salary: "",
        postedAt: clean(job.publication_date),
        tags: uniqueStrings([
          ...(job.categories ?? []).map((item) => item.name),
          ...(job.levels ?? []).map((item) => item.name)
        ]),
        description: stripHtml(clean(job.contents))
      }))
    );

    return { id, jobs: jobs.filter(hasRequiredFields) };
  } catch (error) {
    return failedSource(id, error);
  }
}

async function fetchGreenhouseJobs(): Promise<SourceResult> {
  const id: JobSourceId = "greenhouse";
  try {
    const boards = await Promise.all(
      GREENHOUSE_BOARDS.map(async ({ board, company }) => {
        try {
          const data = await fetchJson<GreenhouseResponse>(
            `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`
          );

          return (data.jobs ?? []).map((job) => ({
            externalId: `${board}-${job.id}`,
            title: clean(job.title),
            company,
            source: id,
            sourceName: SOURCE_META[id].name,
            sourceUrl: SOURCE_META[id].url,
            url: clean(job.absolute_url),
            location: clean(job.location?.name) || "Location not listed",
            remote: /remote/i.test(clean(job.location?.name)),
            employmentType: uniqueStrings((job.departments ?? []).map((item) => item.name)).join(", ") || "Not listed",
            salary: "",
            postedAt: clean(job.updated_at),
            tags: uniqueStrings([
              ...(job.departments ?? []).map((item) => item.name),
              ...(job.offices ?? []).map((item) => item.name)
            ]),
            description: stripHtml(clean(job.content))
          }));
        } catch {
          return [];
        }
      })
    );

    const allJobs = boards.flat().filter(hasRequiredFields);
    return { id, jobs: allJobs, error: allJobs.length === 0 ? "No boards responded" : undefined };
  } catch (error) {
    return failedSource(id, error);
  }
}

async function fetchSmartRecruitersJobs(): Promise<SourceResult> {
  const id: JobSourceId = "smartrecruiters";
  try {
    const companyPages = await Promise.all(
      SMART_RECRUITERS_COMPANIES.map(async (company) => {
        try {
          const data = await fetchJson<SmartRecruitersResponse>(
            `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=200`
          );

          return (data.content ?? []).map((job) => ({
            externalId: `${company}-${job.id}`,
            title: clean(job.name),
            company: clean(job.company?.name) || company,
            source: id,
            sourceName: SOURCE_META[id].name,
            sourceUrl: SOURCE_META[id].url,
            url: smartRecruitersPostingUrl(job),
            location: clean(job.location?.fullLocation) || smartRecruitersLocation(job.location),
            remote: Boolean(job.location?.remote || job.location?.hybrid),
            employmentType: clean(job.typeOfEmployment?.label) || "Not listed",
            salary: "",
            postedAt: clean(job.releasedDate),
            tags: uniqueStrings([
              clean(job.industry?.label),
              clean(job.department?.label),
              clean(job.function?.label),
              clean(job.experienceLevel?.label)
            ]),
            description: uniqueStrings([
              clean(job.industry?.label),
              clean(job.department?.label),
              clean(job.typeOfEmployment?.label),
              smartRecruitersLocation(job.location)
            ]).join(" / ")
          }));
        } catch {
          return [];
        }
      })
    );

    return { id, jobs: companyPages.flat().filter(hasRequiredFields) };
  } catch (error) {
    return failedSource(id, error);
  }
}

function looksLikeUS(location: string): boolean {
  if (!location || location === "Remote" || location === "Location not listed") return true;
  const loc = location.toLowerCase();
  if (US_STATE_PATTERNS.some((pattern) => loc.includes(pattern))) return true;
  if (/\b(united states|usa|u\.s\.)\b/i.test(loc)) return true;
  if (/\b[A-Z]{2}\b/.test(location) && US_STATE_CODES.has(location.match(/\b([A-Z]{2})\b/)?.[1] ?? "")) return true;
  if (FOREIGN_WORD_PATTERNS.some((pattern) => new RegExp(`\\b${pattern}\\b`, "i").test(loc))) return false;
  return true;
}

const US_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
]);

const US_STATE_PATTERNS = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut","delaware",
  "florida","georgia","hawaii","idaho","illinois","indiana","iowa","kansas","kentucky",
  "louisiana","maine","maryland","massachusetts","michigan","minnesota","mississippi",
  "missouri","montana","nebraska","nevada","new hampshire","new jersey","new mexico",
  "new york","north carolina","north dakota","ohio","oklahoma","oregon","pennsylvania",
  "rhode island","south carolina","south dakota","tennessee","texas","utah","vermont",
  "virginia","washington","west virginia","wisconsin","wyoming"
];

const FOREIGN_WORD_PATTERNS = [
  "germany","france","united kingdom","london","paris","amsterdam","australia",
  "canada","toronto","vancouver","bangalore","mumbai","singapore","japan","tokyo",
  "brazil","spain","italy","portugal","sweden","norway","denmark","finland",
  "poland","czech","austria","switzerland","ireland","belgium","netherlands","south africa",
  "nigeria","kenya","argentina","chile","colombia","philippines","indonesia","vietnam",
  "thailand","malaysia","china","beijing","shanghai","hong kong","taiwan","south korea",
  "seoul","dubai","abu dhabi","saudi","qatar","tel aviv","new zealand","auckland",
  "europe","asia","africa","latin america","worldwide","anywhere"
];

function scoreAndCategorize(job: RawJob): AggregatedJob | null {
  if (!looksLikeUS(job.location)) return null;

  const titleText = `${job.title} ${job.tags.join(" ")} ${job.employmentType}`.toLowerCase();
  const text = searchableText(job);
  const titleLooksHandsOn = HANDS_ON_TITLE_TERMS.some((term) => termPresent(titleText, term));
  const categoryScores = Object.entries(TRADE_KEYWORDS).map(([name, keywords]) => ({
    name,
    score:
      keywords.reduce((sum, keyword) => sum + keywordHits(titleText, keyword), 0) * 10 +
      keywords.reduce((sum, keyword) => sum + keywordHits(text, keyword), 0)
  }));
  const best = categoryScores.sort((a, b) => b.score - a.score)[0];

  if (!best || best.score === 0 || !titleLooksHandsOn || isKnowledgeOnlyTitle(titleText)) {
    return null;
  }

  const freshnessBoost = Math.max(0, 14 - daysOld(job.postedAt));
  const sourceBoost = job.source === "greenhouse" || job.source === "smartrecruiters" ? 8 : 1;
  const score = best.score * 20 + freshnessBoost + sourceBoost + Math.min(job.tags.length, 8);
  const id = `${job.source}-${slugify(job.externalId || `${job.company}-${job.title}`)}`;

  return {
    ...job,
    id,
    companyInitials: initials(job.company),
    tradeCategory: best.name,
    score
  };
}

function matchesUserFilters(
  job: AggregatedJob,
  filters: { q: string; category: string; location: string; remote: boolean }
): boolean {
  if (filters.remote && !job.remote) {
    return false;
  }

  if (filters.category && job.tradeCategory.toLowerCase() !== filters.category.toLowerCase()) {
    return false;
  }

  if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
    return false;
  }

  if (!filters.q) {
    return true;
  }

  const terms = filters.q
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 1);
  const text = searchableText(job);

  return terms.every((term) => keywordHits(text, term) > 0) || keywordHits(text, filters.q.toLowerCase()) > 0;
}

function dedupeJobs(jobs: AggregatedJob[]): AggregatedJob[] {
  const byKey = new Map<string, AggregatedJob>();

  for (const job of jobs) {
    const key = `${slugify(job.company)}-${slugify(job.title)}-${slugify(job.location)}`;
    const existing = byKey.get(key);

    if (!existing || job.score > existing.score || dateValue(job.postedAt) > dateValue(existing.postedAt)) {
      byKey.set(key, job);
    } else if (existing) {
      byKey.set(key, {
        ...existing,
        tags: uniqueStrings([...existing.tags, ...job.tags]).slice(0, 10)
      });
    }
  }

  return Array.from(byKey.values());
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      next: { revalidate: 600 }
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function failedSource(id: JobSourceId, error: unknown): SourceResult {
  return {
    id,
    jobs: [],
    error: error instanceof Error ? error.message : "Unknown source error"
  };
}

function hasRequiredFields(job: RawJob): boolean {
  return Boolean(job.title && job.company && job.url);
}

function searchableText(job: Pick<AggregatedJob, "title" | "company" | "location" | "tags" | "description">): string {
  return `${job.title} ${job.company} ${job.location} ${job.tags.join(" ")} ${job.description}`.toLowerCase();
}

function keywordHits(text: string, keyword: string): number {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(`\\b${escaped}\\b`, "gi")) ?? []).length;
}

function termPresent(text: string, term: string): boolean {
  return keywordHits(text, term) > 0;
}

function isKnowledgeOnlyTitle(titleText: string): boolean {
  const looksKnowledgeWork = KNOWLEDGE_WORK_TITLE_TERMS.some((term) => termPresent(titleText, term));
  const hasPracticalRole = PRACTICAL_ROLE_TERMS.some((term) => termPresent(titleText, term));

  return looksKnowledgeWork && !hasPracticalRole;
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => clean(value)).filter(Boolean))).slice(0, 12);
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) {
    return "";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  return formatter.format(min ?? max ?? 0);
}

function smartRecruitersPostingUrl(job: SmartRecruitersJob): string {
  const postingUrl = clean(job.postingUrl);
  if (postingUrl) {
    return postingUrl;
  }

  const company = clean(job.company?.identifier);
  const id = clean(job.id);

  if (!company || !id) {
    return clean(job.ref);
  }

  return `https://jobs.smartrecruiters.com/${company}/${id}-${slugify(clean(job.name))}`;
}

function smartRecruitersLocation(location?: SmartRecruitersLocation): string {
  if (!location) {
    return "Location not listed";
  }

  return uniqueStrings([clean(location.city), clean(location.region), clean(location.country)]).join(", ");
}

function initials(company: string): string {
  return company
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function daysOld(value: string): number {
  const date = dateValue(value);
  if (!date) {
    return 30;
  }

  return Math.floor((Date.now() - date) / 86_400_000);
}

function dateValue(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function countBy(jobs: AggregatedJob[], key: "tradeCategory"): Record<string, number> {
  return jobs.reduce<Record<string, number>>((memo, job) => {
    memo[job[key]] = (memo[job[key]] ?? 0) + 1;
    return memo;
  }, {});
}

function topLocations(jobs: AggregatedJob[]): string[] {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    const location = job.location.split(",")[0]?.trim();
    if (location) {
      counts.set(location, (counts.get(location) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([location]) => location);
}

type RemotiveResponse = {
  jobs?: Array<{
    id: number;
    title?: string;
    company_name?: string;
    candidate_required_location?: string;
    salary?: string;
    tags?: string[];
    publication_date?: string;
    job_type?: string;
    description?: string;
    url?: string;
  }>;
};

type ArbeitnowResponse = {
  data?: Array<{
    slug?: string;
    company_name?: string;
    title?: string;
    url?: string;
    tags?: string[];
    job_types?: string[];
    location?: string;
    remote?: boolean;
    created_at?: number;
    description?: string;
  }>;
};

type RemoteOkJob = {
  id?: number | string;
  slug?: string;
  company?: string;
  position?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  tags?: string[];
  date?: string;
  url?: string;
  description?: string;
};

type MuseResponse = {
  results?: Array<{
    id: number;
    name?: string;
    publication_date?: string;
    contents?: string;
    refs?: {
      landing_page?: string;
    };
    company?: {
      name?: string;
    };
    locations?: Array<{
      name: string;
    }>;
    categories?: Array<{
      name: string;
    }>;
    levels?: Array<{
      name: string;
    }>;
  }>;
};

type GreenhouseResponse = {
  jobs?: Array<{
    id: number | string;
    title?: string;
    absolute_url?: string;
    updated_at?: string;
    content?: string;
    location?: {
      name?: string;
    };
    departments?: Array<{
      name: string;
    }>;
    offices?: Array<{
      name: string;
    }>;
  }>;
};

type SmartRecruitersLocation = {
  city?: string;
  region?: string;
  country?: string;
  fullLocation?: string;
  remote?: boolean;
  hybrid?: boolean;
};

type SmartRecruitersJob = {
  id?: string;
  name?: string;
  ref?: string;
  postingUrl?: string;
  releasedDate?: string;
  company?: {
    identifier?: string;
    name?: string;
  };
  location?: SmartRecruitersLocation;
  industry?: {
    label?: string;
  };
  department?: {
    label?: string;
  };
  function?: {
    label?: string;
  };
  typeOfEmployment?: {
    label?: string;
  };
  experienceLevel?: {
    label?: string;
  };
};

type SmartRecruitersResponse = {
  content?: SmartRecruitersJob[];
};

export const tradeCategories = Object.keys(TRADE_KEYWORDS);
export const defaultSearchTerms = DEFAULT_SEARCH_TERMS;
export const tradeKeywords = ALL_KEYWORDS;
