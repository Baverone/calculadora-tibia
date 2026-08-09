export type UtilityTabId = 'rashid' | 'tibiadrome' | 'stamina' | 'soulcore' | 'arrows';

const UTILITY_TAB_ACCENT = '#c9a227';

const UTILITY_TABS: { id: UtilityTabId; label: string }[] = [
  { id: 'rashid', label: 'Rashid' },
  { id: 'tibiadrome', label: 'Tibiadrome' },
  { id: 'stamina', label: 'Stamina' },
  { id: 'soulcore', label: 'Soul Core' },
  { id: 'arrows', label: 'Flechas' },
];

interface UtilityTabsBarProps {
  activeId: UtilityTabId;
  onChange: (id: UtilityTabId) => void;
}

export function UtilityTabsBar({ activeId, onChange }: UtilityTabsBarProps) {
  return (
    <nav className="player-tabs-bar">
      {UTILITY_TABS.map((tab) => (
        <button
          key={tab.id}
          className={tab.id === activeId ? 'player-tabs-bar__tab player-tabs-bar__tab--active' : 'player-tabs-bar__tab'}
          style={{ '--tab-accent': UTILITY_TAB_ACCENT } as React.CSSProperties}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
