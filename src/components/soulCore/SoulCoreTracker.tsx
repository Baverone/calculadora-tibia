import { PLAYERS } from '../../constants/players';
import type { CharacterId } from '../../domain/types';
import { useSoulCoreTracker } from '../../hooks/useSoulCoreTracker';
import { SoulCorePriorityBar } from './SoulCorePriorityBar';
import { SoulCoreCharacterColumn } from './SoulCoreCharacterColumn';
import { SoulCoreAssignmentPanel } from './SoulCoreAssignmentPanel';

// The 3 original characters this tracker groups — same trio the rest of the
// app was originally built around, before the multi-team roster existed.
const TRACKED_CHARACTER_IDS: CharacterId[] = ['royal-paladin', 'exalted-monk', 'elite-knight'];

const PLAYERS_BY_ID = Object.fromEntries(PLAYERS.map((p) => [p.id, p]));

export function SoulCoreTracker() {
  const { priorityOrder, moveInPriority, doneByCharacter, addDone, removeDone, monsterListInput, setMonsterListInput, assignments } =
    useSoulCoreTracker(TRACKED_CHARACTER_IDS);

  return (
    <div className="tibiadrome-section">
      <div className="rotation-card__header">
        <h3>Soul Cores da Equipa</h3>
      </div>

      <SoulCorePriorityBar priorityOrder={priorityOrder} playersById={PLAYERS_BY_ID} onMove={moveInPriority} />

      <div className="soul-core-columns">
        {TRACKED_CHARACTER_IDS.map((characterId) => (
          <SoulCoreCharacterColumn
            key={characterId}
            player={PLAYERS_BY_ID[characterId]}
            doneList={doneByCharacter[characterId] ?? []}
            onAdd={(name) => addDone(characterId, name)}
            onRemove={(name) => removeDone(characterId, name)}
          />
        ))}
      </div>

      <SoulCoreAssignmentPanel
        monsterListInput={monsterListInput}
        onMonsterListInputChange={setMonsterListInput}
        assignments={assignments}
        playersById={PLAYERS_BY_ID}
      />
    </div>
  );
}
