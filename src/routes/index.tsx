import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RoleCard } from "@/components/job-ui";
import { refreshRoles, setRoleStatus, type RoleSummary } from "@/lib/api";
import { meQuery, requireSetup, rolesQuery, showError } from "@/lib/queries";
import { JobProgress, useJob } from "@/components/progress-ui";
import { cn } from "@/lib/utils";

type RoleView = "best" | "saved" | "all";


export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: requireSetup,
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(rolesQuery)]),
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
  const [view, setView] = useState<RoleView>("best");
  const [refreshMessage, setRefreshMessage] = useState("");
  const queryClient = useQueryClient();
  const job = useJob();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data, isFetching } = useSuspenseQuery(rolesQuery);
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
  const updated = me.last_scan ? new Date(me.last_scan).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not scanned yet";
  const roles = data.roles.filter((role) => view === "all" || (view === "saved" ? role.status === "saved" : role.fit_score >= data.stats.min_score));
  const stats = data.stats;
  const tabs: { value: RoleView; label: string }[] = useMemo(() => [{ value: "best", label: "Best matches" }, { value: "saved", label: "Saved" }, { value: "all", label: "All roles" }], []);

  return <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Your daily shortlist</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-foreground sm:text-5xl">Roles for you</h1>
        <p className="mt-3 text-base font-semibold text-foreground">Don't just find jobs. Close the gap.</p>
        <p className="mt-1 max-w-2xl text-sm leading-7 text-muted-foreground">Updated {updated} · {data.roles.filter((role) => role.status === "new").length} new roles</p>
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

    <section className="mt-8 rounded-xl border border-border bg-card p-2 shadow-card">
      <div className="grid grid-cols-3 gap-1" role="tablist" aria-label="Role views">
        {tabs.map((tab) => <button key={tab.value} type="button" onClick={() => setView(tab.value)} className={cn("h-10 rounded-lg text-sm font-bold text-muted-foreground transition", view === tab.value && "bg-primary text-primary-foreground")}>{tab.label}</button>)}
      </div>
    </section>

    <section className="mt-5 grid gap-4" aria-live="polite">
      {roles.length === 0 && <div className="rounded-xl border border-border bg-card p-10 text-center shadow-card"><h2 className="text-lg font-bold">No roles here yet</h2><p className="mt-2 text-sm text-muted-foreground">Try another view or check for new roles.</p></div>}
      {roles.map((role) => <RoleCard key={role.id} role={role} onStatus={(status) => statusMutation.mutate({ id: role.id, status })} />)}
      {isFetching && <p className="text-center text-sm font-medium text-muted-foreground">Updating roles…</p>}
    </section>
  </div>;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card"><div className={cn("h-1.5", accent)} /><div className="p-5"><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-extrabold text-foreground">{value}</p></div></div>;
}