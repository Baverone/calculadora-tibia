import { computeDomainProgress, DOMAIN_MAX_POINTS, WHEEL_MECHANICS } from '../../domain/wheel/mechanics';
import type { WheelDomain } from '../../domain/wheel/types';

function dedicationLabel(id: string): string {
  return WHEEL_MECHANICS.dedicationPerks.categories.find((c) => c.id === id)?.label ?? id;
}

interface DomainCardProps {
  domain: WheelDomain;
  points: number;
  onPointsChange: (points: number) => void;
  accentColor: string;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');

export function DomainCard({ domain, points, onPointsChange, accentColor }: DomainCardProps) {
  const progress = computeDomainProgress(domain.id, points);
  const totalSlicesFilled = progress.slicesFilledPerRing.reduce((sum, n) => sum + n, 0);

  function handleChange(value: string) {
    const parsed = Number(value.replace(/\D/g, ''));
    onPointsChange(Number.isFinite(parsed) ? Math.min(DOMAIN_MAX_POINTS, parsed) : 0);
  }

  return (
    <div className="domain-card" style={{ borderColor: accentColor }}>
      <div className="domain-card__header">
        <h4 style={{ color: accentColor }}>{domain.revelationPerk.name}</h4>
        <input
          type="text"
          inputMode="numeric"
          className="domain-card__points-input"
          value={points || ''}
          placeholder="0"
          onChange={(e) => handleChange(e.target.value)}
        />
        <span className="domain-card__max">/ {DOMAIN_MAX_POINTS}</span>
      </div>

      <p className="domain-card__description">{domain.revelationPerk.description}</p>
      {domain.revelationPerk.confidence && (
        <p className="domain-card__confidence">ℹ️ {domain.revelationPerk.confidence}</p>
      )}

      <div className="domain-card__meta">
        <span>{totalSlicesFilled}/9 slices preenchidos</span>
        <span>
          Revelation: estágio <strong>{progress.revelationStageUnlocked}</strong>
          {progress.pointsToNextRevelationStage !== null &&
            ` (faltam ${numberFormatter.format(progress.pointsToNextRevelationStage)} pts p/ o próximo)`}
        </span>
      </div>

      <ul className="domain-card__stages">
        {domain.revelationPerk.stages.map((stage) => (
          <li key={stage.stage} className={progress.revelationStageUnlocked >= stage.stage ? 'is-unlocked' : ''}>
            <span className="domain-card__stage-label">
              {progress.revelationStageUnlocked >= stage.stage ? '✓' : '○'} Estágio {stage.stage} ({stage.pointsRequired} pts)
            </span>
            <span className="domain-card__stage-effect">{stage.effect}</span>
          </li>
        ))}
      </ul>

      {domain.nodes && (
        <details className="domain-card__nodes">
          <summary>Ver os 9 slices deste domínio</summary>
          <table className="wheel-reference-table">
            <thead>
              <tr>
                <th>Anel</th>
                <th>Pts</th>
                <th>Dedication</th>
                <th>Conviction</th>
              </tr>
            </thead>
            <tbody>
              {domain.nodes.dedication.map((dedNode, i) => {
                const convNode = domain.nodes!.conviction[i];
                let sliceOfSameRing = 0;
                for (let j = 0; j < i; j++) if (domain.nodes!.dedication[j].ring === dedNode.ring) sliceOfSameRing++;
                const ringIdx = dedNode.ring - 1;
                const unlocked = progress.slicesFilledPerRing[ringIdx] > sliceOfSameRing;
                return (
                  <tr key={i} className={unlocked ? 'is-unlocked' : undefined}>
                    <td>{dedNode.ring}</td>
                    <td>{dedNode.points}</td>
                    <td>{dedicationLabel(dedNode.name)}</td>
                    <td>{convNode?.name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
