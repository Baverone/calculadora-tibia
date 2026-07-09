import { type FormEvent, useState } from 'react';
import type { CharacterId } from '../../domain/types';
import type { DomainAllocation, WheelDomain } from '../../domain/wheel/types';

interface AiSuggestion {
  allocations: DomainAllocation[];
  reasoning: string;
}

interface AiAdvisorSectionProps {
  idPrefix: string;
  characterId: CharacterId;
  vocationName: string;
  currentLevel: number;
  pointsAvailable: number;
  domains: WheelDomain[];
  accentColor: string;
  onApply: (allocations: DomainAllocation[]) => void;
  onSave: (goal: string, allocations: DomainAllocation[], reasoning: string) => void;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');

/**
 * Lets the user describe a goal in free text and asks the Anthropic API
 * (via the /api/wheel-advisor serverless function — see api/wheel-advisor.ts)
 * for a suggested point distribution + reasoning. Only works on the deployed
 * Vercel site, not plain `npm run dev` (no serverless functions there).
 */
export function AiAdvisorSection({
  idPrefix,
  characterId,
  vocationName,
  currentLevel,
  pointsAvailable,
  domains,
  accentColor,
  onApply,
  onSave,
}: AiAdvisorSectionProps) {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);

  function domainName(domainId: string): string {
    return domains.find((d) => d.id === domainId)?.revelationPerk.name ?? domainId;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (goal.trim() === '') {
      setError('Descreve o teu objetivo primeiro.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await fetch('/api/wheel-advisor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ characterId, vocationName, currentLevel, pointsAvailable, goal }),
      });

      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(
          'O conselheiro de IA só funciona no site publicado (Vercel), não no ambiente de desenvolvimento local (npm run dev).'
        );
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao pedir sugestão.');
      }

      setSuggestion(data as AiSuggestion);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-advisor-section">
      <form className="hunt-form" onSubmit={handleSubmit}>
        <div className="hunt-form__field ai-advisor-section__goal-field">
          <label htmlFor={`${idPrefix}-goal`}>Qual é o teu objetivo?</label>
          <input
            id={`${idPrefix}-goal`}
            type="text"
            placeholder="ex: quero maximizar dano solo em hunts"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        <button type="submit" style={{ backgroundColor: accentColor }} disabled={loading}>
          {loading ? 'A pensar...' : 'Pedir sugestão à IA'}
        </button>

        {error && <p className="field-error">{error}</p>}
      </form>

      {suggestion && (
        <div className="ai-advisor-result">
          <table className="hunt-scenario-table">
            <thead>
              <tr>
                <th>Domínio</th>
                <th>Pontos sugeridos</th>
              </tr>
            </thead>
            <tbody>
              {suggestion.allocations.map((allocation) => (
                <tr key={allocation.domainId}>
                  <td>{domainName(allocation.domainId)}</td>
                  <td>{numberFormatter.format(allocation.points)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="ai-advisor-result__reasoning">{suggestion.reasoning}</p>

          <div className="ai-advisor-result__actions">
            <button type="button" style={{ backgroundColor: accentColor }} onClick={() => onApply(suggestion.allocations)}>
              Aplicar esta distribuição
            </button>
            <button
              type="button"
              className="ai-advisor-result__save-button"
              onClick={() => onSave(goal, suggestion.allocations, suggestion.reasoning)}
            >
              Guardar como build
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
