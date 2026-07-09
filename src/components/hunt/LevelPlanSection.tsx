import { type FormEvent, useMemo, useState } from 'react';
import { buildLevelPlan } from '../../domain/levelPlan';
import { formatHoursAndMinutes } from '../../domain/huntCalculator';
import { levelForExperience, MAX_KNOWN_LEVEL } from '../../domain/experienceTable';
import { parseNonNegativeInteger, validateLevelPlanTarget } from '../../domain/validation';

interface LevelPlanSectionProps {
  idPrefix: string;
  currentExperience: number;
  rawExperiencePerHour: number;
  accentColor: string;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');

/**
 * Lets the user pick a target level and see a row-by-row breakdown of every
 * level in between: XP needed, and time for both bonus scenarios
 * (Stamina 150%, Stamina + Boost 225%) side by side for direct comparison.
 */
export function LevelPlanSection({ idPrefix, currentExperience, rawExperiencePerHour, accentColor }: LevelPlanSectionProps) {
  const currentLevel = levelForExperience(currentExperience);

  const [targetLevelInput, setTargetLevelInput] = useState('');
  const [submittedTargetLevel, setSubmittedTargetLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plan = useMemo(() => {
    if (submittedTargetLevel === null) return null;
    return buildLevelPlan(currentExperience, submittedTargetLevel, rawExperiencePerHour);
  }, [submittedTargetLevel, currentExperience, rawExperiencePerHour]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const numberResult = parseNonNegativeInteger(targetLevelInput, 'o nível objetivo');
    if (!numberResult.ok) {
      setError(numberResult.error);
      return;
    }

    const rangeResult = validateLevelPlanTarget(numberResult.value, currentLevel, MAX_KNOWN_LEVEL);
    if (!rangeResult.ok) {
      setError(rangeResult.error);
      return;
    }

    setError(null);
    setSubmittedTargetLevel(rangeResult.value);
  }

  const lastStep = plan && plan.length > 0 ? plan[plan.length - 1] : null;

  return (
    <div className="level-plan-section">
      <form className="hunt-form" onSubmit={handleSubmit}>
        <div className="hunt-form__field">
          <label htmlFor={`${idPrefix}-target-level`}>
            Nível objetivo <span className="hunt-form__auto-tag">nível atual: {currentLevel}</span>
          </label>
          <input
            id={`${idPrefix}-target-level`}
            type="text"
            inputMode="numeric"
            placeholder="ex: 300"
            value={targetLevelInput}
            onChange={(e) => setTargetLevelInput(e.target.value)}
          />
        </div>

        <button type="submit" style={{ backgroundColor: accentColor }}>
          Calcular plano
        </button>

        {error && <p className="field-error">{error}</p>}
      </form>

      {plan && (
        <div className="level-plan-table-wrapper">
          <table className="level-plan-table">
            <thead>
              <tr>
                <th rowSpan={2}>Nível</th>
                <th rowSpan={2}>XP necessária</th>
                <th colSpan={2}>Stamina (150%)</th>
                <th colSpan={2}>Stamina + Boost (225%)</th>
              </tr>
              <tr>
                <th>Tempo</th>
                <th>Acumulado</th>
                <th>Tempo</th>
                <th>Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((step) => (
                <tr key={step.level}>
                  <td>{step.level}</td>
                  <td>{numberFormatter.format(Math.round(step.experienceNeeded))}</td>
                  <td>{formatHoursAndMinutes(step.hoursAtStamina)}</td>
                  <td>{formatHoursAndMinutes(step.cumulativeHoursAtStamina)}</td>
                  <td>{formatHoursAndMinutes(step.hoursAtStaminaBoost)}</td>
                  <td>{formatHoursAndMinutes(step.cumulativeHoursAtStaminaBoost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lastStep && (
            <p className="level-plan-total">
              Tempo total estimado até ao nível {submittedTargetLevel}: Stamina (150%){' '}
              <strong>{formatHoursAndMinutes(lastStep.cumulativeHoursAtStamina)}</strong> · Stamina + Boost (225%){' '}
              <strong>{formatHoursAndMinutes(lastStep.cumulativeHoursAtStaminaBoost)}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
