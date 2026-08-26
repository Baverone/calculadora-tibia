export type UtilityTabId = 'hunts' | 'stamina' | 'arrows' | 'soulcore';

const UTILITY_TAB_ACCENT = '#c9a227';

const UTILITY_TABS: { id: UtilityTabId; label: string }[] = [
  { id: 'hunts', label: 'Spots' },
  { id: 'stamina', label: 'Stamina' },
  { id: 'arrows', label: 'Flechas' },
  { id: 'soulcore', label: 'Soul Core' },
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
