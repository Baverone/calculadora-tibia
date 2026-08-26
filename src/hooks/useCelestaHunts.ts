import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCelestaHunts } from '../storage/celestaHunts';
import type { CelestaHuntsData } from '../domain/celestaHunts';

export type HuntsStatus = 'loading' | 'ready' | 'empty';

/**
 * O que aconteceu no último "Atualizar" — é isto que responde à pergunta
 * "carreguei no botão, mas ele atualizou mesmo?". Sem este sinal, um clique
 * que não traz nada de novo é indistinguível de um clique que não fez nada.
 */
export type RefreshOutcome = 'updated' | 'unchanged' | 'failed';

const OUTCOME_VISIBLE_MS = 5000;

export function useCelestaHunts() {
  const [data, setData] = useState<CelestaHuntsData | null>(null);
  const [status, setStatus] = useState<HuntsStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [outcome, setOutcome] = useState<RefreshOutcome | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Guardado em ref (e não lido do state) para a comparação não depender da
  // ordem de re-render — só nos interessa o que estava lá quando o pedido saiu.
  const dataRef = useRef<CelestaHuntsData | null>(null);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const isRefresh = reloadToken > 0;

    if (isRefresh) setRefreshing(true);
    setOutcome(null);

    fetchCelestaHunts().then((result) => {
      if (cancelled) return;

      const previous = dataRef.current;

      if (isRefresh) {
        if (!result) setOutcome('failed');
        else if (!previous || result.generatedAt !== previous.generatedAt) setOutcome('updated');
        else setOutcome('unchanged');
      }

      // Numa falha de refresh ficamos com o que já tínhamos — melhor dados
      // velhos assinalados como velhos do que um painel vazio.
      const next = result ?? previous;
      dataRef.current = next;
      setData(next);
      setStatus(next ? 'ready' : 'empty');
      setRefreshing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (!outcome) return;
    const id = setTimeout(() => setOutcome(null), OUTCOME_VISIBLE_MS);
    return () => clearTimeout(id);
  }, [outcome]);

  return { data, status, refreshing, outcome, reload };
}
