import { createFileRoute } from "@tanstack/react-router";
import { FileSearch } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholders";

export const Route = createFileRoute("/resume-match")({
  head: () => ({ meta: [{ title: "Resume Match — Job Search Copilot" }, { name: "description", content: "Check how your resume matches a target job and see what to emphasize." }, { property: "og:title", content: "Resume Match — Job Search Copilot" }, { property: "og:description", content: "Check how your resume matches a target job and see what to emphasize." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <PlaceholderPage icon={FileSearch} eyebrow="Resume match" title="Match a job description" description="Paste a role here next, and Job Search Copilot will show the fit, gaps, and resume edits for that exact posting." />,
});