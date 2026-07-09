import { useState } from 'react';
import type { CharacterId } from '../../domain/types';
import type { DomainAllocation, WheelBuild } from '../../domain/wheel/types';
import { getWheelData } from '../../domain/wheel/loadWheelData';
import { levelForExperience } from '../../domain/experienceTable';
import { pointsAvailableFromLevel, totalAllocatedPoints, validateAllocations } from '../../domain/wheel/mechanics';
import { useSavedWheelBuilds } from '../../hooks/useSavedWheelBuilds';
import { DomainCard } from './DomainCard';
import { WheelReferencePanel } from './WheelReferencePanel';
import { AiAdvisorSection } from './AiAdvisorSection';
import { SavedBuildsList } from './SavedBuildsList';

interface WheelPlannerProps {
  characterId: CharacterId;
  currentExperience: number | null;
  accentColor: string;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');

export function WheelPlanner({ characterId, currentExperience, accentColor }: WheelPlannerProps) {
  const wheelData = getWheelData(characterId);
  const { builds, addBuild, removeBuild } = useSavedWheelBuilds(characterId);

  const [allocations, setAllocations] = useState<DomainAllocation[]>(() =>
    wheelData.domains.map((domain) => ({ domainId: domain.id, points: 0 }))
  );
  const [buildNameInput, setBuildNameInput] = useState('');

  if (currentExperience === null) {
    return (
      <div className="wheel-planner">
        <p className="chart-empty-state">Define a XP atual do personagem para calcular pontos disponíveis do Wheel.</p>
      </div>
    );
  }

  const currentLevel = levelForExperience(currentExperience);
  const pointsAvailable = pointsAvailableFromLevel(currentLevel);
  const totalAllocated = totalAllocatedPoints(allocations);
  const validation = validateAllocations(allocations, pointsAvailable);

  function updateDomainPoints(domainId: string, points: number) {
    setAllocations((prev) => prev.map((a) => (a.domainId === domainId ? { ...a, points } : a)));
  }

  function applyAllocations(newAllocations: DomainAllocation[]) {
    setAllocations(wheelData.domains.map((domain) => {
      const match = newAllocations.find((a) => a.domainId === domain.id);
      return { domainId: domain.id, points: match ? match.points : 0 };
    }));
  }

  function handleSaveManual() {
    addBuild({
      name: buildNameInput.trim() || 'Distribuição manual',
      goal: 'Distribuição definida manualmente',
      allocations,
      source: 'manual',
    });
    setBuildNameInput('');
  }

  function handleSaveFromAi(goal: string, aiAllocations: DomainAllocation[], reasoning: string) {
    addBuild({ name: goal.slice(0, 60), goal, allocations: aiAllocations, reasoning, source: 'ai' });
  }

  function handleApplyBuild(build: WheelBuild) {
    applyAllocations(build.allocations);
  }

  return (
    <div className="wheel-planner">
      <div className="wheel-planner__summary">
        <span>
          Pontos disponíveis (nível {currentLevel}): <strong>{numberFormatter.format(pointsAvailable)}</strong>
        </span>
        <span className={totalAllocated > pointsAvailable ? 'wheel-planner__total is-over' : 'wheel-planner__total'}>
          Alocados: <strong>{numberFormatter.format(totalAllocated)}</strong> / {numberFormatter.format(pointsAvailable)}
        </span>
      </div>
      {!validation.ok && <p className="field-error">{validation.error}</p>}

      <div className="wheel-planner__domains">
        {wheelData.domains.map((domain) => {
          const allocation = allocations.find((a) => a.domainId === domain.id);
          return (
            <DomainCard
              key={domain.id}
              domain={domain}
              points={allocation?.points ?? 0}
              onPointsChange={(points) => updateDomainPoints(domain.id, points)}
              accentColor={accentColor}
            />
          );
        })}
      </div>

      <div className="wheel-planner__manual-save">
        <input
          type="text"
          placeholder="Nome para esta distribuição (opcional)"
          value={buildNameInput}
          onChange={(e) => setBuildNameInput(e.target.value)}
        />
        <button type="button" style={{ backgroundColor: accentColor }} onClick={handleSaveManual}>
          Guardar distribuição atual
        </button>
      </div>

      <WheelReferencePanel wheelData={wheelData} />

      <div className="saved-hunt-card__subsection">
        <h5>Conselheiro de IA</h5>
        <AiAdvisorSection
          idPrefix={`wheel-ai-${characterId}`}
          characterId={characterId}
          vocationName={wheelData.vocationName}
          currentLevel={currentLevel}
          pointsAvailable={pointsAvailable}
          domains={wheelData.domains}
          accentColor={accentColor}
          onApply={applyAllocations}
          onSave={handleSaveFromAi}
        />
      </div>

      {builds.length > 0 && (
        <div className="saved-hunt-card__subsection">
          <h5>Builds guardadas</h5>
          <SavedBuildsList builds={builds} domains={wheelData.domains} onApply={handleApplyBuild} onDelete={removeBuild} />
        </div>
      )}
    </div>
  );
}
