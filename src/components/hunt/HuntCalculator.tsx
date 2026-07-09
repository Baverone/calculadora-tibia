import { useState } from 'react';
import { levelForExperience, MAX_KNOWN_LEVEL } from '../../domain/experienceTable';
import { parseLevelList, parsePositiveNumber } from '../../domain/validation';
import type { CharacterId } from '../../domain/types';
import { useSavedHunts } from '../../hooks/useSavedHunts';
import { HuntCalculatorForm } from './HuntCalculatorForm';
import { SavedHuntCard } from './SavedHuntCard';

interface HuntCalculatorProps {
  characterId: CharacterId;
  idPrefix: string;
  currentExperience: number | null;
  accentColor: string;
}

/**
 * Lets the user add hunts (name, raw exp/h, manually chosen goal levels).
 * Every hunt added is persisted (see useSavedHunts) and its time-to-goal
 * table is recalculated live against the character's current experience.
 */
export function HuntCalculator({ characterId, idPrefix, currentExperience, accentColor }: HuntCalculatorProps) {
  const { hunts, addHunt, removeHunt } = useSavedHunts(characterId);

  const [huntName, setHuntName] = useState('');
  const [rawExpInput, setRawExpInput] = useState('');
  const [goalLevelsInput, setGoalLevelsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentLevelHint = currentExperience !== null ? levelForExperience(currentExperience) : null;

  function handleSubmit() {
    const rawExpResult = parsePositiveNumber(rawExpInput, 'a Raw Experience/h');
    if (!rawExpResult.ok) {
      setError(rawExpResult.error);
      return;
    }

    const goalsResult = parseLevelList(goalLevelsInput, MAX_KNOWN_LEVEL);
    if (!goalsResult.ok) {
      setError(goalsResult.error);
      return;
    }

    setError(null);
    addHunt({ name: huntName.trim(), rawExperiencePerHour: rawExpResult.value, goalLevels: goalsResult.value });
    setHuntName('');
    setRawExpInput('');
    setGoalLevelsInput('');
  }

  return (
    <div className="hunt-calculator">
      <HuntCalculatorForm
        idPrefix={idPrefix}
        huntName={huntName}
        onHuntNameChange={setHuntName}
        rawExpInput={rawExpInput}
        onRawExpInputChange={setRawExpInput}
        goalLevelsInput={goalLevelsInput}
        onGoalLevelsInputChange={setGoalLevelsInput}
        currentLevelHint={currentLevelHint}
        onSubmit={handleSubmit}
        error={error}
        accentColor={accentColor}
      />

      {hunts.length > 0 && (
        <div className="saved-hunts-list">
          {currentExperience !== null ? (
            hunts.map((hunt) => (
              <SavedHuntCard
                key={hunt.id}
                hunt={hunt}
                currentExperience={currentExperience}
                accentColor={accentColor}
                onDelete={removeHunt}
              />
            ))
          ) : (
            <p className="chart-empty-state">Define a XP atual do personagem para ver os tempos estimados.</p>
          )}
        </div>
      )}
    </div>
  );
}
