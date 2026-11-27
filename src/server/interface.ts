import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { INTERFACE_KEY, legacyPath } from "@/lib/interface";

export async function redirectLegacy(path: string) {
  if ((await cookies()).get(INTERFACE_KEY)?.value === "old")
    redirect(legacyPath(path));
}
