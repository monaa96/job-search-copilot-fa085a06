import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholders";

export const Route = createFileRoute("/companies")({
  head: () => ({ meta: [{ title: "Companies — Job Search Copilot" }, { name: "description", content: "Track companies that fit your search and discover new ones to watch." }, { property: "og:title", content: "Companies — Job Search Copilot" }, { property: "og:description", content: "Track companies that fit your search and discover new ones to watch." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <PlaceholderPage icon={Building2} eyebrow="Companies" title="Companies worth watching" description="Next, this page will manage watched companies, suggested companies, and boards that need manual tracking." />,
});