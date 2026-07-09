import { useCallback, useState } from 'react';
import type { CharacterId } from '../domain/types';
import type { WheelBuild } from '../domain/wheel/types';
import { deleteWheelBuild, getWheelBuilds, saveWheelBuild } from '../storage/wheelBuildStorage';

/** Owns the list of saved Wheel of Destiny builds for one character, backed by localStorage. */
export function useSavedWheelBuilds(characterId: CharacterId) {
  const [builds, setBuilds] = useState(() => getWheelBuilds(characterId));

  const addBuild = useCallback(
    (build: Omit<WheelBuild, 'id' | 'createdAt'>) => {
      setBuilds(saveWheelBuild(characterId, build));
    },
    [characterId]
  );

  const removeBuild = useCallback(
    (buildId: string) => {
      setBuilds(deleteWheelBuild(characterId, buildId));
    },
    [characterId]
  );

  return { builds, addBuild, removeBuild };
}
