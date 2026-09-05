// Recebe as reservas lidas da DM do bot Letter e escreve os dois ficheiros
// que a app lê. Determinístico e testável — a parte que precisa de olhos
// (abrir o Discord, correr o /summary, apanhar os embeds) fica de fora.
//
// Uso:
//   node scripts/celesta/escrever-hunts.mjs <HH:MM do footer> <reservas.json>
//
// O <reservas.json> é um mapa spot -> ["HH:MM - HH:MM Nome", ...], ou a
// string "SEM RESERVAS" quando o spot nem aparece no summary.
//
// Escreve em data/ e em public/ porque a app lê os dois e fica com o mais
// recente: public/ serve o `npm run dev` sem depender do GitHub, data/ é o
// que o push-hunts.ps1 envia para o repo e mantém o site atualizado.
// Não faz commit — quem commita e envia é o push-hunts.ps1, de 5 em 5 minutos.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { calcularJanelas, destaques } from './gaps.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FUSO_DO_BOT = 'Europe/Berlin';
const JANELA_MINIMA = 30;

const horaRef = process.argv[2];
const ficheiroReservas = process.argv[3];

if (!/^\d{2}:\d{2}$/.test(horaRef ?? '') || !ficheiroReservas) {
  console.error('Uso: node scripts/celesta/escrever-hunts.mjs <HH:MM> <reservas.json>');
  process.exit(2);
}

let reservas;
try {
  reservas = JSON.parse(readFileSync(ficheiroReservas, 'utf-8'));
} catch (erro) {
  console.error(`Não consegui ler ${ficheiroReservas}: ${erro.message}`);
  process.exit(2);
}

if (typeof reservas !== 'object' || reservas === null || Array.isArray(reservas)) {
  console.error('O ficheiro de reservas tem de ser um objeto spot -> lista de linhas.');
  process.exit(2);
}

// "SEM RESERVAS" à solta (string em vez de lista) é o que sai naturalmente da
// extração; normalizar aqui evita ter de lembrar disso do outro lado.
const normalizadas = {};
for (const [spot, valor] of Object.entries(reservas)) {
  normalizadas[spot] = Array.isArray(valor) ? valor : [String(valor)];
}

const spots = calcularJanelas(normalizadas, horaRef, JANELA_MINIMA);

const dados = {
  generatedAt: new Date().toISOString(),
  referenceTime: horaRef,
  timezone: FUSO_DO_BOT,
  minWindowMinutes: JANELA_MINIMA,
  spots,
  highlights: destaques(spots, horaRef),
};

const conteudo = `${JSON.stringify(dados, null, 2)}\n`;
for (const destino of [join(RAIZ, 'data', 'celesta-hunts.json'), join(RAIZ, 'public', 'celesta-hunts.json')]) {
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, conteudo);
}

const livres = spots.filter((s) => s.noBookings || s.free.length > 0).length;
console.log(`Escrito: ${spots.length} spots (${livres} com janelas), referência ${horaRef} (${FUSO_DO_BOT}).`);
for (const linha of dados.highlights) console.log(`  destaque: ${linha}`);
