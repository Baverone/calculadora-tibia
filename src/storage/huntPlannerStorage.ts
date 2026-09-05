import type { CharacterId } from '../domain/types';

export interface EntradaHunt {
  nivelAlvo: string;
  xpHora: string;
  horas: string;
  stamina: boolean;
  boost: boolean;
  boosts: string;
  dobro: boolean;
}

const PREFIXO = 'calculadora-hunt:';

export const ENTRADA_VAZIA: EntradaHunt = {
  nivelAlvo: '',
  xpHora: '',
  horas: '',
  // A stamina verde é o caso normal de quem planeia uma hunt — quem caça sem
  // ela raramente está a fazer contas para subir de nível.
  stamina: true,
  boost: false,
  boosts: '1',
  dobro: false,
};

/** Guardado por personagem: a XP/h de uma hunt do Baverone não serve ao Bluey. */
export function carregarEntrada(personagem: CharacterId): EntradaHunt {
  try {
    const bruto = localStorage.getItem(`${PREFIXO}${personagem}`);
    if (!bruto) return ENTRADA_VAZIA;
    const lido = JSON.parse(bruto);
    if (typeof lido !== 'object' || lido === null) return ENTRADA_VAZIA;
    return { ...ENTRADA_VAZIA, ...lido };
  } catch {
    return ENTRADA_VAZIA;
  }
}

export function guardarEntrada(personagem: CharacterId, entrada: EntradaHunt): void {
  try {
    localStorage.setItem(`${PREFIXO}${personagem}`, JSON.stringify(entrada));
  } catch {
    // Janela privada ou armazenamento cheio — a calculadora continua a
    // funcionar, só não se lembra dos valores da próxima vez.
  }
}
