import { useState } from 'react';
import { BESTIARY_CLASSES } from '../../data/soulCore/bestiaryClasses';
import type { PlayerMeta } from '../../constants/players';
import type { CharacterId } from '../../domain/types';

interface SoulCoreGridProps {
  characterIds: CharacterId[];
  playersById: Record<CharacterId, PlayerMeta>;
  doneByCharacter: Record<CharacterId, string[]>;
  onToggle: (characterId: CharacterId, name: string) => void;
}

/** Grid of every Bestiary creature, grouped by class like the in-game Cyclopedia — click a card to mark its Soul Core done. */
export function SoulCoreGrid({ characterIds, playersById, doneByCharacter, onToggle }: SoulCoreGridProps) {
  const [activeCharacterId, setActiveCharacterId] = useState<CharacterId>(characterIds[0]);
  const [search, setSearch] = useState('');

  const activePlayer = playersById[activeCharacterId];
  const doneSet = new Set(doneByCharacter[activeCharacterId] ?? []);
  const query = search.trim().toLowerCase();

  return (
    <div className="soul-core-grid">
      <div className="vocation-selector" style={{ marginBottom: 12 }}>
        {characterIds.map((characterId) => {
          const player = playersById[characterId];
          const doneCount = (doneByCharacter[characterId] ?? []).length;
          return (
            <button
              key={characterId}
              type="button"
              className={
                characterId === activeCharacterId
                  ? 'vocation-selector__option vocation-selector__option--active'
                  : 'vocation-selector__option'
              }
              style={characterId === activeCharacterId ? { borderColor: player.accentColor, color: player.accentColor } : undefined}
              onClick={() => setActiveCharacterId(characterId)}
            >
              {player.name} ({doneCount})
            </button>
          );
        })}
      </div>

      <input
        type="text"
        className="soul-core-grid__search"
        placeholder="Pesquisar criatura..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {BESTIARY_CLASSES.map((bestiaryClass) => {
        const creatures = query
          ? bestiaryClass.creatures.filter((c) => c.toLowerCase().includes(query))
          : bestiaryClass.creatures;
        if (creatures.length === 0) return null;

        const doneInClass = bestiaryClass.creatures.filter((c) => doneSet.has(c)).length;

        return (
          <details key={bestiaryClass.name} className="soul-core-grid__class" open={query !== '' || doneInClass > 0}>
            <summary>
              {bestiaryClass.name}{' '}
              <span className="soul-core-grid__class-count">
                ({doneInClass}/{bestiaryClass.creatures.length})
              </span>
            </summary>
            <div className="soul-core-grid__cards">
              {creatures.map((creature) => {
                const done = doneSet.has(creature);
                return (
                  <button
                    key={creature}
                    type="button"
                    className={done ? 'soul-core-grid__card soul-core-grid__card--done' : 'soul-core-grid__card'}
                    style={done ? { borderColor: activePlayer.accentColor } : undefined}
                    onClick={() => onToggle(activeCharacterId, creature)}
                  >
                    {done && (
                      <span className="soul-core-grid__badge" style={{ background: activePlayer.accentColor }}>
                        ✓
                      </span>
                    )}
                    {creature}
                  </button>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
