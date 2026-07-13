/**
 * Skill training math, sourced from TibiaWiki's official formulas (Formulae
 * and Exercise Weapons pages), verified against the wiki's own worked
 * examples (a Lasting Exercise Wand/Rod — 8,640,000 mana — takes a
 * Sorcerer/Druid to ~level 66 and a Paladin to ~level 22.8; both match this
 * implementation within rounding).
 *
 * Skill points needed for the next level: P = A * b^(level - c)
 *   A = skill constant (fixed per skill, all vocations)
 *   b = vocation constant (varies per vocation AND skill)
 *   c = skill offset — 0 for Magic Level, 10 for every other skill
 *
 * Exercise/Training weapons convert real charges into skill points at a
 * fixed rate per skill type (also from TibiaWiki): every charge is worth
 * 7.2 hits for a melee weapon (Sword/Axe/Club/Fist), 4.32 hits for a Bow
 * (Distance), 14.4 blocks for a Shield, or 600 burned mana for a Wand/Rod
 * (Magic Level). "Regular training" here means a standard Exercise Dummy —
 * Monk/Demon/Ferumbras Exercise Dummies are 10% more efficient.
 */

export type Vocation = 'knight' | 'paladin' | 'sorcerer' | 'druid' | 'monk';
export type TrainableSkill = 'magic' | 'axe' | 'sword' | 'club' | 'distance' | 'shielding' | 'fist';

interface SkillFormulaConfig {
  a: number;
  c: number;
  pointsPerCharge: number;
}

const SKILL_CONFIG: Record<TrainableSkill, SkillFormulaConfig> = {
  magic: { a: 1600, c: 0, pointsPerCharge: 600 },
  axe: { a: 50, c: 10, pointsPerCharge: 7.2 },
  sword: { a: 50, c: 10, pointsPerCharge: 7.2 },
  club: { a: 50, c: 10, pointsPerCharge: 7.2 },
  fist: { a: 50, c: 10, pointsPerCharge: 7.2 },
  distance: { a: 30, c: 10, pointsPerCharge: 4.32 },
  shielding: { a: 100, c: 10, pointsPerCharge: 14.4 },
};

const VOCATION_B: Record<Vocation, Partial<Record<TrainableSkill, number>>> = {
  knight: { magic: 3.0, axe: 1.1, sword: 1.1, club: 1.1, shielding: 1.1 },
  paladin: { magic: 1.4, distance: 1.1 },
  sorcerer: { magic: 1.1 },
  druid: { magic: 1.1 },
  monk: { magic: 1.25, fist: 1.1 },
};

export const VOCATION_SKILLS: Record<Vocation, TrainableSkill[]> = {
  knight: ['axe', 'sword', 'club', 'magic', 'shielding'],
  paladin: ['distance', 'magic'],
  sorcerer: ['magic'],
  druid: ['magic'],
  monk: ['magic', 'fist'],
};

export const VOCATION_LABELS: Record<Vocation, string> = {
  knight: 'Knight',
  paladin: 'Paladin',
  sorcerer: 'Sorcerer',
  druid: 'Druid',
  monk: 'Monk',
};

export const SKILL_LABELS: Record<TrainableSkill, string> = {
  magic: 'Magic Level',
  axe: 'Axe Fighting',
  sword: 'Sword Fighting',
  club: 'Club Fighting',
  distance: 'Distance Fighting',
  shielding: 'Shielding',
  fist: 'Fist Fighting',
};

/** Minimum valid skill level — combat skills start at 10, Magic Level starts at 0. */
export function minSkillLevel(skill: TrainableSkill): number {
  return SKILL_CONFIG[skill].c;
}

export function skillTrainableBy(vocation: Vocation, skill: TrainableSkill): boolean {
  return VOCATION_B[vocation][skill] !== undefined;
}

function vocationB(skill: TrainableSkill, vocation: Vocation): number {
  const b = VOCATION_B[vocation][skill];
  if (b === undefined) {
    throw new Error(`${skill} não é treinável por ${vocation}.`);
  }
  return b;
}

/** Points (hits, or mana for Magic Level) needed to go from currentLevel to currentLevel + 1. */
export function pointsForNextLevel(skill: TrainableSkill, vocation: Vocation, currentLevel: number): number {
  const config = SKILL_CONFIG[skill];
  const b = vocationB(skill, vocation);
  return config.a * Math.pow(b, currentLevel - config.c);
}

