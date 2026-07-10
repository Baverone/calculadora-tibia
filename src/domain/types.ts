// Shared domain types. Keep this file free of React/UI concerns so it can be
// reused by any future feature (comparisons, hunt planner, highscores, etc).

export type CharacterId = 'elite-knight' | 'royal-paladin' | 'exalted-monk';

/** A character tab, or the non-character "Utilitários Tibia" tab (Rashid + Tibiadrome Tracker). */
export type AppTabId = CharacterId | 'utilities';

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
