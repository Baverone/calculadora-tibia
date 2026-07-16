import { useState } from 'react';
import { levelForExperience, MAX_KNOWN_LEVEL } from '../../domain/experienceTable';
import { parseLevelList, parsePositiveNumber } from '../../domain/validation';
import type { SavedHunt } from '../../domain/types';
import { HuntCalculatorForm } from './HuntCalculatorForm';
import { SavedHuntCard } from './SavedHuntCard';

interface HuntCalculatorProps {
  idPrefix: string;
  currentExperience: number | null;
  accentColor: string;
  hunts: SavedHunt[];
  addHunt: (hunt: Omit<SavedHunt, 'id' | 'createdAt'>) => void;
  removeHunt: (huntId: string) => void;
}

/**
 * Lets the user add hunts (name, raw exp/h, manually chosen goal levels).
 * Every hunt added is persisted and its time-to-goal table is recalculated
 * live against the character's current experience.
 *
 * The hunt list is owned by PlayerPanel (not fetched here via useSavedHunts)
 * because XpForecastCard needs the same list: two useSavedHunts instances
 * would each hold their own useState copy, so a hunt added here would never
 * show up in the forecast's respawn picker until a reload.
 */
export function HuntCalculator({
  idPrefix,
  currentExperience,
  accentColor,
  hunts,
  addHunt,
  removeHunt,
}: HuntCalculatorProps) {
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
