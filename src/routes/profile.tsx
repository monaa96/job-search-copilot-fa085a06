import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { clearToken, deleteAccount, saveSearch, uploadResume, type Me } from "@/lib/api";
import { meQuery, requireSetup, searchQuery, showError } from "@/lib/queries";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ResumeInput, SearchForm } from "@/components/forms-ui";
import { ConfirmDialog, PageHeader } from "@/components/progress-ui";
import { ConnectionsCard } from "@/components/connections-ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  ssr: false,
  beforeLoad: requireSetup,
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(meQuery), context.queryClient.ensureQueryData(searchQuery)]),
  head: () => pageHead("Your profile — Job Search Copilot", "Update your resume, import LinkedIn connections, and manage your search, usage, and data."),
  component: ProfilePage,
});

const usageLabels: [keyof Me["usage"], string][] = [["fit_checks", "Role scores"], ["analyses", "Full analyses"], ["discoveries", "Company searches"], ["messages", "Drafted messages"], ["coaching", "Skills reports"]];

function Card({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-border bg-card p-5 shadow-card", className)}><h2 className="text-lg font-extrabold">{title}</h2><div className="mt-4">{children}</div></section>;
}

const resumeStatus = (kind: Me["resume_kind"]) => kind === "pdf" ? "PDF on file" : kind === "text" ? "Text resume on file" : "No resume yet";

function ProfilePage() {
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: search } = useSuspenseQuery(searchQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resumeKey, setResumeKey] = useState(0);
  const signOut = () => { clearToken(); queryClient.clear(); navigate({ to: "/welcome" }); };

  const saveMut = useMutation({ mutationFn: saveSearch, onError: showError, onSuccess: (p) => { queryClient.setQueryData(searchQuery.queryKey, p); queryClient.invalidateQueries({ queryKey: ["roles"] }); toast.success("Your search is saved"); } });
  const resumeMut = useMutation({ mutationFn: uploadResume, onError: showError, onSuccess: (next) => { queryClient.setQueryData(meQuery.queryKey, next); setResumeKey((k) => k + 1); toast.success("Resume updated"); } });
  const delAccMut = useMutation({ mutationFn: deleteAccount, onError: showError, onSuccess: signOut });

  return <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <PageHeader eyebrow="Your profile" title="Profile" />
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><FileText className="size-5" /></span>
          <div><h2 className="text-lg font-extrabold">Your resume</h2><p className={cn("text-sm font-semibold", me.resume_kind ? "text-fit-green" : "text-muted-foreground")}>{resumeStatus(me.resume_kind)}</p></div>
        </div>
        <p className="mt-5 text-sm leading-6 text-foreground/85">Every role is scored against this. Update it whenever your resume changes.</p>
        <div className="mt-4"><ResumeInput key={resumeKey} busy={resumeMut.isPending} submitLabel={me.resume_kind ? "Replace resume" : "Upload resume"} onSubmit={(input) => resumeMut.mutate(input)} /></div>
      </section>
      <ConnectionsCard />
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card title="Your search" className="self-start"><SearchForm initial={search} busy={saveMut.isPending} submitLabel="Save search" onSubmit={(p) => saveMut.mutate(p)} /></Card>
      <div className="grid content-start gap-6">
        <Card title="Today's usage">
          <ul className="grid gap-3">{usageLabels.map(([key, label]) => { const u = me.usage[key]; const pct = u.limit ? Math.min(100, Math.round((u.used / u.limit) * 100)) : 0; return <li key={key}><div className="flex justify-between text-sm"><span className="font-semibold">{label}</span><span className="tabular-nums text-muted-foreground">{u.used} of {u.limit}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", pct >= 100 ? "bg-fit-orange" : "bg-primary")} style={{ width: `${pct}%` }} /></div></li>; })}</ul>
          <p className="mt-3 text-xs text-muted-foreground">Limits reset every day.</p>
        </Card>
        <Card title="Account">
          <p className="font-bold">{me.name}</p><p className="text-sm text-muted-foreground">{me.email}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={signOut}>Sign out</Button>
        </Card>
        <section className="rounded-xl border border-destructive/30 bg-card p-5 shadow-card">
          <h2 className="text-lg font-extrabold text-destructive">Delete my data</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Permanently deletes your resume, preferences, tracked companies, jobs, analyses and connections. This can't be undone.</p>
          <Button variant="destructive" size="sm" className="mt-4" onClick={() => setConfirmDelete(true)}>Delete my data</Button>
        </section>
      </div>
    </div>
    <ConfirmDialog open={confirmDelete} title="Delete all your data?" body="Your resume, preferences, companies, jobs, analyses and connections will be permanently deleted and you'll be signed out. This can't be undone." confirmLabel="Delete everything" busy={delAccMut.isPending} onCancel={() => setConfirmDelete(false)} onConfirm={() => delAccMut.mutate()} />
  </div>;
}
