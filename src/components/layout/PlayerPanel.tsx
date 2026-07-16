import { useCharacterState } from '../../hooks/useCharacterState';
import { useSavedHunts } from '../../hooks/useSavedHunts';
import { getLevelProgress } from '../../domain/levelProgress';
import type { PlayerMeta } from '../../constants/players';
import { fetchSharedHistory, fetchTeamPlayerSharedHistory } from '../../storage/sharedHistory';
import { XpInputForm } from '../xp/XpInputForm';
import { LevelProgressCard } from '../xp/LevelProgressCard';
import { XpForecastCard } from '../xp/XpForecastCard';
import { XpProgressChart } from '../charts/XpProgressChart';
import { RecentHistoryList } from '../charts/RecentHistoryList';
import { HuntCalculator } from '../hunt/HuntCalculator';
import { AccessBossSection } from '../accessBoss/AccessBossSection';
import { SkillTrainingCalculator } from '../skillTraining/SkillTrainingCalculator';

interface PlayerPanelProps {
  player: PlayerMeta;
  isActive: boolean;
}

/**
 * Everything for one player: XP input, level progress, history chart, hunt
 * calculator, and the Quests & Bosses checklist. Always kept mounted (see
 * App.tsx) so switching sub-tabs never loses a draft input or state.
 */
export function PlayerPanel({ player, isActive }: PlayerPanelProps) {
  const fetchShared = player.sharedHistorySource === 'team' ? fetchTeamPlayerSharedHistory : fetchSharedHistory;
  const { inputValue, setInputValue, error, history, currentExperience, commitExperience } = useCharacterState(
    player.id,
    fetchShared
  );

  // Owned here rather than inside HuntCalculator so the forecast's respawn
  // picker and the hunt list stay in sync off a single source of truth.
  const { hunts, addHunt, removeHunt } = useSavedHunts(player.id);

  const progress = currentExperience !== null ? getLevelProgress(currentExperience) : null;

  return (
    <section className={isActive ? 'character-panel' : 'character-panel character-panel--hidden'}>
      <header className="character-panel__header" style={{ borderColor: player.accentColor }}>
        <player.Icon className="character-panel__icon" />
        <div>
          <h2 style={{ color: player.accentColor }}>{player.name}</h2>
          <p>{player.tagline}</p>
        </div>
      </header>

      <XpInputForm
        inputId={`xp-input-${player.id}`}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSubmit={commitExperience}
        error={error}
        accentColor={player.accentColor}
      />

      {progress && (
        <>
          <LevelProgressCard progress={progress} accentColor={player.accentColor} />

          <div className="character-panel__block">
            <h3>Progressão</h3>
            <XpProgressChart history={history} accentColor={player.accentColor} />
            <RecentHistoryList history={history} />
          </div>

          <div className="character-panel__block">
            <h3>Previsão dos próximos níveis</h3>
            <XpForecastCard
              characterId={player.id}
              history={history}
              currentExperience={currentExperience}
              accentColor={player.accentColor}
              hunts={hunts}
            />
          </div>

          <div className="character-panel__block">
            <h3>Calculadora de Hunt</h3>
            <HuntCalculator
              idPrefix={`hunt-${player.id}`}
              currentExperience={currentExperience}
              accentColor={player.accentColor}
              hunts={hunts}
              addHunt={addHunt}
              removeHunt={removeHunt}
            />
          </div>

          <SkillTrainingCalculator player={player} />

          <AccessBossSection characterId={player.id} accentColor={player.accentColor} />
        </>
      )}
    </section>
  );
}
