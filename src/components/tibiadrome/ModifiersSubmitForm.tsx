import { useState } from 'react';
import { parseModifiersFromAnnouncement } from '../../domain/tibiadrome/parseModifiers';

interface ModifiersSubmitFormProps {
  rotationNumber: number;
  accentColor: string;
}

export function ModifiersSubmitForm({ rotationNumber, accentColor }: ModifiersSubmitFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit() {
    const result = parseModifiersFromAnnouncement(text);
    setCopied(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível identificar os modificadores.');
      setDetected(null);
      return;
    }
    setError(null);
    setDetected(result.modifiers);
  }

  function buildCommand(modifiers: string[]): string {
    const args = modifiers.map((name) => `"${name}"`).join(' ');
    return `node scripts/save-modifier-rotation.mjs ${rotationNumber} ${args}`;
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
      <label htmlFor="tibiadrome-announcement">Cola aqui o anúncio in-game dos modificadores</label>
      <textarea
        id="tibiadrome-announcement"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'The modifiers for the current rotation:\nExploding Corpses:\n...\nBad Roots:\n...'}
      />
      <button type="button" style={{ backgroundColor: accentColor }} onClick={handleSubmit}>
        Submeter
      </button>

      {error && <p className="field-error">{error}</p>}

      {detected && (
        <div className="modifiers-submit-form__result">
          <p>
            Detetei para a Rotação #{rotationNumber}: <strong>{detected.join(', ')}</strong>
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
