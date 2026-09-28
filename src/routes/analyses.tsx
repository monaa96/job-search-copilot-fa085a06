import { formatShortDate } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteAnalysis, type SavedAnalysis } from "@/lib/api";
import { analysesQuery, requireSetup, showError } from "@/lib/queries";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { FitBadge } from "@/components/job-ui";
import { AnalysisView, fitFor } from "@/components/analysis-ui";
import { ConfirmDialog, PageHeader } from "@/components/progress-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyses")({
  ssr: false,
  beforeLoad: requireSetup,
  loader: ({ context }) => context.queryClient.ensureQueryData(analysesQuery),
  head: () => pageHead("Saved analyses — Job Search Copilot", "Every fit analysis you've run, in one place."),
  component: AnalysesPage,
});

function AnalysesPage() {
  const { data } = useSuspenseQuery(analysesQuery);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<number | null>(null);
  const [pending, setPending] = useState<SavedAnalysis | null>(null);
  const remove = useMutation({ mutationFn: (id: number) => deleteAnalysis(id), onError: showError, onSuccess: (_r, id) => { queryClient.setQueryData<SavedAnalysis[]>(analysesQuery.queryKey, (list) => list?.filter((a) => a.id !== id)); queryClient.invalidateQueries({ queryKey: ["skills"] }); setPending(null); } });

  return <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <PageHeader eyebrow="Your history" title="Analyses" subtitle="Every fit analysis you've run, from role plans and resume matches." />
    {data.length === 0 ? <section className="mt-8 rounded-xl border border-border bg-card p-10 text-center shadow-card"><h2 className="text-lg font-extrabold">No analyses yet</h2><p className="mt-2 text-sm text-muted-foreground">Paste a job description to run your first one.</p><Button asChild className="mt-6"><Link to="/match">Try Resume match</Link></Button></section>
      : <div className="mt-8 grid gap-3">{data.map((item) => {
        const fit = fitFor(item.match_score);
        const expanded = open === item.id;
        return <article key={item.id} className="rounded-xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-3 p-4 sm:p-5">
            <button type="button" onClick={() => setOpen(expanded ? null : item.id)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition", expanded && "rotate-180")} />
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{item.title}</p><p className="truncate text-sm text-muted-foreground">{item.company} · {formatShortDate(item.created_at, true)}</p></div>
              <span className="hidden sm:block"><FitBadge score={item.match_score} label={fit.label} color={fit.color} /></span>
            </button>
            <Button variant="ghost" size="icon" aria-label={`Delete analysis for ${item.title}`} onClick={() => setPending(item)}><Trash2 className="size-4" /></Button>
          </div>
          {expanded && <div className="border-t border-border bg-background/50 p-4 sm:p-5"><AnalysisView analysis={item.analysis} /></div>}
        </article>;
      })}</div>}
    <ConfirmDialog open={!!pending} title="Delete this analysis?" body={pending ? `The analysis for ${pending.title} at ${pending.company} will be permanently deleted.` : ""} confirmLabel="Delete" busy={remove.isPending} onCancel={() => setPending(null)} onConfirm={() => pending && remove.mutate(pending.id)} />
  </div>;
}
