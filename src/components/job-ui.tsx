import { formatShortDate } from "@/lib/utils";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clearToken } from "@/lib/api";
import { meQuery } from "@/lib/queries";
import { BarChart3, Bookmark, BriefcaseBusiness, Building2, ChevronDown, FileSearch, Menu, Settings, Sparkles, Target, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { FitColor, RoleSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Roles", icon: BriefcaseBusiness },
  { to: "/match", label: "Resume match", icon: FileSearch },
  { to: "/skills", label: "Skills", icon: Target },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/analyses", label: "Analyses", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useQuery(meQuery);
  const initials = me ? me.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() : "";
  const checks = me?.usage.fit_checks;
  const signOut = () => { clearToken(); queryClient.clear(); navigate({ to: "/welcome" }); };
  useEffect(() => { setMobileOpen(false); setUserOpen(false); }, [path]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setUserOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, []);

  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Job Search Copilot home">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
          <span className="hidden text-sm font-bold text-foreground sm:block">Job Search Copilot</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "bg-primary-soft text-primary" }} activeOptions={{ exact: to === "/" }}><Icon className="size-4" />{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground md:flex"><span className={cn("size-1.5 rounded-full", checks && checks.used >= checks.limit ? "bg-fit-orange" : "bg-fit-green")} />{checks ? `${checks.used} of ${checks.limit} role scores today` : "Loading usage…"}</div>
          <div className="relative" ref={menuRef}>
            <Button variant="ghost" size="sm" onClick={() => setUserOpen((value) => !value)} aria-expanded={userOpen} aria-label="Open user menu" className="px-1.5">
              <span className="grid size-8 place-items-center rounded-full bg-violet-soft font-bold text-violet">{initials}</span><ChevronDown className="hidden size-3.5 sm:block" />
            </Button>
            {userOpen && <div className="absolute right-0 top-11 w-52 rounded-lg border border-border bg-card p-1.5 shadow-card">
              <div className="border-b border-border px-3 py-2"><p className="truncate text-sm font-semibold">{me?.name}</p><p className="truncate text-xs text-muted-foreground">{me?.email}</p></div>
              <Link to="/settings" className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"><Settings className="size-4" />Settings</Link>
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted" type="button" onClick={signOut}>Sign out</button>
            </div>}
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}</Button>
        </div>
      </div>
      {mobileOpen && <nav className="grid gap-1 border-t border-border bg-card p-3 lg:hidden" aria-label="Mobile navigation">{navItems.map(({ to, label, icon: Icon }) => <Link key={to} to={to} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-muted-foreground" activeProps={{ className: "bg-primary-soft text-primary" }} activeOptions={{ exact: to === "/" }}><Icon className="size-4" />{label}</Link>)}</nav>}
    </header>
    <main>{children}</main>
  </div>;
}

const fitStyles: Record<FitColor, string> = { green: "bg-fit-green-soft text-fit-green border-fit-green-border", blue: "bg-fit-blue-soft text-fit-blue border-fit-blue-border", orange: "bg-fit-orange-soft text-fit-orange border-fit-orange-border", gray: "bg-fit-gray-soft text-fit-gray border-fit-gray-border" };
const stripeStyles: Record<FitColor, string> = { green: "border-l-fit-green", blue: "border-l-fit-blue", orange: "border-l-fit-orange", gray: "border-l-fit-gray" };

export function FitBadge({ score, label, color }: { score: number; label: string; color: FitColor }) {
  return <span className={cn("inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold", fitStyles[color])}>{score} · {label}</span>;
}

export function CompanyLogo({ company, logo_url, size = "md" }: { company: string; logo_url: string | null; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "size-16 rounded-xl" : size === "sm" ? "size-8 rounded-md" : "size-11 rounded-lg";
  return <span className={cn("grid shrink-0 place-items-center overflow-hidden border border-border bg-card font-bold text-primary", dims)}>{logo_url ? <img src={logo_url} alt={`${company} logo`} className="size-full object-contain p-1.5" /> : company.charAt(0)}</span>;
}

export function RoleCard({ role, onStatus }: { role: RoleSummary; onStatus: (status: RoleSummary["status"]) => void }) {
  return <article className={cn("group relative rounded-xl border border-l-4 border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover", stripeStyles[role.fit_color])}>
    <Link to="/roles/$id" params={{ id: String(role.id) }} className="absolute inset-0 rounded-xl" aria-label={`View ${role.title} at ${role.company}`} />
    <div className="relative pointer-events-none flex items-start gap-3.5 sm:gap-4">
      <CompanyLogo company={role.company} logo_url={role.logo_url} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><h2 className="text-base font-bold text-foreground sm:text-lg">{role.title}</h2><p className="mt-1 text-sm text-muted-foreground">{role.company} · {role.location}{role.posted_at ? ` · Posted ${formatShortDate(role.posted_at)}` : ""}</p></div>
          <FitBadge score={role.fit_score} label={role.fit_label} color={role.fit_color} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">{role.known_people > 0 && <span className="rounded-full bg-violet-soft px-2.5 py-1 text-xs font-semibold text-violet">You know {role.known_people} {role.known_people === 1 ? "person" : "people"} here</span>}{role.has_plan && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Plan ready</span>}</div>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-foreground/80">{role.fit_reason}</p>
        <div className="pointer-events-auto relative z-10 mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <a href={role.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted">View posting</a>
          <Button variant="ghost" size="sm" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onStatus(role.status === "saved" ? "new" : "saved"); }}><Bookmark className={cn("size-3.5", role.status === "saved" && "fill-current text-primary")} />{role.status === "saved" ? "Saved" : "Save"}</Button>
          <Button variant="ghost" size="icon" aria-label={`Dismiss ${role.title}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onStatus("dismissed"); }}><X className="size-4" /></Button>
          <Link to="/roles/$id" params={{ id: String(role.id) }} className="ml-auto text-xs font-bold text-primary hover:text-primary-hover">Your plan to land it →</Link>
        </div>
      </div>
    </div>
  </article>;
}

export function PageLoading({ label = "Finding your best matches…" }: { label?: string }) { return <div className="grid min-h-[360px] place-items-center"><div className="text-center"><span className="mx-auto block size-8 animate-spin rounded-full border-2 border-primary-soft border-t-primary" /><p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p></div></div>; }