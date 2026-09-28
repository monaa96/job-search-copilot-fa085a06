import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholders";

export const Route = createFileRoute("/analyses")({
  head: () => ({ meta: [{ title: "Analyses — Job Search Copilot" }, { name: "description", content: "Review saved match analyses and revisit your strongest opportunities." }, { property: "og:title", content: "Analyses — Job Search Copilot" }, { property: "og:description", content: "Review saved match analyses and revisit your strongest opportunities." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <PlaceholderPage icon={BarChart3} eyebrow="Analyses" title="Saved role analyses" description="This page will collect your past match checks so you can compare patterns and revisit promising roles." />,
});