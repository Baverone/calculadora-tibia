import type { AppTabId } from '../../domain/types';
import { PLAYERS } from '../../constants/players';

interface TabsBarProps {
  activeId: AppTabId;
  onChange: (id: AppTabId) => void;
}

const UTILITIES_ACCENT = '#c9a227';

function UtilitiesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A barra de separadores — uma só, com os bonecos e os utilitários ao mesmo
 * nível. Era uma navegação de dois andares (aba de equipa → aba de jogador)
 * quando eram 6 jogadores em 3 equipas; com dois bonecos, o primeiro andar
 * eram três abas grandes para um jogador cada.
 */
export function TabsBar({ activeId, onChange }: TabsBarProps) {
  return (
    <nav className="tabs-bar">
      {PLAYERS.map((player) => (
        <button
          key={player.id}
          className={player.id === activeId ? 'tabs-bar__tab tabs-bar__tab--active' : 'tabs-bar__tab'}
          style={{ '--tab-accent': player.accentColor } as React.CSSProperties}
          onClick={() => onChange(player.id)}
          type="button"
        >
          <player.Icon className="tabs-bar__icon" />
          {player.name}
        </button>
      ))}
      <button
        className={activeId === 'utilities' ? 'tabs-bar__tab tabs-bar__tab--active' : 'tabs-bar__tab'}
        style={{ '--tab-accent': UTILITIES_ACCENT } as React.CSSProperties}
        onClick={() => onChange('utilities')}
        type="button"
      >
        <UtilitiesIcon className="tabs-bar__icon" />
        Utilitários
      </button>
    </nav>
  );
}
