import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { matchJob } from "@/lib/api";
import { requireSetup, showError } from "@/lib/queries";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { AnalysisView } from "@/components/analysis-ui";
import { textareaClass } from "@/components/forms-ui";
import { JobProgress, PageHeader, useJob } from "@/components/progress-ui";

export const Route = createFileRoute("/match")({
  ssr: false,
  beforeLoad: requireSetup,
  head: () => pageHead("Resume match — Job Search Copilot", "Paste any job description to see your fit, gaps, and exactly how to tailor your resume."),
  component: MatchPage,
});

function MatchPage() {
  const [text, setText] = useState("");
  const job = useJob();
  const queryClient = useQueryClient();
  const analyze = useMutation({ mutationFn: () => job.run((onLog) => matchJob(text, onLog)), onError: showError, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["analyses"] }); queryClient.invalidateQueries({ queryKey: ["skills"] }); queryClient.invalidateQueries({ queryKey: ["me"] }); } });
  return <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <PageHeader eyebrow="Tailor your application" title="Resume match" subtitle="Paste any job description to see how you stack up and what to change on your resume before you apply." />
    <section className="mt-8 rounded-xl border border-border bg-card p-5 shadow-card">
      <label htmlFor="jd" className="text-sm font-bold">Job description</label>
      <textarea id="jd" rows={12} className={`${textareaClass} mt-2`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the full job description here, including responsibilities and requirements…" />
      <div className="mt-4 flex flex-wrap items-center gap-3"><Button onClick={() => analyze.mutate()} disabled={analyze.isPending || text.trim().length < 50}>{analyze.isPending ? "Analyzing…" : "Analyze"}</Button>{text.trim().length > 0 && text.trim().length < 50 && <span className="text-xs text-muted-foreground">Paste a bit more of the description to analyze it.</span>}</div>
    </section>
    {analyze.isPending && <JobProgress className="mt-6" title="Analyzing your fit…" hint="This takes about 40 seconds." logs={job.logs} />}
    {analyze.data && !analyze.isPending && <div className="mt-8"><AnalysisView analysis={analyze.data} /></div>}
  </div>;
}
