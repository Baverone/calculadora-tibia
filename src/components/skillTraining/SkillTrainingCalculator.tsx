import { LOYALTY_BONUS_OPTIONS, VOCATION_LABELS, VOCATION_SKILLS, type TrainableSkill, type Vocation } from '../../domain/skillTraining';
import type { PlayerMeta } from '../../constants/players';
import { useCharacterVocation } from '../../hooks/useCharacterVocation';
import { useSkillTrainingConfig } from '../../hooks/useSkillTrainingConfig';
import type { SkillEntryInput } from '../../storage/skillTrainingStorage';
import { SkillTrainingRow } from './SkillTrainingRow';

interface SkillTrainingCalculatorProps {
  player: PlayerMeta;
}

const VOCATIONS: Vocation[] = ['knight', 'paladin', 'sorcerer', 'druid', 'monk'];
const KNIGHT_WEAPONS: ('axe' | 'sword' | 'club')[] = ['axe', 'sword', 'club'];
const EMPTY_ENTRY: SkillEntryInput = { level: '', percent: '' };

/** Which skills should get a row, given the vocation and (for Knight) chosen weapons. */
function activeSkills(vocation: Vocation, knightWeapons: ('axe' | 'sword' | 'club')[]): TrainableSkill[] {
  if (vocation !== 'knight') return VOCATION_SKILLS[vocation];
  return [...knightWeapons, 'magic', 'shielding'];
}

export function SkillTrainingCalculator({ player }: SkillTrainingCalculatorProps) {
  const accentColor = player.accentColor;
  const { vocation, loading, detect, setManualVocation } = useCharacterVocation(player.id, player.name);
  const { config, updateConfig } = useSkillTrainingConfig(player.id);

  function toggleKnightWeapon(weapon: 'axe' | 'sword' | 'club') {
    updateConfig((current) => {
      const has = current.knightWeapons.includes(weapon);
      return {
        ...current,
        knightWeapons: has ? current.knightWeapons.filter((w) => w !== weapon) : [...current.knightWeapons, weapon],
      };
    });
  }

  function toggleSpecialDummy() {
    updateConfig((current) => ({ ...current, specialDummy: !current.specialDummy }));
  }

  function setLoyaltyBonus(loyaltyBonusPercent: number) {
    updateConfig((current) => ({ ...current, loyaltyBonusPercent }));
  }

  function setSkillEntry(skill: TrainableSkill, entry: SkillEntryInput) {
    updateConfig((current) => ({ ...current, skills: { ...current.skills, [skill]: entry } }));
  }

  const skills = vocation ? activeSkills(vocation, config.knightWeapons) : [];

  return (
    <div className="character-panel__block">
      <h3>Calculadora de Varinhas de Treino</h3>

      <div className="hunt-form__field" style={{ marginBottom: 14 }}>
        <label>Vocação</label>
        {loading && <p className="chart-empty-state">A detetar vocação de {player.name}...</p>}

        {!loading && vocation && (
          <p className="skill-training-vocation">
            <span style={{ color: accentColor, fontWeight: 'bold' }}>{VOCATION_LABELS[vocation]}</span>
            <button type="button" className="skill-training-vocation__refresh" onClick={() => detect()} title="Voltar a detetar">
              🔄
            </button>
          </p>
        )}

        {!loading && !vocation && (
          <>
            <p className="field-error">Não foi possível detetar a vocação de {player.name} automaticamente. Escolhe manualmente:</p>
            <div className="vocation-selector">
              {VOCATIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="vocation-selector__option"
                  onClick={() => setManualVocation(v)}
                >
                  {VOCATION_LABELS[v]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {vocation === 'knight' && (
        <div className="hunt-form__field" style={{ marginBottom: 14 }}>
          <label>Arma(s) a treinar</label>
          <div className="vocation-selector">
            {KNIGHT_WEAPONS.map((weapon) => (
              <button
                key={weapon}
                type="button"
                className={
                  config.knightWeapons.includes(weapon)
                    ? 'vocation-selector__option vocation-selector__option--active'
                    : 'vocation-selector__option'
                }
                style={config.knightWeapons.includes(weapon) ? { borderColor: accentColor, color: accentColor } : undefined}
                onClick={() => toggleKnightWeapon(weapon)}
              >
                {weapon === 'axe' ? 'Axe' : weapon === 'sword' ? 'Sword' : 'Club'}
              </button>
            ))}
          </div>
        </div>
      )}

      {vocation && (
        <>
          <label className="skill-training-dummy-toggle">
            <input type="checkbox" checked={config.specialDummy} onChange={toggleSpecialDummy} />
            Dummy especial (Monk/Demon/Ferumbras Exercise Dummy, +10% eficiência)
          </label>

          <div className="hunt-form__field" style={{ marginBottom: 14, maxWidth: 260 }}>
            <label>Loyalty da conta</label>
            <div className="vocation-selector">
              {LOYALTY_BONUS_OPTIONS.map((bonus) => (
                <button
                  key={bonus}
                  type="button"
                  className={
                    bonus === config.loyaltyBonusPercent
                      ? 'vocation-selector__option vocation-selector__option--active'
                      : 'vocation-selector__option'
                  }
                  style={bonus === config.loyaltyBonusPercent ? { borderColor: accentColor, color: accentColor } : undefined}
                  onClick={() => setLoyaltyBonus(bonus)}
                >
                  {bonus}%
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {vocation === 'knight' && skills.length === 0 && (
        <p className="chart-empty-state">Seleciona pelo menos uma arma para o Knight treinar.</p>
      )}

      {vocation && skills.length > 0 && (
        <div className="saved-hunts-list">
          {skills.map((skill) => (
            <SkillTrainingRow
              key={skill}
              skill={skill}
              vocation={vocation}
              entry={config.skills[skill] ?? EMPTY_ENTRY}
              specialDummy={config.specialDummy}
              loyaltyBonusPercent={config.loyaltyBonusPercent}
              onChange={(entry) => setSkillEntry(skill, entry)}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
