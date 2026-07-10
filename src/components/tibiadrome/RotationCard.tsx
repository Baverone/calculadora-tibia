import { formatDuration, formatRotationDate, type RotationState } from '../../domain/tibiadrome/rotation';
import { TIBIADROME_MODIFIERS } from '../../data/tibiadrome/modifiers';

interface RotationCardProps {
  state: RotationState;
  now: number;
  currentModifiers: string[] | null;
  isCurrentRotationRecorded: boolean;
}

function descriptionFor(modifierName: string): string {
  return TIBIADROME_MODIFIERS.find((m) => m.name === modifierName)?.description ?? '';
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
          <div className="rotation-card__modifier-list">
            {currentModifiers.map((name) => (
              <div key={name} className="rotation-card__modifier-item">
                <span className="rotation-card__modifier-tag">{name}</span>
                <p className="rotation-card__modifier-description">{descriptionFor(name)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
