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

const USE_MOCK = true;
const API_URL = import.meta.env["VITE_API_URL"] ?? "";
let roles = structuredClone(mockRoles);
let details = structuredClone(mockRoleDetails);
let search = structuredClone(mockSearch);

const pause = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window === "undefined" ? "" : window.sessionStorage.getItem("job_search_token") ?? "";
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Something went wrong. Please try again." }));
    throw new Error(payload.detail ?? "Something went wrong. Please try again.");
  }
  return response.json() as Promise<T>;
}

const mock = async <T>(value: T, ms?: number) => { await pause(ms); return structuredClone(value); };

export async function getMe(): Promise<Me> { return USE_MOCK ? mock(mockMe) : request("/api/me"); }
export async function getRoles(view: "best" | "saved" | "all" = "best"): Promise<RolesResponse> {
  if (!USE_MOCK) return request(`/api/roles?view=${view}`);
  await pause();
  const visible = roles.filter((role) => role.status !== "dismissed" && (view === "all" || (view === "saved" ? role.status === "saved" : role.fit_score >= search.min_score)));
  return { stats: { strong_count: roles.filter((role) => role.fit_score >= search.min_score && role.status !== "dismissed").length, saved_count: roles.filter((role) => role.status === "saved").length, companies_watched: 5, min_score: search.min_score }, roles: structuredClone(visible) };
}
export async function getRole(id: number): Promise<RoleDetail> { if (!USE_MOCK) return request(`/api/roles/${id}`); const detail = details[id]; if (!detail) throw new Error("Role not found"); return mock(detail); }
export async function setRoleStatus(id: number, status: RoleSummary["status"]): Promise<RoleSummary> { if (!USE_MOCK) return request(`/api/roles/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }); await pause(220); roles = roles.map((role) => role.id === id ? { ...role, status } : role); if (details[id]) details[id] = { ...details[id], role: { ...details[id].role, status } }; const role = roles.find((item) => item.id === id); if (!role) throw new Error("Role not found"); return structuredClone(role); }
export async function buildPlan(id: number): Promise<RoleDetail> { if (!USE_MOCK) return request(`/api/roles/${id}/plan`, { method: "POST" }); await pause(4500); const template = details[1]; const current = details[id]; if (!current || !template) throw new Error("Role not found"); details[id] = { ...current, analysis: { ...template.analysis, job_title: current.role.title, company: current.role.company, match_score: current.role.fit_score } as Analysis, recommendation: { headline: current.role.fit_score >= 70 ? "Apply with a focused story" : "Build evidence before applying", detail: "Use the plan below to close the most important gaps and make your relevant experience unmistakable.", color: current.role.fit_color }, plan: structuredClone(template.plan), people: [], adjacent: structuredClone(template.adjacent), role: { ...current.role, has_plan: true } }; roles = roles.map((role) => role.id === id ? { ...role, has_plan: true } : role); return structuredClone(details[id]); }
export async function setPlanStep(id: number, step_key: string, done: boolean) { if (!USE_MOCK) return request(`/api/roles/${id}/plan/${step_key}`, { method: "PUT", body: JSON.stringify({ done }) }); await pause(180); const detail = details[id]; if (!detail) throw new Error("Role not found"); detail.plan = detail.plan.map((step) => step.key === step_key ? { ...step, done } : step); return structuredClone(detail.plan); }
export async function draftMessage(id: number, person_index: number): Promise<{ message: string }> { if (!USE_MOCK) return request(`/api/roles/${id}/draft`, { method: "POST", body: JSON.stringify({ person_index }) }); await pause(900); const person = details[id]?.people.find((item) => item.index === person_index); const role = details[id]?.role; return { message: `Hi ${person?.name.split(" ")[0] ?? "there"} — I’m exploring the ${role?.title ?? "product role"} at ${role?.company ?? "your company"}. It stood out because I recently led an internal payments API adopted by 12 teams and cut integration time from six weeks to two. Would you be open to a quick 15-minute chat about the team and what they value most?` }; }
export async function addTitleToSearch(id: number, title: string): Promise<SearchProfile> { if (!USE_MOCK) return request(`/api/roles/${id}/add-title`, { method: "POST", body: JSON.stringify({ title }) }); await pause(250); if (!search.include_titles.includes(title)) search.include_titles.push(title); return structuredClone(search); }
export async function refreshRoles(): Promise<{ summary: string }> { return USE_MOCK ? mock({ summary: "6 new roles found" }, 1800) : request("/api/roles/refresh", { method: "POST" }); }
export async function findRoles(): Promise<{ summary: string }> { return USE_MOCK ? mock({ summary: "8 roles found across 5 companies" }, 1800) : request("/api/roles/find", { method: "POST" }); }
export async function getCompanies(): Promise<CompaniesResponse> { return USE_MOCK ? mock(mockCompanies) : request("/api/companies"); }
export async function discoverCompanies(): Promise<CompaniesResponse> { return USE_MOCK ? mock(mockCompanies, 1800) : request("/api/companies/discover", { method: "POST" }); }
export async function addCompany(name: string, careers_url?: string): Promise<Company> { if (!USE_MOCK) return request("/api/companies", { method: "POST", body: JSON.stringify({ name, careers_url }) }); return mock({ id: 99, name, logo_url: null, board_name: "Careers", board_url: careers_url ?? null, why_it_fits: "Added by you.", open_roles: 0, known_people: 0 }); }
export async function setCompanyStatus(id: number, status: "tracking" | "rejected"): Promise<CompaniesResponse> { return USE_MOCK ? mock(mockCompanies) : request(`/api/companies/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }); }
export async function removeCompany(id: number): Promise<CompaniesResponse> { return USE_MOCK ? mock(mockCompanies) : request(`/api/companies/${id}`, { method: "DELETE" }); }
export async function matchJob(job_description: string): Promise<Analysis> { if (!USE_MOCK) return request("/api/match", { method: "POST", body: JSON.stringify({ job_description }) }); const analysis = mockRoleDetails[1]?.analysis; if (!analysis) throw new Error("Analysis unavailable"); return mock(analysis, 1800); }
export async function getAnalyses(): Promise<SavedAnalysis[]> { return USE_MOCK ? mock(mockAnalyses) : request("/api/analyses"); }
export async function deleteAnalysis(id: number): Promise<void> { if (!USE_MOCK) await request(`/api/analyses/${id}`, { method: "DELETE" }); else await pause(200); }
export async function getSkills(): Promise<SkillsResponse> { return USE_MOCK ? mock(mockSkills) : request("/api/skills"); }
export async function buildSkills(): Promise<SkillsResponse> { return USE_MOCK ? mock(mockSkills, 1800) : request("/api/skills", { method: "POST" }); }
export async function getSearch(): Promise<SearchProfile> { return USE_MOCK ? mock(search) : request("/api/search"); }
export async function saveSearch(profile: SearchProfile): Promise<SearchProfile> { if (!USE_MOCK) return request("/api/search", { method: "PUT", body: JSON.stringify(profile) }); search = structuredClone(profile); return mock(search); }
export async function uploadResume(input: File | string): Promise<Me> { if (!USE_MOCK) { const options: RequestInit = { method: "PUT" }; if (typeof input === "string") options.body = JSON.stringify({ text: input }); else { const data = new FormData(); data.append("file", input); options.body = data; } return request("/api/resume", options); } return mock(mockMe); }
export async function uploadConnections(file: File): Promise<{ count: number }> { if (!USE_MOCK) { const data = new FormData(); data.append("file", file); return request("/api/connections", { method: "PUT", body: data }); } return mock({ count: 684 }); }
export async function deleteConnections(): Promise<{ count: 0 }> { return USE_MOCK ? mock({ count: 0 as const }) : request("/api/connections", { method: "DELETE" }); }
export async function deleteAccount(): Promise<void> { if (!USE_MOCK) await request("/api/me", { method: "DELETE" }); else await pause(300); }