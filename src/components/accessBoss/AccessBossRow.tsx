import type { AccessBossItem } from '../../domain/types';

interface AccessBossRowProps {
  item: AccessBossItem;
  done: boolean;
  onToggle: (itemId: string, done: boolean) => void;
}

/** One checklist row: checkbox + label (indented and linked to its parent quest when it's a sub-item) + a short reference note. */
export function AccessBossRow({ item, done, onToggle }: AccessBossRowProps) {
  const isSub = item.tag === 'sub';

  return (
    <li className={isSub ? 'access-boss-row access-boss-row--sub' : 'access-boss-row'}>
      <label className="access-boss-row__main">
        <input type="checkbox" checked={done} onChange={(e) => onToggle(item.id, e.target.checked)} />
        <span className="access-boss-row__label">{item.label}</span>
        {isSub && item.parent && <span className="access-boss-row__parent-tag">de {item.parent}</span>}
      </label>
      <p className="access-boss-row__note">{item.note}</p>
    </li>
  );
}
