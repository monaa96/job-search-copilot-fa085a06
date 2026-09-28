import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, ListChecks, Map, Sparkles } from "lucide-react";
import { getToken, setToken, signInUrl, USE_MOCK } from "@/lib/api";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/welcome")({
  ssr: false,
  beforeLoad: () => {
    // A signed-in visitor landing here should go straight into the app; the
    // "/" guard sends them to /setup if they still need to finish onboarding.
    if (!USE_MOCK && getToken()) throw redirect({ to: "/" });
  },
  head: () => pageHead("Job Search Copilot — Finding a job is a job in itself", "Your job search copilot finds matching roles and shows you how to close the gap — while you're busy working."),
  component: WelcomePage,
});

const features = [
  { icon: Building2, title: "Finds companies for you", body: "Tell it what you want once. It suggests companies that fit your background and checks their job boards every morning." },
  { icon: ListChecks, title: "Ranks every new role", body: "Each new opening gets a fit score against your resume, with one clear sentence on why, so you only read what matters." },
  { icon: Map, title: "Gives you a plan to land it", body: "Resume edits, skills to build, and referrals from people you already know, turned into a short checklist for each role." },
];

function GoogleMark() {
  return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8Z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4Z" /></svg>;
}

function WelcomePage() {
  const navigate = useNavigate();
  // Sign-in errors arrive as ?error=… (set by /auth/callback).
  const [error] = useState(() => new URLSearchParams(window.location.search).get("error"));
  const signIn = () => {
    if (USE_MOCK) { setToken("mock-token"); navigate({ to: "/" }); return; }
    window.location.href = signInUrl();
  };
  return <div className="min-h-screen bg-background">
    <section className="bg-hero text-primary-foreground">
      <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-lg bg-primary-foreground/15"><Sparkles className="size-4" /></span><span className="text-sm font-bold">Job Search Copilot</span></div>
        <div className="mt-16 max-w-3xl sm:mt-24">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary-foreground/70">Don't just find jobs. Close the gap.</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] sm:text-6xl">Finding a job is a job in itself</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8 text-primary-foreground/85">Your job search copilot helps you not only find jobs but also fill the gaps that can make you stand out beyond just the resume. While you're busy working, Job Search Copilot is busy finding you a job and giving you suggestions for how to land it, without you doing the research.</p>
          <button type="button" onClick={signIn} className="mt-9 inline-flex h-12 items-center gap-3 rounded-lg bg-card px-5 text-base font-bold text-foreground shadow-card-hover transition hover:-translate-y-0.5"><GoogleMark />Sign in with Google</button>
          {error && <p className="mt-6 max-w-2xl rounded-lg border border-primary-foreground/25 bg-card/15 px-4 py-3 text-sm font-semibold text-primary-foreground">{error}</p>}
        </div>
      </div>
    </section>
    <section className="mx-auto -mt-12 grid max-w-[1180px] gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
      {features.map(({ icon: Icon, title, body }) => <article key={title} className="rounded-xl border border-border bg-card p-6 shadow-card"><span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="size-5" /></span><h2 className="mt-4 text-lg font-extrabold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}
    </section>
    <footer className="mx-auto max-w-[1180px] px-4 py-12 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">Free to use with daily limits · <Link to="/privacy" className="font-semibold text-primary hover:underline">Privacy</Link></footer>
  </div>;
}
