import { useCharacterState } from '../../hooks/useCharacterState';
import { getLevelProgress } from '../../domain/levelProgress';
import type { VocationMeta } from '../../constants/vocations';
import { XpInputForm } from '../xp/XpInputForm';
import { LevelProgressCard } from '../xp/LevelProgressCard';
import { XpProgressChart } from '../charts/XpProgressChart';
import { RecentHistoryList } from '../charts/RecentHistoryList';
import { HuntCalculator } from '../hunt/HuntCalculator';
import { WheelPlanner } from '../wheel/WheelPlanner';

interface CharacterPanelProps {
  vocation: VocationMeta;
  isActive: boolean;
}

/**
 * Everything for one character: XP input, level progress, history chart and
 * the hunt calculator. Always kept mounted (see App.tsx) so switching tabs
 * never loses a character's draft input or state.
 */
export function CharacterPanel({ vocation, isActive }: CharacterPanelProps) {
  const { inputValue, setInputValue, error, history, currentExperience, commitExperience } =
    useCharacterState(vocation.id);

  const progress = currentExperience !== null ? getLevelProgress(currentExperience) : null;

  return (
    <section className={isActive ? 'character-panel' : 'character-panel character-panel--hidden'}>
      <header className="character-panel__header" style={{ borderColor: vocation.accentColor }}>
        <vocation.Icon className="character-panel__icon" />
        <div>
          <h2 style={{ color: vocation.accentColor }}>{vocation.name}</h2>
          <p>{vocation.tagline}</p>
        </div>
      </header>

      <XpInputForm
        inputId={`xp-input-${vocation.id}`}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSubmit={commitExperience}
        error={error}
        accentColor={vocation.accentColor}
      />

      {progress && (
        <>
          <LevelProgressCard progress={progress} accentColor={vocation.accentColor} />

          <div className="character-panel__block">
            <h3>Progressão</h3>
            <XpProgressChart history={history} accentColor={vocation.accentColor} />
            <RecentHistoryList history={history} />
          </div>

          <div className="character-panel__block">
            <h3>Calculadora de Hunt</h3>
            <HuntCalculator
              characterId={vocation.id}
              idPrefix={`hunt-${vocation.id}`}
              currentExperience={currentExperience}
              accentColor={vocation.accentColor}
            />
          </div>

          <div className="character-panel__block">
            <h3>Wheel of Destiny</h3>
            <WheelPlanner
              characterId={vocation.id}
              currentExperience={currentExperience}
              accentColor={vocation.accentColor}
            />
          </div>
        </>
      )}
    </section>
  );
}
