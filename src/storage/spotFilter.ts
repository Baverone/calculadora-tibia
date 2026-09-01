const STORAGE_KEY = 'celesta-spot-filter';

/**
 * Que spots do Celesta mostrar. Guarda-se a lista dos escolhidos, e não a dos
 * escondidos, por uma razão prática: o bot pode passar a mandar spots novos, e
 * um spot novo deve aparecer sozinho só enquanto não houver escolha nenhuma
 * feita. Depois de escolheres, o painel é teu — nada entra sem tu meteres.
 *
 * `null` = nunca escolheste nada, mostra-se tudo.
 */
export function loadSelectedSpots(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((s) => typeof s === 'string') ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSelectedSpots(names: string[] | null): void {
  try {
    if (names === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    // localStorage cheio ou bloqueado (janela privada) — o filtro fica só
    // nesta sessão, o painel continua a funcionar.
  }
}
