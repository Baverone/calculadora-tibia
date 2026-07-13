import { useState } from 'react';
import type { PlayerMeta } from '../../constants/players';

interface SoulCoreCharacterColumnProps {
  player: PlayerMeta;
  doneList: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

/** One character's "Soul Cores already done" list — add by name, remove with the x. */
export function SoulCoreCharacterColumn({ player, doneList, onAdd, onRemove }: SoulCoreCharacterColumnProps) {
  const [input, setInput] = useState('');

  function commitAdd() {
    const trimmed = input.trim();
    if (trimmed) onAdd(trimmed);
    setInput('');
  }

  return (
    <div className="soul-core-column">
      <h4 style={{ color: player.accentColor }}>{player.name}</h4>
      <p className="soul-core-column__count">{doneList.length} Soul Core(s) feitas</p>

      <div className="soul-core-column__add">
        <input
          type="text"
          placeholder="Nome do monstro"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitAdd();
          }}
        />
        <button type="button" onClick={commitAdd}>
          +
        </button>
      </div>

      <ul className="soul-core-column__list">
        {doneList.map((name) => (
          <li key={name}>
            <span>{name}</span>
            <button type="button" onClick={() => onRemove(name)} title="Remover">
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
