import { formatDuration, formatRotationDate, type RotationState } from '../../domain/tibiadrome/rotation';

interface RotationCardProps {
  state: RotationState;
  now: number;
  currentModifiers: string[] | null;
  isCurrentRotationRecorded: boolean;
}

export function RotationCard({ state, now, currentModifiers, isCurrentRotationRecorded }: RotationCardProps) {
  const remainingMs = state.endAt - now;

  return (
    <div className="rotation-card">
      <div className="rotation-card__header">
        <h3>Tibiadrome</h3>
        <span className="rotation-card__number">Rotação Número #{state.number}</span>
      </div>

      {!isCurrentRotationRecorded && (
        <p className="rotation-card__banner">
          🔔 Nova rotação começou! Cola o anúncio dos modificadores abaixo para os registares.
        </p>
      )}

      <div className="rotation-card__columns">
        <div className="rotation-card__column">
          <span className="rotation-card__label">Fim</span>
          <span className="rotation-card__date">{formatRotationDate(state.endAt)}</span>
          <span className="rotation-card__relative">dentro de {formatDuration(remainingMs)}</span>
        </div>
      </div>

      {currentModifiers && currentModifiers.length > 0 && (
        <div className="rotation-card__modifiers">
          <span className="rotation-card__label">Modificadores ativos</span>
          <div className="rotation-card__modifier-tags">
            {currentModifiers.map((name) => (
              <span key={name} className="rotation-card__modifier-tag">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
