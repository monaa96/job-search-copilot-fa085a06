import type { LucideIcon } from "lucide-react";

export function PlaceholderPage({ icon: Icon, eyebrow, title, description }: { icon: LucideIcon; eyebrow: string; title: string; description: string }) {
  return <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-6 lg:px-8">
    <section className="rounded-xl border border-border bg-card p-8 shadow-card sm:p-10">
      <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="size-6" /></span>
      <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
    </section>
  </div>;
}