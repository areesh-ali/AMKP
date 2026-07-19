import { AmkpApiError } from "@amkp/sdk-js";

export function formatApiError(e: unknown): string {
  if (e instanceof AmkpApiError) {
    return `${e.message}${e.requestId ? ` · ${e.requestId}` : ""}`;
  }
  if (e instanceof Error) return e.message;
  return "Request failed";
}
