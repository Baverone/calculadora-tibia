import { useCallback, useState } from 'react';
import type { CharacterId } from '../domain/types';
import type { SkillTrainingConfig } from '../storage/skillTrainingStorage';
import { getSkillTrainingConfig, saveSkillTrainingConfig } from '../storage/skillTrainingStorage';

/** Owns the Skill Training Calculator draft/config for one character, backed by localStorage. */
export function useSkillTrainingConfig(characterId: CharacterId) {
  const [config, setConfig] = useState(() => getSkillTrainingConfig(characterId));

  const updateConfig = useCallback(
    (updater: (current: SkillTrainingConfig) => SkillTrainingConfig) => {
      setConfig((current) => saveSkillTrainingConfig(characterId, updater(current)));
    },
    [characterId]
  );

  return { config, updateConfig };
}
