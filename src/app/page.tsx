import { redirectLegacy } from "@/server/interface";

export default async function Page() {
  await redirectLegacy("/");
  return null;
}
