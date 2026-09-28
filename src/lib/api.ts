import {
  mockAnalyses,
  mockCompanies,
  mockMe,
  mockRoleDetails,
  mockRoles,
  mockSearch,
  mockSkills,
  type Analysis,
  type CompaniesResponse,
  type Company,
  type Me,
  type RoleDetail,
  type RoleSummary,
  type RolesResponse,
  type SavedAnalysis,
  type SearchProfile,
  type SkillsResponse,
} from "./mockData";

export type * from "./mockData";

// ---------------------------------------------------------------------------
// Configuration. Flip USE_MOCK to false to talk to the real API.
// ---------------------------------------------------------------------------
export const API_BASE_URL = "https://job-search-copilot-nxwm.onrender.com";
export const USE_MOCK = false;

const TOKEN_KEY = "jsc_token";
const isBrowser = () => typeof window !== "undefined";

export function getToken(): string | null { return isBrowser() ? window.localStorage.getItem(TOKEN_KEY) : null; }
export function setToken(token: string) { if (isBrowser()) window.localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { if (isBrowser()) window.localStorage.removeItem(TOKEN_KEY); }
export function signInUrl(): string { return `${API_BASE_URL}/api/auth/login?redirect=${encodeURIComponent(`${window.location.origin}/auth/callback`)}`; }

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

// ---------------------------------------------------------------------------
// "Waking up the server" signal: true while any request has taken > 5s.
// ---------------------------------------------------------------------------
let slowCount = 0;
const slowListeners = new Set<() => void>();
const emitSlow = () => slowListeners.forEach((listener) => listener());
export function subscribeSlow(listener: () => void) { slowListeners.add(listener); return () => { slowListeners.delete(listener); }; }
export function isServerWaking() { return slowCount > 0; }

let firstGetDone = false;
const pause = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let slow = false;
  const timer = setTimeout(() => { slow = true; slowCount += 1; emitSlow(); }, 5000);
  const send = () => fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  try {
    let response: Response;
    const retryable = method === "GET" && !firstGetDone;
    firstGetDone = firstGetDone || method === "GET";
    try {
      response = await send();
      if (retryable && response.status >= 500) { await pause(3000); response = await send(); }
    } catch (error) {
      if (!retryable) throw new ApiError("We couldn't reach the server. Check your connection and try again.", 0);
      await pause(3000);
      response = await send();
    }
    if (response.status === 401) {
      clearToken();
      if (isBrowser()) window.location.assign("/welcome");
      throw new ApiError("Your session has ended. Please sign in again.", 401);
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
      const detail = typeof payload?.detail === "string" ? payload.detail : "Something went wrong. Please try again.";
      throw new ApiError(detail, response.status);
    }
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  } finally {
    clearTimeout(timer);
    if (slow) { slowCount -= 1; emitSlow(); }
  }
}

const json = (method: string, body?: unknown): RequestInit => (body === undefined ? { method } : { method, body: JSON.stringify(body) });

// ---------------------------------------------------------------------------
// Background jobs: start returns { job_id }, then poll /api/jobs/{id}.
// ---------------------------------------------------------------------------
export type LogHandler = (line: string) => void;
type JobStatus<T> = { status: "running" | "done" | "error"; log: string[]; result: T; error: string | null };

export async function runJob<T>(start: () => Promise<{ job_id: string }>, onLog?: LogHandler): Promise<T> {
  const { job_id } = await start();
  let seen = 0;
  for (;;) {
    const job = await request<JobStatus<T>>(`/api/jobs/${job_id}`);
    const lines = job.log ?? [];
    for (; seen < lines.length; seen += 1) onLog?.(lines[seen] as string);
    if (job.status === "done") return job.result;
    if (job.status === "error") throw new ApiError(job.error ?? "Something went wrong. Please try again.", 500);
    await pause(2000);
  }
}

async function mockJob<T>(lines: string[], result: () => T, totalMs: number, onLog?: LogHandler): Promise<T> {
  const step = totalMs / (lines.length + 1);
  for (const line of lines) { await pause(step); onLog?.(line); }
  await pause(step);
  return result();
}

