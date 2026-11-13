import { ProtectedRoute } from "@/components/protected-route";
import { OrderView } from "@/components/order/order-view";

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { date } = await searchParams;
  const initialDate = typeof date === "string" ? date : undefined;
  return (
    <ProtectedRoute>
      <OrderView initialDate={initialDate} />
    </ProtectedRoute>
  );
}
