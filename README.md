# Career Compass

Build the frontend for "Job Search Copilot", an AI job search app. Tagline: "Don't just find jobs. Close the gap." It finds roles that fit you, shows exactly what stands between you and each one, and gives you a concrete plan to land it (resume edits, skills to build, referrals from people you know, adjacent roles).

IMPORTANT ARCHITECTURE RULES
- This is a frontend only. Do NOT enable Lovable Cloud, Supabase, or any backend/database. All data comes from an existing external REST API (Python, built separately).
- Put ALL data access in one module, src/lib/api.ts, with one async function per endpoint (getMe, getRoles(view), getRole(id), setRoleStatus, buildPlan, setPlanStep, draftMessage, addTitleToSearch, refreshRoles, findRoles, getCompanies, discoverCompanies, addCompany, setCompanyStatus, removeCompany, matchJob, getAnalyses, deleteAnalysis, getSkills, buildSkills, getSearch, saveSearch, uploadResume, uploadConnections, deleteConnections, deleteAccount).
- For now these functions return realistic MOCK data (in src/lib/mockData.ts) with a short simulated delay, controlled by a single flag: `const USE_MOCK = true`. Later we'll switch it to real fetch calls against `import.meta.env.VITE_API_URL` with an `Authorization: Bearer <token>` header, so structure the code to make that swap trivial.
- Use these TypeScript types exactly (snake_case field names, they match the API):

type FitColor = "green" | "blue" | "orange" | "gray";
type Usage = { used: number; limit: number };
type Me = { name: string; email: string; is_owner: boolean; onboarding: { has_resume: boolean; has_search: boolean; has_companies: boolean }; resume_kind: "pdf" | "text" | null; connections_count: number; last_scan: string | null; usage: { fit_checks: Usage; analyses: Usage; discoveries: Usage; messages: Usage; coaching: Usage } };
type SearchProfile = { include_titles: string[]; exclude_titles: string[]; locations: string[]; interests: string; company_stage: string; min_score: number };
type RoleSummary = { id: number; title: string; company: string; company_id: number; logo_url: string | null; location: string; posted_at: string | null; url: string; fit_score: number; fit_color: FitColor; fit_label: string; fit_reason: string; status: "new" | "saved" | "dismissed"; has_plan: boolean; known_people: number };
type RolesResponse = { stats: { strong_count: number; saved_count: number; companies_watched: number; min_score: number }; roles: RoleSummary[] };
type Analysis = { job_title: string; company: string; match_score: number; verdict: string; strong_matches: { skill: string; evidence: string }[]; skill_gaps: { skill: string; importance: "critical" | "important" | "nice-to-have"; why_it_matters: string }[]; why_youre_a_fit: string[]; what_to_emphasize: string[]; skills_to_build: { skill: string; how: string }[]; adjacent_roles: { title: string; why: string }[]; resume_edits: { original: string; suggested: string; why: string }[] };
type PlanStep = { key: string; kind: "resume" | "skill" | "referral" | "story" | "apply"; title: string; detail: string; done: boolean };
type Person = { index: number; name: string; position: string; url: string; why: string };
type Opening = { title: string; company: string; logo_url: string | null; location: string; url: string };
type RoleDetail = { role: RoleSummary; analysis: Analysis | null; recommendation: { headline: string; detail: string; color: FitColor } | null; plan: PlanStep[]; people: Person[]; has_connections: boolean; adjacent: { title: string; why: string; in_search: boolean; openings: Opening[] }[] };

DESIGN DIRECTION
- Professional, modern, confident. Think Welcome to the Jungle's job cards meets Linear's polish. Not generic AI-app styling: no gradients on everything, no emoji.
- Font: Inter. Primary accent: royal blue #2451D6, secondary accent violet #6D3FD9. Page background a soft blue-gray (#F1F4FA) with white cards, subtle 1px borders (#E2E6EE), soft shadows, 12px radius.
- Fit colors are the core visual language, used consistently everywhere: green = Strong fit (85+), blue = Good fit (70-84), orange = Stretch (50-69), gray = Long shot (<50). Show fit as a pill badge "88 · Strong fit" and as a colored left border stripe on role cards.
- Company logos: show logo_url images in a small rounded white square with a border; if null, show a colored square with the company's first letter.
- Top navigation bar (white, sticky): logo mark + "Job Search Copilot" on the left; nav items Roles, Resume match, Skills, Companies, Analyses; on the right a small usage indicator and a user avatar menu (Settings, Sign out). Fully responsive, including mobile.