/** Total points spent to reach `level` starting from the skill's base level. */
function totalPointsAtLevel(skill: TrainableSkill, vocation: Vocation, level: number): number {
  const config = SKILL_CONFIG[skill];
  const b = vocationB(skill, vocation);
  return (config.a * (Math.pow(b, level - config.c) - 1)) / (b - 1);
}

/** Inverse of totalPointsAtLevel: turns a raw point total back into a level + % into that level. */
function levelPercentFromPoints(skill: TrainableSkill, vocation: Vocation, points: number): { level: number; percent: number } {
  const config = SKILL_CONFIG[skill];
  const b = vocationB(skill, vocation);

  const exactLevel = Math.log((points * (b - 1)) / config.a + 1) / Math.log(b) + config.c;
  const level = Math.max(config.c, Math.floor(exactLevel));
  const pointsAtLevel = totalPointsAtLevel(skill, vocation, level);
  const pointsForThisLevel = pointsForNextLevel(skill, vocation, level);
  const percent = pointsForThisLevel > 0 ? ((points - pointsAtLevel) / pointsForThisLevel) * 100 : 0;

  return { level, percent: Math.min(99.99, Math.max(0, percent)) };
}

/**
 * Loyalty bonus: 5% per 360 Loyalty Points, capped at 50% at 3600 points.
 * It does NOT speed up point gain per hit — per TibiaWiki, "characters with
 * a loyalty skill bonus will accrue skills as if they did not have the
 * bonus". It only inflates the *displayed* skill level: displayedPoints =
 * basePoints * (1 + bonus). So a level/percent typed in from the in-game
 * skills window is already loyalty-inflated and has to be converted back to
 * real (base) points before working out how many real hits are needed.
 */
export const LOYALTY_BONUS_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export interface SkillTrainingResult {
  /** The real (non-inflated) skill level/%, derived from the displayed level/% and the Loyalty bonus. */
  baseLevel: number;
  basePercent: number;
  /** Points (hits or mana) still needed to reach the next level, with no Double Skill Event. */
  pointsRemaining: number;
  /** Exercise/Training weapon charges needed under normal conditions. */
  chargesNormal: number;
  /** Exercise/Training weapon charges needed with an active Double Skill Event (2x point gain). */
  chargesDoubleEvent: number;
}

const SPECIAL_DUMMY_EFFICIENCY = 1.1;

export function calculateSkillTraining(
  skill: TrainableSkill,
  vocation: Vocation,
  displayedCurrentLevel: number,
  displayedCurrentPercent: number,
  useSpecialDummy: boolean,
  loyaltyBonusPercent: number
): SkillTrainingResult {
  const loyaltyMultiplier = 1 + loyaltyBonusPercent / 100;

  const pointsForNextDisplayedLevel = pointsForNextLevel(skill, vocation, displayedCurrentLevel);
  const displayedPointsAtCurrent =
    totalPointsAtLevel(skill, vocation, displayedCurrentLevel) + (displayedCurrentPercent / 100) * pointsForNextDisplayedLevel;
  const displayedPointsAtNextLevel = totalPointsAtLevel(skill, vocation, displayedCurrentLevel + 1);

  const basePointsAtCurrent = displayedPointsAtCurrent / loyaltyMultiplier;
  const basePointsNeededForNextLevel = displayedPointsAtNextLevel / loyaltyMultiplier;

  const pointsRemaining = basePointsNeededForNextLevel - basePointsAtCurrent;
  const { level: baseLevel, percent: basePercent } = levelPercentFromPoints(skill, vocation, basePointsAtCurrent);

  const perCharge = SKILL_CONFIG[skill].pointsPerCharge * (useSpecialDummy ? SPECIAL_DUMMY_EFFICIENCY : 1);

  return {
    baseLevel,
    basePercent,
    pointsRemaining,
    chargesNormal: Math.ceil(pointsRemaining / perCharge),
    chargesDoubleEvent: Math.ceil(pointsRemaining / perCharge / 2),
  };
}

/** A Lasting Exercise weapon (the largest purchasable tier) has this many charges. */
export const LASTING_EXERCISE_CHARGES = 14400;
