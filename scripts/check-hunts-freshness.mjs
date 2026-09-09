// Guarda-costas das janelas de hunt do Celesta.
//
// O check-history-freshness.mjs faz esta mesma pergunta à XP desde os dez dias
// parados de agosto de 2026. O celesta-hunts.json não tinha equivalente
// nenhum: se a tarefa que lê o Discord parasse, o painel dizia "há 9 horas" e
// mais nada — zero mail, zero vermelho. É exatamente a mesma falha, noutro
// ficheiro.
//
// O que muda em relação à XP é o horário. A tarefa (tibia-celesta) corre de
// hora a hora entre as 08:03 e as 23:03, mais uma vez às 00:03. Entre as 00:30
// e as 08:00 o ficheiro envelhece porque ninguém o escreve — é o normal, não
// uma avaria, e às 08:00 tem legitimamente ~8h. Por isso não se conta o tempo
// de relógio: contam-se os minutos de HORÁRIO decorridos desde o generatedAt.
// Quatro horas de horário são quatro corridas falhadas seguidas.
//
// O limiar de 4h é a sugestão da revisão de 09/09/2026 — o número é do André,
// e muda-se aqui e em src/domain/celestaHunts.ts (a mesma decisão está
// copiada do lado da app, que a usa para pintar o painel de vermelho; se um
// lado mudar, o outro tem de mudar também).
//
// Uso: node scripts/check-hunts-freshness.mjs [--max-idade-horas N]
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const FICHEIRO = join(RAIZ, 'data', 'celesta-hunts.json');

// 08:00 e 00:30 em minutos desde a meia-noite de Lisboa.
const INICIO_HORARIO = 8 * 60;
const FIM_HORARIO = 30;
const MINUTOS_DE_HORARIO_POR_DIA = FIM_HORARIO + (24 * 60 - INICIO_HORARIO);

// Mesma validação do check-history-freshness.mjs, e pela mesma razão: um
// `--max-idade-horas` sem número dava NaN, toda a comparação com NaN é falsa,
// e o alarme saía 0 a dizer que estava tudo bem. Um guarda-costas que se cala
// por causa de um argumento mal escrito é o modo de falha que ele existe para
// impedir.
const argIndex = process.argv.indexOf('--max-idade-horas');
const MAX_HORAS = argIndex !== -1 ? Number(process.argv[argIndex + 1]) : 4;

if (!Number.isFinite(MAX_HORAS) || MAX_HORAS < 0) {
  console.error(
    `--max-idade-horas precisa de um número >= 0 (recebi ${JSON.stringify(process.argv[argIndex + 1] ?? null)}).`
  );
  process.exit(2);
}

const MAX_MINUTOS = MAX_HORAS * 60;

const partesDeLisboa = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Lisbon',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** { dia desde a época, minutos desde a meia-noite } em hora de Lisboa. */
function relogioDeLisboa(ms) {
  const p = {};
  for (const parte of partesDeLisboa.formatToParts(new Date(ms))) p[parte.type] = parte.value;
  const [ano, mes, dia, hora, minuto] = [p.year, p.month, p.day, p.hour, p.minute].map(Number);
  if ([ano, mes, dia, hora, minuto].some((n) => !Number.isInteger(n))) return null;
  return { dia: Date.UTC(ano, mes - 1, dia) / 86_400_000, minutos: hora * 60 + minuto };
}

/** Um relógio que só anda dentro do horário da tarefa. */
function relogioDeHorario(ms) {
  const r = relogioDeLisboa(ms);
  if (r === null) return null;
  const m = r.minutos;
  const noDia = m <= FIM_HORARIO ? m : m < INICIO_HORARIO ? FIM_HORARIO : FIM_HORARIO + (m - INICIO_HORARIO);
  return r.dia * MINUTOS_DE_HORARIO_POR_DIA + noDia;
}

function dentroDoHorario(ms) {
  const r = relogioDeLisboa(ms);
  return r !== null && (r.minutos <= FIM_HORARIO || r.minutos >= INICIO_HORARIO);
}

function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto}min`;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, '0')}`;
}

const agora = Date.now();
const horaDeLisboa = relogioDeLisboa(agora);
const etiquetaDaHora = horaDeLisboa
  ? `${String(Math.floor(horaDeLisboa.minutos / 60)).padStart(2, '0')}:${String(horaDeLisboa.minutos % 60).padStart(2, '0')}`
  : '??:??';

let dados;
try {
  dados = JSON.parse(readFileSync(FICHEIRO, 'utf-8'));
} catch (erro) {
  // Aqui não há folga de horário que valha: o ficheiro não existe ou não se lê.
  console.error(`Não consegui ler ${FICHEIRO}: ${erro.message}`);
  console.error('A tarefa tibia-celesta nunca correu com sucesso neste PC, ou o ficheiro foi apagado.');
  process.exit(1);
}

const gerado = Date.parse(dados?.generatedAt ?? '');
if (Number.isNaN(gerado)) {
  console.error(`celesta-hunts.json sem generatedAt legível (${JSON.stringify(dados?.generatedAt ?? null)}).`);
  console.error('Sem data não há como saber de quando são estas janelas — vale o mesmo que não haver ficheiro.');
  process.exit(1);
}

const inicio = relogioDeHorario(gerado);
const fim = relogioDeHorario(agora);
const minutosDeHorario = Math.max(0, fim - inicio);
const idadeReal = Math.max(0, Math.round((agora - gerado) / 60000));

if (!dentroDoHorario(agora)) {
  // Entre as 00:30 e as 08:00 ninguém escreve o ficheiro. Um alarme que toca
  // todas as noites é um alarme que se ignora.
  console.log(
    `Fora do horário da tarefa (08:00–00:30; agora são ${etiquetaDaHora} em Lisboa) — sem alarme.\n` +
      `Ficheiro escrito há ${formatarDuracao(idadeReal)}, ${formatarDuracao(minutosDeHorario)} de horário.`
  );
  process.exit(0);
}

if (minutosDeHorario > MAX_MINUTOS) {
  console.error(
    `PARADO  celesta-hunts.json escrito há ${formatarDuracao(idadeReal)} — ` +
      `${formatarDuracao(minutosDeHorario)} de horário da tarefa, mais do que os ${MAX_HORAS}h de folga ` +
      `(agora são ${etiquetaDaHora} em Lisboa).\n\n` +
      'A recolha do Discord parou. A tarefa tibia-celesta corre de hora a hora entre as 08:03 e as 23:03,\n' +
      'mais uma vez às 00:03, e precisa do Chrome aberto com sessão no Discord.\n' +
      'Ver scripts/celesta/runs.jsonl, scripts/celesta-local.log e o estado da tarefa no ai-pc.'
  );
  process.exit(1);
}

console.log(
  `Janelas em dia — escritas há ${formatarDuracao(idadeReal)} (${formatarDuracao(minutosDeHorario)} de horário, ` +
    `folga de ${MAX_HORAS}h; agora são ${etiquetaDaHora} em Lisboa).`
);
process.exit(0);
