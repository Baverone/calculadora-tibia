import type { AccessBossSectionData } from '../../domain/types';
import { getSectionProgress } from '../../domain/accessBoss/progress';
import { AccessBossRow } from './AccessBossRow';

interface AccessBossTableProps {
  sections: AccessBossSectionData[];
  completedIds: Set<string>;
  onToggle: (itemId: string, done: boolean) => void;
}

/** Three-column checklist (Úteis / Acessos / Bosses), one checkbox per item, with a done/total count per section. */
export function AccessBossTable({ sections, completedIds, onToggle }: AccessBossTableProps) {
  return (
    <div className="access-boss-table">
      {sections.map((section) => {
        const progress = getSectionProgress(section, completedIds);
        return (
          <div key={section.section} className="access-boss-table__column">
            <h4>
              {section.section} <span className="access-boss-table__count">{progress.done}/{progress.total} completos</span>
            </h4>
            <ul>
              {section.items.map((item) => (
                <AccessBossRow key={item.id} item={item} done={completedIds.has(item.id)} onToggle={onToggle} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
