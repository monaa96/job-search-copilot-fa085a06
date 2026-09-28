import { useState, type KeyboardEvent } from "react";
import { FileUp, X } from "lucide-react";
import { addCompany, type Company, type SearchProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const inputClass = "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";
export const textareaClass = "w-full rounded-lg border border-border bg-card p-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return <div><label htmlFor={htmlFor} className="text-sm font-bold text-foreground">{label}</label>{hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}<div className="mt-2">{children}</div></div>;
}

export function TagInput({ value, onChange, placeholder, id }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; id?: string }) {
  const [draft, setDraft] = useState("");
  const commit = () => { const t = draft.trim().replace(/,$/, ""); if (t && !value.includes(t)) onChange([...value, t]); setDraft(""); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
    else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
  };
  return <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
    {value.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))}><X className="size-3" /></button></span>)}
    <input id={id} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={commit} placeholder={value.length ? "Add another…" : placeholder} className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground" />
  </div>;
}

export function SearchForm({ initial, onSubmit, submitLabel, busy }: { initial: SearchProfile; onSubmit: (p: SearchProfile) => void; submitLabel: string; busy?: boolean }) {
  const [profile, setProfile] = useState<SearchProfile>(initial);
  const [more, setMore] = useState(false);
  const set = <K extends keyof SearchProfile>(key: K, value: SearchProfile[K]) => setProfile((p) => ({ ...p, [key]: value }));
  return <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); onSubmit(profile); }}>
    <Field label="Job titles" hint="Press Enter after each one." htmlFor="titles"><TagInput id="titles" value={profile.include_titles} onChange={(v) => set("include_titles", v)} placeholder="Product Manager" /></Field>
    <Field label="Locations" htmlFor="locations"><TagInput id="locations" value={profile.locations} onChange={(v) => set("locations", v)} placeholder="New York, Remote" /></Field>
    <Field label="Industries and interests" htmlFor="interests"><textarea id="interests" rows={3} className={textareaClass} value={profile.interests} onChange={(e) => set("interests", e.target.value)} placeholder="Fintech, developer tools, climate…" /></Field>
    <Field label="Company stage or size" htmlFor="stage"><input id="stage" className={inputClass} value={profile.company_stage} onChange={(e) => set("company_stage", e.target.value)} placeholder="Series B to public" /></Field>
    <div className="rounded-lg border border-border">
      <button type="button" onClick={() => setMore((m) => !m)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold" aria-expanded={more}>More options<span className="text-muted-foreground">{more ? "−" : "+"}</span></button>
      {more && <div className="grid gap-5 border-t border-border p-4">
        <Field label="Exclude titles" htmlFor="exclude"><TagInput id="exclude" value={profile.exclude_titles} onChange={(v) => set("exclude_titles", v)} placeholder="Intern, Junior" /></Field>
        <Field label={`Minimum fit score: ${profile.min_score}`} hint="Roles below this score won't show in Best matches." htmlFor="min"><input id="min" type="range" min={0} max={100} step={5} value={profile.min_score} onChange={(e) => set("min_score", Number(e.target.value))} className="w-full accent-primary" /></Field>
      </div>}
    </div>
    <div><Button type="submit" disabled={busy || profile.include_titles.length === 0}>{busy ? "Saving…" : submitLabel}</Button></div>
  </form>;
}

export function ResumeInput({ onSubmit, busy, submitLabel = "Upload resume" }: { onSubmit: (input: File | string) => void; busy?: boolean; submitLabel?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const pick = (f?: File | null) => {
    if (!f) return;
    if (/\.(pdf|docx|txt|md)$/i.test(f.name)) { setFile(f); setText(""); setError(""); }
    else setError("That file type isn't supported. Please choose a PDF, Word (.docx), TXT or MD file.");
  };
  return <div className="grid gap-4">
    <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }} className={cn("flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background/60 px-4 py-8 text-center transition hover:border-primary", drag && "border-primary bg-primary-soft/50")}>
      <FileUp className="size-7 text-primary" />
      <span className="mt-3 text-sm font-bold">{file ? file.name : "Drop your resume here, or click to choose"}</span>
      <span className="mt-1 text-xs text-muted-foreground">PDF, Word or text file</span>
      <input type="file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
    </label>
    {error && <p className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>}
    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><span className="h-px flex-1 bg-border" />or paste it<span className="h-px flex-1 bg-border" /></div>
    <textarea rows={5} className={textareaClass} value={text} onChange={(e) => { setText(e.target.value); if (e.target.value) setFile(null); }} placeholder="Paste your resume text…" />
    <div><Button onClick={() => { if (file) onSubmit(file); else if (text.trim()) onSubmit(text.trim()); }} disabled={busy || (!file && !text.trim())}>{busy ? "Uploading…" : submitLabel}</Button></div>
  </div>;
}

export function AddCompanyForm({ onAdded }: { onAdded: (c: Company) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="grid gap-3" onSubmit={async (e) => {
    e.preventDefault(); if (!name.trim()) return;
    setBusy(true); setError("");
    try { const c = await addCompany(name.trim(), url.trim() || undefined); setName(""); setUrl(""); onAdded(c); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't add that company."); }
    finally { setBusy(false); }
  }}>
    <input aria-label="Company name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" />
    <input aria-label="Careers page URL (optional)" className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Careers page URL (optional)" />
    {error && <p className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>}
    <div><Button type="submit" disabled={busy || !name.trim()}>{busy ? "Looking for their job board…" : "Add company"}</Button></div>
  </form>;
}
