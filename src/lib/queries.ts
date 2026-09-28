import { queryOptions } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, type RoleFilters, getAnalyses, getCompanies, getMe, getRoles, getSearch, getSkills, getToken, USE_MOCK } from "./api";

export const meQuery = queryOptions({ queryKey: ["me"], queryFn: getMe });
export const rolesQuery = (filters: RoleFilters = {}) => queryOptions({ queryKey: ["roles", filters.postedWithin ?? null, filters.sort ?? "fit", filters.companyId ?? null], queryFn: () => getRoles("all", filters) });
export const companiesQuery = queryOptions({ queryKey: ["companies"], queryFn: getCompanies });
export const skillsQuery = queryOptions({ queryKey: ["skills"], queryFn: getSkills });
export const analysesQuery = queryOptions({ queryKey: ["analyses"], queryFn: getAnalyses });
export const searchQuery = queryOptions({ queryKey: ["search"], queryFn: getSearch });

export const isOnboarded = (o: { has_resume: boolean; has_search: boolean; has_companies: boolean }) => o.has_resume && o.has_search && o.has_companies;

/** Route guard for signed-in app pages: requires a token and completed setup. */
export async function requireSetup({ context }: { context: { queryClient: QueryClient } }) {
  if (!USE_MOCK && !getToken()) throw redirect({ to: "/welcome" });
  const me = await context.queryClient.ensureQueryData(meQuery);
  if (!isOnboarded(me.onboarding)) throw redirect({ to: "/setup" });
}

/** Route guard that only requires a token (used by /setup). */
export function requireToken() {
  if (!USE_MOCK && !getToken()) throw redirect({ to: "/welcome" });
}

export function showError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) return;
  if (error instanceof ApiError && error.status === 429) {
    toast.error("You've reached today's limit", { description: `${error.message} Your limits reset tomorrow, so come back then and pick up where you left off.` });
    return;
  }
  toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
}
