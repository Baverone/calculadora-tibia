import { LOYALTY_BONUS_OPTIONS, VOCATION_LABELS, VOCATION_SKILLS, type TrainableSkill, type Vocation } from '../../domain/skillTraining';
import type { CharacterId } from '../../domain/types';
import { useSkillTrainingConfig } from '../../hooks/useSkillTrainingConfig';
import type { SkillEntryInput } from '../../storage/skillTrainingStorage';
import { SkillTrainingRow } from './SkillTrainingRow';

interface SkillTrainingCalculatorProps {
  characterId: CharacterId;
  accentColor: string;
}

const VOCATIONS: Vocation[] = ['knight', 'paladin', 'sorcerer', 'druid', 'monk'];
const KNIGHT_WEAPONS: ('axe' | 'sword' | 'club')[] = ['axe', 'sword', 'club'];
const EMPTY_ENTRY: SkillEntryInput = { level: '', percent: '' };

/** Which skills should get a row, given the chosen vocation and (for Knight) chosen weapons. */
function activeSkills(vocation: Vocation, knightWeapons: ('axe' | 'sword' | 'club')[]): TrainableSkill[] {
  if (vocation !== 'knight') return VOCATION_SKILLS[vocation];
  return [...knightWeapons, 'magic', 'shielding'];
}

export function SkillTrainingCalculator({ characterId, accentColor }: SkillTrainingCalculatorProps) {
  const { config, updateConfig } = useSkillTrainingConfig(characterId);

  function setVocation(vocation: Vocation) {
    updateConfig((current) => ({ ...current, vocation }));
  }

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

  const skills = config.vocation ? activeSkills(config.vocation, config.knightWeapons) : [];

  return (
    <div className="character-panel__block">
      <h3>Calculadora de Varinhas de Treino</h3>

      <div className="hunt-form__field" style={{ marginBottom: 14 }}>
        <label>Vocação</label>
        <div className="vocation-selector">
          {VOCATIONS.map((vocation) => (
            <button
              key={vocation}
              type="button"
              className={
                vocation === config.vocation ? 'vocation-selector__option vocation-selector__option--active' : 'vocation-selector__option'
              }
              style={vocation === config.vocation ? { borderColor: accentColor, color: accentColor } : undefined}
              onClick={() => setVocation(vocation)}
            >
              {VOCATION_LABELS[vocation]}
            </button>
          ))}
        </div>
      </div>

      {config.vocation === 'knight' && (
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

      {config.vocation && (
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

      {config.vocation && skills.length === 0 && (
        <p className="chart-empty-state">Seleciona pelo menos uma arma para o Knight treinar.</p>
      )}

      {config.vocation && skills.length > 0 && (
        <div className="saved-hunts-list">
          {skills.map((skill) => (
            <SkillTrainingRow
              key={skill}
              skill={skill}
              vocation={config.vocation as Vocation}
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
