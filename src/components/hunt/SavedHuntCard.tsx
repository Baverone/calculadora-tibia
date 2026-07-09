import { calculateHuntScenarios, formatHoursAndMinutes } from '../../domain/huntCalculator';
import type { SavedHunt } from '../../domain/types';
import { LevelPlanSection } from './LevelPlanSection';
import { DailySimulationSection } from './DailySimulationSection';

interface SavedHuntCardProps {
  hunt: SavedHunt;
  currentExperience: number;
  accentColor: string;
  onDelete: (huntId: string) => void;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');

/**
 * Renders one saved hunt's comparison table plus the level-by-level planner
 * and daily-forecast tools. Everything is recalculated live from the
 * character's current experience on every render, so the saved hunt (name,
 * raw exp/h, goal levels) always reflects up-to-date time estimates.
 */
export function SavedHuntCard({ hunt, currentExperience, accentColor, onDelete }: SavedHuntCardProps) {
  const scenarios = calculateHuntScenarios(currentExperience, hunt.rawExperiencePerHour, hunt.goalLevels);

  return (
    <div className="saved-hunt-card">
      <div className="saved-hunt-card__header">
        <h4>{hunt.name || 'Hunt sem nome'}</h4>
        <button type="button" className="saved-hunt-card__delete" onClick={() => onDelete(hunt.id)}>
          Remover
        </button>
      </div>
      <p className="saved-hunt-card__meta">Raw Experience/h: {numberFormatter.format(hunt.rawExperiencePerHour)}</p>

      <table className="hunt-scenario-table">
        <thead>
          <tr>
            <th>Cenário</th>
            <th>Exp/h efetiva</th>
            {scenarios[0].milestones.map((milestone) => (
              <th key={milestone.targetLevel}>Nível {milestone.targetLevel}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario) => (
            <tr key={scenario.bonus.type}>
              <td>{scenario.bonus.label}</td>
              <td>{numberFormatter.format(Math.round(scenario.effectiveExperiencePerHour))}</td>
              {scenario.milestones.map((milestone) => (
                <td key={milestone.targetLevel}>
                  {milestone.alreadyReached ? 'Atingido' : formatHoursAndMinutes(milestone.hoursNeeded)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="saved-hunt-card__subsection">
        <h5>Planeamento nível a nível</h5>
        <LevelPlanSection
          idPrefix={`plan-${hunt.id}`}
          currentExperience={currentExperience}
          rawExperiencePerHour={hunt.rawExperiencePerHour}
          accentColor={accentColor}
        />
      </div>

      <div className="saved-hunt-card__subsection">
        <h5>Previsão por data</h5>
        <DailySimulationSection
          idPrefix={`sim-${hunt.id}`}
          currentExperience={currentExperience}
          rawExperiencePerHour={hunt.rawExperiencePerHour}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}
