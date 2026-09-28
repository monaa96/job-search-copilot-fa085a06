import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { RefreshCw, Users, X } from "lucide-react";
import { ConnectionsDialog } from "@/components/connections-ui";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RoleCard } from "@/components/job-ui";
import { refreshRoles, setRoleStatus, type RoleSort, type RoleSummary } from "@/lib/api";
import { meQuery, requireSetup, rolesQuery, showError } from "@/lib/queries";
import { JobProgress, useJob } from "@/components/progress-ui";
import { cn } from "@/lib/utils";

type RoleView = "best" | "saved" | "all";
const DATE_KEY = "jsc_roles_posted_within";
const SORT_KEY = "jsc_roles_sort";
const dateOptions = [{ value: 0, label: "Any time" }, { value: 1, label: "Past 24 hours" }, { value: 7, label: "Past week" }, { value: 30, label: "Past month" }];
const readDate = () => { if (typeof window === "undefined") return 0; const n = Number(localStorage.getItem(DATE_KEY)); return [1, 7, 30].includes(n) ? n : 0; };
const readSort = (): RoleSort => typeof window !== "undefined" && localStorage.getItem(SORT_KEY) === "recent" ? "recent" : "fit";
const selectClass = "h-10 rounded-lg border border-border bg-card px-3 pr-8 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";


