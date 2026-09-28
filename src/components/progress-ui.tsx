import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { isServerWaking, subscribeSlow, type LogHandler } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Runs a long background action and collects its live log lines. */
export function useJob() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const run = useCallback(async <T,>(fn: (onLog: LogHandler) => Promise<T>): Promise<T> => {
    setLogs([]); setRunning(true);
    try { return await fn((line) => setLogs((current) => [...current, line])); }
    finally { setRunning(false); }
  }, []);
  return { logs, running, run };
}

function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const start = Date.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return seconds;
}

export function JobProgress({ title, hint, logs, className }: { title: string; hint: string; logs: string[]; className?: string }) {
  const seconds = useElapsed(true);
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [logs.length]);
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className={cn("rounded-xl border border-primary/20 bg-primary-soft/50 p-5", className)} role="status" aria-live="polite">
    <div className="flex items-start gap-3">
      <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-bold text-foreground">{title}</p><span className="text-xs font-semibold tabular-nums text-muted-foreground">{time}</span></div>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
    <ol ref={listRef} className="mt-4 max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-card p-3 text-sm">
      {logs.length === 0 && <li className="text-muted-foreground">Getting started…</li>}
      {logs.map((line, i) => <li key={`${i}-${line}`} className={cn("flex gap-2", i === logs.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground")}><span className={cn("mt-2 size-1.5 shrink-0 rounded-full", i === logs.length - 1 ? "bg-primary" : "bg-fit-green")} />{line}</li>)}
    </ol>
  </div>;
}

export function WakingBanner() {
  const waking = useSyncExternalStore(subscribeSlow, isServerWaking, () => false);
  if (!waking) return null;
  return <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4" role="status">
    <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-card-hover">
      <Loader2 className="size-4 animate-spin text-primary" />Waking up the server… this can take up to a minute the first time.
    </div>
  </div>;
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, busy }: { open: boolean; title: string; body: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-foreground/40 p-4" onMouseDown={onCancel}>
    <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-card-hover" onMouseDown={(e) => e.stopPropagation()}>
      <h2 id="confirm-title" className="text-lg font-extrabold">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{body}</div>
      <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button><Button variant="destructive" onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</Button></div>
    </div>
  </div>;
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
    <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-2 text-3xl font-extrabold text-foreground sm:text-5xl">{title}</h1>{subtitle && <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{subtitle}</p>}</div>
    {action && <div className="flex flex-col items-start gap-2 sm:items-end">{action}</div>}
  </section>;
}
