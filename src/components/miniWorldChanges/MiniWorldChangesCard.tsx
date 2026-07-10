import { useState } from 'react';
import { useTibiaDayClock } from '../../hooks/useTibiaDayClock';
import { formatDuration } from '../../domain/tibiadrome/rotation';
import type { MiniWorldChangesRecord } from '../../storage/miniWorldChangesHistory';
import { MINI_WORLD_CHANGE_EVENTS } from '../../data/miniWorldChanges/events';

interface MiniWorldChangesCardProps {
  todayEntry: MiniWorldChangesRecord | undefined;
}

const dateFormatter = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'long', timeZone: 'UTC' });

function formatTibiaDate(dateKey: string): string {
  return dateFormatter.format(new Date(`${dateKey}T12:00:00Z`));
}

function locationFor(eventName: string): string {
  return MINI_WORLD_CHANGE_EVENTS.find((e) => e.name === eventName)?.location ?? '';
}

/** "Spider's Nest" -> "spiders-nest" — matches the filename the user places under public/mini-world-changes/. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function EventMapImage({ eventName }: { eventName: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <img
      src={`/mini-world-changes/${slugify(eventName)}.png`}
      alt={eventName}
      className="mwc-event-card__map"
      onError={() => setFailed(true)}
    />
  );
}

export function MiniWorldChangesCard({ todayEntry }: MiniWorldChangesCardProps) {
  const { dateKey, nextChangeAt } = useTibiaDayClock();
  const remainingMs = nextChangeAt - Date.now();

  return (
    <div className="mwc-card">
      <div className="mwc-card__header">
        <h3>Mini World Changes</h3>
        <span className="mwc-card__date">{formatTibiaDate(dateKey)}</span>
      </div>

      {todayEntry ? (
        <div className="mwc-event-grid">
          {todayEntry.events.map((name) => (
            <div key={name} className="mwc-event-card">
              <EventMapImage eventName={name} />
              <div className="mwc-event-card__info">
                <strong>{name}</strong>
                <span>{locationFor(name)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mwc-card__empty">Ainda não submeteste as mini world changes de hoje.</p>
      )}

      <p className="mwc-card__countdown">muda às 9:00 — dentro de {formatDuration(remainingMs)}</p>
    </div>
  );
}
