/**
 * Em que separador a app abre.
 *
 * Abria sempre no Baverone. Quem abre isto no telemóvel antes de ir caçar
 * abre-o para ver os spots livres — e isso eram dois toques de cada vez.
 * Guarda-se o último separador aberto, pela mesma razão por que já se guarda
 * o filtro de spots e a caixa da hora de Lisboa (`spotFilter.ts`).
 *
 * Sem `localStorage` (janela privada, cookies bloqueados) tudo isto devolve
 * `null` e a app abre como sempre abriu. Nunca lança.
 */

const KEYS = {
  main: 'app-active-tab',
  utility: 'app-active-utility-tab',
} as const;

export type TabScope = keyof typeof KEYS;

/**
 * O separador guardado, ou `null` se não houver nenhum.
 *
 * O valor lido é confrontado com a lista dos que existem hoje: um boneco que
 * saia da app, ou um separador que mude de nome, deixaria a app a abrir num
 * painel que já não existe — ecrã vazio sem explicação nenhuma.
 */
export function loadTab<T extends string>(scope: TabScope, valid: readonly T[]): T | null {
  try {
    const raw = localStorage.getItem(KEYS[scope]);
    return raw !== null && (valid as readonly string[]).includes(raw) ? (raw as T) : null;
  } catch {
    return null;
  }
}

export function saveTab(scope: TabScope, id: string): void {
  try {
    localStorage.setItem(KEYS[scope], id);
  } catch {
    // Ver acima: sem localStorage a escolha vive só nesta sessão.
  }
}