SCREENS FOR THIS FIRST PASS

1. Roles (home, route "/")
- Eyebrow "YOUR DAILY SHORTLIST", title "Roles for you", subtitle with last_scan ("Updated Sep 28, 8:00 AM · 6 new roles"), and a "Check for new roles" button (calls refreshRoles, shows progress, then reloads).
- Three stat cards: "Roles at {min_score}+", "Saved", "Companies watched", each white with a colored top accent (blue, green, violet).
- Segmented control: Best matches / Saved / All roles.
- Role cards (the most important component): company logo, title (bold), company · location · "Posted Sep 20", fit badge, violet "You know 2 people here" badge when known_people > 0, the one-sentence fit_reason, and actions: View posting (external), Save/Saved (bookmark toggle), dismiss (X). Clicking the card or a "Your plan to land it →" link opens the role page. Colored left stripe by fit_color. Good empty and loading states.

2. Role page (route "/roles/:id")
- Back link "All roles". Header card: larger logo, title, meta, View posting and Save buttons.
- If analysis is null: a card with the fit badge, fit_reason, a short explanation of what the plan includes, and a primary "Build my plan" button (calls buildPlan, which takes ~40 seconds: show an engaging multi-step progress state, e.g. "Reading the job description… Comparing to your resume… Writing your plan…").
- If the plan exists:
  • Recommendation banner with colored stripe: eyebrow "OUR RECOMMENDATION", headline (e.g. "Apply with a referral"), fit badge, detail, and the analysis verdict in muted text.
  • Two columns. Left (wider): "Your plan to land it" with a progress bar ("2 of 7 done") and each step as a card with a checkbox, bold title, and detail text; an icon per kind (resume, skill, referral, story, apply). Checking calls setPlanStep optimistically.
  • Right: "At a glance" card (strengths with green check icons, gaps with importance badges: Critical red, Important orange, Nice to have gray). Below it, "People you know at {company}": each person with name (linked to their LinkedIn url), position, a muted "why", and a "Draft a message" button that calls draftMessage and shows the message in a card with a Copy button. If has_connections is false, show a prompt to import LinkedIn connections in Settings; if true but people is empty, say none of their connections work there yet.
  • Tabs below: "Adjacent roles" (each adjacent role type as a card with title, why, matching openings as compact rows with logo/title/company/location and a View link, and an "Add to my search" button unless in_search), "Resume suggestions" (each edit as a card: "Current" in muted strikethrough-style, "Suggested" in bold, and the why), and "Full analysis" (strengths with evidence, gaps, why you're a fit, what to emphasize, skills to build).

For the other nav items, create simple placeholder pages for now; we'll build them next.

MOCK DATA: a fictional candidate "Alex" who is a platform product manager with payments/fintech experience (internal payments API used by 12 teams, cut integration time from 6 weeks to 2; founding PM at a B2B startup; ex-strategy consultant). About 8 roles at fintech and AI companies (e.g. Ramp, Plaid, Modern Treasury, Mercury, Anthropic) with a realistic spread of fit scores (41 to 88) and all four fit colors, specific one-sentence fit reasons written to "you", a couple saved, some with known_people. Use https://www.google.com/s2/favicons?domain=<company domain>&sz=128 for logo_url. Include one role with a fully built plan (7 steps, 2 done, 2 people you know including a recruiter, 3 adjacent role types with a couple of openings, 4 resume edits) and one without a plan.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://job-search-copilot.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/38327c67-7320-4609-b5ba-359aee15bbba).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
