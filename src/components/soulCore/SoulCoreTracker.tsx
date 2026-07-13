import { PLAYERS } from '../../constants/players';
import type { CharacterId } from '../../domain/types';
import { useSoulCoreTracker } from '../../hooks/useSoulCoreTracker';
import { SoulCorePriorityBar } from './SoulCorePriorityBar';
import { SoulCoreGrid } from './SoulCoreGrid';
import { SoulCoreAssignmentPanel } from './SoulCoreAssignmentPanel';

// The 3 original characters this tracker groups — same trio the rest of the
// app was originally built around, before the multi-team roster existed.
const TRACKED_CHARACTER_IDS: CharacterId[] = ['royal-paladin', 'exalted-monk', 'elite-knight'];

const PLAYERS_BY_ID = Object.fromEntries(PLAYERS.map((p) => [p.id, p]));

export function SoulCoreTracker() {
  const { priorityOrder, moveInPriority, doneByCharacter, toggleDone, monsterListInput, setMonsterListInput, assignments } =
    useSoulCoreTracker(TRACKED_CHARACTER_IDS);

  return (
    <div className="tibiadrome-section">
      <div className="rotation-card__header">
        <h3>Soul Cores da Equipa</h3>
      </div>

      <SoulCorePriorityBar priorityOrder={priorityOrder} playersById={PLAYERS_BY_ID} onMove={moveInPriority} />

      <SoulCoreGrid
        characterIds={TRACKED_CHARACTER_IDS}
        playersById={PLAYERS_BY_ID}
        doneByCharacter={doneByCharacter}
        onToggle={toggleDone}
      />

      <SoulCoreAssignmentPanel
        monsterListInput={monsterListInput}
        onMonsterListInputChange={setMonsterListInput}
        assignments={assignments}
        playersById={PLAYERS_BY_ID}
      />
    </div>
  );
}
