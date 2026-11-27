"use client";

import { useInterfaceDesign } from "./use-interface-design";
import { useTranslations } from "next-intl";
import { rememberInterface } from "@/lib/interface";

export function InterfaceSwitcher({ onChange }: { onChange?: () => void }) {
  const t = useTranslations("interface");
  const old = useInterfaceDesign() === "old";
  return (
    <fieldset className="my-4 flex flex-wrap gap-2">
      <legend className="mb-2 font-semibold">{t("title")}</legend>
      {(["new", "old"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={old === (value === "old")}
          className="rounded-full border px-4 py-3 text-sm font-medium aria-pressed:bg-[#223d52] aria-pressed:text-white"
          onClick={() => {
            rememberInterface(value);
            onChange?.();
            window.location.assign(value === "old" ? "/old-design" : "/");
          }}
        >
          {t(value)}
        </button>
      ))}
    </fieldset>
  );
}
