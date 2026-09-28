import { Check } from "lucide-react";
import type { Analysis, FitColor } from "@/lib/api";
import { FitBadge } from "@/components/job-ui";
import { cn } from "@/lib/utils";

export function fitFor(score: number): { color: FitColor; label: string } {
  if (score >= 85) return { color: "green", label: "Strong fit" };
  if (score >= 70) return { color: "blue", label: "Good fit" };
  if (score >= 50) return { color: "orange", label: "Stretch" };
  return { color: "gray", label: "Long shot" };
}

export function stripeFor(color: FitColor) { return { green: "border-l-fit-green", blue: "border-l-fit-blue", orange: "border-l-fit-orange", gray: "border-l-fit-gray" }[color]; }

export function ImportanceBadge({ importance }: { importance: Analysis["skill_gaps"][number]["importance"] }) {
  const styles = { critical: "bg-critical-soft text-critical", important: "bg-fit-orange-soft text-fit-orange", "nice-to-have": "bg-fit-gray-soft text-fit-gray" };
  const label = importance === "nice-to-have" ? "Nice to have" : importance.charAt(0).toUpperCase() + importance.slice(1);
  return <span className={cn("shrink-0 rounded-full px-2 py-1 text-xs font-bold", styles[importance])}>{label}</span>;
}

export function AtAGlance({ analysis }: { analysis: Analysis }) {
  return <section className="rounded-xl border border-border bg-card p-5 shadow-card"><h2 className="text-lg font-extrabold">At a glance</h2><div className="mt-4"><h3 className="text-sm font-bold">Strengths</h3><div className="mt-2 grid gap-2">{analysis.strong_matches.slice(0, 4).map((item) => <p key={item.skill} className="flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-fit-green" />{item.skill}</p>)}</div></div><div className="mt-5"><h3 className="text-sm font-bold">Gaps</h3><div className="mt-2 grid gap-2">{analysis.skill_gaps.map((gap) => <div key={gap.skill} className="flex items-start justify-between gap-3 text-sm"><span className="text-muted-foreground">{gap.skill}</span><ImportanceBadge importance={gap.importance} /></div>)}</div></div></section>;
}

export function ResumeSuggestions({ analysis }: { analysis: Analysis }) {
  return <div className="grid gap-4">{analysis.resume_edits.map((edit) => <article key={edit.suggested} className="rounded-xl border border-border bg-background/60 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Current</p><p className="mt-2 text-sm leading-6 text-muted-foreground line-through decoration-border">{edit.original}</p><p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-primary">Suggested</p><p className="mt-2 font-bold leading-7 text-foreground">{edit.suggested}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{edit.why}</p></article>)}</div>;
}

export function FullAnalysis({ analysis }: { analysis: Analysis }) {
  return <div className="grid gap-5 lg:grid-cols-2">
    <section className="rounded-xl border border-border bg-background/60 p-4"><h3 className="font-extrabold">Strengths with evidence</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{analysis.strong_matches.map((item) => <li key={item.skill} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-fit-green" /><span><span className="font-bold text-foreground">{item.skill}.</span> <span className="text-muted-foreground">{item.evidence}</span></span></li>)}</ul></section>
    <section className="rounded-xl border border-border bg-background/60 p-4"><h3 className="font-extrabold">Skill gaps</h3><ul className="mt-3 grid gap-3 text-sm leading-6">{analysis.skill_gaps.map((item) => <li key={item.skill}><div className="flex items-start justify-between gap-3"><span className="font-bold text-foreground">{item.skill}</span><ImportanceBadge importance={item.importance} /></div><p className="mt-1 text-muted-foreground">{item.why_it_matters}</p></li>)}</ul></section>
    <AnalysisBlock title="Why you're a fit" items={analysis.why_youre_a_fit} />
    <AnalysisBlock title="What to emphasize" items={analysis.what_to_emphasize} />
    <section className="rounded-xl border border-border bg-background/60 p-4 lg:col-span-2"><h3 className="font-extrabold">Skills to build</h3><ul className="mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-2">{analysis.skills_to_build.map((item) => <li key={item.skill}><span className="font-bold text-foreground">{item.skill}</span><p className="text-muted-foreground">{item.how}</p></li>)}</ul></section>
  </div>;
}

function AnalysisBlock({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-xl border border-border bg-background/60 p-4"><h3 className="font-extrabold">{title}</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">{items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}</ul></section>;
}

/** Complete stand-alone analysis view used by Resume match and Analyses. */
export function AnalysisView({ analysis }: { analysis: Analysis }) {
  const fit = fitFor(analysis.match_score);
  return <div className="grid gap-6">
    <section className={cn("rounded-xl border border-l-4 border-border bg-card p-5 shadow-card", stripeFor(fit.color))}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Verdict</p><h2 className="mt-2 text-xl font-extrabold sm:text-2xl">{analysis.job_title}</h2><p className="text-sm text-muted-foreground">{analysis.company}</p></div><FitBadge score={analysis.match_score} label={fit.label} color={fit.color} /></div>
      <p className="mt-4 max-w-3xl leading-7 text-foreground/85">{analysis.verdict}</p>
    </section>
    <AtAGlance analysis={analysis} />
    <FullAnalysis analysis={analysis} />
    <section className="rounded-xl border border-border bg-card p-5 shadow-card"><h2 className="text-lg font-extrabold">Resume suggestions</h2><div className="mt-4"><ResumeSuggestions analysis={analysis} /></div></section>
    {analysis.adjacent_roles.length > 0 && <section className="rounded-xl border border-border bg-card p-5 shadow-card"><h2 className="text-lg font-extrabold">Adjacent role types</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{analysis.adjacent_roles.map((item) => <article key={item.title} className="rounded-xl border border-border bg-background/60 p-4"><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.why}</p></article>)}</div></section>}
  </div>;
}
