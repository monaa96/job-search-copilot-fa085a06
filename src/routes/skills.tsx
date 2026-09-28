import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Lightbulb, RefreshCw } from "lucide-react";
import { buildSkills, type SkillTheme } from "@/lib/api";
import { requireSetup, showError, skillsQuery } from "@/lib/queries";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { JobProgress, PageHeader, useJob } from "@/components/progress-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/skills")({
  ssr: false,
  beforeLoad: requireSetup,
  loader: ({ context }) => context.queryClient.ensureQueryData(skillsQuery),
  head: () => pageHead("Skills to build — Job Search Copilot", "Your coaching plan: the skill gaps that show up across the roles you want, with a plan to close each one."),
  component: SkillsPage,
});

const priority = { high: { label: "High", badge: "bg-critical-soft text-critical", stripe: "border-l-critical" }, medium: { label: "Medium", badge: "bg-fit-orange-soft text-fit-orange", stripe: "border-l-fit-orange" }, low: { label: "Lower", badge: "bg-fit-gray-soft text-fit-gray", stripe: "border-l-fit-gray" } };

function SkillsPage() {
  const { data } = useSuspenseQuery(skillsQuery);
  const queryClient = useQueryClient();
  const job = useJob();
  const build = useMutation({ mutationFn: () => job.run((onLog) => buildSkills(onLog)), onSuccess: (next) => { queryClient.setQueryData(skillsQuery.queryKey, next); queryClient.invalidateQueries({ queryKey: ["me"] }); }, onError: showError });
  const ready = data.analyses_count >= data.min_analyses;
  const label = !data.report ? "Build my skills plan" : `Refresh (${data.new_since_report} new)`;

  return <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <PageHeader eyebrow="Your coaching plan" title="Skills to build" subtitle={data.report ? `Based on ${data.report.roles_count} roles you've analyzed · Updated ${new Date(data.report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "The skill gaps that show up again and again across the roles you want."} action={ready && <Button onClick={() => build.mutate()} disabled={build.isPending || (!!data.report && data.new_since_report === 0)}><RefreshCw className={cn("size-4", build.isPending && "animate-spin")} />{label}</Button>} />

    {!ready && <section className="mt-8 rounded-xl border border-border bg-card p-10 text-center shadow-card">
      <Lightbulb className="mx-auto size-8 text-primary" />
      <h2 className="mt-4 text-lg font-extrabold">Analyze at least {data.min_analyses} roles to see your patterns</h2>
      <p className="mt-2 text-sm text-muted-foreground">You have {data.analyses_count} so far. Build a plan for a few roles and your coaching plan will appear here.</p>
      <Button asChild className="mt-6"><Link to="/">Go to your roles</Link></Button>
    </section>}

    {build.isPending && <JobProgress className="mt-6" title="Building your skills plan…" hint="This takes about 90 seconds." logs={job.logs} />}

    {ready && data.report && <div className="mt-8 grid gap-5">
      <section className="rounded-xl border border-border bg-card p-6 shadow-card"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Summary</p><p className="mt-3 max-w-4xl leading-7 text-foreground/85">{data.report.summary}</p></section>
      {data.report.themes.map((theme) => <ThemeCard key={theme.skill} theme={theme} total={data.report?.roles_count ?? 0} />)}
    </div>}
    {ready && !data.report && !build.isPending && <section className="mt-8 rounded-xl border border-border bg-card p-10 text-center shadow-card"><h2 className="text-lg font-extrabold">You're ready for your first skills plan</h2><p className="mt-2 text-sm text-muted-foreground">We'll look across your {data.analyses_count} analyses for the gaps that matter most.</p></section>}
  </div>;
}

function ThemeCard({ theme, total }: { theme: SkillTheme; total: number }) {
  const p = priority[theme.priority];
  return <article className={cn("rounded-xl border border-l-4 border-border bg-card p-6 shadow-card", p.stripe)}>
    <div className="flex flex-wrap items-center gap-2"><h2 className="mr-2 text-xl font-extrabold">{theme.skill}</h2><span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", p.badge)}>{p.label} priority</span><span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">Needed in {theme.roles.length} of {total} roles</span></div>
    <p className="mt-3 max-w-4xl leading-7 text-foreground/85">{theme.why_it_matters}</p>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section><h3 className="text-sm font-extrabold">Your plan</h3><ol className="mt-3 grid gap-3">{theme.plan.map((step, i) => <li key={step.action} className="flex gap-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span><span className="leading-6">{step.action} <span className="text-muted-foreground">· {step.time}</span></span></li>)}</ol></section>
      <section className="grid content-start gap-4">
        <div><h3 className="text-sm font-extrabold">What you already have</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{theme.what_you_have}</p></div>
        <div className="rounded-lg border border-violet/20 bg-violet-soft p-4"><h3 className="text-sm font-extrabold text-violet">Proof project</h3><p className="mt-1 text-sm leading-6 text-foreground/85">{theme.proof_project}</p></div>
      </section>
    </div>
    <div className="mt-5 border-t border-border pt-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Roles that need it</p><ul className="mt-2 flex flex-wrap gap-2">{theme.roles.map((r) => <li key={`${r.company}-${r.title}`}>{r.role_id !== null ? <Link to="/roles/$id" params={{ id: String(r.role_id) }} className="inline-block rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary">{r.title} · {r.company}</Link> : <span className="inline-block rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">{r.title} · {r.company}</span>}</li>)}</ul></div>
  </article>;
}
