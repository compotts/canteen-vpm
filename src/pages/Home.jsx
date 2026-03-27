import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CONTACT_URL } from "../constants.js";
import { MessageSquare, ExternalLink, Clock, Loader2 } from "lucide-react";
import { loadUpdates } from "../services/updates.js";

function pickTextByLang(map, lang) {
  if (!map || typeof map !== "object") return "";
  const order = [lang, "lt", "ru", "en"];
  for (const key of order) {
    const value = map[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const [dbUpdates, setDbUpdates] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const list = await loadUpdates();
        if (ignore) return;
        setDbUpdates(Array.isArray(list) ? list : []);
      } catch {
        if (ignore) return;
        setDbUpdates([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);
  const lang = i18n.language || "lt";

  return (
    <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-6 box-border">
      <h1 className="text-xl md:text-2xl font-semibold text-[var(--text)] m-0 mb-5">
        {t("nav.home")}
      </h1>

      <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] p-5 mb-5 md:mb-0">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]" aria-hidden="true">
          <MessageSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[var(--text)] text-[15px] leading-relaxed m-0 mb-3">
              {t("home.feedback")}
            </p>
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium no-underline transition-opacity hover:opacity-90"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              {CONTACT_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
            <p className="text-[var(--text-muted)] text-sm mt-3 mb-0 font-medium">
              {t("home.thanks")}
            </p>
          </div>
        </div>
      </section>
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]" aria-hidden="true">
            <Clock className="w-5 h-5" aria-hidden="true" />
          </div>

          <h2 className="text-base font-semibold text-[var(--text)] m-0">
            {t("home.updatesTitle")}
          </h2>
        </div>

        <div className="pl-10 space-y-4">
          {dbUpdates === null ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--text-muted)]" aria-hidden="true" />
            </div>
          ) : dbUpdates.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed m-0">
              {t("home.noUpdates")}
            </p>
          ) : (
            dbUpdates.map((u) => (
                <div key={u.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2, var(--surface))] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {u.dateLabel && (
                      <span className="text-xs text-[var(--text-muted)]">
                        {u.dateLabel}
                      </span>
                    )}

                    {u.version && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]">
                        {u.version}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[var(--text)] leading-relaxed m-0">
                    {u.emoji || ""} {pickTextByLang(u.text, lang)}
                  </p>
                </div>
              ))
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
