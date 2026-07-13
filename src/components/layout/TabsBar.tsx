import type { AppTabId } from '../../domain/types';
import { TEAMS } from '../../constants/players';

interface TabsBarProps {
  activeId: AppTabId;
  onChange: (id: AppTabId) => void;
}

const UTILITIES_TAB_ID: AppTabId = 'utilities';
const UTILITIES_TAB_ACCENT = '#c9a227';

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

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 20c0-3 2.2-5.5 5-5.5s5 2.5 5 5.5M14 20c0-2.4 1.6-4.5 3.7-5.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TabsBar({ activeId, onChange }: TabsBarProps) {
  return (
    <nav className="tabs-bar">
      <button
        className={UTILITIES_TAB_ID === activeId ? 'tabs-bar__tab tabs-bar__tab--active' : 'tabs-bar__tab'}
        style={{ '--tab-accent': UTILITIES_TAB_ACCENT } as React.CSSProperties}
        onClick={() => onChange(UTILITIES_TAB_ID)}
        type="button"
      >
        <UtilitiesIcon className="tabs-bar__icon" />
        Utilitários Tibia
      </button>
      {TEAMS.map((team) => (
        <button
          key={team.id}
          className={team.id === activeId ? 'tabs-bar__tab tabs-bar__tab--active' : 'tabs-bar__tab'}
          style={{ '--tab-accent': '#c9a227' } as React.CSSProperties}
          onClick={() => onChange(team.id)}
          type="button"
        >
          <TeamIcon className="tabs-bar__icon" />
          {team.label}
        </button>
      ))}
    </nav>
  );
}
