import type { WheelBuild, WheelDomain } from '../../domain/wheel/types';

interface SavedBuildsListProps {
  builds: WheelBuild[];
  domains: WheelDomain[];
  onApply: (build: WheelBuild) => void;
  onDelete: (buildId: string) => void;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');
const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function SavedBuildsList({ builds, domains, onApply, onDelete }: SavedBuildsListProps) {
  if (builds.length === 0) return null;

  function domainName(domainId: string): string {
    return domains.find((d) => d.id === domainId)?.revelationPerk.name ?? domainId;
  }

  return (
    <div className="saved-builds-list">
      {builds.map((build) => (
        <div key={build.id} className="saved-hunt-card">
          <div className="saved-hunt-card__header">
            <h4>
              {build.name || 'Build sem nome'}
              {build.source === 'ai' && <span className="recent-history-list__source-tag">IA</span>}
            </h4>
            <button type="button" className="saved-hunt-card__delete" onClick={() => onDelete(build.id)}>
              Remover
            </button>
          </div>
          <p className="saved-hunt-card__meta">
            {build.goal} · guardado em {dateFormatter.format(build.createdAt)}
          </p>
          <ul className="wheel-reference-list">
            {build.allocations
              .filter((allocation) => allocation.points > 0)
              .map((allocation) => (
                <li key={allocation.domainId}>
                  {domainName(allocation.domainId)}: <strong>{numberFormatter.format(allocation.points)}</strong> pts
                </li>
              ))}
          </ul>
          {build.reasoning && <p className="ai-advisor-result__reasoning">{build.reasoning}</p>}
          <button type="button" className="ai-advisor-result__save-button" onClick={() => onApply(build)}>
            Aplicar esta build
          </button>
        </div>
      ))}
    </div>
  );
}
