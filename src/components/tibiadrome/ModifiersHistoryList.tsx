import type { ModifierRotationRecord } from '../../storage/tibiadromeHistory';

interface ModifiersHistoryListProps {
  history: ModifierRotationRecord[];
}

export function ModifiersHistoryList({ history }: ModifiersHistoryListProps) {
  if (history.length === 0) return null;

  const sorted = [...history].sort((a, b) => b.rotation - a.rotation);

  return (
    <details className="tibiadrome-history">
      <summary>Histórico de rotações ({sorted.length})</summary>
      <table className="tibiadrome-history__table">
        <thead>
          <tr>
            <th>Rotação</th>
            <th>Modificadores</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.rotation}>
              <td>#{entry.rotation}</td>
              <td>{entry.modifiers.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
