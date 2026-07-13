import {
  calculateSkillTraining,
  EXERCISE_WEAPON_TIERS,
  minSkillLevel,
  SKILL_LABELS,
  type TrainableSkill,
  type Vocation,
} from '../../domain/skillTraining';
import { parseNonNegativeInteger, parsePercentInLevel } from '../../domain/validation';
import type { SkillEntryInput } from '../../storage/skillTrainingStorage';

interface SkillTrainingRowProps {
  skill: TrainableSkill;
  vocation: Vocation;
  entry: SkillEntryInput;
  specialDummy: boolean;
  loyaltyBonusPercent: number;
  onChange: (entry: SkillEntryInput) => void;
  accentColor: string;
}

const chargesFormatter = new Intl.NumberFormat('pt-PT');

/** How many of the biggest-first weapon tiers cover a number of charges, e.g. "1x Exercise + 40 cargas". */
function breakdownCharges(charges: number): string {
  if (charges <= 0) return '0 cargas';

  let remaining = charges;
  const parts: string[] = [];

  for (const tier of [...EXERCISE_WEAPON_TIERS].reverse()) {
    const count = Math.floor(remaining / tier.charges);
    if (count > 0) {
      parts.push(`${count}x ${tier.label}`);
      remaining -= count * tier.charges;
    }
  }
  if (remaining > 0) {
    parts.push(`${chargesFormatter.format(Math.ceil(remaining))} carga(s) extra`);
  }

  return parts.join(' + ');
}

export function SkillTrainingRow({
  skill,
  vocation,
  entry,
  specialDummy,
  loyaltyBonusPercent,
  onChange,
  accentColor,
}: SkillTrainingRowProps) {
  const minLevel = minSkillLevel(skill);

  const levelResult = parseNonNegativeInteger(entry.level, 'o nível');
  const percentResult = parsePercentInLevel(entry.percent);

  const levelError =
    entry.level.trim() !== '' && levelResult.ok && levelResult.value < minLevel
      ? `${SKILL_LABELS[skill]} começa no nível ${minLevel}.`
      : null;

  const canCalculate = levelResult.ok && percentResult.ok && !levelError;

  const result =
    canCalculate && levelResult.ok && percentResult.ok
      ? calculateSkillTraining(skill, vocation, levelResult.value, percentResult.value, specialDummy, loyaltyBonusPercent)
      : null;

  return (
    <div className="saved-hunt-card">
      <div className="saved-hunt-card__header">
        <h4 style={{ color: accentColor }}>{SKILL_LABELS[skill]}</h4>
      </div>

      <div className="hunt-form" style={{ marginTop: 10 }}>
        <div className="hunt-form__field">
          <label>Nível atual</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder={`ex: ${minLevel}`}
            value={entry.level}
            onChange={(e) => onChange({ ...entry, level: e.target.value })}
          />
        </div>
        <div className="hunt-form__field">
          <label>% no nível atual</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="ex: 32.5"
            value={entry.percent}
            onChange={(e) => onChange({ ...entry, percent: e.target.value })}
          />
        </div>
      </div>

      {(levelError || (entry.level.trim() !== '' && !levelResult.ok) || (entry.percent.trim() !== '' && !percentResult.ok)) && (
        <p className="field-error">
          {levelError ?? (!levelResult.ok ? levelResult.error : '') ?? (!percentResult.ok ? percentResult.error : '')}
        </p>
      )}

      {result && loyaltyBonusPercent > 0 && (
        <p className="skill-training-base-hint">
          Nível base (sem Loyalty): <strong>{result.baseLevel}</strong> ({result.basePercent.toFixed(2)}%) — as varinhas de treino são
          calculadas a partir daqui, porque a Loyalty só infla o nível mostrado, não acelera o treino real.
        </p>
      )}

      {result && (
        <table className="hunt-scenario-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th></th>
              <th>Sem evento</th>
              <th>Com Double Skill Event</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cargas necessárias</td>
              <td>{chargesFormatter.format(result.chargesNormal)}</td>
              <td>{chargesFormatter.format(result.chargesDoubleEvent)}</td>
            </tr>
            <tr>
              <td>Armas de treino</td>
              <td>{breakdownCharges(result.chargesNormal)}</td>
              <td>{breakdownCharges(result.chargesDoubleEvent)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
