import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, Users } from "lucide-react";
import { deleteConnections, uploadConnections } from "@/lib/api";
import { meQuery, showError } from "@/lib/queries";
import { ConfirmDialog } from "@/components/progress-ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Why + privacy + export steps. Shared by every LinkedIn import surface. */
export function ConnectionsInfo() {
  return <div className="grid gap-4">
    <p className="text-sm leading-6 text-foreground/85">See who you know at each company and get a drafted referral ask.</p>
    <p className="text-xs leading-5 text-muted-foreground">Emails aren't stored, and the app never contacts anyone.</p>
    <div className="rounded-lg bg-background p-4 text-sm leading-6 text-foreground/85">
      <p className="font-bold">How to export them</p>
      <ol className="mt-1 list-decimal space-y-1 pl-5">
        <li>On LinkedIn, go to Settings &amp; Privacy → Data privacy → Get a copy of your data.</li>
        <li>Choose Connections, then Request archive.</li>
        <li>LinkedIn emails you a download link, usually within 10 minutes.</li>
        <li>Upload the Connections.csv file here.</li>
      </ol>
    </div>
  </div>;
}

/** Drag-and-drop CSV upload with inline errors. Refreshes the account after success. */
export function ConnectionsUpload({ onUploaded }: { onUploaded?: (count: number) => void }) {
  const queryClient = useQueryClient();
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const mut = useMutation({
    mutationFn: uploadConnections,
    onMutate: () => setError(""),
    onError: (e) => { setError(e instanceof Error ? e.message : "Couldn't import that file. Please try again."); },
    onSuccess: async (r) => { await queryClient.invalidateQueries({ queryKey: ["me"] }); toast.success(`Imported ${r.count.toLocaleString()} connections`); onUploaded?.(r.count); },
  });
  const pick = (f?: File | null) => {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) { setError("Please choose the Connections.csv file from your LinkedIn download."); return; }
    mut.mutate(f);
  };
  return <div className="grid gap-3">
    <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
      className={cn("flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-4 py-7 text-center transition hover:border-primary", drag && "border-primary bg-primary-soft", mut.isPending && "pointer-events-none opacity-60")}>
      <FileUp className="size-6 text-primary" />
      <span className="mt-2 text-sm font-bold">{mut.isPending ? "Importing…" : "Drop Connections.csv here or click to choose"}</span>
      <span className="mt-1 text-xs text-muted-foreground">CSV file from LinkedIn</span>
      <input type="file" accept=".csv,text/csv" className="sr-only" disabled={mut.isPending} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </label>
    {error && <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>}
  </div>;
}

export function connectionsStatus(count: number) {
  return count > 0 ? `${count.toLocaleString()} connections imported` : "Not imported yet";
}

/** Full card: status, info, upload, and delete link. */
export function ConnectionsCard({ className, title = "LinkedIn connections", onUploaded }: { className?: string; title?: string; onUploaded?: (count: number) => void }) {
  const { data: me } = useQuery(meQuery);
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const count = me?.connections_count ?? 0;
  const del = useMutation({ mutationFn: deleteConnections, onError: showError, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["me"] }); setConfirm(false); toast.success("Connections deleted"); } });
  return <section className={cn("rounded-xl border border-border bg-card p-6 shadow-card", className)}>
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-violet-soft text-violet"><Users className="size-5" /></span>
      <div><h2 className="text-lg font-extrabold">{title}</h2><p className={cn("text-sm font-semibold", count ? "text-fit-green" : "text-muted-foreground")}>{connectionsStatus(count)}</p></div>
    </div>
    <div className="mt-5"><ConnectionsInfo /></div>
    <div className="mt-4"><ConnectionsUpload onUploaded={onUploaded} /></div>
    {count > 0 && <button type="button" onClick={() => setConfirm(true)} className="mt-3 text-xs font-semibold text-destructive hover:underline">Delete connections</button>}
    <ConfirmDialog open={confirm} title="Delete your connections?" body="Your imported LinkedIn connections will be deleted. You can import them again at any time." confirmLabel="Delete connections" busy={del.isPending} onCancel={() => setConfirm(false)} onConfirm={() => del.mutate()} />
  </section>;
}

/** Dialog variant used from the Roles banner and role page. */
export function ConnectionsDialog({ open, onOpenChange, onUploaded }: { open: boolean; onOpenChange: (open: boolean) => void; onUploaded?: (count: number) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Import your LinkedIn connections</DialogTitle><DialogDescription className="sr-only">Upload the Connections.csv file from LinkedIn.</DialogDescription></DialogHeader>
      <ConnectionsInfo />
      <ConnectionsUpload onUploaded={(c) => { onUploaded?.(c); onOpenChange(false); }} />
    </DialogContent>
  </Dialog>;
}
