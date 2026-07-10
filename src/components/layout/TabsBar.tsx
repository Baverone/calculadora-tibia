import type { AppTabId } from '../../domain/types';
import { VOCATIONS } from '../../constants/vocations';

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
      {VOCATIONS.map((vocation) => (
        <button
          key={vocation.id}
          className={vocation.id === activeId ? 'tabs-bar__tab tabs-bar__tab--active' : 'tabs-bar__tab'}
          style={{ '--tab-accent': vocation.accentColor } as React.CSSProperties}
          onClick={() => onChange(vocation.id)}
          type="button"
        >
          <vocation.Icon className="tabs-bar__icon" />
          {vocation.name}
        </button>
      ))}
    </nav>
  );
}
