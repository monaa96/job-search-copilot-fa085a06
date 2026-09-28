import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpenCheck, BriefcaseBusiness, Check, Clipboard, FileText, MessageSquare, PenLine, Send, Target, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CompanyLogo, FitBadge } from "@/components/job-ui";
import { addTitleToSearch, buildPlan, draftMessage, getRole, setPlanStep, setRoleStatus, type Analysis, type FitColor, type PlanStep, type RoleDetail } from "@/lib/api";
import { cn } from "@/lib/utils";

const roleQuery = (id: number) => queryOptions({ queryKey: ["role", id], queryFn: () => getRole(id) });

export const Route = createFileRoute("/roles/$id")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(roleQuery(Number(params.id))),
  head: ({ loaderData }) => {
    const role = loaderData?.role;
    const title = role ? `${role.title} at ${role.company} — Job Search Copilot` : "Role plan — Job Search Copilot";
    const description = role ? `See your fit, gaps, referrals, and action plan for ${role.title} at ${role.company}.` : "See your fit, gaps, referrals, and action plan for a target role.";
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: RolePage,
});

function RolePage() {
  const { id } = Route.useParams();
  const roleId = Number(id);
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(roleQuery(roleId));
  const [tab, setTab] = useState<"adjacent" | "resume" | "analysis">("adjacent");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState<number | null>(null);
  const [planProgress, setPlanProgress] = useState(0);

  const saveMutation = useMutation({ mutationFn: () => setRoleStatus(roleId, data.role.status === "saved" ? "new" : "saved"), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["role", roleId] }); queryClient.invalidateQueries({ queryKey: ["roles"] }); } });
  const buildMutation = useMutation({ mutationFn: () => buildPlan(roleId), onMutate: () => setPlanProgress(1), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role", roleId] }) });
  const stepMutation = useMutation({ mutationFn: ({ key, done }: { key: string; done: boolean }) => setPlanStep(roleId, key, done), onMutate: async ({ key, done }) => {
    await queryClient.cancelQueries({ queryKey: ["role", roleId] });
    const previous = queryClient.getQueryData<RoleDetail>(["role", roleId]);
    if (previous) queryClient.setQueryData<RoleDetail>(["role", roleId], { ...previous, plan: previous.plan.map((step) => step.key === key ? { ...step, done } : step) });
    return { previous };
  }, onError: (_error, _variables, context) => { if (context?.previous) queryClient.setQueryData(["role", roleId], context.previous); }, onSettled: () => queryClient.invalidateQueries({ queryKey: ["role", roleId] }) });
  const draftMutation = useMutation({ mutationFn: (person_index: number) => draftMessage(roleId, person_index), onSuccess: (result, personIndex) => setDrafts((current) => ({ ...current, [personIndex]: result.message })) });
  const addTitleMutation = useMutation({ mutationFn: (title: string) => addTitleToSearch(roleId, title) });

  const doneCount = data.plan.filter((step) => step.done).length;
  const progressPercent = data.plan.length ? Math.round((doneCount / data.plan.length) * 100) : 0;
  const buildStatus = useBuildProgress(buildMutation.isPending, planProgress, setPlanProgress);

  return <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />All roles</Link>
    <section className={cn("mt-5 rounded-xl border border-l-4 border-border bg-card p-5 shadow-card", stripeFor(data.role.fit_color))}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4"><CompanyLogo company={data.role.company} logo_url={data.role.logo_url} size="lg" /><div><FitBadge score={data.role.fit_score} label={data.role.fit_label} color={data.role.fit_color} /><h1 className="mt-3 text-2xl font-extrabold tracking-normal text-foreground sm:text-4xl">{data.role.title}</h1><p className="mt-2 text-sm text-muted-foreground">{data.role.company} · {data.role.location}{data.role.posted_at ? ` · Posted ${new Date(`${data.role.posted_at}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</p></div></div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><a href={data.role.url} target="_blank" rel="noreferrer">View posting</a></Button><Button variant={data.role.status === "saved" ? "secondary" : "primary"} onClick={() => saveMutation.mutate()}>{data.role.status === "saved" ? "Saved" : "Save"}</Button></div>
      </div>
    </section>

    {!data.analysis && <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
      <FitBadge score={data.role.fit_score} label={data.role.fit_label} color={data.role.fit_color} />
      <h2 className="mt-4 text-2xl font-extrabold">Close the gap for this role</h2>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{data.role.fit_reason} Your plan will turn that into resume edits, skills to build, referral moves, interview stories, and adjacent roles.</p>
      {buildMutation.isPending ? <div className="mt-6 rounded-xl bg-muted p-5"><div className="h-2 overflow-hidden rounded-full bg-primary-soft"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${buildStatus.percent}%` }} /></div><p className="mt-4 text-sm font-bold text-foreground">{buildStatus.label}</p><p className="mt-1 text-sm text-muted-foreground">This can take about 40 seconds when connected to the live service.</p></div> : <Button className="mt-6" onClick={() => buildMutation.mutate()}>Build my plan</Button>}
    </section>}

    {data.analysis && <>
      <Recommendation detail={data} />
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Your plan to land it</p><h2 className="mt-2 text-2xl font-extrabold">{doneCount} of {data.plan.length} done</h2></div><span className="text-sm font-semibold text-muted-foreground">{progressPercent}% complete</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} /></div>
          <div className="mt-5 grid gap-3">{data.plan.map((step) => <PlanStepCard key={step.key} step={step} onToggle={() => stepMutation.mutate({ key: step.key, done: !step.done })} />)}</div>
        </div>
        <aside className="grid content-start gap-5">
          <AtAGlance analysis={data.analysis} />
          <PeopleCard detail={data} drafts={drafts} copied={copied} onDraft={(index) => draftMutation.mutate(index)} draftingIndex={draftMutation.variables ?? null} onCopy={async (index, message) => { await navigator.clipboard.writeText(message); setCopied(index); }} />
        </aside>
      </section>
      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Role details tabs">{[{ id: "adjacent", label: "Adjacent roles" }, { id: "resume", label: "Resume suggestions" }, { id: "analysis", label: "Full analysis" }].map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id as typeof tab)} className={cn("h-9 rounded-lg px-3 text-sm font-bold text-muted-foreground", tab === item.id && "bg-primary text-primary-foreground")}>{item.label}</button>)}</div>
        {tab === "adjacent" && <AdjacentRoles detail={data} onAdd={(title) => addTitleMutation.mutate(title)} addedTitle={addTitleMutation.variables} />}
        {tab === "resume" && <ResumeSuggestions analysis={data.analysis} />}
        {tab === "analysis" && <FullAnalysis analysis={data.analysis} />}
      </section>
    </>}
  </div>;
}

function useBuildProgress(active: boolean, progress: number, setProgress: (value: number) => void) {
  const steps = useMemo(() => ["Reading the job description…", "Comparing to your resume…", "Finding referral angles…", "Writing your plan…"], []);
  if (!active) return { percent: 0, label: steps[0] };
  const next = Math.min(steps.length - 1, progress);
  setTimeout(() => setProgress(Math.min(steps.length - 1, progress + 1)), 1200);
  return { percent: 20 + next * 22, label: steps[next] };
}

function Recommendation({ detail }: { detail: RoleDetail }) {
  if (!detail.recommendation || !detail.analysis) return null;
  return <section className={cn("mt-6 rounded-xl border border-l-4 border-border bg-card p-5 shadow-card", stripeFor(detail.recommendation.color))}><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Our recommendation</p><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-extrabold">{detail.recommendation.headline}</h2><p className="mt-2 max-w-3xl leading-7 text-foreground/80">{detail.recommendation.detail}</p><p className="mt-3 text-sm text-muted-foreground">{detail.analysis.verdict}</p></div><FitBadge score={detail.role.fit_score} label={detail.role.fit_label} color={detail.role.fit_color} /></div></section>;
}

function PlanStepCard({ step, onToggle }: { step: PlanStep; onToggle: () => void }) {
  const Icon = ({ resume: FileText, skill: BookOpenCheck, referral: UserRoundCheck, story: MessageSquare, apply: Send })[step.kind];
  return <article className="flex gap-3 rounded-xl border border-border bg-background/60 p-4"><button type="button" onClick={onToggle} className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-border bg-card", step.done && "border-primary bg-primary text-primary-foreground")} aria-label={step.done ? `Mark ${step.title} incomplete` : `Mark ${step.title} done`}>{step.done && <Check className="size-4" />}</button><Icon className="mt-0.5 size-5 shrink-0 text-primary" /><div><h3 className="font-bold text-foreground">{step.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{step.detail}</p></div></article>;
}

function AtAGlance({ analysis }: { analysis: Analysis }) {
  return <section className="rounded-xl border border-border bg-card p-5 shadow-card"><h2 className="text-lg font-extrabold">At a glance</h2><div className="mt-4"><h3 className="text-sm font-bold">Strengths</h3><div className="mt-2 grid gap-2">{analysis.strong_matches.slice(0, 3).map((item) => <p key={item.skill} className="flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-fit-green" />{item.skill}</p>)}</div></div><div className="mt-5"><h3 className="text-sm font-bold">Gaps</h3><div className="mt-2 grid gap-2">{analysis.skill_gaps.map((gap) => <div key={gap.skill} className="flex items-start justify-between gap-3 text-sm"><span className="text-muted-foreground">{gap.skill}</span><ImportanceBadge importance={gap.importance} /></div>)}</div></div></section>;
}

function PeopleCard({ detail, drafts, copied, onDraft, draftingIndex, onCopy }: { detail: RoleDetail; drafts: Record<number, string>; copied: number | null; onDraft: (index: number) => void; draftingIndex: number | null; onCopy: (index: number, message: string) => void }) {
  return <section className="rounded-xl border border-border bg-card p-5 shadow-card"><h2 className="text-lg font-extrabold">People you know at {detail.role.company}</h2>{!detail.has_connections ? <p className="mt-3 text-sm text-muted-foreground">Import LinkedIn connections in Settings to find warm paths into this company.</p> : detail.people.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">None of your connections work there yet.</p> : <div className="mt-4 grid gap-4">{detail.people.map((person) => <article key={person.index} className="rounded-xl border border-border bg-background/60 p-4"><a href={person.url} target="_blank" rel="noreferrer" className="font-bold text-foreground hover:text-primary">{person.name}</a><p className="mt-1 text-sm text-muted-foreground">{person.position}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{person.why}</p><Button className="mt-3" variant="secondary" size="sm" onClick={() => onDraft(person.index)} disabled={draftingIndex === person.index}><PenLine className="size-3.5" />{draftingIndex === person.index ? "Drafting…" : "Draft a message"}</Button>{drafts[person.index] && <div className="mt-3 rounded-lg border border-border bg-card p-3"><p className="text-sm leading-6 text-foreground/85">{drafts[person.index]}</p><Button className="mt-3" variant="ghost" size="sm" onClick={() => onCopy(person.index, drafts[person.index])}><Clipboard className="size-3.5" />{copied === person.index ? "Copied" : "Copy"}</Button></div>}</article>)}</div>}</section>;
}

function AdjacentRoles({ detail, onAdd, addedTitle }: { detail: RoleDetail; onAdd: (title: string) => void; addedTitle?: string }) {
  return <div className="mt-5 grid gap-4">{detail.adjacent.map((item) => <article key={item.title} className="rounded-xl border border-border bg-background/60 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-extrabold">{item.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.why}</p></div>{item.in_search ? <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">In your search</span> : <Button variant="secondary" size="sm" onClick={() => onAdd(item.title)}>{addedTitle === item.title ? "Added" : "Add to my search"}</Button>}</div><div className="mt-4 grid gap-2">{item.openings.map((opening) => <div key={`${opening.company}-${opening.title}`} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"><CompanyLogo company={opening.company} logo_url={opening.logo_url} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{opening.title}</p><p className="truncate text-xs text-muted-foreground">{opening.company} · {opening.location}</p></div><a href={opening.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:text-primary-hover">View</a></div>)}</div></article>)}</div>;
}

function ResumeSuggestions({ analysis }: { analysis: Analysis }) { return <div className="mt-5 grid gap-4">{analysis.resume_edits.map((edit) => <article key={edit.suggested} className="rounded-xl border border-border bg-background/60 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Current</p><p className="mt-2 text-sm leading-6 text-muted-foreground line-through decoration-border">{edit.original}</p><p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-primary">Suggested</p><p className="mt-2 font-bold leading-7 text-foreground">{edit.suggested}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{edit.why}</p></article>)}</div>; }

function FullAnalysis({ analysis }: { analysis: Analysis }) { return <div className="mt-5 grid gap-5 lg:grid-cols-2"><AnalysisBlock title="Strengths with evidence" items={analysis.strong_matches.map((item) => `${item.skill}: ${item.evidence}`)} /><AnalysisBlock title="Skill gaps" items={analysis.skill_gaps.map((item) => `${item.skill}: ${item.why_it_matters}`)} /><AnalysisBlock title="Why you're a fit" items={analysis.why_youre_a_fit} /><AnalysisBlock title="What to emphasize" items={analysis.what_to_emphasize} /><AnalysisBlock title="Skills to build" items={analysis.skills_to_build.map((item) => `${item.skill}: ${item.how}`)} /></div>; }
function AnalysisBlock({ title, items }: { title: string; items: string[] }) { return <section className="rounded-xl border border-border bg-background/60 p-4"><h3 className="font-extrabold">{title}</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">{items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></section>; }
function ImportanceBadge({ importance }: { importance: Analysis["skill_gaps"][number]["importance"] }) { const styles = { critical: "bg-critical-soft text-critical", important: "bg-fit-orange-soft text-fit-orange", "nice-to-have": "bg-fit-gray-soft text-fit-gray" }; const label = importance === "nice-to-have" ? "Nice to have" : importance.charAt(0).toUpperCase() + importance.slice(1); return <span className={cn("rounded-full px-2 py-1 text-xs font-bold", styles[importance])}>{label}</span>; }
function stripeFor(color: FitColor) { return { green: "border-l-fit-green", blue: "border-l-fit-blue", orange: "border-l-fit-orange", gray: "border-l-fit-gray" }[color]; }