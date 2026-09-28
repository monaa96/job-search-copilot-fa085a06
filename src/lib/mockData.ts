export type FitColor = "green" | "blue" | "orange" | "gray";
export type Usage = { used: number; limit: number };
export type Me = { name: string; email: string; is_owner: boolean; onboarding: { has_resume: boolean; has_search: boolean; has_companies: boolean }; resume_kind: "pdf" | "text" | null; connections_count: number; last_scan: string | null; usage: { fit_checks: Usage; analyses: Usage; discoveries: Usage; messages: Usage; coaching: Usage } };
export type SearchProfile = { include_titles: string[]; exclude_titles: string[]; locations: string[]; interests: string; company_stage: string; min_score: number };
export type RoleSummary = { id: number; title: string; company: string; company_id: number; logo_url: string | null; location: string; posted_at: string | null; url: string; fit_score: number; fit_color: FitColor; fit_label: string; fit_reason: string; status: "new" | "saved" | "dismissed"; has_plan: boolean; known_people: number };
export type RolesResponse = { stats: { strong_count: number; saved_count: number; companies_watched: number; min_score: number }; roles: RoleSummary[] };
export type Analysis = { job_title: string; company: string; match_score: number; verdict: string; strong_matches: { skill: string; evidence: string }[]; skill_gaps: { skill: string; importance: "critical" | "important" | "nice-to-have"; why_it_matters: string }[]; why_youre_a_fit: string[]; what_to_emphasize: string[]; skills_to_build: { skill: string; how: string }[]; adjacent_roles: { title: string; why: string }[]; resume_edits: { original: string; suggested: string; why: string }[] };
export type PlanStep = { key: string; kind: "resume" | "skill" | "referral" | "story" | "apply"; title: string; detail: string; done: boolean };
export type Person = { index: number; name: string; position: string; url: string; why: string };
export type Opening = { title: string; company: string; logo_url: string | null; location: string; url: string };
export type RoleDetail = { role: RoleSummary; analysis: Analysis | null; recommendation: { headline: string; detail: string; color: FitColor } | null; plan: PlanStep[]; people: Person[]; has_connections: boolean; adjacent: { title: string; why: string; in_search: boolean; openings: Opening[] }[] };
export type Company = { id: number; company_id: number | null; name: string; logo_url: string | null; board_name: string | null; board_url: string | null; why_it_fits: string; open_roles: number; known_people: number };
export type CompaniesResponse = { suggested: Company[]; watching: Company[]; untrackable: Company[] };
export type SkillTheme = { skill: string; priority: "high" | "medium" | "low"; roles: { title: string; company: string; role_id: number | null }[]; why_it_matters: string; what_you_have: string; plan: { action: string; time: string }[]; proof_project: string };
export type SkillsResponse = { analyses_count: number; min_analyses: number; new_since_report: number; report: { summary: string; themes: SkillTheme[]; roles_count: number; created_at: string } | null };
export type SavedAnalysis = { id: number; title: string; company: string; match_score: number; created_at: string; analysis: Analysis };

const logo = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const mockMe: Me = {
  name: "Alex Morgan", email: "alex@example.com", is_owner: true,
  onboarding: { has_resume: true, has_search: true, has_companies: true },
  resume_kind: "pdf", connections_count: 684, last_scan: "Sep 28, 8:00 AM · 12 new roles, 5 at 60+ · 4 more to score next scan",
  usage: { fit_checks: { used: 8, limit: 20 }, analyses: { used: 3, limit: 10 }, discoveries: { used: 1, limit: 5 }, messages: { used: 2, limit: 15 }, coaching: { used: 4, limit: 20 } },
};

export const mockSearch: SearchProfile = {
  include_titles: ["Platform Product Manager", "Product Lead", "Payments Product Manager"],
  exclude_titles: ["Junior Product Manager"], locations: ["New York", "Remote"],
  interests: "Payments infrastructure, developer platforms, applied AI", company_stage: "Series B to public", min_score: 50,
};

