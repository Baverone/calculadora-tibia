import { useEffect, useMemo, useState } from 'react';
import { useCelestaHunts } from '../../hooks/useCelestaHunts';
import { loadSelectedSpots, saveSelectedSpots } from '../../storage/spotFilter';
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

const OUTCOME_TEXT: Record<string, string> = {
  updated: '✓ Dados novos',
  unchanged: 'Sem novidades — é o summary mais recente que existe',
  failed: '✗ Não consegui chegar aos dados',
};

export function CelestaHuntsPanel() {
  const { data, status, refreshing, outcome, reload } = useCelestaHunts();
  const [showLisbon, setShowLisbon] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<string[] | null>(() => loadSelectedSpots());
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const allSpotNames = useMemo(() => data?.spots.map((spot) => spot.name) ?? [], [data]);

  // Sem escolha feita, mostra-se tudo — é o estado de quem abre a app pela
  // primeira vez, e ver spots a menos sem perceber porquê era pior do que ver
  // spots a mais.
  const visibleSpots = useMemo(() => {
    if (!data) return [];
    if (selected === null) return data.spots;
    return data.spots.filter((spot) => selected.includes(spot.name));
  }, [data, selected]);

  function toggleSpot(name: string) {
    const base = selected ?? allSpotNames;
    const next = base.includes(name) ? base.filter((n) => n !== name) : [...base, name];
    setSelected(next);
    saveSelectedSpots(next);
  }

  function showAllSpots() {
    setSelected(null);
    saveSelectedSpots(null);
  }

  return (
    <div className="hunts-panel">
      <div className="hunts-panel__header">
        <h3>Spots livres — Celesta</h3>
        <div className="hunts-panel__actions">
          {status === 'ready' && (
            <button
              className="hunts-panel__choose"
              onClick={() => setChoosing((open) => !open)}
              type="button"
              aria-expanded={choosing}
            >
              {choosing ? 'Fechar' : 'Escolher spots'}
            </button>
          )}
          <button className="hunts-panel__reload" onClick={reload} type="button" disabled={refreshing}>
            {refreshing ? 'A verificar…' : 'Atualizar'}
          </button>
        </div>
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
            {outcome && (
              <span className={outcome === 'updated' ? 'hunts-panel__outcome hunts-panel__outcome--ok' : 'hunts-panel__outcome'}>
                {OUTCOME_TEXT[outcome]}
              </span>
            )}
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

          {choosing && (
            <fieldset className="hunts-panel__chooser">
              <legend>Spots a mostrar</legend>
              {allSpotNames.map((name) => (
                <label key={name} className="hunts-panel__chooser-item">
                  <input
                    type="checkbox"
                    checked={selected === null || selected.includes(name)}
                    onChange={() => toggleSpot(name)}
                  />
                  {name}
                </label>
              ))}
              <button type="button" className="hunts-panel__chooser-reset" onClick={showAllSpots}>
                Mostrar todos
              </button>
            </fieldset>
          )}

          <div className="hunts-panel__spots">
            {visibleSpots.length === 0 ? (
              <p className="hunts-panel__note">
                Escondeste todos os spots. Carrega em "Escolher spots" para voltar a mostrar algum.
              </p>
            ) : (
              visibleSpots.map((spot) => <SpotRow key={spot.name} spot={spot} showLisbon={showLisbon} />)
            )}
          </div>

          <p className="hunts-panel__footnote">
            Horas em {data.timezone.replace('Europe/', '')}. Janela mínima: {data.minWindowMinutes}min.
          </p>
        </>
      )}
    </div>
  );
}
