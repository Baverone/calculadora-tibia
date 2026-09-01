import type { ReactElement } from 'react';
import type { CharacterId } from '../domain/types';

// Ícones geométricos próprios (nada de arte oficial do Tibia) — decoração.

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 21 L21 3 M21 3 H14 M21 3 V10 M7 13 L11 17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21 C12 21 4 17 4 10 C4 6 8 3 12 8 C16 3 20 6 20 10 C20 17 12 21 12 21 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="1.6" fill="currentColor" />
    </svg>
  );
}

export interface PlayerMeta {
  /** Também o nome do ficheiro em data/scraped-history/<id>.json. */
  id: CharacterId;
  name: string;
  tagline: string;
  accentColor: string;
  Icon: (props: { className?: string }) => ReactElement;
}

/**
 * Os dois bonecos. Se um dia voltar a haver mais, é aqui e em
 * scripts/lib/trackedPlayers.mjs — as duas listas têm de bater certo, senão a
 * app pede um ficheiro que o robô nunca escreve.
 */
export const PLAYERS: PlayerMeta[] = [
  {
    id: 'royal-paladin',
    name: 'Baverone',
    tagline: 'Royal Paladin — Precisão',
    accentColor: '#27ae60',
    Icon: ArrowIcon,
  },
  {
    id: 'exalted-monk',
    name: 'Bluey The Cat',
    tagline: 'Exalted Monk — Disciplina',
    accentColor: '#8e44ad',
    Icon: LotusIcon,
  },
];
