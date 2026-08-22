import { ProtectedRoute } from "@/components/protected-route";
import { AdminView } from "@/components/admin/admin-view";

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminView />
    </ProtectedRoute>
  );
}
