const numberFormatter = new Intl.NumberFormat('pt-PT');

interface TeamSummaryCardsProps {
  playerCount: number;
  totalExpGained: number;
  teamAvgPerDay: number;
}

export function TeamSummaryCards({ playerCount, totalExpGained, teamAvgPerDay }: TeamSummaryCardsProps) {
  return (
    <div className="team-summary-cards">
      <div className="team-summary-card">
        <span className="team-summary-card__label">Jogadores</span>
        <span className="team-summary-card__value">{numberFormatter.format(playerCount)}</span>
      </div>
      <div className="team-summary-card">
        <span className="team-summary-card__label">EXP total ganha no período</span>
        <span className="team-summary-card__value">{numberFormatter.format(totalExpGained)}</span>
      </div>
      <div className="team-summary-card">
        <span className="team-summary-card__label">Média da equipa (EXP/dia)</span>
        <span className="team-summary-card__value">{numberFormatter.format(Math.round(teamAvgPerDay))}</span>
      </div>
    </div>
  );
}
