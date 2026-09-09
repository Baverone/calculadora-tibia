/**
 * Janelas livres de hunt no mundo Celesta, tal como são publicadas em
 * data/celesta-hunts.json pela tarefa agendada que lê a DM do bot Letter
 * (TibiaLoot.com Spot Assistant) no Discord.
 *
 * As horas vêm todas em Europe/Berlin — é o fuso do bot, e é assim que
 * aparecem no Discord. Lisboa = Berlim −1h.
 */

export interface HuntWindow {
  /** "HH:MM" em hora de Berlim. */
  start: string;
  /** "HH:MM" em hora de Berlim. Pode ser menor que start quando passa da meia-noite. */
  end: string;
  minutes: number;
}

export interface HuntSpotStatus {
  name: string;
  free: HuntWindow[];
  /** true quando o spot nem sequer aparece no summary — sem reservas nenhumas. */
  noBookings?: boolean;
}

export interface CelestaHuntsData {
  /** ISO 8601, momento em que a tarefa gerou este ficheiro. */
  generatedAt: string;
  /** "HH:MM" do footer do summary — o "agora" com que as janelas foram calculadas. */
  referenceTime: string;
  timezone: string;
  minWindowMinutes: number;
  spots: HuntSpotStatus[];
  /** Uma ou duas janelas em horário decente que valem a pena, já em texto. */
  highlights?: string[];
}

/** Acima disto o ficheiro é velho de mais para se confiar nele às cegas. */
const STALE_AFTER_MS = 95 * 60 * 1000;

export function isStale(data: CelestaHuntsData, now: number): boolean {
  const generated = Date.parse(data.generatedAt);
  if (Number.isNaN(generated)) return true;
  return now - generated > STALE_AFTER_MS;
}

export function formatAge(data: CelestaHuntsData, now: number): string {
  const generated = Date.parse(data.generatedAt);
  if (Number.isNaN(generated)) return 'data desconhecida';

  const minutes = Math.max(0, Math.round((now - generated) / 60000));
  if (minutes < 1) return 'agora mesmo';
  if (minutes === 1) return 'há 1 minuto';
  if (minutes < 60) return `há ${minutes} minutos`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 1 && rest === 0) return 'há 1 hora';
  if (rest === 0) return `há ${hours} horas`;
  return `há ${hours}h${String(rest).padStart(2, '0')}`;
}

export function formatWindow(window: HuntWindow): string {
  return `${window.start} - ${window.end}`;
}

export function formatLength(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}

/** Converte "HH:MM" de Berlim para a mesma hora em Lisboa (−1h). */
export function toLisbon(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  return `${String((h + 23) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function totalFreeMinutes(spot: HuntSpotStatus): number {
  if (spot.noBookings) return 24 * 60;
  return spot.free.reduce((sum, w) => sum + w.minutes, 0);
}

/* --- "Está livre agora?" ----------------------------------------------
 *
 * As janelas não trazem data: são "HH:MM - HH:MM" numa volta de 24h que
 * começa em `referenceTime`. Para responder à pergunta que se faz ao abrir
 * isto no telemóvel — este spot está livre AGORA? — só é preciso saber
 * quantos minutos passaram desde essa referência, e comparar com o desvio de
 * cada janela dentro da mesma volta.
 *
 * O relógio de Berlim não entra na conta: os minutos decorridos saem do
 * `generatedAt`, que é um instante absoluto. Vale mais ou menos 2 minutos de
 * folga (o `referenceTime` é o footer do summary, escrito um pouco antes de o
 * ficheiro ser gerado) e nenhuma dependência de fusos.
 */

const MINUTES_PER_DAY = 24 * 60;

function toMinutes(hhmm: string): number | null {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  return h * 60 + m;
}

/**
 * Minutos passados desde o momento a que as janelas se referem.
 *
 * `null` quando não dá para responder com honestidade: data inválida, relógio
 * do dispositivo atrás do ficheiro, ou ficheiro com 24h+ — a partir daí a
 * conta dava a volta e dizia "livre agora" com toda a confiança sobre uma
 * janela de ontem.
 */
export function minutesSinceReference(data: CelestaHuntsData, now: number): number | null {
  const generated = Date.parse(data.generatedAt);
  if (Number.isNaN(generated)) return null;

  const elapsed = Math.floor((now - generated) / 60000);
  if (elapsed < 0 || elapsed >= MINUTES_PER_DAY) return null;
  return elapsed;
}

export interface SpotAvailability {
  /** `free` = dá para entrar já; `busy` = está reservado neste momento. */
  state: 'free' | 'busy';
  /** A janela a decorrer (state `free`) ou a próxima a abrir (state `busy`). */
  window: HuntWindow | null;
  /** "HH:MM" a que isto muda: fim da janela atual, ou início da próxima. */
  changesAt: string | null;
  /** Minutos até essa mudança. `null` quando não há próxima janela nas 24h. */
  minutesUntilChange: number | null;
}

/**
 * O estado do spot neste instante. `null` quando `minutesSinceReference` não
 * sabe responder — nesse caso o painel mostra só as janelas, sem inventar um
 * "agora".
 */
export function spotAvailability(
  spot: HuntSpotStatus,
  data: CelestaHuntsData,
  now: number
): SpotAvailability | null {
  const elapsed = minutesSinceReference(data, now);
  if (elapsed === null) return null;

  if (spot.noBookings) {
    return { state: 'free', window: null, changesAt: null, minutesUntilChange: null };
  }

  const anchor = toMinutes(data.referenceTime);
  if (anchor === null) return null;

  let next: { window: HuntWindow; startsIn: number } | null = null;

  for (const window of spot.free) {
    const start = toMinutes(window.start);
    if (start === null) continue;

    // Desvio da janela dentro da volta de 24h que começa na referência. É isto
    // que põe uma janela "00:00 - 02:04" no fim do dia e não no princípio.
    const offset = (((start - anchor) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

    if (offset <= elapsed && elapsed < offset + window.minutes) {
      return {
        state: 'free',
        window,
        changesAt: window.end,
        minutesUntilChange: offset + window.minutes - elapsed,
      };
    }

    if (offset > elapsed && (next === null || offset - elapsed < next.startsIn)) {
      next = { window, startsIn: offset - elapsed };
    }
  }

  return next
    ? { state: 'busy', window: next.window, changesAt: next.window.start, minutesUntilChange: next.startsIn }
    : { state: 'busy', window: null, changesAt: null, minutesUntilChange: null };
}
