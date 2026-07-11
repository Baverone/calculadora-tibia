import type { AccessBossSectionData } from '../../domain/types';
import { AccessBossRow } from './AccessBossRow';

interface AccessBossTableProps {
  sections: AccessBossSectionData[];
  completedIds: Set<string>;
  onToggle: (itemId: string, done: boolean) => void;
}

/** One Por fazer/Feitas table: the 3 category columns (Úteis/Acessos/Bosses), filtered to only the given done-state. */
function AccessBossSubTable({
  sections,
  completedIds,
  done,
  onToggle,
}: AccessBossTableProps & { done: boolean }) {
  return (
    <div className="access-boss-table">
      {sections.map((section) => {
        const items = section.items.filter((item) => completedIds.has(item.id) === done);
        if (items.length === 0) return null;
        return (
          <div key={section.section} className="access-boss-table__column">
            <h5>
              {section.section} <span className="access-boss-table__count">{items.length}</span>
            </h5>
            <ul>
              {items.map((item) => (
                <AccessBossRow key={item.id} item={item} done={done} onToggle={onToggle} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Two separate tables — Por fazer (highlighted) and Feitas (muted) — each split into the Úteis/Acessos/Bosses columns. */
export function AccessBossTable({ sections, completedIds, onToggle }: AccessBossTableProps) {
  return (
    <>
      <div className="access-boss-group access-boss-group--pending">
        <h4 className="access-boss-group__title">Por fazer</h4>
        <AccessBossSubTable sections={sections} completedIds={completedIds} done={false} onToggle={onToggle} />
      </div>
      <div className="access-boss-group access-boss-group--done">
        <h4 className="access-boss-group__title">Feitas</h4>
        <AccessBossSubTable sections={sections} completedIds={completedIds} done onToggle={onToggle} />
      </div>
    </>
  );
}
