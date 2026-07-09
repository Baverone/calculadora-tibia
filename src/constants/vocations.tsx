import type { ReactElement } from 'react';
import type { CharacterId } from '../domain/types';

// Small, original geometric icons (no official Tibia artwork) used to give
// each tab a distinct visual identity. Pure decoration — safe to swap out later.

function SwordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2 L20 8 L11 17 L8 14 L17 5 Z M8 14 L4 18 L3 21 L6 20 L10 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 3 C6 3 4 12 6 21 M6 3 L19 12 L6 21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M6 12 H20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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

export interface VocationMeta {
  id: CharacterId;
  name: string;
  tagline: string;
  accentColor: string;
  Icon: (props: { className?: string }) => ReactElement;
}

export const VOCATIONS: VocationMeta[] = [
  { id: 'elite-knight', name: 'Elite Knight', tagline: 'Força bruta', accentColor: '#c0392b', Icon: SwordIcon },
  { id: 'royal-paladin', name: 'Royal Paladin', tagline: 'Precisão', accentColor: '#27ae60', Icon: BowIcon },
  { id: 'exalted-monk', name: 'Exalted Monk', tagline: 'Disciplina', accentColor: '#8e44ad', Icon: LotusIcon },
];
