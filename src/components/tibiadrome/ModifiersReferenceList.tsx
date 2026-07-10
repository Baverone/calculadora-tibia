import { TIBIADROME_MODIFIERS } from '../../data/tibiadrome/modifiers';

export function ModifiersReferenceList() {
  return (
    <details className="tibiadrome-reference">
      <summary>Os 9 modificadores possíveis</summary>
      <ul className="tibiadrome-reference__list">
        {TIBIADROME_MODIFIERS.map((modifier) => (
          <li key={modifier.name}>
            <strong>{modifier.name}</strong>
            <span>{modifier.description}</span>
            {modifier.confidence && <em className="tibiadrome-reference__confidence">ℹ️ {modifier.confidence}</em>}
          </li>
        ))}
      </ul>
    </details>
  );
}
