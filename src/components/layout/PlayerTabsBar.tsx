import type { PlayerMeta } from '../../constants/players';

interface PlayerTabsBarProps {
  players: PlayerMeta[];
  activePlayerId: string;
  onChange: (playerId: string) => void;
}

/** Secondary tab row — the players within the currently active team's big tab. */
export function PlayerTabsBar({ players, activePlayerId, onChange }: PlayerTabsBarProps) {
  return (
    <nav className="player-tabs-bar">
      {players.map((player) => (
        <button
          key={player.id}
          className={player.id === activePlayerId ? 'player-tabs-bar__tab player-tabs-bar__tab--active' : 'player-tabs-bar__tab'}
          style={{ '--tab-accent': player.accentColor } as React.CSSProperties}
          onClick={() => onChange(player.id)}
          type="button"
        >
          <player.Icon className="player-tabs-bar__icon" />
          {player.name}
        </button>
      ))}
    </nav>
  );
}
