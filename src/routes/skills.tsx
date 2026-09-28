import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholders";

export const Route = createFileRoute("/skills")({
  head: () => ({ meta: [{ title: "Skills — Job Search Copilot" }, { name: "description", content: "See the recurring skills that would unlock stronger-fit roles." }, { property: "og:title", content: "Skills — Job Search Copilot" }, { property: "og:description", content: "See the recurring skills that would unlock stronger-fit roles." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <PlaceholderPage icon={Target} eyebrow="Skills" title="Skill gaps across your search" description="This page will turn repeated gaps from role analyses into a focused build plan with proof projects." />,
});