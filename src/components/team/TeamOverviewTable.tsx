import { useState } from 'react';

export interface TeamOverviewRow {
  playerId: string;
  name: string;
  status: 'ok' | 'no-records' | 'no-baseline';
  currentLevel: number | null;
  currentExp: number | null;
  avgPerDay: number | null;
  daysToNext: number | null;
  projectedLevelEndOfYear: number | null;
}

type SortKey = 'name' | 'currentLevel' | 'currentExp' | 'avgPerDay' | 'daysToNext' | 'projectedLevelEndOfYear';

const numberFormatter = new Intl.NumberFormat('pt-PT');

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Jogador' },
  { key: 'currentLevel', label: 'Nível atual' },
  { key: 'currentExp', label: 'EXP atual' },
  { key: 'avgPerDay', label: 'EXP/dia (média)' },
  { key: 'daysToNext', label: 'Dias p/ próximo nível' },
  { key: 'projectedLevelEndOfYear', label: 'Nível previsto a 31/dez' },
];

function statusLabel(status: TeamOverviewRow['status']): string {
  if (status === 'no-records') return 'Sem registos';
  if (status === 'no-baseline') return 'Sem registo na/após a data-base';
  return '';
}

export function TeamOverviewTable({ rows }: { rows: TeamOverviewRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    // Rows without data sort to the bottom regardless of direction.
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortAsc ? cmp : -cmp;
  });

  if (rows.length === 0) {
    return <p className="chart-empty-state">Ainda não há jogadores.</p>;
  }

  return (
    <table className="team-overview-table">
      <thead>
        <tr>
          {COLUMNS.map((col) => (
            <th key={col.key} onClick={() => handleSort(col.key)} className="team-overview-table__sortable">
              {col.label} {sortKey === col.key && (sortAsc ? '▲' : '▼')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr key={row.playerId}>
            <td>{row.name}</td>
            {row.status !== 'ok' ? (
              <td colSpan={5} className="team-overview-table__status">
                {statusLabel(row.status)}
              </td>
            ) : (
              <>
                <td>{row.currentLevel}</td>
                <td>{numberFormatter.format(row.currentExp ?? 0)}</td>
                <td>{numberFormatter.format(Math.round(row.avgPerDay ?? 0))}</td>
                <td>{row.daysToNext === null ? '—' : numberFormatter.format(row.daysToNext)}</td>
                <td>{row.projectedLevelEndOfYear ?? '—'}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
