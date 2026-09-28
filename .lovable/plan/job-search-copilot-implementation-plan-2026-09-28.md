# Job Search Copilot implementation plan

## Scope
- Build the Roles dashboard and role-detail experience using realistic mock data.
- Add responsive shared navigation and placeholder pages for Resume match, Skills, Companies, Analyses, and Settings.
- Keep all data access behind the requested API module, with mock mode controlled by one flag.

## Implementation
1. Define the exact API-aligned TypeScript models and fintech product-manager mock dataset.
2. Create one API function per requested endpoint, with simulated latency and future authenticated REST wiring isolated in one module.
3. Establish the blue-gray, royal-blue, violet, and fit-status design system with Inter typography.
4. Build reusable navigation, logos, fit badges, role cards, loading/empty states, and polished mobile behavior.
5. Build the Roles dashboard with stats, filters, refresh progress, save, dismiss, and role navigation.
6. Build role details with build-plan progress, recommendation, optimistic checklist, people/message drafting, and analysis tabs.
7. Add route-specific metadata and simple placeholder pages for remaining navigation destinations.
8. Validate compilation and the central dashboard-to-role interactions on desktop and mobile.

## Technical details
- Frontend only; no Cloud, database, or persistence service.
- Mock mutations stay in memory for this pass.
- Dynamic role URLs use `/roles/$id` internally and render as `/roles/:id` to users.
- External job and LinkedIn links open safely in a new tab.