export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { company?: number; name?: string } => { const c = Number(search["company"]); return { ...(Number.isFinite(c) && c > 0 ? { company: c } : {}), ...(typeof search["name"] === "string" && search["name"] ? { name: search["name"] } : {}) }; },
  beforeLoad: requireSetup,
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(rolesQuery({ postedWithin: readDate() || null, sort: readSort() }))]),
  head: () => ({
    meta: [
      { title: "Roles for You — Job Search Copilot" },
      { name: "description", content: "Your daily shortlist of roles, ranked by fit with concrete next steps to land them." },
      { property: "og:title", content: "Roles for You — Job Search Copilot" },
      { property: "og:description", content: "Your daily shortlist of roles, ranked by fit with concrete next steps to land them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  const { company, name } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const companyName = name || "this company";
  const clearCompany = () => navigate({ search: {} });
  const [view, setView] = useState<RoleView>(company ? "all" : "best");
  useEffect(() => { if (company) setView("all"); }, [company]);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [bannerHidden, setBannerHidden] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  useEffect(() => { setBannerHidden(localStorage.getItem("jsc_hide_connections_banner") === "1"); }, []);
  const dismissBanner = () => { localStorage.setItem("jsc_hide_connections_banner", "1"); setBannerHidden(true); };
  const queryClient = useQueryClient();
  const job = useJob();
  const { data: me } = useSuspenseQuery(meQuery);
  const [postedWithin, setPostedWithinState] = useState(readDate);
  const [sort, setSortState] = useState<RoleSort>(readSort);
  const setPostedWithin = (n: number) => { localStorage.setItem(DATE_KEY, String(n)); setPostedWithinState(n); };
  const setSort = (v: RoleSort) => { localStorage.setItem(SORT_KEY, v); setSortState(v); };
  const rolesResult = useQuery({ ...rolesQuery({ postedWithin: postedWithin || null, sort, companyId: company ?? null }), placeholderData: keepPreviousData });
  const isFetching = rolesResult.isFetching;
  const data = rolesResult.data ?? { stats: { strong_count: 0, saved_count: 0, companies_watched: 0, min_score: 60 }, roles: [] };
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RoleSummary["status"] }) => setRoleStatus(id, status),
    onError: showError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
  const refreshMutation = useMutation({
    mutationFn: () => job.run((onLog) => refreshRoles(onLog)),
    onMutate: () => setRefreshMessage(""),
    onError: showError,
    onSuccess: async (result) => { setRefreshMessage(result.summary); await Promise.all([queryClient.invalidateQueries({ queryKey: ["roles"] }), queryClient.invalidateQueries({ queryKey: ["me"] })]); },
  });
  const updated = me.last_scan ? `Last updated ${me.last_scan}` : "Updated automatically every morning";
  const roles = data.roles.filter((role) => view === "all" || (view === "saved" ? role.status === "saved" : role.fit_score >= data.stats.min_score));
  const stats = data.stats;
  const tabs: { value: RoleView; label: string }[] = useMemo(() => [{ value: "best", label: "Best matches" }, { value: "saved", label: "Saved" }, { value: "all", label: "All roles" }], []);

  return <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Your daily shortlist</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-foreground sm:text-5xl">Roles for you</h1>
        <p className="mt-3 text-base font-semibold text-foreground">Don't just find jobs. Close the gap.</p>
        <p className="mt-1 max-w-2xl text-sm leading-7 text-muted-foreground">{updated}</p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}><RefreshCw className={cn("size-4", refreshMutation.isPending && "animate-spin")} />Check for new roles</Button>
        {!refreshMutation.isPending && refreshMessage && <p className="text-xs font-medium text-muted-foreground">{refreshMessage}</p>}
      </div>
    </section>

    {refreshMutation.isPending && <JobProgress className="mt-6" title="Checking your companies for new roles…" hint="This takes a minute or two. New roles are scored against your resume as they come in." logs={job.logs} />}

    <section className="mt-7 grid gap-4 md:grid-cols-3">
      <StatCard label={`Roles at ${stats.min_score}+`} value={stats.strong_count} accent="bg-fit-blue" />
      <StatCard label="Saved" value={stats.saved_count} accent="bg-fit-green" />
      <StatCard label="Companies watched" value={stats.companies_watched} accent="bg-violet" />
    </section>

    <section className="mt-8 flex flex-col gap-2 rounded-xl border border-border bg-card p-2 shadow-card md:flex-row md:items-center">
      <div className="grid flex-1 grid-cols-3 gap-1" role="tablist" aria-label="Role views">
        {tabs.map((tab) => <button key={tab.value} type="button" onClick={() => setView(tab.value)} className={cn("h-10 rounded-lg text-sm font-bold text-muted-foreground transition", view === tab.value && "bg-primary text-primary-foreground")}>{tab.label}</button>)}
      </div>
      {company && <button type="button" onClick={clearCompany} aria-label={`Clear ${companyName} filter`} className="inline-flex h-10 max-w-full items-center gap-1.5 self-start rounded-full border border-primary/30 bg-primary/10 px-3 text-sm font-bold text-primary transition hover:bg-primary/15 md:self-auto"><span className="truncate">{companyName}</span><X className="size-4 shrink-0" /></button>}
      <div className="grid grid-cols-2 gap-2 md:flex">
        <label className="grid gap-0.5 md:flex md:items-center md:gap-2"><span className="sr-only md:not-sr-only md:text-xs md:font-semibold md:text-muted-foreground">Date posted</span><select aria-label="Date posted" className={selectClass} value={postedWithin} onChange={(e) => setPostedWithin(Number(e.target.value))}>{dateOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
        <label className="grid gap-0.5 md:flex md:items-center md:gap-2"><span className="sr-only md:not-sr-only md:text-xs md:font-semibold md:text-muted-foreground">Sort by</span><select aria-label="Sort by" className={selectClass} value={sort} onChange={(e) => setSort(e.target.value as RoleSort)}><option value="fit">Best fit</option><option value="recent">Most recent</option></select></label>
      </div>
    </section>

    {me.connections_count === 0 && !bannerHidden && <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card sm:flex-row sm:items-center">
      <span className="flex flex-1 items-center gap-3 text-sm font-semibold"><Users className="size-4 shrink-0 text-violet" />Import your LinkedIn connections to see who can refer you at these companies</span>
      <div className="flex items-center gap-1"><Button size="sm" onClick={() => setImportOpen(true)}>Import connections</Button><Button variant="ghost" size="icon" aria-label="Dismiss" onClick={dismissBanner}><X className="size-4" /></Button></div>
    </div>}
    <ConnectionsDialog open={importOpen} onOpenChange={setImportOpen} onUploaded={() => queryClient.invalidateQueries({ queryKey: ["roles"] })} />

    <section className="mt-5 grid gap-4" aria-live="polite">
      {roles.length === 0 && company && <div className="rounded-xl border border-border bg-card p-10 text-center shadow-card"><h2 className="text-lg font-bold">No open roles at {companyName} match your search right now</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Clear the company filter to see roles from all your companies.</p><Button className="mt-5" variant="secondary" onClick={clearCompany}>Clear filter</Button></div>}
      {roles.length === 0 && !company && postedWithin > 0 && <div className="rounded-xl border border-border bg-card p-10 text-center shadow-card"><h2 className="text-lg font-bold">No roles posted in the {dateOptions.find((o) => o.value === postedWithin)?.label.toLowerCase()}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Your date filter is hiding older roles{view === "saved" ? " you saved" : ""}.</p><Button className="mt-5" variant="secondary" onClick={() => setPostedWithin(0)}>Show any time</Button></div>}
      {roles.length === 0 && !company && postedWithin === 0 && <div className="rounded-xl border border-border bg-card p-10 text-center shadow-card"><h2 className="text-lg font-bold">{data.roles.length === 0 ? "No roles yet" : view === "saved" ? "Nothing saved yet" : "No roles in this view"}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{data.roles.length === 0 ? "Your watched companies are checked every morning. You can also check right now and new roles will be scored against your resume." : view === "saved" ? "Bookmark a role to keep it here." : "Try another view or check for new roles."}</p>{view !== "saved" && <Button className="mt-5" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}><RefreshCw className={cn("size-4", refreshMutation.isPending && "animate-spin")} />Check for new roles</Button>}</div>}
      {roles.map((role) => <RoleCard key={role.id} role={role} onStatus={(status) => statusMutation.mutate({ id: role.id, status })} />)}
      {isFetching && <p className="text-center text-sm font-medium text-muted-foreground">Updating roles…</p>}
    </section>
  </div>;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card"><div className={cn("h-1.5", accent)} /><div className="p-5"><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-extrabold text-foreground">{value}</p></div></div>;
}