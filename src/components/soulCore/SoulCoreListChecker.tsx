import { useState } from 'react';
import { normalizeMonsterName, parseMonsterList } from '../../domain/soulCore';

interface SoulCoreListCheckerProps {
  doneSet: Set<string>;
  accentColor: string;
}

/** Paste a list of monster names and see, for the selected character, which ones are already done. */
export function SoulCoreListChecker({ doneSet, accentColor }: SoulCoreListCheckerProps) {
  const [input, setInput] = useState('');

  const normalizedDone = new Set([...doneSet].map(normalizeMonsterName));
  const monsters = parseMonsterList(input);

  return (
    <div className="soul-core-checker">
      <label htmlFor="soul-core-checker-input">Verificar lista (quais já tens)</label>
      <textarea
        id="soul-core-checker-input"
        rows={4}
        placeholder={'ex:\nCrimson Frog\nQuara Predator\nHellhound'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {monsters.length > 0 && (
        <table className="hunt-scenario-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Monstro</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {monsters.map((monster) => {
              const has = normalizedDone.has(normalizeMonsterName(monster));
              return (
                <tr key={monster}>
                  <td>{monster}</td>
                  <td>
                    {has ? (
                      <span style={{ color: accentColor, fontWeight: 'bold' }}>✓ Já tens</span>
                    ) : (
                      <span style={{ color: 'var(--error)' }}>✗ Não tens</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
