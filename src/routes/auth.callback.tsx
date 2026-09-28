import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { setToken } from "@/lib/api";
import { PageLoading } from "@/components/job-ui";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => pageHead("Signing you in — Job Search Copilot", "Finishing your sign-in to Job Search Copilot."),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");
    window.history.replaceState(null, "", window.location.pathname);
    if (token) { setToken(token); navigate({ to: "/", replace: true }); }
    else navigate({ to: "/welcome", replace: true });
  }, [navigate]);
  return <div className="min-h-screen bg-background"><PageLoading label="Signing you in…" /></div>;
}
