import type { FormEvent } from 'react';

interface HuntCalculatorFormProps {
  idPrefix: string;
  huntName: string;
  onHuntNameChange: (value: string) => void;
  rawExpInput: string;
  onRawExpInputChange: (value: string) => void;
  goalLevelsInput: string;
  onGoalLevelsInputChange: (value: string) => void;
  currentLevelHint: number | null;
  onSubmit: () => void;
  error: string | null;
  accentColor: string;
}

export function HuntCalculatorForm({
  idPrefix,
  huntName,
  onHuntNameChange,
  rawExpInput,
  onRawExpInputChange,
  goalLevelsInput,
  onGoalLevelsInputChange,
  currentLevelHint,
  onSubmit,
  error,
  accentColor,
}: HuntCalculatorFormProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="hunt-form" onSubmit={handleSubmit}>
      <div className="hunt-form__field">
        <label htmlFor={`${idPrefix}-name`}>Nome da hunt</label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          placeholder="ex: Rotten Blade"
          value={huntName}
          onChange={(e) => onHuntNameChange(e.target.value)}
        />
      </div>

      <div className="hunt-form__field">
        <label htmlFor={`${idPrefix}-raw-exp`}>Raw Experience/h</label>
        <input
          id={`${idPrefix}-raw-exp`}
          type="text"
          inputMode="numeric"
          placeholder="ex: 900000"
          value={rawExpInput}
          onChange={(e) => onRawExpInputChange(e.target.value)}
        />
      </div>

      <div className="hunt-form__field">
        <label htmlFor={`${idPrefix}-goals`}>
          Objetivos (níveis) {currentLevelHint !== null && (
            <span className="hunt-form__auto-tag">nível atual: {currentLevelHint}</span>
          )}
        </label>
        <input
          id={`${idPrefix}-goals`}
          type="text"
          inputMode="numeric"
          placeholder="ex: 1350, 1400, 1500"
          value={goalLevelsInput}
          onChange={(e) => onGoalLevelsInputChange(e.target.value)}
        />
      </div>

      <button type="submit" style={{ backgroundColor: accentColor }}>
        Guardar hunt
      </button>

      {error && <p className="field-error">{error}</p>}
    </form>
  );
}
