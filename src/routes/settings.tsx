import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholders";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Job Search Copilot" }, { name: "description", content: "Manage your resume, connections, search profile, and account settings." }, { property: "og:title", content: "Settings — Job Search Copilot" }, { property: "og:description", content: "Manage your resume, connections, search profile, and account settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <PlaceholderPage icon={Settings} eyebrow="Settings" title="Profile and imports" description="This page will hold your resume, LinkedIn connections import, search criteria, and account controls." />,
});