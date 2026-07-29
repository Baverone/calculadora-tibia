import {
  calculateSkillTraining,
  LASTING_EXERCISE_CHARGES,
  minSkillLevel,
  SKILL_LABELS,
  type TrainableSkill,
  type Vocation,
} from '../../domain/skillTraining';
import { parseNonNegativeInteger, parsePercentMissing } from '../../domain/validation';
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

const lastingFormatter = new Intl.NumberFormat('pt-PT');

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
  const percentMissingResult = parsePercentMissing(entry.percent);

  const levelError =
    entry.level.trim() !== '' && levelResult.ok && levelResult.value < minLevel
      ? `${SKILL_LABELS[skill]} começa no nível ${minLevel}.`
      : null;

  const canCalculate = levelResult.ok && percentMissingResult.ok && !levelError;

  const result =
    canCalculate && levelResult.ok && percentMissingResult.ok
      ? calculateSkillTraining(
          skill,
          vocation,
          levelResult.value,
          100 - percentMissingResult.value,
          specialDummy,
          loyaltyBonusPercent
        )
      : null;

  const lastingNormal = result ? Math.ceil(result.chargesNormal / LASTING_EXERCISE_CHARGES) : 0;
  const lastingDoubleEvent = result ? Math.ceil(result.chargesDoubleEvent / LASTING_EXERCISE_CHARGES) : 0;
  const lastingNormalBase = result ? Math.ceil(result.chargesNormalBase / LASTING_EXERCISE_CHARGES) : 0;
  const lastingDoubleEventBase = result ? Math.ceil(result.chargesDoubleEventBase / LASTING_EXERCISE_CHARGES) : 0;

  const hasLoyalty = loyaltyBonusPercent > 0;
  const displayedLevel = levelResult.ok ? levelResult.value : 0;
  const displayedMissing = percentMissingResult.ok ? percentMissingResult.value : 0;

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
          <label>% que falta para o próximo nível</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="ex: 67.5"
            value={entry.percent}
            onChange={(e) => onChange({ ...entry, percent: e.target.value })}
          />
        </div>
      </div>

      {(levelError ||
        (entry.level.trim() !== '' && !levelResult.ok) ||
        (entry.percent.trim() !== '' && !percentMissingResult.ok)) && (
        <p className="field-error">
          {levelError ?? (!levelResult.ok ? levelResult.error : '') ?? (!percentMissingResult.ok ? percentMissingResult.error : '')}
        </p>
      )}

      {result && hasLoyalty && (
        <p className="skill-training-base-hint">
          <strong>No jogo (com Loyalty):</strong> nível {displayedLevel}, faltam {displayedMissing}% para {displayedLevel + 1}.
          <br />
          <strong>Nível base real (sem Loyalty):</strong> {result.baseLevel}, faltam {(100 - result.basePercent).toFixed(2)}% para{' '}
          {result.baseLevel + 1} — é a partir daqui que o treino conta; a Loyalty só infla o número mostrado, não acelera o treino real.
        </p>
      )}

      {result && (
        <table className="hunt-scenario-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Lasting Exercise necessárias</th>
              <th>Sem evento</th>
              <th>Com Double Skill Event</th>
            </tr>
          </thead>
          <tbody>
            {hasLoyalty && (
              <tr>
                <td>
                  No jogo, com Loyalty ({displayedLevel}→{displayedLevel + 1})
                </td>
                <td>{lastingFormatter.format(lastingNormal)}</td>
                <td>{lastingFormatter.format(lastingDoubleEvent)}</td>
              </tr>
            )}
            <tr>
              <td>
                {hasLoyalty
                  ? `Nível base, sem Loyalty (${result.baseLevel}→${result.baseLevel + 1})`
                  : `Nível ${displayedLevel}→${displayedLevel + 1}`}
              </td>
              <td>{lastingFormatter.format(hasLoyalty ? lastingNormalBase : lastingNormal)}</td>
              <td>{lastingFormatter.format(hasLoyalty ? lastingDoubleEventBase : lastingDoubleEvent)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
