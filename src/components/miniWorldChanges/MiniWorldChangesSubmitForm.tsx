import { useState } from 'react';
import { parseMiniWorldChangesFromAnnouncement } from '../../domain/miniWorldChanges/parseMiniWorldChanges';

interface MiniWorldChangesSubmitFormProps {
  dateKey: string;
  accentColor: string;
}

export function MiniWorldChangesSubmitForm({ dateKey, accentColor }: MiniWorldChangesSubmitFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit() {
    const result = parseMiniWorldChangesFromAnnouncement(text);
    setCopied(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível identificar as mini world changes.');
      setDetected(null);
      return;
    }
    setError(null);
    setDetected(result.events);
  }

  function buildCommand(events: string[]): string {
    const args = events.map((name) => `"${name}"`).join(' ');
    return `node scripts/save-mini-world-changes.mjs ${dateKey} ${args}`;
  }

  async function handleCopyCommand() {
    if (!detected) return;
    try {
      await navigator.clipboard.writeText(buildCommand(detected));
      setCopied(true);
    } catch {
      // Clipboard API unavailable/blocked — the command is still visible to copy manually.
    }
  }

  return (
    <div className="modifiers-submit-form">
      <label htmlFor="mwc-announcement">Cola aqui o texto do Towncryer / World Board</label>
      <textarea
        id="mwc-announcement"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Bank Robbery is happening in Carlin!\nThawing has started in Svargrond.\n...'}
      />
      <button type="button" style={{ backgroundColor: accentColor }} onClick={handleSubmit}>
        Submeter
      </button>

      {error && <p className="field-error">{error}</p>}

      {detected && (
        <div className="modifiers-submit-form__result">
          <p>
            Detetei para {dateKey}: <strong>{detected.join(', ')}</strong>
          </p>
          <p className="modifiers-submit-form__hint">
            Isto ainda não fica guardado — corre este comando no terminal para registar e publicar:
          </p>
          <code className="modifiers-submit-form__command">{buildCommand(detected)}</code>
          <button type="button" className="modifiers-submit-form__copy" onClick={handleCopyCommand}>
            {copied ? 'Copiado!' : 'Copiar comando'}
          </button>
        </div>
      )}
    </div>
  );
}
