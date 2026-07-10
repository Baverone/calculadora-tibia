import { MINI_WORLD_CHANGE_EVENTS } from '../../data/miniWorldChanges/events';

export function MiniWorldChangesReferenceList() {
  return (
    <details className="tibiadrome-reference">
      <summary>As {MINI_WORLD_CHANGE_EVENTS.length} mini world changes possíveis</summary>
      <ul className="tibiadrome-reference__list">
        {MINI_WORLD_CHANGE_EVENTS.map((event) => (
          <li key={event.name}>
            <strong>{event.name}</strong>
            <span>{event.location}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
