import { useRef, useState } from "react";
import type { MatchDetail } from "@busco/contracts";
import { formatMatchDate } from "../formatters";

export function MatchShare({ match }: { match: MatchDetail }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const linkInput = useRef<HTMLInputElement>(null);
  const shareUrl = window.location.href;
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setShareOpen(true);
      requestAnimationFrame(() => {
        linkInput.current?.focus();
        linkInput.current?.select();
      });
    }
  }
  return (
    <section className="share-box">
      <h3>Que no falte nadie.</h3>
      <p className="muted">Mandá el enlace a tu grupo.</p>
      <a
        className="button primary"
        href={`https://wa.me/?text=${encodeURIComponent(`¿Jugamos? ${match.title} · ${formatMatchDate(match)}\n${shareUrl}`)}`}
        target="_blank"
        rel="noreferrer"
      >
        Compartir por WhatsApp ↗
      </a>
      <button onClick={copyLink}>
        {copied ? "Enlace copiado ✓" : "Copiar enlace"}
      </button>
      <button className="text-button" onClick={() => setShareOpen((v) => !v)}>
        {shareOpen ? "Ocultar enlace" : "Ver enlace"}
      </button>
      {shareOpen && (
        <label>
          Enlace del partido
          <input
            ref={linkInput}
            value={shareUrl}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
      <p className="help">
        Cualquier persona que reciba el enlace puede ver el partido y anotarse.
      </p>
    </section>
  );
}
