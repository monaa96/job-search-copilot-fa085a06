import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { findRoles, saveSearch, uploadResume, type SearchProfile } from "@/lib/api";
import { requireToken, searchQuery, showError } from "@/lib/queries";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { AddCompanyForm, ResumeInput, SearchForm } from "@/components/forms-ui";
import { JobProgress, useJob } from "@/components/progress-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/setup")({
  ssr: false,
  beforeLoad: requireToken,
  loader: ({ context }) => context.queryClient.ensureQueryData(searchQuery),
  head: () => pageHead("Set up your search — Job Search Copilot", "Add your resume and preferences so Job Search Copilot can find roles that fit you."),
  component: SetupPage,
});

const steps = ["Resume", "Preferences", "Find roles"];

function SetupPage() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const { data: existing } = useSuspenseQuery(searchQuery);
  const initial: SearchProfile = { ...existing, include_titles: existing.include_titles.length ? existing.include_titles : ["Product Manager"], min_score: existing.min_score || 60 };
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const job = useJob();

  const wrap = async (fn: () => Promise<unknown>, next: () => void) => { setBusy(true); try { await fn(); next(); } catch (e) { showError(e); } finally { setBusy(false); } };
  const finish = async () => { await queryClient.invalidateQueries(); navigate({ to: "/" }); };
  const find = () => wrap(() => job.run((onLog) => findRoles(onLog)), finish);

  return <div className="min-h-screen bg-background px-4 py-8 sm:py-14">
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-center gap-2.5"><span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span><span className="text-sm font-bold">Job Search Copilot</span></div>
      <ol className="mt-8 flex items-center justify-center gap-2 sm:gap-3" aria-label="Setup progress">
        {steps.map((label, i) => <li key={label} className="flex items-center gap-2 sm:gap-3">
          <span className={cn("grid size-7 place-items-center rounded-full border text-xs font-bold", i < step ? "border-primary bg-primary text-primary-foreground" : i === step ? "border-primary text-primary" : "border-border text-muted-foreground")}>{i < step ? <Check className="size-3.5" /> : i + 1}</span>
          <span className={cn("hidden text-sm font-semibold sm:inline", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
          {i < steps.length - 1 && <span className="h-px w-6 bg-border sm:w-10" />}
        </li>)}
      </ol>
      <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
        {step === 0 && <>
          <h1 className="text-2xl font-extrabold">Start with your resume</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Every role is scored against it, so the more complete it is, the better your matches.</p>
          <div className="mt-6"><ResumeInput busy={busy} submitLabel="Continue" onSubmit={(input) => wrap(() => uploadResume(input), () => setStep(1))} /></div>
        </>}
        {step === 1 && <>
          <h1 className="text-2xl font-extrabold">What are you looking for?</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">You can change any of this later in your Profile.</p>
          <div className="mt-6"><SearchForm initial={initial} busy={busy} submitLabel="Continue" onSubmit={(profile) => wrap(() => saveSearch(profile), () => setStep(2))} /></div>
        </>}
        {step === 2 && <>
          <h1 className="text-2xl font-extrabold">Let's find your roles</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">We'll pick companies that fit your background, check their job boards, and score every relevant opening against your resume. It takes 3 to 5 minutes the first time.</p>
          {job.running ? <JobProgress className="mt-6" title="Finding roles for you…" hint="This is working, even when it looks quiet. Feel free to leave this tab open and come back in a few minutes." logs={job.logs} /> : <>
            <Button size="lg" className="mt-6 w-full sm:w-auto" onClick={find} disabled={busy}>Find roles for me</Button>
            <div className="mt-6 border-t border-border pt-5">
              {!manual ? <button type="button" className="text-sm font-bold text-primary hover:underline" onClick={() => setManual(true)}>I'll add companies myself</button> : <>
                <h2 className="font-extrabold">Add companies</h2>
                <p className="mt-1 text-sm text-muted-foreground">Add the companies you want watched. We'll look for their job board.</p>
                <div className="mt-4"><AddCompanyForm onAdded={(c) => setAdded((a) => [...a, c.name])} /></div>
                {added.length > 0 && <p className="mt-3 text-sm text-muted-foreground">Watching: <span className="font-semibold text-foreground">{added.join(", ")}</span></p>}
                {added.length > 0 && <Button variant="secondary" className="mt-4" onClick={find}>Scan these companies</Button>}
              </>}
            </div>
          </>}
        </>}
      </section>
      {step > 0 && !job.running && <button type="button" onClick={() => setStep(step - 1)} className="mt-4 text-sm font-semibold text-muted-foreground hover:text-foreground">← Back</button>}
    </div>
  </div>;
}
