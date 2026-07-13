import { useState } from 'react';
import type { ExpRecord, TeamPlayer } from '../../domain/team/types';
import { recordsForPlayer } from '../../domain/team/calculations';
import { levelForExperience } from '../../domain/experienceTable';

interface PlayerHistoryPanelProps {
  players: TeamPlayer[];
  records: ExpRecord[];
  onEdit: (playerId: string, date: string, exp: number) => void;
  onDelete: (playerId: string, date: string) => void;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');

function PlayerHistoryTable({
  player,
  records,
  onEdit,
  onDelete,
}: {
  player: TeamPlayer;
  records: ExpRecord[];
  onEdit: (playerId: string, date: string, exp: number) => void;
  onDelete: (playerId: string, date: string) => void;
}) {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const sorted = recordsForPlayer(records, player.id);

  if (sorted.length === 0) {
    return <p className="chart-empty-state">Sem registos para {player.name}.</p>;
  }

  function startEdit(record: ExpRecord) {
    setEditingDate(record.date);
    setEditingValue(String(record.exp));
  }

  function commitEdit(date: string) {
    const exp = Number(editingValue);
    if (Number.isFinite(exp) && exp >= 0) {
      onEdit(player.id, date, exp);
    }
    setEditingDate(null);
  }

  return (
    <table className="tibiadrome-history__table">
      <thead>
        <tr>
          <th>Data</th>
          <th>EXP total</th>
          <th>EXP ganha</th>
          <th>Nível</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((record, index) => {
          const previous = sorted[index - 1];
          const gained = previous ? record.exp - previous.exp : null;
          return (
            <tr key={record.date}>
              <td>{record.date}</td>
              <td>
                {editingDate === record.date ? (
                  <input
                    type="number"
                    min="0"
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => commitEdit(record.date)}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit(record.date)}
                  />
                ) : (
                  numberFormatter.format(record.exp)
                )}
              </td>
              <td className={gained !== null && gained < 0 ? 'team-history__negative' : undefined}>
                {gained === null ? '—' : numberFormatter.format(gained)}
              </td>
              <td>{levelForExperience(record.exp)}</td>
              <td className="team-history__row-actions">
                <button type="button" onClick={() => startEdit(record)}>
                  Editar
                </button>
                <button type="button" onClick={() => onDelete(player.id, record.date)}>
                  Apagar
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function PlayerHistoryPanel({ players, records, onEdit, onDelete }: PlayerHistoryPanelProps) {
  if (players.length === 0) return null;

  return (
    <div className="team-history-panel">
      {players.map((player) => (
        <details key={player.id} className="tibiadrome-history">
          <summary>Histórico de {player.name}</summary>
          <PlayerHistoryTable player={player} records={records} onEdit={onEdit} onDelete={onDelete} />
        </details>
      ))}
    </div>
  );
}
