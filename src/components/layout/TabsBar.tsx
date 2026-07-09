import type { CharacterId } from '../../domain/types';
import { VOCATIONS } from '../../constants/vocations';

interface TabsBarProps {
  activeId: CharacterId;
  onChange: (id: CharacterId) => void;
}

export function TabsBar({ activeId, onChange }: TabsBarProps) {
  return (
    <nav className="tabs-bar">
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
