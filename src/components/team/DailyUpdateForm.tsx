import { useState } from 'react';
import type { ExpRecord, TeamPlayer } from '../../domain/team/types';
import { todayDateKey } from '../../domain/team/calculations';

interface DailyUpdateFormProps {
  players: TeamPlayer[];
  records: ExpRecord[];
  onSubmit: (date: string, values: { playerId: string; exp: number }[]) => void;
}

export function DailyUpdateForm({ players, records, onSubmit }: DailyUpdateFormProps) {
  const [date, setDate] = useState(todayDateKey());
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const existingForDate = new Set(records.filter((r) => r.date === date).map((r) => r.playerId));

  function handleDateChange(newDate: string) {
    setDate(newDate);
    // Prefill with whatever's already saved for that date, so re-opening a date shows current values.
    const prefill: Record<string, string> = {};
    for (const record of records) {
      if (record.date === newDate) prefill[record.playerId] = String(record.exp);
    }
    setInputs(prefill);
  }

  function handleSubmit() {
    if (!date) {
      setError('Escolhe uma data válida.');
      return;
    }
    const values: { playerId: string; exp: number }[] = [];
    for (const player of players) {
      const raw = inputs[player.id];
      if (raw === undefined || raw.trim() === '') continue;
      const exp = Number(raw);
      if (!Number.isFinite(exp) || exp < 0) {
        setError(`EXP inválida para ${player.name}: tem de ser um número não negativo.`);
        return;
      }
      values.push({ playerId: player.id, exp });
    }
    if (values.length === 0) {
      setError('Preenche a EXP de pelo menos um jogador.');
      return;
    }
    setError(null);
    onSubmit(date, values);
    setInputs({});
  }

  if (players.length === 0) {
    return <p className="chart-empty-state">Adiciona jogadores acima para começares a registar EXP.</p>;
  }

  return (
    <div className="team-daily-update">
      <label className="team-daily-update__date">
        Data
        <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} />
      </label>

      <div className="team-daily-update__grid">
        {players.map((player) => (
          <label key={player.id} className="team-daily-update__field">
            {player.name}
            {existingForDate.has(player.id) && <span className="team-daily-update__existing-tag">já tem registo — vai atualizar</span>}
            <input
              type="number"
              min="0"
              placeholder="EXP total"
              value={inputs[player.id] ?? ''}
              onChange={(e) => setInputs((prev) => ({ ...prev, [player.id]: e.target.value }))}
            />
          </label>
        ))}
      </div>

      {error && <p className="field-error">{error}</p>}
      <button type="button" onClick={handleSubmit}>
        Guardar update de {date}
      </button>
    </div>
  );
}
