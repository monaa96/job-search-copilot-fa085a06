import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { clearToken, deleteAccount, deleteConnections, saveSearch, uploadConnections, uploadResume, type Me } from "@/lib/api";
import { meQuery, requireSetup, searchQuery, showError } from "@/lib/queries";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ResumeInput, SearchForm } from "@/components/forms-ui";
import { ConfirmDialog, PageHeader } from "@/components/progress-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  ssr: false,
  beforeLoad: requireSetup,
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(searchQuery)]),
  head: () => pageHead("Settings — Job Search Copilot", "Manage your search, resume, LinkedIn connections, usage, and data."),
  component: SettingsPage,
});

const usageLabels: [keyof Me["usage"], string][] = [["fit_checks", "Role scores"], ["analyses", "Full analyses"], ["discoveries", "Company searches"], ["messages", "Drafted messages"], ["coaching", "Skills reports"]];

function Card({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-border bg-card p-5 shadow-card", className)}><h2 className="text-lg font-extrabold">{title}</h2><div className="mt-4">{children}</div></section>;
}

function SettingsPage() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: search } = useSuspenseQuery(searchQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [replacing, setReplacing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmConnections, setConfirmConnections] = useState(false);
  const refreshMe = () => queryClient.invalidateQueries({ queryKey: ["me"] });
  const signOut = () => { clearToken(); queryClient.clear(); navigate({ to: "/welcome" }); };

  const saveMut = useMutation({ mutationFn: saveSearch, onError: showError, onSuccess: (p) => { queryClient.setQueryData(searchQuery.queryKey, p); queryClient.invalidateQueries({ queryKey: ["roles"] }); toast.success("Your search is saved"); } });
  const resumeMut = useMutation({ mutationFn: uploadResume, onError: showError, onSuccess: (next) => { queryClient.setQueryData(meQuery.queryKey, next); setReplacing(false); toast.success("Resume updated"); } });
  const connMut = useMutation({ mutationFn: uploadConnections, onError: showError, onSuccess: (r) => { refreshMe(); toast.success(`Imported ${r.count} connections`); } });
  const delConnMut = useMutation({ mutationFn: deleteConnections, onError: showError, onSuccess: () => { refreshMe(); setConfirmConnections(false); toast.success("Connections deleted"); } });
  const delAccMut = useMutation({ mutationFn: deleteAccount, onError: showError, onSuccess: signOut });

  return <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <PageHeader eyebrow="Your account" title="Settings" />
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card title="Your search" className="self-start"><SearchForm initial={search} busy={saveMut.isPending} submitLabel="Save search" onSubmit={(p) => saveMut.mutate(p)} /></Card>
      <div className="grid content-start gap-6">
        <Card title="Account">
          <p className="font-bold">{me.name}</p><p className="text-sm text-muted-foreground">{me.email}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={signOut}>Sign out</Button>
        </Card>
        <Card title="Resume">
          <p className="text-sm text-muted-foreground">{me.resume_kind ? `Current resume: ${me.resume_kind === "pdf" ? "PDF upload" : "pasted text"}` : "No resume yet."}</p>
          {replacing ? <div className="mt-4"><ResumeInput busy={resumeMut.isPending} submitLabel="Replace resume" onSubmit={(input) => resumeMut.mutate(input)} /></div> : <Button variant="secondary" size="sm" className="mt-4" onClick={() => setReplacing(true)}>Replace resume</Button>}
        </Card>
        <Card title="LinkedIn connections">
          <p className="text-2xl font-extrabold">{me.connections_count.toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">imported</span></p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Used only to show who you know at each company. Emails aren't stored, and the app never contacts anyone.</p>
          <div className="mt-4 rounded-lg bg-background p-3 text-sm leading-6 text-foreground/85"><p className="font-bold">How to export them</p><p>On LinkedIn, go to Settings → Data privacy → Get a copy of your data → Connections. LinkedIn emails you a file; upload the Connections.csv inside it here.</p></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <label className={cn("inline-flex h-8 cursor-pointer items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover", connMut.isPending && "pointer-events-none opacity-60")}>
              {connMut.isPending ? "Importing…" : me.connections_count ? "Upload a new file" : "Upload Connections.csv"}
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) connMut.mutate(f); e.target.value = ""; }} />
            </label>
            {me.connections_count > 0 && <Button variant="danger" size="sm" onClick={() => setConfirmConnections(true)}>Delete connections</Button>}
          </div>
        </Card>
        <Card title="Today's usage">
          <ul className="grid gap-3">{usageLabels.map(([key, label]) => { const u = me.usage[key]; const pct = u.limit ? Math.min(100, Math.round((u.used / u.limit) * 100)) : 0; return <li key={key}><div className="flex justify-between text-sm"><span className="font-semibold">{label}</span><span className="tabular-nums text-muted-foreground">{u.used} of {u.limit}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", pct >= 100 ? "bg-fit-orange" : "bg-primary")} style={{ width: `${pct}%` }} /></div></li>; })}</ul>
          <p className="mt-3 text-xs text-muted-foreground">Limits reset every day.</p>
        </Card>
        <section className="rounded-xl border border-destructive/30 bg-card p-5 shadow-card">
          <h2 className="text-lg font-extrabold text-destructive">Delete my data</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Permanently deletes your resume, preferences, tracked companies, jobs, analyses and connections. This can't be undone.</p>
          <Button variant="destructive" size="sm" className="mt-4" onClick={() => setConfirmDelete(true)}>Delete my data</Button>
        </section>
      </div>
    </div>
    <ConfirmDialog open={confirmDelete} title="Delete all your data?" body="Your resume, preferences, companies, jobs, analyses and connections will be permanently deleted and you'll be signed out. This can't be undone." confirmLabel="Delete everything" busy={delAccMut.isPending} onCancel={() => setConfirmDelete(false)} onConfirm={() => delAccMut.mutate()} />
    <ConfirmDialog open={confirmConnections} title="Delete your connections?" body="Your imported LinkedIn connections will be deleted. You can import them again at any time." confirmLabel="Delete connections" busy={delConnMut.isPending} onCancel={() => setConfirmConnections(false)} onConfirm={() => delConnMut.mutate()} />
  </div>;
}
