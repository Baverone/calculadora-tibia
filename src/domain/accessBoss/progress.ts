import type { AccessBossSectionData } from '../types';

export interface AccessBossProgress {
  done: number;
  total: number;
  /** 0-100 */
  percent: number;
}

function toProgress(done: number, total: number): AccessBossProgress {
  return { done, total, percent: total === 0 ? 0 : (done / total) * 100 };
}

export function getSectionProgress(section: AccessBossSectionData, completedIds: Set<string>): AccessBossProgress {
  const done = section.items.filter((item) => completedIds.has(item.id)).length;
  return toProgress(done, section.items.length);
}

export function getOverallProgress(sections: AccessBossSectionData[], completedIds: Set<string>): AccessBossProgress {
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);
  const done = sections.reduce((sum, section) => sum + section.items.filter((item) => completedIds.has(item.id)).length, 0);
  return toProgress(done, total);
}
