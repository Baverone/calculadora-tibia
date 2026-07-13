// Shared domain types. Keep this file free of React/UI concerns so it can be
// reused by any future feature (comparisons, hunt planner, highscores, etc).

// Was a narrow union of just the 3 original characters — widened to a plain
// string once players became a dynamic per-team roster (2026-07-13). The 3
// originals keep these exact ids ('elite-knight' | 'royal-paladin' |
// 'exalted-monk') for backward-compat with existing localStorage data and
// the GitHub-scraped-history filenames; new team-only players use their
// slug (e.g. 'bigodes-the-legend') instead.
export type CharacterId = string;

export type TeamId = 'baverone' | 'bluey' | 'solo';

/** Top-level tab: the non-character "Utilitários Tibia" section, or one of the team tabs (each with its own player sub-tabs). */
export type AppTabId = 'utilities' | TeamId;

export interface ExperienceTableEntry {
  level: number;
  experience: number;
}

/** A single point-in-time XP reading for a character, used to build history/charts. */
export interface HistoryEntry {
  /** Unix epoch ms */
  timestamp: number;
  experience: number;
  /** 'manual' = typed in by the user (localStorage); 'guildstats' = daily automated scrape. Defaults to 'manual' when absent (older entries). */
  source?: 'manual' | 'guildstats';
}

export interface LevelProgress {
  currentLevel: number;
  nextLevel: number;
  experienceAtCurrentLevel: number;
  experienceAtNextLevel: number;
  experienceIntoLevel: number;
  experienceToNextLevel: number;
  /** 0-100 */
  progressPercent: number;
}

export type HuntBonusType = 'stamina' | 'stamina-boost';

export interface HuntBonusDefinition {
  type: HuntBonusType;
  label: string;
  /** Multiplier applied to raw exp/h, e.g. 1.5 for +50% (150% total) */
  multiplier: number;
}

export interface HuntMilestoneEstimate {
  /** Absolute level the user picked as a goal, not relative to current level. */
  targetLevel: number;
  experienceNeeded: number;
  hoursNeeded: number;
  alreadyReached: boolean;
}

export interface HuntScenarioResult {
  bonus: HuntBonusDefinition;
  effectiveExperiencePerHour: number;
  milestones: HuntMilestoneEstimate[];
}

/** A hunt the user has saved for a character, persisted across sessions. */
export interface SavedHunt {
  id: string;
  name: string;
  rawExperiencePerHour: number;
  /** User-defined target levels, ascending, deduplicated. */
  goalLevels: number[];
  createdAt: number;
}

/**
 * One row of a level-by-level plan: the level reached at the end of this
 * step. Shows both bonus scenarios side by side so they can be compared
 * directly, instead of picking one via a toggle.
 */
export interface LevelPlanStep {
  level: number;
  experienceNeeded: number;
  hoursAtStamina: number;
  /** Running total of hoursAtStamina up to and including this step. */
  cumulativeHoursAtStamina: number;
  hoursAtStaminaBoost: number;
  /** Running total of hoursAtStaminaBoost up to and including this step. */
  cumulativeHoursAtStaminaBoost: number;
}

/** How far apart the rows of a daily simulation table are, chosen based on the total range. */
export type SimulationGranularity = 'daily' | 'weekly' | 'monthly';

export interface SimulationCheckpoint {
  date: Date;
  /** Days elapsed since the simulation's start date (0 = today). */
  daysSinceStart: number;
  totalExperienceGained: number;
  finalExperience: number;
  level: number;
}

export interface DailySimulationResult {
  daysSimulated: number;
  granularity: SimulationGranularity;
  /** One row per checkpoint, ascending by date. Always includes day 0 (today) and the final target date. */
  checkpoints: SimulationCheckpoint[];
}

/**
 * How this item relates to Tibia's in-game Quest Log:
 * - 'own': has its own Quest Log entry.
 * - 'none': no Quest Log entry exists — confirm some other way (achievement, NPC dialogue, etc).
 * - 'sub': not an independent quest — it's a sub-part/rank/chapter of `parent`.
 */
export type AccessBossTag = 'own' | 'none' | 'sub';

/** One "Útil", "Acesso" or "Boss" the user tracks. Completion is a plain manual checkbox the user ticks after verifying in-game. */
export interface AccessBossItem {
  id: string;
  label: string;
  tag: AccessBossTag;
  /** Present when tag === 'sub': the quest this item is a part of. */
  parent?: string;
  /** Short reference text: where/how to confirm this in-game. */
  note: string;
}

export interface AccessBossSectionData {
  section: string;
  items: AccessBossItem[];
}
