import { useState } from 'react';
import type { PlayerMeta } from '../../constants/players';

interface PlayerTabsBarProps {
  players: PlayerMeta[];
  activePlayerId: string;
  onChange: (playerId: string) => void;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (playerId: string) => void;
}

/** Secondary tab row — the players within the currently active team's big tab, plus a "+" to add one. */
export function PlayerTabsBar({ players, activePlayerId, onChange, onAddPlayer, onRemovePlayer }: PlayerTabsBarProps) {
  const [adding, setAdding] = useState(false);
  const [nameInput, setNameInput] = useState('');

  function commitAdd() {
    const trimmed = nameInput.trim();
    if (trimmed) onAddPlayer(trimmed);
    setNameInput('');
    setAdding(false);
  }

  function handleRemove(player: PlayerMeta) {
    if (window.confirm(`Remover ${player.name}? Perdes o acesso ao histórico e dados guardados dele.`)) {
      onRemovePlayer(player.id);
    }
  }

  return (
    <nav className="player-tabs-bar">
      {players.map((player) => {
        const isCustom = player.id.startsWith('custom-');
        return (
          <span key={player.id} className="player-tabs-bar__tab-wrapper">
            <button
              className={player.id === activePlayerId ? 'player-tabs-bar__tab player-tabs-bar__tab--active' : 'player-tabs-bar__tab'}
              style={{ '--tab-accent': player.accentColor } as React.CSSProperties}
              onClick={() => onChange(player.id)}
              type="button"
            >
              <player.Icon className="player-tabs-bar__icon" />
              {player.name}
            </button>
            {isCustom && (
              <button
                type="button"
                className="player-tabs-bar__remove"
                onClick={() => handleRemove(player)}
                title={`Remover ${player.name}`}
              >
                ×
              </button>
            )}
          </span>
        );
      })}

      {adding ? (
        <input
          type="text"
          className="player-tabs-bar__add-input"
          placeholder="Nome do jogador"
          autoFocus
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={commitAdd}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitAdd();
            if (e.key === 'Escape') {
              setNameInput('');
              setAdding(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="player-tabs-bar__tab player-tabs-bar__tab--add"
          onClick={() => setAdding(true)}
          title="Adicionar jogador a esta equipa"
        >
          +
        </button>
      )}
    </nav>
  );
}
