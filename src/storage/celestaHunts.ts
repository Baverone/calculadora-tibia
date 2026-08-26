import { GITHUB_REPO } from '../config';
import type { CelestaHuntsData } from '../domain/celestaHunts';

/**
 * A tarefa agendada escreve o mesmo ficheiro em dois sítios:
 *
 *  - public/celesta-hunts.json — servido em /celesta-hunts.json. É o que o
 *    `npm run dev` (e o site já publicado) lê sem precisar de nada do GitHub,
 *    por isso funciona logo a seguir à tarefa correr.
 *  - data/celesta-hunts.json — commitado e enviado para o repo público. Serve
 *    de rede de segurança quando a cópia local está velha ou não existe.
 *
 * Ganha o que for mais recente, para nunca mostrarmos dados velhos só porque
 * um dos dois lados ficou para trás.
 */
const LOCAL_URL = '/celesta-hunts.json';
const REMOTE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/data/celesta-hunts.json`;

function isValid(value: unknown): value is CelestaHuntsData {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as Partial<CelestaHuntsData>;
  return typeof data.generatedAt === 'string' && Array.isArray(data.spots);
}

async function fetchOne(url: string): Promise<CelestaHuntsData | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;

    const data: unknown = await response.json();
    return isValid(data) ? data : null;
  } catch {
    return null;
  }
}

function generatedTime(data: CelestaHuntsData): number {
  const parsed = Date.parse(data.generatedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Vai buscar as janelas livres mais recentes. Nunca rebenta: se as duas
 * origens falharem (offline, ficheiro ainda não escrito, JSON estragado)
 * devolve null e o painel mostra o estado vazio em vez de partir a app.
 */
export async function fetchCelestaHunts(): Promise<CelestaHuntsData | null> {
  const [local, remote] = await Promise.all([fetchOne(LOCAL_URL), fetchOne(REMOTE_URL)]);

  if (local && remote) return generatedTime(local) >= generatedTime(remote) ? local : remote;
  return local ?? remote;
}
