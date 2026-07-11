import type { CharacterId } from '../../domain/types';
import { ACCESS_BOSS_SECTIONS } from '../../data/accessBoss/accessBossList';
import { getOverallProgress } from '../../domain/accessBoss/progress';
import { useCharacterAccessBoss } from '../../hooks/useCharacterAccessBoss';
import { ProgressBar } from '../xp/ProgressBar';
import { AccessBossTable } from './AccessBossTable';

interface AccessBossSectionProps {
  characterId: CharacterId;
  accentColor: string;
}

/** Quests & Bosses checklist for one character: overall progress bar plus the Úteis/Acessos/Bosses table. */
export function AccessBossSection({ characterId, accentColor }: AccessBossSectionProps) {
  const { completedSet, toggleEntry } = useCharacterAccessBoss(characterId);
  const overall = getOverallProgress(ACCESS_BOSS_SECTIONS, completedSet);

  return (
    <div className="character-panel__block">
      <h3>Quests &amp; Bosses</h3>
      <div className="access-boss-overview">
        <ProgressBar percent={overall.percent} accentColor={accentColor} />
        <span className="access-boss-overview__count">{overall.done}/{overall.total} completos</span>
      </div>
      <AccessBossTable sections={ACCESS_BOSS_SECTIONS} completedIds={completedSet} onToggle={toggleEntry} />
    </div>
  );
}
