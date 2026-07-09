// Shared input-validation helpers. Every user-facing numeric field in the app
// should go through one of these so error messages stay consistent.

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseNonNegativeInteger(raw: string, fieldLabel: string): ValidationResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: `Introduz ${fieldLabel}.` };
  }

  const normalized = trimmed.replace(/\s|\./g, '').replace(',', '.');
  const value = Number(normalized);

  if (!Number.isFinite(value)) {
    return { ok: false, error: `${fieldLabel} tem de ser um número válido.` };
  }
  if (value < 0) {
    return { ok: false, error: `${fieldLabel} não pode ser negativo.` };
  }
  if (!Number.isInteger(value)) {
    return { ok: false, error: `${fieldLabel} tem de ser um número inteiro.` };
  }

  return { ok: true, value };
}

export function parsePositiveNumber(raw: string, fieldLabel: string): ValidationResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: `Introduz ${fieldLabel}.` };
  }

  const normalized = trimmed.replace(/\s|\./g, '').replace(',', '.');
  const value = Number(normalized);

  if (!Number.isFinite(value)) {
    return { ok: false, error: `${fieldLabel} tem de ser um número válido.` };
  }
  if (value <= 0) {
    return { ok: false, error: `${fieldLabel} tem de ser maior que zero.` };
  }

  return { ok: true, value };
}

/** Like parsePositiveNumber, but allows zero (e.g. "0 hours with boost" is valid). */
export function parseNonNegativeNumber(raw: string, fieldLabel: string): ValidationResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: `Introduz ${fieldLabel}.` };
  }

  const normalized = trimmed.replace(/\s|\./g, '').replace(',', '.');
  const value = Number(normalized);

  if (!Number.isFinite(value)) {
    return { ok: false, error: `${fieldLabel} tem de ser um número válido.` };
  }
  if (value < 0) {
    return { ok: false, error: `${fieldLabel} não pode ser negativo.` };
  }

  return { ok: true, value };
}

export function validateLevelInRange(level: number, maxLevel: number): ValidationResult<number> {
  if (!Number.isInteger(level) || level < 1) {
    return { ok: false, error: 'Nível tem de ser um número inteiro >= 1.' };
  }
  if (level > maxLevel) {
    return { ok: false, error: `Nível não pode exceder ${maxLevel}.` };
  }
  return { ok: true, value: level };
}

/** Parses a free-form "1350, 1400 1500" list of goal levels into a sorted, deduplicated array. */
export function parseLevelList(raw: string, maxLevel: number): ValidationResult<number[]> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Introduz pelo menos um nível objetivo.' };
  }

  const parts = trimmed.split(/[,;\s]+/).filter(Boolean);
  const levels: number[] = [];

  for (const part of parts) {
    const numberResult = parseNonNegativeInteger(part, 'cada nível objetivo');
    if (!numberResult.ok) return numberResult;

    const rangeResult = validateLevelInRange(numberResult.value, maxLevel);
    if (!rangeResult.ok) return rangeResult;

    levels.push(rangeResult.value);
  }

  return { ok: true, value: [...new Set(levels)].sort((a, b) => a - b) };
}

/** Caps the level-by-level plan table so it never renders an unreasonable number of rows. */
export const MAX_LEVEL_PLAN_STEPS = 500;

export function validateLevelPlanTarget(targetLevel: number, currentLevel: number, maxLevel: number): ValidationResult<number> {
  const rangeResult = validateLevelInRange(targetLevel, maxLevel);
  if (!rangeResult.ok) return rangeResult;

  if (targetLevel <= currentLevel) {
    return { ok: false, error: `O nível objetivo tem de ser maior que o nível atual (${currentLevel}).` };
  }
  if (targetLevel - currentLevel > MAX_LEVEL_PLAN_STEPS) {
    return {
      ok: false,
      error: `Diferença entre o nível atual e o objetivo é demasiado grande para a tabela nível-a-nível (máx. ${MAX_LEVEL_PLAN_STEPS} níveis). Escolhe um objetivo mais próximo.`,
    };
  }

  return { ok: true, value: targetLevel };
}

export function parseFutureDate(raw: string, fromDate: Date = new Date()): ValidationResult<Date> {
  if (raw.trim() === '') {
    return { ok: false, error: 'Escolhe uma data.' };
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: 'Data inválida.' };
  }

  const startOfToday = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  if (date.getTime() < startOfToday.getTime()) {
    return { ok: false, error: 'A data tem de ser hoje ou no futuro.' };
  }

  return { ok: true, value: date };
}
