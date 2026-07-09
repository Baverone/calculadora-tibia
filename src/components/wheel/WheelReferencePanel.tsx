import { WHEEL_MECHANICS } from '../../domain/wheel/mechanics';
import type { VocationWheelData } from '../../domain/wheel/types';

interface WheelReferencePanelProps {
  wheelData: VocationWheelData;
}

/** Read-only reference info: conviction perks, augmentations, dedication categories, Gem Atelier. */
export function WheelReferencePanel({ wheelData }: WheelReferencePanelProps) {
  return (
    <details className="wheel-reference-panel">
      <summary>Conviction Perks, Dedication e Gem Atelier (referência)</summary>

      <div className="wheel-reference-panel__section">
        <h5>Conviction Perks únicos de {wheelData.vocationName}</h5>
        <ul className="wheel-reference-list">
          {wheelData.vocationConvictionPerks.map((perk) => (
            <li key={perk.name}>
              <strong>{perk.name}</strong>: {perk.description}
              {perk.confidence && <span className="wheel-reference-confidence"> — {perk.confidence}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="wheel-reference-panel__section">
        <h5>Augmentações (2 estágios, cada habilidade aparece 2x na roda)</h5>
        <table className="wheel-reference-table">
          <thead>
            <tr>
              <th>Habilidade</th>
              <th>Estágio 1</th>
              <th>Estágio 2</th>
            </tr>
          </thead>
          <tbody>
            {wheelData.augmentations.abilities.map((ability) => (
              <tr key={ability.name}>
                <td>{ability.name}</td>
                <td>{ability.stage1}</td>
                <td>{ability.stage2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="wheel-reference-panel__section">
        <h5>Conviction Perks genéricos (partilhados por todas as vocações)</h5>
        <ul className="wheel-reference-list">
          {WHEEL_MECHANICS.convictionPerks.generic.perks.map((perk) => (
            <li key={perk.name}>
              <strong>{perk.name}</strong>: {perk.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="wheel-reference-panel__section">
        <h5>Dedication Perks</h5>
        <p className="wheel-reference-note">{WHEEL_MECHANICS.dedicationPerks._note}</p>
        <ul className="wheel-reference-list">
          {WHEEL_MECHANICS.dedicationPerks.categories.map((category) => (
            <li key={category.id}>{category.label}</li>
          ))}
        </ul>
      </div>

      <div className="wheel-reference-panel__section">
        <h5>Gem Atelier</h5>
        <p className="wheel-reference-note">{WHEEL_MECHANICS.gemAtelier._note}</p>
        <ul className="wheel-reference-list">
          {WHEEL_MECHANICS.gemAtelier.gemSizes.map((gem) => (
            <li key={gem.name}>
              <strong>{gem.name}</strong>: {gem.basicModSlots} slot(s) Basic, {gem.supremeModSlots} slot(s) Supreme —{' '}
              {gem.primarySource}
            </li>
          ))}
          <li>Afinidade de domínio: {WHEEL_MECHANICS.gemAtelier.domainAffinity}</li>
          <li>Resonância: {WHEEL_MECHANICS.gemAtelier.vesselResonance}</li>
        </ul>
      </div>
    </details>
  );
}
