import { useEffect, useState } from 'react';
import { useCelestaHunts } from '../../hooks/useCelestaHunts';
import {
  formatAge,
  formatLength,
  formatWindow,
  isStale,
  toLisbon,
  totalFreeMinutes,
  type HuntSpotStatus,
} from '../../domain/celestaHunts';
import '../../styles/celestaHunts.css';

function SpotRow({ spot, showLisbon }: { spot: HuntSpotStatus; showLisbon: boolean }) {
  const free = totalFreeMinutes(spot);
  const packed = !spot.noBookings && free < 90;

  return (
    <div className="hunts-spot">
      <div className="hunts-spot__header">
        <span className="hunts-spot__name">{spot.name}</span>
        {spot.noBookings ? (
          <span className="hunts-spot__badge hunts-spot__badge--free">livre o dia todo</span>
        ) : (
          <span className={packed ? 'hunts-spot__badge hunts-spot__badge--packed' : 'hunts-spot__badge'}>
            {formatLength(free)} livres
          </span>
        )}
      </div>

      {!spot.noBookings && (
        spot.free.length > 0 ? (
          <div className="hunts-spot__windows">
            {spot.free.map((window) => (
              <span key={`${window.start}-${window.end}`} className="hunts-spot__window">
                {formatWindow(window)}
                {showLisbon && (
                  <em className="hunts-spot__window-alt">
                    {toLisbon(window.start)} - {toLisbon(window.end)}
                  </em>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="hunts-spot__none">sem janelas de 30min — está cheio</p>
        )
      )}
    </div>
  );
}

export function CelestaHuntsPanel() {
  const { data, status, reload } = useCelestaHunts();
  const [showLisbon, setShowLisbon] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hunts-panel">
      <div className="hunts-panel__header">
        <h3>Spots livres — Celesta</h3>
        <button className="hunts-panel__reload" onClick={reload} type="button">
          Atualizar
        </button>
      </div>

      {status === 'loading' && <p className="hunts-panel__note">A carregar…</p>}

      {status === 'empty' && (
        <p className="hunts-panel__note">
          Ainda não há dados. A tarefa agendada corre de hora a hora entre as 09:00 e a 01:00 e
          escreve <code>data/celesta-hunts.json</code> no repo.
        </p>
      )}

      {status === 'ready' && data && (
        <>
          <div className="hunts-panel__meta">
            <span className={isStale(data, now) ? 'hunts-panel__age hunts-panel__age--stale' : 'hunts-panel__age'}>
              Summary das {data.referenceTime} ({formatAge(data, now)})
            </span>
            <label className="hunts-panel__toggle">
              <input type="checkbox" checked={showLisbon} onChange={(e) => setShowLisbon(e.target.checked)} />
              mostrar hora de Lisboa
            </label>
          </div>

          {isStale(data, now) && (
            <p className="hunts-panel__banner">
              ⚠️ Estes dados já têm mais de hora e meia — pode haver reservas novas desde então.
            </p>
          )}

          {data.highlights && data.highlights.length > 0 && (
            <div className="hunts-panel__highlights">
              <span className="hunts-panel__label">Melhores janelas</span>
              <ul>
                {data.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="hunts-panel__spots">
            {data.spots.map((spot) => (
              <SpotRow key={spot.name} spot={spot} showLisbon={showLisbon} />
            ))}
          </div>

          <p className="hunts-panel__footnote">
            Horas em {data.timezone.replace('Europe/', '')}. Janela mínima: {data.minWindowMinutes}min.
          </p>
        </>
      )}
    </div>
  );
}
