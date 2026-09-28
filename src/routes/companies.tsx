import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import { discoverCompanies, removeCompany, setCompanyStatus, type CompaniesResponse, type Company } from "@/lib/api";
import { companiesQuery, requireSetup, showError } from "@/lib/queries";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/job-ui";
import { AddCompanyForm } from "@/components/forms-ui";
import { JobProgress, PageHeader, useJob } from "@/components/progress-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/companies")({
  ssr: false,
  beforeLoad: requireSetup,
  loader: ({ context }) => context.queryClient.ensureQueryData(companiesQuery),
  head: () => pageHead("Companies — Job Search Copilot", "The companies whose job boards are checked for you every morning."),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { data } = useSuspenseQuery(companiesQuery);
  const queryClient = useQueryClient();
  const job = useJob();
  const [showUntrackable, setShowUntrackable] = useState(false);
  const apply = (next: CompaniesResponse) => { queryClient.setQueryData(companiesQuery.queryKey, next); queryClient.invalidateQueries({ queryKey: ["roles"] }); queryClient.invalidateQueries({ queryKey: ["me"] }); };
  const discover = useMutation({ mutationFn: () => job.run((onLog) => discoverCompanies(onLog)), onSuccess: apply, onError: showError });
  const status = useMutation({ mutationFn: ({ id, s }: { id: number; s: "tracking" | "rejected" }) => setCompanyStatus(id, s), onSuccess: apply, onError: showError });
  const remove = useMutation({ mutationFn: (id: number) => removeCompany(id), onSuccess: apply, onError: showError });
  const addAll = useMutation({ mutationFn: async () => { let last = data; for (const c of data.suggested) last = await setCompanyStatus(c.id, "tracking"); return last; }, onSuccess: apply, onError: showError });

  return <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <PageHeader eyebrow="Your watchlist" title="Companies" subtitle="The companies whose job boards are checked for you every morning" action={<Button onClick={() => discover.mutate()} disabled={discover.isPending}><Search className="size-4" />Find more</Button>} />
    {discover.isPending && <JobProgress className="mt-6" title="Finding companies that fit you…" hint="This takes about 2 minutes. New suggestions will appear below when it's done." logs={job.logs} />}

    {data.suggested.length > 0 && <section className="mt-8">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold">Suggested for you ({data.suggested.length})</h2><Button variant="secondary" size="sm" onClick={() => addAll.mutate()} disabled={addAll.isPending}>{addAll.isPending ? "Adding…" : "Add all"}</Button></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.suggested.map((c) => <CompanyTile key={c.id} company={c} actions={<><Button size="sm" onClick={() => status.mutate({ id: c.id, s: "tracking" })}>Add</Button><Button size="sm" variant="ghost" onClick={() => status.mutate({ id: c.id, s: "rejected" })}>Skip</Button></>} />)}</div>
    </section>}

    <section className="mt-10">
      <h2 className="text-lg font-extrabold">Watching ({data.watching.length})</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.watching.map((c) => <CompanyTile key={c.id} company={c} actions={<Button size="sm" variant="ghost" onClick={() => remove.mutate(c.id)}>Remove</Button>} />)}
        <article className="rounded-xl border border-dashed border-border bg-card p-5 shadow-card">
          <h3 className="font-extrabold">Add a company</h3>
          <p className="mt-1 text-sm text-muted-foreground">We'll find its job board and start checking it every morning.</p>
          <div className="mt-4"><AddCompanyForm onAdded={() => { queryClient.invalidateQueries({ queryKey: ["companies"] }); queryClient.invalidateQueries({ queryKey: ["me"] }); }} /></div>
        </article>
      </div>
    </section>

    {data.untrackable.length > 0 && <section className="mt-10 rounded-xl border border-border bg-card shadow-card">
      <button type="button" onClick={() => setShowUntrackable((v) => !v)} aria-expanded={showUntrackable} className="flex w-full items-center justify-between px-5 py-4 text-left font-extrabold">Can't be tracked automatically ({data.untrackable.length})<ChevronDown className={cn("size-4 transition", showUntrackable && "rotate-180")} /></button>
      {showUntrackable && <ul className="grid gap-3 border-t border-border p-5">{data.untrackable.map((c) => <li key={c.id} className="flex gap-3"><CompanyLogo company={c.name} logo_url={c.logo_url} size="sm" /><div><p className="font-bold">{c.name}</p><p className="text-sm leading-6 text-muted-foreground">{c.why_it_fits}</p></div></li>)}</ul>}
    </section>}
  </div>;
}

function CompanyTile({ company: c, actions }: { company: Company; actions: React.ReactNode }) {
  return <article className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
    <div className="flex items-start gap-3"><CompanyLogo company={c.name} logo_url={c.logo_url} /><div className="min-w-0"><h3 className="truncate font-extrabold">{c.name}</h3>{c.board_url ? <a href={c.board_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">{c.board_name ?? "Job board"}</a> : <span className="text-xs text-muted-foreground">{c.board_name ?? "No job board"}</span>}</div></div>
    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{c.why_it_fits}</p>
    <div className="mt-3 flex flex-wrap gap-2">{c.open_roles > 0 && c.company_id ? <Link to="/" search={{ company: c.company_id, name: c.name }} className="group inline-flex items-center gap-1 rounded-full bg-fit-blue-soft px-2.5 py-1 text-xs font-bold text-fit-blue transition hover:bg-fit-blue hover:text-primary-foreground">{c.open_roles} {c.open_roles === 1 ? "role" : "roles"} for you<ArrowRight className="size-3 transition group-hover:translate-x-0.5" /></Link> : <span className="rounded-full bg-fit-gray-soft px-2.5 py-1 text-xs font-bold text-fit-gray">{c.open_roles} {c.open_roles === 1 ? "role" : "roles"} for you</span>}{c.known_people > 0 && <span className="rounded-full bg-violet-soft px-2.5 py-1 text-xs font-bold text-violet">You know {c.known_people}</span>}</div>
    <div className="mt-4 flex gap-2 border-t border-border pt-4">{actions}</div>
  </article>;
}