export const mockRoles: RoleSummary[] = [
  { id: 1, title: "Senior Product Manager, Payments Platform", company: "Ramp", company_id: 1, logo_url: logo("ramp.com"), location: "New York, NY", posted_at: "2026-09-20", url: "https://ramp.com/careers", fit_score: 88, fit_color: "green", fit_label: "Strong fit", fit_reason: "You have shipped the exact kind of internal payments platform this team needs, with adoption and speed metrics to prove it.", status: "saved", has_plan: true, known_people: 2 },
  { id: 2, title: "Product Manager, Money Movement", company: "Plaid", company_id: 2, logo_url: logo("plaid.com"), location: "San Francisco, CA · Remote", posted_at: "2026-09-22", url: "https://plaid.com/careers", fit_score: 82, fit_color: "blue", fit_label: "Good fit", fit_reason: "Your payments API and B2B product experience map well; direct bank-rail ownership is the main gap.", status: "new", has_plan: false, known_people: 1 },
  { id: 3, title: "Product Lead, Payment Operations", company: "Modern Treasury", company_id: 3, logo_url: logo("moderntreasury.com"), location: "New York, NY · Remote", posted_at: "2026-09-18", url: "https://www.moderntreasury.com/careers", fit_score: 79, fit_color: "blue", fit_label: "Good fit", fit_reason: "You bring platform depth and founding-PM ownership, but should make your operational payments expertise more explicit.", status: "saved", has_plan: false, known_people: 0 },
  { id: 4, title: "Senior Product Manager, Risk", company: "Mercury", company_id: 4, logo_url: logo("mercury.com"), location: "Remote, US", posted_at: "2026-09-15", url: "https://mercury.com/jobs", fit_score: 71, fit_color: "blue", fit_label: "Good fit", fit_reason: "Your fintech foundation is relevant, though the role asks for deeper underwriting and fraud-model experience.", status: "new", has_plan: false, known_people: 3 },
  { id: 5, title: "Product Manager, Enterprise", company: "Anthropic", company_id: 5, logo_url: logo("anthropic.com"), location: "San Francisco, CA", posted_at: "2026-09-24", url: "https://www.anthropic.com/careers", fit_score: 66, fit_color: "orange", fit_label: "Stretch", fit_reason: "Your enterprise platform work transfers, but you need a sharper story around AI products and model evaluation.", status: "new", has_plan: false, known_people: 1 },
  { id: 6, title: "Principal Product Manager, Billing", company: "Stripe", company_id: 6, logo_url: logo("stripe.com"), location: "New York, NY", posted_at: "2026-09-12", url: "https://stripe.com/jobs", fit_score: 59, fit_color: "orange", fit_label: "Stretch", fit_reason: "You match the domain, but the scope and years-at-scale expectations sit one level above your current evidence.", status: "new", has_plan: false, known_people: 0 },
  { id: 7, title: "Product Manager, AI Experiences", company: "Perplexity", company_id: 7, logo_url: logo("perplexity.ai"), location: "San Francisco, CA", posted_at: "2026-09-25", url: "https://www.perplexity.ai/careers", fit_score: 51, fit_color: "orange", fit_label: "Stretch", fit_reason: "Your zero-to-one instincts fit, but your resume does not yet show consumer AI experimentation or growth loops.", status: "new", has_plan: false, known_people: 0 },
  { id: 8, title: "Product Manager, Machine Learning Platform", company: "OpenAI", company_id: 8, logo_url: null, location: "San Francisco, CA", posted_at: "2026-09-10", url: "https://openai.com/careers", fit_score: 41, fit_color: "gray", fit_label: "Long shot", fit_reason: "Your platform skills are credible, but this role requires hands-on ML infrastructure depth that is not yet visible.", status: "new", has_plan: false, known_people: 0 },
];

const rampAnalysis: Analysis = {
  job_title: "Senior Product Manager, Payments Platform", company: "Ramp", match_score: 88,
  verdict: "You are a high-confidence match. The clearest path is to lead with your payments platform outcomes and use a warm introduction to close the scale-perception gap.",
  strong_matches: [
    { skill: "Payments platform", evidence: "Built an internal payments API adopted by 12 teams." },
    { skill: "Developer experience", evidence: "Reduced partner integration time from six weeks to two." },
    { skill: "Zero-to-one leadership", evidence: "Founding PM at a B2B startup, from discovery through launch." },
    { skill: "Structured strategy", evidence: "Former strategy consultant with strong executive communication." },
  ],
  skill_gaps: [
    { skill: "Card issuing", importance: "important", why_it_matters: "The team owns card lifecycle and authorization products." },
    { skill: "Public-company scale", importance: "nice-to-have", why_it_matters: "Ramp wants evidence of operating across a larger product organization." },
    { skill: "Risk controls", importance: "critical", why_it_matters: "Payment acceptance decisions require fluency in controls and loss tradeoffs." },
  ],
  why_youre_a_fit: ["You understand platform customers because you have served internal product teams directly.", "You can quantify both adoption and developer velocity.", "Your founding-PM background shows you can work through ambiguity."],
  what_to_emphasize: ["The 12 teams that adopted your API", "The four-week reduction in integration time", "How you aligned engineering, risk, and commercial stakeholders"],
  skills_to_build: [{ skill: "Card economics", how: "Build a concise point of view on interchange, authorization rates, and loss controls." }, { skill: "Risk product metrics", how: "Prepare a metric tree connecting approval rate, fraud loss, and customer experience." }],
  adjacent_roles: [{ title: "Platform Product Manager", why: "Your strongest direct evidence is in reusable infrastructure." }, { title: "Developer Experience PM", why: "Your integration-time result is a standout proof point." }, { title: "Fintech Partnerships Lead", why: "Your consulting and cross-functional skills translate to ecosystem roles." }],
  resume_edits: [
    { original: "Built an internal payments API for product teams.", suggested: "Led strategy and launch of an internal payments API adopted by 12 product teams, establishing the company’s reusable money-movement platform.", why: "Adds leadership, adoption, and platform scope." },
    { original: "Improved the integration process.", suggested: "Cut payments integration time from six weeks to two by standardizing APIs, documentation, and launch controls.", why: "Makes the business impact concrete." },
    { original: "Worked with engineering and business teams.", suggested: "Aligned engineering, risk, finance, and commercial leaders on platform priorities and release criteria.", why: "Mirrors Ramp’s cross-functional environment." },
    { original: "Founding product manager at a B2B startup.", suggested: "Founding PM for a B2B workflow product; took the product from customer discovery to launch and the first 25 enterprise accounts.", why: "Shows zero-to-one ownership and commercial impact." },
  ],
};

