import { ProtectedRoute } from "@/components/protected-route";
import { OrderView } from "@/components/order/order-view";

export default function OrderPage() {
  return (
    <ProtectedRoute>
      <OrderView />
    </ProtectedRoute>
  );
}
