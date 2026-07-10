import type { MiniWorldChangesRecord } from '../../storage/miniWorldChangesHistory';

interface MiniWorldChangesHistoryListProps {
  history: MiniWorldChangesRecord[];
}

export function MiniWorldChangesHistoryList({ history }: MiniWorldChangesHistoryListProps) {
  if (history.length === 0) return null;

  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <details className="tibiadrome-history">
      <summary>Histórico de dias ({sorted.length})</summary>
      <table className="tibiadrome-history__table">
        <thead>
          <tr>
            <th>Dia</th>
            <th>Mini world changes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.date}>
              <td>{entry.date}</td>
              <td>{entry.events.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
