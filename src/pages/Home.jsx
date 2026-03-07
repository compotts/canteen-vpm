import { useTranslation } from "react-i18next";
import { CONTACT_URL } from "../constants.js";

export default function Home() {
  const { t } = useTranslation();
  const updates = ["update1", "update2", "update3", "update4"];

  return (
    <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-6 box-border">
      <h1 className="text-xl font-semibold text-[var(--text)] m-0 mb-5">
        {t("nav.home")}
      </h1>

      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] p-5 mb-5">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <h2 className="text-base font-semibold text-[var(--text)] m-0">
            {t("home.updatesTitle")}
          </h2>
        </div>

        <div className="pl-10 space-y-4">
          {[...updates].reverse().map((key) => (
            <div key={key} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2, var(--surface))] p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[var(--text-muted)]">
                  {t(`updates.${key}.date`)}
                </span>

                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]">
                  {t(`updates.${key}.version`)}
                </span>
              </div>

              <p className="text-sm text-[var(--text)] leading-relaxed m-0">
                {t(`updates.${key}.emoji`)} {t(`updates.${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
