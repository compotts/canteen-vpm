import { apiFetch } from "./client";
import type { FeedbackEntry } from "@/types/api";

export function sendFeedback(message: string): Promise<FeedbackEntry> {
  return apiFetch<FeedbackEntry>("/api/feedback", {
    method: "POST",
    body: { message },
  });
}

export function loadFeedback(): Promise<FeedbackEntry[]> {
  return apiFetch<FeedbackEntry[]>("/api/feedback");
}

export function deleteFeedback(id: string): Promise<null> {
  return apiFetch<null>(`/api/feedback?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
