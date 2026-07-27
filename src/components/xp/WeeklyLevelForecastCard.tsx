import { useMemo } from 'react';
import type { HistoryEntry } from '../../domain/types';
import { levelForExperience } from '../../domain/experienceTable';
import {
  computeRecentDailyRate,
  projectedLevelAt,
  upcomingMondayDates,
  WEEKLY_FORECAST_WINDOWS,
} from '../../domain/xpForecast';

interface WeeklyLevelForecastCardProps {
  history: HistoryEntry[];
  currentExperience: number | null;
  accentColor: string;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');
const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });

interface Scenario {
  key: string;
  label: string;
  /** Average XP/day for this window, or null when there aren't enough readings in it. */
  averageDailyXp: number | null;
}

interface Cell {
  key: string;
  level: number | null;
  experience: number | null;
  leveledUp: boolean;
}

/**
 * Projects the level reached on each upcoming Monday (through the end of the
 * year) under four paces shown side by side: the average XP/day over the last
 * 7, 15 and 30 days, plus "Média" — the mean of those three rates. Each pace
 * is taken straight from the stored history, so there's nothing to type in;
 * cells where a level-up lands are highlighted.
 */
export function WeeklyLevelForecastCard({ history, currentExperience, accentColor }: WeeklyLevelForecastCardProps) {
  const scenarios = useMemo<Scenario[]>(() => {
    const windowed: Scenario[] = WEEKLY_FORECAST_WINDOWS.map((days) => ({
      key: `d${days}`,
      label: `${days} dias`,
      averageDailyXp: computeRecentDailyRate(history, days)?.averageDailyXp ?? null,
    }));
    const known = windowed.map((s) => s.averageDailyXp).filter((r): r is number => r !== null);
    const average = known.length > 0 ? known.reduce((sum, r) => sum + r, 0) / known.length : null;
    return [...windowed, { key: 'avg', label: 'Média', averageDailyXp: average }];
  }, [history]);

  // Recomputed once per mount — the horizon only shifts by whole days.
  const now = useMemo(() => new Date(), []);
  const mondays = useMemo(() => upcomingMondayDates(now), [now]);

  const rows = useMemo(() => {
    if (currentExperience === null) return [];
    const startLevel = levelForExperience(currentExperience);
    const previousLevel: Record<string, number> = {};
    scenarios.forEach((s) => (previousLevel[s.key] = startLevel));

    return mondays.map((monday) => {
      const cells: Cell[] = scenarios.map((s) => {
        const projected =
          s.averageDailyXp === null ? null : projectedLevelAt(currentExperience, s.averageDailyXp, monday, now);
        if (!projected) return { key: s.key, level: null, experience: null, leveledUp: false };
        const leveledUp = projected.level > previousLevel[s.key];
        previousLevel[s.key] = projected.level;
        return { key: s.key, level: projected.level, experience: projected.experience, leveledUp };
      });
      return { date: monday, cells };
    });
  }, [mondays, scenarios, currentExperience, now]);

  if (currentExperience === null) {
    return <p className="chart-empty-state">Sem XP registada para projetar níveis.</p>;
  }

  const hasAnyRate = scenarios.some((s) => s.averageDailyXp !== null && s.averageDailyXp > 0);
  if (!hasAnyRate) {
    return (
      <p className="daily-simulation-note">
        Sem ganho de XP positivo nos últimos {WEEKLY_FORECAST_WINDOWS[WEEKLY_FORECAST_WINDOWS.length - 1]} dias — não dá
        para projetar níveis. A previsão atualiza-se sozinha quando voltares a fazer XP.
      </p>
    );
  }

  const currentLevel = levelForExperience(currentExperience);

  return (
    <div className="xp-forecast">
      <p className="daily-simulation-summary">
        Nível atual: <strong style={{ color: accentColor }}>{currentLevel}</strong>. Ritmo médio —{' '}
        {scenarios.map((s, i) => (
          <span key={s.key}>
            {i > 0 && ' · '}
            {s.label}:{' '}
            <strong style={{ color: accentColor }}>
              {s.averageDailyXp === null ? '—' : `${numberFormatter.format(Math.round(s.averageDailyXp))} XP/dia`}
            </strong>
          </span>
        ))}
        .
      </p>

      <div className="simulation-table-wrapper">
        <table className="simulation-table">
          <thead>
            <tr>
              <th>Segunda-feira</th>
              {scenarios.map((s) => (
                <th key={s.key}>{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date.getTime()}>
                <td>{dateFormatter.format(row.date)}</td>
                {row.cells.map((cell) => (
                  <td
                    key={cell.key}
                    title={cell.experience !== null ? `${numberFormatter.format(Math.round(cell.experience))} XP prevista` : undefined}
                    style={cell.leveledUp ? { color: accentColor, fontWeight: 700 } : undefined}
                  >
                    {cell.level ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="daily-simulation-note">
        Nível previsto em cada segunda-feira se o ritmo se mantiver. As colunas usam a média de XP/dia dos últimos 7, 15
        e 30 dias; <strong>Média</strong> é a média desses ritmos. Células destacadas = sobes de nível nessa semana.
      </p>
    </div>
  );
}
