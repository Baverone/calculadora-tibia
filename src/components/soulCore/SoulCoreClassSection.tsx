import { useState } from 'react';
import type { BestiaryClass } from '../../data/soulCore/bestiaryClasses';

interface SoulCoreClassSectionProps {
  bestiaryClass: BestiaryClass;
  creatures: string[];
  doneSet: Set<string>;
  doneInClass: number;
  accentColor: string;
  forceOpen: boolean;
  paginate: boolean;
  onToggle: (name: string) => void;
}

/** Matches the in-game Bestiary page size (5 columns x 3 rows = 15 per page). */
const PAGE_SIZE = 15;

/** One Bestiary class: collapsible, paginated like the in-game Cyclopedia so positions line up 1:1 with what's on screen in Tibia. */
export function SoulCoreClassSection({
  bestiaryClass,
  creatures,
  doneSet,
  doneInClass,
  accentColor,
  forceOpen,
  paginate,
  onToggle,
}: SoulCoreClassSectionProps) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(creatures.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const visible = paginate ? creatures.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE) : creatures;

  return (
    <details className="soul-core-grid__class" open={forceOpen}>
      <summary>
        {bestiaryClass.name}{' '}
        <span className="soul-core-grid__class-count">
          ({doneInClass}/{bestiaryClass.creatures.length})
        </span>
      </summary>

      {paginate && pageCount > 1 && (
        <div className="soul-core-grid__pager">
          <button type="button" disabled={clampedPage === 0} onClick={() => setPage(clampedPage - 1)}>
            ◀
          </button>
          <span>
            {clampedPage + 1} / {pageCount}
          </span>
          <button type="button" disabled={clampedPage === pageCount - 1} onClick={() => setPage(clampedPage + 1)}>
            ▶
          </button>
        </div>
      )}

      <div className={paginate ? 'soul-core-grid__cards soul-core-grid__cards--paginated' : 'soul-core-grid__cards'}>
        {visible.map((creature) => {
          const done = doneSet.has(creature);
          return (
            <button
              key={creature}
              type="button"
              className={done ? 'soul-core-grid__card soul-core-grid__card--done' : 'soul-core-grid__card'}
              style={done ? { borderColor: accentColor } : undefined}
              onClick={() => onToggle(creature)}
            >
              {done && (
                <span className="soul-core-grid__badge" style={{ background: accentColor }}>
                  ✓
                </span>
              )}
              {creature}
            </button>
          );
        })}
      </div>
    </details>
  );
}
