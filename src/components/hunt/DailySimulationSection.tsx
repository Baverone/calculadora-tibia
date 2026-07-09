import { type FormEvent, useState } from 'react';
import { simulateExperienceByDate } from '../../domain/dailySimulation';
import { parseFutureDate, parseNonNegativeNumber } from '../../domain/validation';
import type { DailySimulationResult, SimulationGranularity } from '../../domain/types';

interface DailySimulationSectionProps {
  idPrefix: string;
  currentExperience: number;
  rawExperiencePerHour: number;
  accentColor: string;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');
const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

const GRANULARITY_NOTES: Record<SimulationGranularity, string> = {
  daily: 'Mostrado dia a dia.',
  weekly: 'Intervalo grande — mostrado um checkpoint a cada 7 dias, mais a data final.',
  monthly: 'Intervalo muito grande — mostrado um checkpoint no dia 1 de cada mês, mais a data final.',
};

/**
 * Projects the character's level over time (not just on the final date),
 * assuming the same daily routine (hours with/without Boost) repeats every
 * day between today and the chosen date. Rows are daily, weekly, or monthly
 * depending on how long the range is — see domain/dailySimulation.ts.
 */
export function DailySimulationSection({
  idPrefix,
  currentExperience,
  rawExperiencePerHour,
  accentColor,
}: DailySimulationSectionProps) {
  const [hoursWithBoostInput, setHoursWithBoostInput] = useState('');
  const [hoursWithoutBoostInput, setHoursWithoutBoostInput] = useState('');
  const [targetDateInput, setTargetDateInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DailySimulationResult | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const withBoostResult = parseNonNegativeNumber(hoursWithBoostInput, 'as horas com Boost por dia');
    if (!withBoostResult.ok) {
      setError(withBoostResult.error);
      return;
    }
    const withoutBoostResult = parseNonNegativeNumber(hoursWithoutBoostInput, 'as horas sem Boost por dia');
    if (!withoutBoostResult.ok) {
      setError(withoutBoostResult.error);
      return;
    }
    const totalHoursPerDay = withBoostResult.value + withoutBoostResult.value;
    if (totalHoursPerDay <= 0) {
      setError('O total de horas de hunt por dia tem de ser maior que zero.');
      return;
    }
    if (totalHoursPerDay > 24) {
      setError('O total de horas de hunt por dia não pode exceder 24.');
      return;
    }

    const dateResult = parseFutureDate(targetDateInput);
    if (!dateResult.ok) {
      setError(dateResult.error);
      return;
    }

    setError(null);
    setResult(
      simulateExperienceByDate(
        currentExperience,
        rawExperiencePerHour,
        withBoostResult.value,
        withoutBoostResult.value,
        dateResult.value
      )
    );
  }

  const finalCheckpoint = result ? result.checkpoints[result.checkpoints.length - 1] : null;

  return (
    <div className="daily-simulation-section">
      <form className="hunt-form" onSubmit={handleSubmit}>
        <div className="hunt-form__field">
          <label htmlFor={`${idPrefix}-hours-with-boost`}>Horas/dia com Boost</label>
          <input
            id={`${idPrefix}-hours-with-boost`}
            type="text"
            inputMode="decimal"
            placeholder="ex: 1"
            value={hoursWithBoostInput}
            onChange={(e) => setHoursWithBoostInput(e.target.value)}
          />
        </div>

        <div className="hunt-form__field">
          <label htmlFor={`${idPrefix}-hours-without-boost`}>Horas/dia sem Boost</label>
          <input
            id={`${idPrefix}-hours-without-boost`}
            type="text"
            inputMode="decimal"
            placeholder="ex: 4"
            value={hoursWithoutBoostInput}
            onChange={(e) => setHoursWithoutBoostInput(e.target.value)}
          />
        </div>

        <div className="hunt-form__field">
          <label htmlFor={`${idPrefix}-target-date`}>Data objetivo</label>
          <input
            id={`${idPrefix}-target-date`}
            type="date"
            value={targetDateInput}
            onChange={(e) => setTargetDateInput(e.target.value)}
          />
        </div>

        <button type="submit" style={{ backgroundColor: accentColor }}>
          Simular
        </button>

        {error && <p className="field-error">{error}</p>}
      </form>

      {result && finalCheckpoint && (
        <div className="daily-simulation-result">
          <p className="daily-simulation-summary">
            Em <strong>{dateFormatter.format(finalCheckpoint.date)}</strong> ({result.daysSimulated}{' '}
            {result.daysSimulated === 1 ? 'dia' : 'dias'} de hunt), estarás por volta do nível{' '}
            <strong>{finalCheckpoint.level}</strong> ({numberFormatter.format(Math.round(finalCheckpoint.finalExperience))}{' '}
            XP, +{numberFormatter.format(Math.round(finalCheckpoint.totalExperienceGained))} XP ganha).
          </p>

          <div className="simulation-table-wrapper">
            <table className="simulation-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nível estimado</th>
                  <th>XP acumulada</th>
                </tr>
              </thead>
              <tbody>
                {result.checkpoints.map((checkpoint) => (
                  <tr
                    key={checkpoint.daysSinceStart}
                    className={checkpoint === finalCheckpoint ? 'is-final-row' : undefined}
                  >
                    <td>{dateFormatter.format(checkpoint.date)}</td>
                    <td>{checkpoint.level}</td>
                    <td>{numberFormatter.format(Math.round(checkpoint.totalExperienceGained))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="daily-simulation-note">{GRANULARITY_NOTES[result.granularity]}</p>
        </div>
      )}
    </div>
  );
}
