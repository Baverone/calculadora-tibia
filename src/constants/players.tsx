import type { ReactElement } from 'react';
import type { TeamId } from '../domain/types';
import type { CustomPlayer } from '../storage/customPlayerStorage';

// Small, original geometric icons (no official Tibia artwork) — pure decoration.

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

/** Generic member icon for team players without a known in-game vocation. */
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 12 L11 14 L15.5 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface PlayerMeta {
  /** Storage key — 'elite-knight'/'royal-paladin'/'exalted-monk' for the 3 originals (kept exactly, for backward-compat with existing data), a slug for team-only players. */
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
  Icon: (props: { className?: string }) => ReactElement;
  teamId: TeamId;
  /** Which GitHub-scraped dataset backs this player's automatic XP history. */
  sharedHistorySource: 'main' | 'team';
}

export interface TeamMeta {
  id: TeamId;
  label: string;
}

export const TEAMS: TeamMeta[] = [
  { id: 'baverone', label: 'Equipa Baverone' },
  { id: 'bluey', label: 'Equipa Bluey The Cat' },
  { id: 'solo', label: 'Solo' },
];

export const PLAYERS: PlayerMeta[] = [
  {
    id: 'royal-paladin',
    name: 'Baverone',
    tagline: 'Royal Paladin — Precisão',
    accentColor: '#27ae60',
    Icon: ShieldIcon,
    teamId: 'baverone',
    sharedHistorySource: 'main',
  },
  {
    id: 'exalted-monk',
    name: 'Bluey The Cat',
    tagline: 'Exalted Monk — Disciplina',
    accentColor: '#8e44ad',
    Icon: LotusIcon,
    teamId: 'bluey',
    sharedHistorySource: 'main',
  },
  {
    id: 'dalla-shot',
    name: 'Dalla Shot',
    tagline: 'Membro da Equipa Bluey The Cat',
    accentColor: '#2980b9',
    Icon: ShieldIcon,
    teamId: 'bluey',
    sharedHistorySource: 'team',
  },
  {
    id: 'fire-wu',
    name: 'Fire Wu',
    tagline: 'Membro da Equipa Bluey The Cat',
    accentColor: '#e67e22',
    Icon: ShieldIcon,
    teamId: 'bluey',
    sharedHistorySource: 'team',
  },
  {
    id: 'elite-knight',
    name: 'Serip Seomis',
    tagline: 'Elite Knight — Força bruta',
    accentColor: '#c0392b',
    Icon: SwordIcon,
    teamId: 'solo',
    sharedHistorySource: 'main',
  },
];

export function playersForTeam(teamId: TeamId): PlayerMeta[] {
  return PLAYERS.filter((p) => p.teamId === teamId);
}

const CUSTOM_PLAYER_PALETTE = ['#e67e22', '#2980b9', '#16a085', '#c0392b', '#8e44ad', '#27ae60', '#d4af37'];

/**
 * Turns a manually-added player (via the "+" button) into the same
 * PlayerMeta shape as the fixed roster, so PlayerPanel/PlayerTabsBar don't
 * need to know the difference. `sharedHistorySource: 'team'` still applies
 * — it just resolves to no automatic data since these names aren't in
 * scripts/scrape-team-experience.mjs's fixed list, so it's fully
 * manual-XP-only until/unless that script is updated to include them.
 */
export function customPlayerToMeta(custom: CustomPlayer, colorIndex: number): PlayerMeta {
  return {
    id: custom.id,
    name: custom.name,
    tagline: 'Membro da equipa (adicionado manualmente)',
    accentColor: CUSTOM_PLAYER_PALETTE[colorIndex % CUSTOM_PLAYER_PALETTE.length],
    Icon: ShieldIcon,
    teamId: custom.teamId,
    sharedHistorySource: 'team',
  };
}
