import type { FormEvent } from 'react';

interface XpInputFormProps {
  inputId: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  error: string | null;
  accentColor: string;
}

export function XpInputForm({ inputId, inputValue, onInputChange, onSubmit, error, accentColor }: XpInputFormProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="xp-input-form" onSubmit={handleSubmit}>
      <label htmlFor={inputId}>XP atual</label>
      <div className="xp-input-form__row">
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          placeholder="ex: 1250000"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
        />
        <button type="submit" style={{ backgroundColor: accentColor }}>
          Atualizar
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  );
}
