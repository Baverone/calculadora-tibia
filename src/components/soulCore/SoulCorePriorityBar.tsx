import type { PlayerMeta } from '../../constants/players';
import type { CharacterId } from '../../domain/types';

interface SoulCorePriorityBarProps {
  priorityOrder: CharacterId[];
  playersById: Record<CharacterId, PlayerMeta>;
  onMove: (characterId: CharacterId, direction: -1 | 1) => void;
}

/** Lets the user reorder the 3 characters — who gets a missing Soul Core assigned first. */
export function SoulCorePriorityBar({ priorityOrder, playersById, onMove }: SoulCorePriorityBarProps) {
  return (
    <div className="soul-core-priority">
      <label>Ordem de prioridade</label>
      <ol className="soul-core-priority__list">
        {priorityOrder.map((characterId, index) => {
          const player = playersById[characterId];
          return (
            <li key={characterId} className="soul-core-priority__item">
              <span className="soul-core-priority__rank">{index + 1}º</span>
              <span style={{ color: player.accentColor }}>{player.name}</span>
              <div className="soul-core-priority__arrows">
                <button type="button" disabled={index === 0} onClick={() => onMove(characterId, -1)} title="Subir">
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === priorityOrder.length - 1}
                  onClick={() => onMove(characterId, 1)}
                  title="Descer"
                >
                  ▼
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
