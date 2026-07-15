import { useMemo } from 'react';
import type { HistoryEntry } from '../../domain/types';
import {
  computeRecentDailyRate,
  forecastNextLevels,
  FORECAST_WINDOW_DAYS,
} from '../../domain/xpForecast';

interface XpForecastCardProps {
  history: HistoryEntry[];
  currentExperience: number | null;
  accentColor: string;
  /** How many upcoming levels to project. */
  levelCount?: number;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');
const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Rounds a fractional-day count into a friendly "X dias" / "hoje" label. */
function formatDays(days: number): string {
  if (days < 0.5) return 'hoje';
  const rounded = Math.round(days);
  return `${numberFormatter.format(rounded)} ${rounded === 1 ? 'dia' : 'dias'}`;
}

/**
 * Prediction built straight from the stored XP history: it takes the average
 * XP/day over the last {@link FORECAST_WINDOW_DAYS} days and projects when the
 * character will hit each of the next levels — no hand-typed exp/h needed.
 */
export function XpForecastCard({ history, currentExperience, accentColor, levelCount = 10 }: XpForecastCardProps) {
  const rate = useMemo(() => computeRecentDailyRate(history, FORECAST_WINDOW_DAYS), [history]);
  const forecast = useMemo(
    () =>
      rate && currentExperience !== null
        ? forecastNextLevels(currentExperience, rate.averageDailyXp, levelCount)
        : [],
    [rate, currentExperience, levelCount]
  );

  if (!rate || currentExperience === null) {
    return (
      <p className="chart-empty-state">
        Precisas de pelo menos 2 registos de XP nos últimos {FORECAST_WINDOW_DAYS} dias para gerar uma previsão.
      </p>
    );
  }

  const roundedSpan = Math.max(1, Math.round(rate.daysCovered));

  return (
    <div className="xp-forecast">
      <p className="daily-simulation-summary">
        Média dos últimos {roundedSpan} {roundedSpan === 1 ? 'dia' : 'dias'} ({rate.readingsUsed} registos):{' '}
        <strong style={{ color: accentColor }}>{numberFormatter.format(Math.round(rate.averageDailyXp))}</strong> XP/dia.
      </p>

      {forecast.length === 0 ? (
        <p className="daily-simulation-note">
          Sem ganho de XP positivo nos últimos {FORECAST_WINDOW_DAYS} dias — não dá para prever os próximos níveis. Volta a
          fazer hunt e a previsão atualiza-se sozinha.
        </p>
      ) : (
        <div className="simulation-table-wrapper">
          <table className="simulation-table">
            <thead>
              <tr>
                <th>Nível</th>
                <th>XP em falta</th>
                <th>Tempo estimado</th>
                <th>Data prevista</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((step, index) => (
                <tr key={step.level} className={index === 0 ? 'is-final-row' : undefined}>
                  <td>{step.level}</td>
                  <td>{numberFormatter.format(Math.round(step.experienceNeeded))}</td>
                  <td>{formatDays(step.daysToReach)}</td>
                  <td>{dateFormatter.format(step.estimatedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="daily-simulation-note">
        Estimativa com base no ritmo real dos últimos {FORECAST_WINDOW_DAYS} dias, assumindo que o manténs.
      </p>
    </div>
  );
}
