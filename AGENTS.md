<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep all remote and mock data access in `src/lib/api.ts`; this preserves a single seam for switching from mock mode to the external REST API.
- Keep shared product navigation in the root route and content pages as TanStack leaf routes; this ensures responsive chrome and route-specific metadata remain consistent.
- Signed-in pages use `ssr: false` plus the `requireSetup` guard from `src/lib/queries.ts`; the token lives in localStorage, so the server can't fetch user data.
- Long API actions go through `runJob` in `src/lib/api.ts` and show live logs with `useJob` + `JobProgress`; one consistent progress pattern for every background job.
