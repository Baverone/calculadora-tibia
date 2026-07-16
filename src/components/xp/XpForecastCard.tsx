import { useMemo, useState } from 'react';
import type { CharacterId, HistoryEntry, SavedHunt } from '../../domain/types';
import {
  computeRecentDailyRate,
  dailyXpFromHunt,
  forecastNextLevels,
  FORECAST_WINDOW_DAYS,
} from '../../domain/xpForecast';
import { parseNonNegativeNumber } from '../../domain/validation';

interface XpForecastCardProps {
  characterId: CharacterId;
  history: HistoryEntry[];
  currentExperience: number | null;
  accentColor: string;
  /** Owned by PlayerPanel and shared with HuntCalculator, so a hunt saved there appears here immediately. */
  hunts: SavedHunt[];
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
 * Predicts when each of the next levels lands, under two hypotheses shown
 * side by side:
 *
 *  - "Ritmo real": the average XP/day over the last {@link FORECAST_WINDOW_DAYS}
 *    days, taken straight from the stored history — nothing to type in.
 *  - "Respawn": a saved hunt's raw exp/h turned into an XP/day via the daily
 *    routine (hours with/without Boost) the user enters once.
 *
 * Both are expressed as dates so they're directly comparable — the real pace
 * answers "when do I level if I carry on as I have been", the respawn answers
 * "when do I level if I actually do this hunt every day".
 */
export function XpForecastCard({
  characterId,
  history,
  currentExperience,
  accentColor,
  hunts,
  levelCount = 10,
}: XpForecastCardProps) {
  const [selectedHuntId, setSelectedHuntId] = useState('');
  const [hoursWithBoostInput, setHoursWithBoostInput] = useState('');
  const [hoursWithoutBoostInput, setHoursWithoutBoostInput] = useState('');

  const rate = useMemo(() => computeRecentDailyRate(history, FORECAST_WINDOW_DAYS), [history]);

  const realForecast = useMemo(
    () =>
      rate && currentExperience !== null
        ? forecastNextLevels(currentExperience, rate.averageDailyXp, levelCount)
        : [],
    [rate, currentExperience, levelCount]
  );

  const selectedHunt = hunts.find((hunt) => hunt.id === selectedHuntId) ?? null;

  // Only builds the respawn column once a hunt is picked and the hours entered
  // are valid and add up to something — otherwise there's no XP/day to project.
  const huntDailyXp = useMemo(() => {
    if (!selectedHunt) return null;
    const withBoost = parseNonNegativeNumber(hoursWithBoostInput || '0', 'as horas com Boost');
    const withoutBoost = parseNonNegativeNumber(hoursWithoutBoostInput || '0', 'as horas sem Boost');
    if (!withBoost.ok || !withoutBoost.ok) return null;
    const total = withBoost.value + withoutBoost.value;
    if (total <= 0 || total > 24) return null;
    return dailyXpFromHunt(selectedHunt.rawExperiencePerHour, withBoost.value, withoutBoost.value);
  }, [selectedHunt, hoursWithBoostInput, hoursWithoutBoostInput]);

  const huntForecast = useMemo(
    () =>
      huntDailyXp !== null && currentExperience !== null
        ? forecastNextLevels(currentExperience, huntDailyXp, levelCount)
        : [],
    [huntDailyXp, currentExperience, levelCount]
  );

  if (!rate || currentExperience === null) {
    return (
      <p className="chart-empty-state">
        Precisas de pelo menos 2 registos de XP nos últimos {FORECAST_WINDOW_DAYS} dias para gerar uma previsão.
      </p>
    );
  }

  const roundedSpan = Math.max(1, Math.round(rate.daysCovered));
  const showHuntColumn = huntForecast.length > 0;

  return (
    <div className="xp-forecast">
      <p className="daily-simulation-summary">
        <strong>Ritmo real:</strong> média dos últimos {roundedSpan} {roundedSpan === 1 ? 'dia' : 'dias'} (
        {rate.readingsUsed} registos):{' '}
        <strong style={{ color: accentColor }}>{numberFormatter.format(Math.round(rate.averageDailyXp))}</strong> XP/dia.
      </p>

      {hunts.length === 0 ? (
        <p className="daily-simulation-note">
          Guarda uma hunt na Calculadora de Hunt para comparares o ritmo real com o respawn.
        </p>
      ) : (
        <form className="hunt-form" onSubmit={(e) => e.preventDefault()}>
          <div className="hunt-form__field">
            <label htmlFor={`forecast-hunt-${characterId}`}>Comparar com o respawn</label>
            <select
              id={`forecast-hunt-${characterId}`}
              value={selectedHuntId}
              onChange={(e) => setSelectedHuntId(e.target.value)}
            >
              <option value="">— nenhum —</option>
              {hunts.map((hunt) => (
                <option key={hunt.id} value={hunt.id}>
                  {hunt.name || 'Hunt sem nome'} ({numberFormatter.format(hunt.rawExperiencePerHour)} exp/h)
                </option>
              ))}
            </select>
          </div>

          <div className="hunt-form__field">
            <label htmlFor={`forecast-boost-${characterId}`}>Horas/dia com Boost</label>
            <input
              id={`forecast-boost-${characterId}`}
              type="text"
              inputMode="decimal"
              placeholder="ex: 1"
              value={hoursWithBoostInput}
              onChange={(e) => setHoursWithBoostInput(e.target.value)}
            />
          </div>

          <div className="hunt-form__field">
            <label htmlFor={`forecast-noboost-${characterId}`}>Horas/dia sem Boost</label>
            <input
              id={`forecast-noboost-${characterId}`}
              type="text"
              inputMode="decimal"
              placeholder="ex: 4"
              value={hoursWithoutBoostInput}
              onChange={(e) => setHoursWithoutBoostInput(e.target.value)}
            />
          </div>
        </form>
      )}

      {selectedHunt && huntDailyXp !== null && (
        <p className="daily-simulation-summary">
          <strong>Respawn ({selectedHunt.name || 'sem nome'}):</strong>{' '}
          <strong style={{ color: accentColor }}>{numberFormatter.format(Math.round(huntDailyXp))}</strong> XP/dia com
          essa rotina.
        </p>
      )}

      {selectedHunt && huntDailyXp === null && (
        <p className="daily-simulation-note">Indica as horas/dia (total entre 0 e 24) para veres a coluna do respawn.</p>
      )}

      {realForecast.length === 0 ? (
        <p className="daily-simulation-note">
          Sem ganho de XP positivo nos últimos {FORECAST_WINDOW_DAYS} dias — não dá para prever pelo ritmo real. Volta a
          fazer hunt e a previsão atualiza-se sozinha.
        </p>
      ) : (
        <div className="simulation-table-wrapper">
          <table className="simulation-table">
            <thead>
              <tr>
                <th rowSpan={2}>Nível</th>
                <th rowSpan={2}>XP em falta</th>
                <th colSpan={2}>Ritmo real ({FORECAST_WINDOW_DAYS} dias)</th>
                {showHuntColumn && <th colSpan={2}>Respawn ({selectedHunt?.name || 'sem nome'})</th>}
              </tr>
              <tr>
                <th>Tempo</th>
                <th>Data</th>
                {showHuntColumn && (
                  <>
                    <th>Tempo</th>
                    <th>Data</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {realForecast.map((step, index) => {
                const huntStep = huntForecast[index];
                return (
                  <tr key={step.level} className={index === 0 ? 'is-final-row' : undefined}>
                    <td>{step.level}</td>
                    <td>{numberFormatter.format(Math.round(step.experienceNeeded))}</td>
                    <td>{formatDays(step.daysToReach)}</td>
                    <td>{dateFormatter.format(step.estimatedDate)}</td>
                    {showHuntColumn && huntStep && (
                      <>
                        <td>{formatDays(huntStep.daysToReach)}</td>
                        <td>{dateFormatter.format(huntStep.estimatedDate)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="daily-simulation-note">
        Ritmo real = o que fizeste mesmo nos últimos {FORECAST_WINDOW_DAYS} dias (inclui dias parados). Respawn = se
        fizeres essa hunt todos os dias com a rotina indicada.
      </p>
    </div>
  );
}
