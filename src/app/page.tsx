import { HomeOrLogin } from "@/components/home/home-or-login";
import { getUpdates } from "@/server/queries/updates";
import type { AppUpdate } from "@/types/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let updates: AppUpdate[] = [];
  try {
    updates = await getUpdates();
  } catch (error) {
    console.error("Failed to load updates:", error);
  }

  return <HomeOrLogin updates={updates} />;
}
