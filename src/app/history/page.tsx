import { ProtectedRoute } from "@/components/protected-route";
import { HistoryView } from "@/components/history/history-view";

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryView />
    </ProtectedRoute>
  );
}
