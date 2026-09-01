// Quem é recolhido automaticamente, e para onde vai.
//
// Vivia espalhado pelos scripts de recolha; está aqui porque o
// check-history-freshness.mjs também precisa da lista — sem isso ele olhava
// para *todos* os ficheiros na pasta e queixava-se de jogadores que ninguém
// rastreia. Um alarme que está sempre a tocar é um alarme que se ignora, e
// era exatamente esse o problema a resolver.
//
// Manter igual a src/constants/players.tsx: se os ids não baterem certo, a
// app pede um ficheiro que o robô nunca escreve e mostra um painel vazio sem
// dizer porquê.
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Os dois bonecos do André → data/scraped-history/<id>.json */
export const CHARACTERS = [
  { id: 'royal-paladin', nick: 'Baverone' },
  { id: 'exalted-monk', nick: 'Bluey The Cat' },
];

export const DATA_DIR = join(ROOT, 'data', 'scraped-history');