// ---------------------------------------------------------------------------
// In-memory mock state
// ---------------------------------------------------------------------------
let me = structuredClone(mockMe);
let roles = structuredClone(mockRoles);
const details = structuredClone(mockRoleDetails);
let search = structuredClone(mockSearch);
let companies = structuredClone(mockCompanies);
let analyses = structuredClone(mockAnalyses);
let skills = structuredClone(mockSkills);
const mock = async <T>(value: T, ms?: number) => { await pause(ms); return structuredClone(value); };
const bump = (key: keyof Me["usage"]) => {
  const usage = me.usage[key];
  if (usage.used >= usage.limit) throw new ApiError("Daily limit reached.", 429);
  usage.used += 1;
};

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function getMe(): Promise<Me> {
  if (!USE_MOCK) return request("/api/me");
  me.connections_count = me.connections_count ?? 0;
  me.onboarding.has_companies = companies.watching.length > 0;
  return mock(me, 250);
}
export async function getRoles(view: "best" | "saved" | "all" = "best"): Promise<RolesResponse> {
  if (!USE_MOCK) return request(`/api/roles?view=${view}`);
  await pause();
  const visible = roles.filter((role) => role.status !== "dismissed" && (view === "all" || (view === "saved" ? role.status === "saved" : role.fit_score >= search.min_score)));
  return { stats: { strong_count: roles.filter((role) => role.fit_score >= search.min_score && role.status !== "dismissed").length, saved_count: roles.filter((role) => role.status === "saved").length, companies_watched: companies.watching.length, min_score: search.min_score }, roles: structuredClone(visible) };
}
export async function getRole(id: number): Promise<RoleDetail> {
  if (!USE_MOCK) return request(`/api/roles/${id}`);
  const detail = details[id];
  if (!detail) throw new ApiError("Role not found", 404);
  return mock({ ...detail, has_connections: me.connections_count > 0, people: me.connections_count > 0 ? detail.people : [] });
}
export async function setRoleStatus(id: number, status: RoleSummary["status"]): Promise<RoleSummary> {
  if (!USE_MOCK) return request(`/api/roles/${id}/status`, json("POST", { status }));
  await pause(220);
  roles = roles.map((role) => role.id === id ? { ...role, status } : role);
  const current = details[id];
  if (current) details[id] = { ...current, role: { ...current.role, status } };
  const role = roles.find((item) => item.id === id);
  if (!role) throw new ApiError("Role not found", 404);
  return structuredClone(role);
}
export async function buildPlan(id: number, onLog?: LogHandler): Promise<RoleDetail> {
  if (!USE_MOCK) return runJob(() => request(`/api/roles/${id}/plan`, json("POST")), onLog);
  const template = details[1];
  const current = details[id];
  if (!current || !template) throw new ApiError("Role not found", 404);
  bump("analyses");
  return mockJob([`Reading the ${current.role.company} job description…`, "Comparing requirements to your resume…", "Checking who you know there…", "Looking for adjacent roles…", "Writing your plan…"], () => {
    details[id] = { ...current, analysis: { ...template.analysis, job_title: current.role.title, company: current.role.company, match_score: current.role.fit_score } as Analysis, recommendation: { headline: current.role.fit_score >= 70 ? "Apply with a focused story" : "Build evidence before applying", detail: "Use the plan below to close the most important gaps and make your relevant experience unmistakable.", color: current.role.fit_color }, plan: structuredClone(template.plan).map((step) => ({ ...step, done: false })), people: [], adjacent: structuredClone(template.adjacent), role: { ...current.role, has_plan: true } };
    roles = roles.map((role) => role.id === id ? { ...role, has_plan: true } : role);
    return structuredClone(details[id] as RoleDetail);
  }, 6000, onLog);
}
export async function setPlanStep(id: number, step_key: string, done: boolean) {
  if (!USE_MOCK) return request<RoleDetail["plan"]>(`/api/roles/${id}/plan/${step_key}`, json("PUT", { done }));
  await pause(180);
  const detail = details[id];
  if (!detail) throw new ApiError("Role not found", 404);
  detail.plan = detail.plan.map((step) => step.key === step_key ? { ...step, done } : step);
  return structuredClone(detail.plan);
}
export async function draftMessage(id: number, person_index: number): Promise<{ message: string }> {
  if (!USE_MOCK) return request(`/api/roles/${id}/draft`, json("POST", { person_index }));
  await pause(900);
  bump("messages");
  const person = details[id]?.people.find((item) => item.index === person_index);
  const role = details[id]?.role;
  return { message: `Hi ${person?.name.split(" ")[0] ?? "there"}, I'm exploring the ${role?.title ?? "product role"} at ${role?.company ?? "your company"}. It stood out because I recently led an internal payments API adopted by 12 teams and cut integration time from six weeks to two. Would you be open to a quick 15-minute chat about the team and what they value most?` };
}
export async function addTitleToSearch(id: number, title: string): Promise<SearchProfile> {
  if (!USE_MOCK) return request(`/api/roles/${id}/add-title`, json("POST", { title }));
  await pause(250);
  if (!search.include_titles.includes(title)) search.include_titles.push(title);
  return structuredClone(search);
}
export async function refreshRoles(onLog?: LogHandler): Promise<{ summary: string }> {
  if (!USE_MOCK) return runJob(() => request("/api/roles/refresh", json("POST")), onLog);
  return mockJob(["Ramp: 158 open jobs", "Plaid: 94 open jobs", "Modern Treasury: 31 open jobs", "Mercury: 47 open jobs", "Anthropic: 212 open jobs", "Checking fit for 12 new jobs…", "Scored 12 jobs"], () => { me.last_scan = `${new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · 0 new roles`; return { summary: "No new roles above your minimum score since this morning." }; }, 5000, onLog);
}
export async function findRoles(onLog?: LogHandler): Promise<{ summary: string }> {
  if (!USE_MOCK) return runJob(() => request("/api/roles/find", json("POST")), onLog);
  return mockJob(["Reading your resume and search preferences…", "Looking for companies that match you…", "Found 8 companies with job boards", "Ramp: 158 open jobs", "Plaid: 94 open jobs", "Modern Treasury: 31 open jobs", "Mercury: 47 open jobs", "Anthropic: 212 open jobs", "Filtering by your titles and locations…", "Checking fit for 23 jobs…", "Done: 8 roles ranked for you"], () => {
    me.onboarding = { has_resume: true, has_search: true, has_companies: true };
    if (companies.watching.length === 0) companies = structuredClone(mockCompanies);
    me.last_scan = `${new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · 0 new roles`;
    return { summary: "8 roles found across 5 companies" };
  }, 9000, onLog);
}
export async function getCompanies(): Promise<CompaniesResponse> { return USE_MOCK ? mock(companies) : request("/api/companies"); }
export async function discoverCompanies(onLog?: LogHandler): Promise<CompaniesResponse> {
  if (!USE_MOCK) return runJob(() => request("/api/companies/discover", json("POST")), onLog);
  bump("discoveries");
  return mockJob(["Thinking about companies that fit your background…", "Considering 24 candidates", "Adyen: Greenhouse job board found", "Marqeta: Ashby job board found", "Checking open roles…"], () => {
    const extra: Company[] = [
      { id: 31, name: "Adyen", logo_url: "https://www.google.com/s2/favicons?domain=adyen.com&sz=128", board_name: "Greenhouse job board", board_url: "https://careers.adyen.com", why_it_fits: "Global payments platform with a large product org in New York; your API platform work maps to their merchant integrations team.", open_roles: 2, known_people: 0 },
      { id: 32, name: "Marqeta", logo_url: "https://www.google.com/s2/favicons?domain=marqeta.com&sz=128", board_name: "Ashby job board", board_url: "https://www.marqeta.com/company/careers", why_it_fits: "Card-issuing platform whose customers are developers. Your integration-time story is directly relevant.", open_roles: 1, known_people: 1 },
    ];
    const known = new Set([...companies.suggested, ...companies.watching].map((c) => c.id));
    companies.suggested.push(...extra.filter((c) => !known.has(c.id)));
    return structuredClone(companies);
  }, 7000, onLog);
}
export async function addCompany(name: string, careers_url?: string): Promise<Company> {
  if (!USE_MOCK) return request("/api/companies", json("POST", { name, careers_url: careers_url || undefined }));
  await pause(900);
  if (/acme|test/i.test(name) && !careers_url) throw new ApiError(`We couldn't find a job board for ${name}. Try adding its careers page URL.`, 404);
  const company: Company = { id: Date.now(), name, logo_url: null, board_name: "Ashby job board", board_url: careers_url || null, why_it_fits: "Added by you.", open_roles: 0, known_people: 0 };
  companies.watching.unshift(company);
  me.onboarding.has_companies = true;
  return structuredClone(company);
}
export async function setCompanyStatus(id: number, status: "tracking" | "rejected"): Promise<CompaniesResponse> {
  if (!USE_MOCK) return request(`/api/companies/${id}/status`, json("POST", { status }));
  await pause(250);
  const company = companies.suggested.find((c) => c.id === id);
  companies.suggested = companies.suggested.filter((c) => c.id !== id);
  if (company && status === "tracking") companies.watching.push(company);
  return structuredClone(companies);
}
export async function removeCompany(id: number): Promise<CompaniesResponse> {
  if (!USE_MOCK) return request(`/api/companies/${id}`, json("DELETE"));
  await pause(250);
  companies.watching = companies.watching.filter((c) => c.id !== id);
  return structuredClone(companies);
}
export async function matchJob(job_description: string, onLog?: LogHandler): Promise<Analysis> {
  if (!USE_MOCK) return runJob(() => request("/api/match", json("POST", { job_description })), onLog);
  const template = mockRoleDetails[1]?.analysis;
  if (!template) throw new ApiError("Analysis unavailable", 500);
  bump("analyses");
  return mockJob(["Reading the job description…", "Comparing requirements to your resume…", "Finding your strongest evidence…", "Writing resume suggestions…"], () => {
    const firstLine = job_description.trim().split("\n")[0]?.slice(0, 80) ?? "";
    const analysis: Analysis = { ...structuredClone(template), job_title: firstLine.length > 3 ? firstLine : "Pasted role", company: "Pasted job", match_score: 76, verdict: "A solid fit: your platform and payments evidence covers most of the core requirements. Tighten your story around the gaps below before applying." };
    analyses.unshift({ id: Date.now(), title: analysis.job_title, company: analysis.company, match_score: analysis.match_score, created_at: new Date().toISOString(), analysis });
    skills.analyses_count += 1; skills.new_since_report += 1;
    return analysis;
  }, 5000, onLog);
}
export async function getAnalyses(): Promise<SavedAnalysis[]> { return USE_MOCK ? mock(analyses) : request("/api/analyses"); }
export async function deleteAnalysis(id: number): Promise<void> {
  if (!USE_MOCK) { await request(`/api/analyses/${id}`, json("DELETE")); return; }
  await pause(200);
  analyses = analyses.filter((a) => a.id !== id);
}
export async function getSkills(): Promise<SkillsResponse> { return USE_MOCK ? mock(skills) : request("/api/skills"); }
export async function buildSkills(onLog?: LogHandler): Promise<SkillsResponse> {
  if (!USE_MOCK) return runJob(() => request("/api/skills", json("POST")), onLog);
  bump("coaching");
  return mockJob([`Reading your ${skills.analyses_count} analyses…`, "Grouping skill gaps into themes…", "Ranking themes by how many roles need them…", "Writing your coaching plan…"], () => {
    skills = { ...skills, new_since_report: 0, report: skills.report ? { ...skills.report, roles_count: skills.analyses_count, created_at: new Date().toISOString() } : mockSkills.report };
    return structuredClone(skills);
  }, 6000, onLog);
}
export async function getSearch(): Promise<SearchProfile> { return USE_MOCK ? mock(search) : request("/api/search"); }
export async function saveSearch(profile: SearchProfile): Promise<SearchProfile> {
  if (!USE_MOCK) return request("/api/search", json("PUT", profile));
  search = structuredClone(profile);
  me.onboarding.has_search = true;
  return mock(search);
}
export async function uploadResume(input: File | string): Promise<Me> {
  if (!USE_MOCK) {
    const data = new FormData();
    if (typeof input === "string") data.append("text", input); else data.append("file", input);
    return request("/api/resume", { method: "PUT", body: data });
  }
  me.onboarding.has_resume = true;
  me.resume_kind = typeof input === "string" ? "text" : input.name.toLowerCase().endsWith(".pdf") ? "pdf" : "text";
  return mock(me, 900);
}
export async function uploadConnections(file: File): Promise<{ count: number }> {
  if (!USE_MOCK) { const data = new FormData(); data.append("file", file); return request("/api/connections", { method: "PUT", body: data }); }
  me.connections_count = 684;
  return mock({ count: 684 }, 900);
}
export async function deleteConnections(): Promise<{ count: 0 }> {
  if (!USE_MOCK) return request("/api/connections", json("DELETE"));
  me.connections_count = 0;
  return mock({ count: 0 as const });
}
export async function deleteAccount(): Promise<void> {
  if (!USE_MOCK) { await request("/api/me", json("DELETE")); return; }
  await pause(300);
  me = structuredClone(mockMe);
}
