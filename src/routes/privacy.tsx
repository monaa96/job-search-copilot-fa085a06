import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("Privacy Policy — Job Search Copilot", "What Job Search Copilot collects, how it's used, which providers process it, and how to delete it."),
  component: PrivacyPage,
});

const H = ({ children }: { children: ReactNode }) => <h2 className="mt-10 text-xl font-extrabold text-foreground">{children}</h2>;
const P = ({ children }: { children: ReactNode }) => <p className="mt-3 leading-7 text-foreground/85">{children}</p>;
const UL = ({ items }: { items: ReactNode[] }) => <ul className="mt-3 grid gap-2 leading-7 text-foreground/85">{items.map((item, i) => <li key={i} className="flex gap-3"><span className="mt-3 size-1.5 shrink-0 rounded-full bg-primary" /><span>{item}</span></li>)}</ul>;

function PrivacyPage() {
  return <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
    <article className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 shadow-card sm:p-10">
      <Link to="/welcome" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Job Search Copilot</Link>
      <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: September 28, 2026</p>
      <P>Job Search Copilot is a personal project by Mona Agarwal that helps job seekers find roles that fit them. This policy explains what information the app collects, how it's used, and how to delete it.</P>
      <H>What we collect</H>
      <UL items={[
        "Your Google account name and email address, when you sign in with Google. We don't receive your Google password or access to any other Google data.",
        "Your resume, which you upload or paste.",
        "Your search preferences: job titles, locations, industries and company stage.",
        "Your LinkedIn connections, if you choose to import them: each connection's name, company, job title, profile link and connection date, from the file LinkedIn provides when you download your data. Email addresses in that file are discarded, not stored.",
        "Your activity in the app: companies you track, jobs you save or dismiss, fit scores and analyses, and daily usage counts used to enforce usage limits.",
      ]} />
      <H>How we use it</H>
      <P>Your information is used only to provide the app's features to you: finding companies, scanning job boards for matching roles, scoring jobs against your resume, generating fit analyses and resume suggestions, and showing which of your connections work at companies you're interested in.</P>
      <P>Your connections are visible only to you. The app never contacts them: when you ask for a draft message, it's written for you to review and send yourself. To write that draft, the connection's name and job title are sent to Anthropic's API along with your resume.</P>
      <P>To do this, your resume, search preferences and job descriptions are sent to Anthropic's Claude API for processing. Under Anthropic's commercial terms, API inputs and outputs are not used to train its models.</P>
      <P>We don't sell your information, use it for advertising, or share it with anyone other than the service providers below.</P>
      <H>Service providers</H>
      <UL items={[
        <><strong>Anthropic (Claude API):</strong> processes your resume and job descriptions to produce scores and analyses.</>,
        <><strong>Neon:</strong> hosts the database where your information is stored.</>,
        <><strong>Render:</strong> hosts the app's server.</>,
        <><strong>Lovable:</strong> hosts the website.</>,
        <><strong>Google:</strong> provides sign-in, and serves the company logos shown in the app (your browser loads these images from Google).</>,
      ]} />
      <H>Retention and deletion</H>
      <P>Your information is kept until you delete it. You can permanently delete your resume, preferences, tracked companies, jobs and analyses at any time under Profile → Delete my data, and your imported connections on their own under Profile → LinkedIn connections. Deletion is immediate and can't be undone.</P>
      <H>Security</H>
      <P>Data is transmitted over encrypted connections (HTTPS/TLS) and stored with access restricted to the app. No system is perfectly secure; please don't upload information you're not comfortable sharing with the services above.</P>
      <H>Children</H>
      <P>The app is not intended for anyone under 16.</P>
      <H>Contact</H>
      <P>Questions or requests: <a href="mailto:monaa96@gmail.com" className="font-semibold text-primary hover:underline">monaa96@gmail.com</a></P>
    </article>
  </div>;
}
