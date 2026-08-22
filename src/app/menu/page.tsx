import { ProtectedRoute } from "@/components/protected-route";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getDishes } from "@/server/queries/dishes";
import type { Dish } from "@/types/api";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  let dishes: Dish[] = [];
  let loadFailed = false;

  try {
    dishes = await getDishes();
  } catch (error) {
    console.error("Failed to load dishes:", error);
    loadFailed = true;
  }

  return (
    <ProtectedRoute>
      <CatalogView dishes={dishes} loadFailed={loadFailed} />
    </ProtectedRoute>
  );
}
