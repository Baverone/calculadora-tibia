import { useRef } from 'react';
import { TimerCard, type TimerCardHandle } from './TimerCard';

const POT_SKILLS_COLOR = '#3498db';
const FOOD_ML_COLOR = '#e67e22';

export function TimersPanel() {
  const potSkillsRef = useRef<TimerCardHandle>(null);
  const foodMlRef = useRef<TimerCardHandle>(null);

  function startBoth() {
    potSkillsRef.current?.start();
    foodMlRef.current?.start();
  }

  return (
    <section className="timers-panel">
      <div className="timers-panel__header">
        <h2>Timers</h2>
        <button type="button" className="timers-panel__start-both" onClick={startBoth}>
          Iniciar ambos
        </button>
      </div>
      <div className="timers-panel__cards">
        <TimerCard ref={potSkillsRef} name="Pot Skills" durationSeconds={600} color={POT_SKILLS_COLOR} />
        <TimerCard ref={foodMlRef} name="Food ML" durationSeconds={3600} color={FOOD_ML_COLOR} />
      </div>
    </section>
  );
}