const rampPlan: PlanStep[] = [
  { key: "positioning", kind: "story", title: "Frame your platform story", detail: "Open with the 12-team payments API and connect developer speed to faster product launches.", done: true },
  { key: "resume-api", kind: "resume", title: "Rewrite the payments API bullet", detail: "Use the suggested result-led language and place it in the top third of your resume.", done: true },
  { key: "risk", kind: "skill", title: "Build your risk-controls point of view", detail: "Prepare a one-page metric tree covering authorization rate, fraud loss, and false declines.", done: false },
  { key: "cards", kind: "skill", title: "Learn the card issuing economics", detail: "Spend 90 minutes on interchange, network fees, disputes, and authorization optimization.", done: false },
  { key: "maya", kind: "referral", title: "Ask Maya for a referral", detail: "Send a concise note that anchors on your payments platform overlap and asks for 15 minutes.", done: false },
  { key: "interview", kind: "story", title: "Prepare the integration-speed story", detail: "Use a clear before-and-after narrative for how you cut integration time from six weeks to two.", done: false },
  { key: "apply", kind: "apply", title: "Apply with the tailored resume", detail: "Submit after the referral is entered, ideally within 48 hours of the conversation.", done: false },
];

export const mockRoleDetails: Record<number, RoleDetail> = Object.fromEntries(mockRoles.map((role) => [role.id, {
  role, analysis: role.id === 1 ? rampAnalysis : null,
  recommendation: role.id === 1 ? { headline: "Apply with a referral", detail: "Your platform payments evidence is unusually direct. A warm introduction will help you establish level and scale before the first screen.", color: "green" } : null,
  plan: role.id === 1 ? rampPlan : [],
  people: role.id === 1 ? [
    { index: 0, name: "Maya Chen", position: "Senior Product Manager at Ramp", url: "https://www.linkedin.com", why: "You worked together on the fintech council for two years." },
    { index: 1, name: "Jordan Lee", position: "Senior Technical Recruiter at Ramp", url: "https://www.linkedin.com", why: "A former colleague introduced you last year." },
  ] : [],
  has_connections: true,
  adjacent: role.id === 1 ? [
    { title: "Platform Product Manager", why: "Your strongest proof is building reusable infrastructure for internal teams.", in_search: true, openings: [{ title: "Product Manager, Platform", company: "Plaid", logo_url: logo("plaid.com"), location: "San Francisco · Remote", url: "https://plaid.com/careers" }, { title: "Senior PM, Financial Platform", company: "Mercury", logo_url: logo("mercury.com"), location: "Remote, US", url: "https://mercury.com/jobs" }] },
    { title: "Developer Experience PM", why: "Your integration-time result gives you unusually strong credibility with developer users.", in_search: false, openings: [{ title: "Product Manager, Developer Experience", company: "Modern Treasury", logo_url: logo("moderntreasury.com"), location: "New York · Remote", url: "https://www.moderntreasury.com/careers" }] },
    { title: "Fintech Partnerships Lead", why: "Your consulting toolkit and payments depth transfer well to ecosystem strategy.", in_search: false, openings: [{ title: "Product Partnerships Lead", company: "Stripe", logo_url: logo("stripe.com"), location: "New York, NY", url: "https://stripe.com/jobs" }] },
  ] : [],
}])) as Record<number, RoleDetail>;

