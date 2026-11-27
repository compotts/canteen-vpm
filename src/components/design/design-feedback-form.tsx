"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Send } from "lucide-react";
import { sendFeedback } from "@/lib/api/feedback";

export function DesignFeedbackForm({
  onPendingChange,
}: {
  onPendingChange: (pending: boolean) => void;
}) {
  const t = useTranslations("home.feedbackModal");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => () => onPendingChange(false), [onPendingChange]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending || !message.trim()) return;
    setSending(true);
    onPendingChange(true);
    setError(false);
    try {
      await sendFeedback(message.trim());
      setSent(true);
      setMessage("");
    } catch {
      setError(true);
    } finally {
      setSending(false);
      onPendingChange(false);
    }
  };

  if (sent)
    return (
      <div className="design-feedback-success" role="status">
        <Check size={34} aria-hidden="true" />
        <h3>{t("successTitle")}</h3>
        <p>{t("successText")}</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="design-feedback-form">
      <label htmlFor="design-feedback-message">{t("subtitle")}</label>
      <textarea
        id="design-feedback-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={t("placeholder")}
        maxLength={4000}
        required
        disabled={sending}
      />
      {error && (
        <p role="alert" className="design-form-error">
          {t("error")}
        </p>
      )}
      <button
        type="submit"
        className="design-button"
        disabled={sending || !message.trim()}
      >
        {sending ? (
          <Loader2 size={17} className="animate-spin" aria-hidden="true" />
        ) : (
          <Send size={17} aria-hidden="true" />
        )}
        {t(sending ? "sending" : "send")}
      </button>
    </form>
  );
}
