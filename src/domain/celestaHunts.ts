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