export const mockCompanies: CompaniesResponse = {
  suggested: [
    { id: 11, company_id: null, name: "Stripe", logo_url: logo("stripe.com"), board_name: "Greenhouse job board", board_url: "https://stripe.com/jobs", why_it_fits: "Stripe's platform and money-movement teams hire PMs who have built APIs other teams depend on, which is exactly your strongest story. Several open roles sit in New York.", open_roles: 4, known_people: 2 },
    { id: 12, company_id: null, name: "Brex", logo_url: logo("brex.com"), board_name: "Greenhouse job board", board_url: "https://www.brex.com/careers", why_it_fits: "Brex is rebuilding its payments and spend-management platform, and your integration-time results speak directly to that work.", open_roles: 2, known_people: 0 },
    { id: 13, company_id: null, name: "Increase", logo_url: logo("increase.com"), board_name: "Ashby job board", board_url: "https://increase.com/careers", why_it_fits: "A small, technical team building bank infrastructure for developers. Your founding-PM experience fits their stage.", open_roles: 0, known_people: 1 },
  ],
  watching: mockRoles.slice(0, 5).map((role, i) => ({ id: role.company_id, company_id: role.company_id, name: role.company, logo_url: role.logo_url, board_name: i % 2 ? "Greenhouse job board" : "Ashby job board", board_url: role.url, why_it_fits: role.fit_reason, open_roles: [4, 2, 3, 1, 2][i] ?? 0, known_people: role.known_people })),
  untrackable: [
    { id: 21, company_id: null, name: "Chime", logo_url: logo("chime.com"), board_name: null, board_url: null, why_it_fits: "Strong consumer payments team, but their careers site doesn't use a job board we can read automatically.", open_roles: 0, known_people: 0 },
    { id: 22, company_id: null, name: "Capital One", logo_url: logo("capitalone.com"), board_name: null, board_url: null, why_it_fits: "Large payments platform org in New York; openings are posted on a custom Workday site.", open_roles: 0, known_people: 1 },
  ],
};
export const mockSkills: SkillsResponse = {
  analyses_count: 4, min_analyses: 3, new_since_report: 1,
  report: {
    summary: "Your clearest advantage is payments platform leadership: every role you analyzed values it. The pattern holding you back is depth in risk systems and hands-on fluency with AI products. Closing those two gaps would move three roles from Good fit to Strong fit.",
    roles_count: 4, created_at: "2026-09-27T16:00:00Z",
    themes: [
      { skill: "Risk and fraud systems", priority: "high", roles: [{ title: "Senior Product Manager, Risk", company: "Mercury", role_id: 4 }, { title: "Product Manager, Money Movement", company: "Plaid", role_id: 2 }, { title: "Product Lead, Payment Operations", company: "Modern Treasury", role_id: 3 }], why_it_matters: "Fintech PM roles increasingly own loss rates and fraud tradeoffs. Hiring managers want to see you can reason about false positives, model thresholds and the cost of friction.", what_you_have: "You designed retry and reconciliation logic in your payments API and worked with compliance on KYC requirements.", plan: [{ action: "Take a short course on fraud detection fundamentals (e.g. Sift or Stripe Radar docs and case studies)", time: "1 week" }, { action: "Interview two risk PMs from your network about how they measure success", time: "2 hours" }, { action: "Write a one-page teardown of a fraud flow you know well", time: "1 weekend" }], proof_project: "Publish a teardown of how Mercury or Ramp could reduce ACH return losses, with a proposed metric tree and experiment plan." },
      { skill: "AI product fluency", priority: "medium", roles: [{ title: "Product Manager, Enterprise", company: "Anthropic", role_id: 5 }, { title: "Senior Product Manager, Payments Platform", company: "Ramp", role_id: 1 }], why_it_matters: "AI companies and AI-heavy fintechs want PMs who have shipped with LLMs and understand evaluation, latency and cost tradeoffs.", what_you_have: "You scoped an ML-based invoice matching feature at your startup and worked closely with data science.", plan: [{ action: "Build a small LLM tool that categorizes transactions using a public API", time: "2 weekends" }, { action: "Write an evaluation set and track accuracy across prompt versions", time: "3 evenings" }], proof_project: "Ship a transaction-categorization demo with a written eval report comparing two approaches." },
      { skill: "Bank rails and ledgers", priority: "low", roles: [{ title: "Product Lead, Payment Operations", company: "Modern Treasury", role_id: 3 }, { title: "Payments Strategy Lead", company: "Adyen", role_id: null }], why_it_matters: "Payment operations roles expect you to speak fluently about ACH, wires, RTP and double-entry ledgers.", what_you_have: "Your internal API abstracted card and ACH flows, so you know the basics of settlement timing.", plan: [{ action: "Read Modern Treasury's Payments Journal guides on ACH, wires and RTP", time: "4 hours" }, { action: "Sketch a double-entry ledger for a simple marketplace", time: "1 evening" }], proof_project: "Write a short explainer comparing payment rails for a B2B payouts use case." },
    ],
  },
};
export const mockAnalyses: SavedAnalysis[] = [{ id: 1, title: rampAnalysis.job_title, company: rampAnalysis.company, match_score: rampAnalysis.match_score, created_at: "2026-09-27T14:20:00Z", analysis: rampAnalysis }];