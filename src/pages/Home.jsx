import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Clock, Loader2, ChevronDown, Send, X, CheckCircle2 } from "lucide-react";
import { loadUpdates } from "../services/updates.js";
import { sendFeedback } from "../services/feedback.js";
import { pickTextByLang } from "../utils/textHelpers.js";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [dbUpdates, setDbUpdates] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sent, setSent] = useState(false);

  const closeModal = () => {
    if (sending) return;
    setModalOpen(false);
    setFeedbackText("");
    setSendError(null);
    setSent(false);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const message = feedbackText.trim();
    if (!message) return;
    setSending(true);
    setSendError(null);
    try {
      await sendFeedback(message);
      setSent(true);
      setFeedbackText("");
    } catch (err) {
      setSendError(err.message || t("home.feedbackModal.error"));
    } finally {
      setSending(false);
    }
  };

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
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)] m-0 mb-5">
        {t("nav.home")}
      </h1>

      <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
      <section className="glass-card rounded-[var(--radius-lg)] p-5 mb-5 md:mb-0 animate-glass-rise">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--glass-highlight)] flex items-center justify-center text-[var(--text-muted)]" aria-hidden="true">
          <MessageSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[var(--text)] text-[15px] leading-relaxed m-0 mb-3">
              {t("home.feedback")}
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium no-underline transition-all hover:opacity-90 active:scale-95 border-0 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              {t("home.reportButton")}
            </button>
            <p className="text-[var(--text-muted)] text-sm mt-3 mb-0 font-medium">
              {t("home.thanks")}
            </p>
          </div>
        </div>
      </section>
      <section className="glass-card rounded-[var(--radius-lg)] p-5 animate-glass-rise">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--glass-highlight)] flex items-center justify-center text-[var(--text-muted)]" aria-hidden="true">
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
            <>
              {(expanded ? dbUpdates : dbUpdates.slice(0, 1)).map((u) => (
                <div key={u.id} className="rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--glass-highlight)] p-3">
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
              ))}

              {dbUpdates.length > 1 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] bg-transparent border-0 p-0 cursor-pointer transition-opacity hover:opacity-80"
                >
                  {expanded ? t("home.showLess") : t("home.showMore")}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </>
          )}
        </div>
      </section>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[1200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4"
          onClick={closeModal}
        >
          <div
            className="glass-card w-full md:max-w-md rounded-t-[var(--radius-lg)] md:rounded-[var(--radius-lg)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5 animate-glass-rise"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-[var(--text)] m-0">
                {t("home.feedbackModal.title")}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t("home.feedbackModal.close")}
                className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-highlight)] hover:text-[var(--text)] rounded-lg border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col items-center text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-[var(--text)] text-[15px] m-0 mb-1 font-medium">
                  {t("home.feedbackModal.successTitle")}
                </p>
                <p className="text-[var(--text-muted)] text-sm m-0 mb-5">
                  {t("home.feedbackModal.successText")}
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium border-0 cursor-pointer"
                >
                  {t("home.feedbackModal.done")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <p className="text-[var(--text-muted)] text-sm m-0 mb-3">
                  {t("home.feedbackModal.subtitle")}
                </p>
                <textarea
                  autoFocus
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t("home.feedbackModal.placeholder")}
                  maxLength={4000}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text)] min-h-[120px] resize-y"
                />
                {sendError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 mb-0">
                    {sendError}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={sending}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--border)] transition-colors border-0 cursor-pointer disabled:opacity-50"
                  >
                    {t("home.feedbackModal.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !feedbackText.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium border-0 cursor-pointer disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {sending ? t("home.feedbackModal.sending") : t("home.feedbackModal.send")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
