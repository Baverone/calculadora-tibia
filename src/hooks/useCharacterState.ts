import { useEffect, useMemo, useState } from 'react';
import type { CharacterId, HistoryEntry } from '../domain/types';
import { fetchSharedHistory } from '../storage/sharedHistory';

/**
 * O estado de um painel de boneco: o histórico recolhido e a XP atual.
 *
 * Já não há input manual nem localStorage. Enquanto a recolha esteve
 * silenciosamente parada, escrever a XP à mão era a única forma de a app
 * mostrar alguma coisa atual — resolvida a recolha, esse remendo passou a
 * ser só mais um sítio onde os números podiam divergir. A fonte é uma só.
 */
export function useCharacterState(characterId: CharacterId) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchSharedHistory(characterId).then((entries) => {
      if (cancelled) return;
      setHistory([...entries].sort((a, b) => a.timestamp - b.timestamp));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const currentExperience = history.at(-1)?.experience ?? null;

  /** Há quantos dias é a leitura mais recente — é o que a app usa para avisar que os dados estão velhos. */
  const daysSinceLastReading = useMemo(() => {
    const last = history.at(-1);
    if (!last) return null;
    return Math.floor((Date.now() - last.timestamp) / 86_400_000);
  }, [history]);

  return { history, currentExperience, loading, daysSinceLastReading };
}
