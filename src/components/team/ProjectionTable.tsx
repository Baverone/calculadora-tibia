import type { TeamPlayer } from '../../domain/team/types';
import type { ProjectionPoint } from '../../domain/team/calculations';

interface ProjectionTableProps {
  players: TeamPlayer[];
  mondays: string[];
  projectionsByPlayer: Record<string, ProjectionPoint[] | null>;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');
const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });

export function ProjectionTable({ players, mondays, projectionsByPlayer }: ProjectionTableProps) {
  if (players.length === 0 || mondays.length === 0) {
    return <p className="chart-empty-state">Sem jogadores ou sem semanas a projetar.</p>;
  }

  return (
    <div className="team-projection-table__wrap">
      <table className="team-projection-table">
        <thead>
          <tr>
            <th>Data</th>
            {players.map((player) => (
              <th key={player.id}>{player.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mondays.map((date, weekIndex) => (
            <tr key={date}>
              <td>{dateFormatter.format(new Date(`${date}T12:00:00Z`))}</td>
              {players.map((player) => {
                const points = projectionsByPlayer[player.id];
                const point = points?.[weekIndex];
                if (!point) {
                  return (
                    <td key={player.id} className="team-projection-table__empty">
                      —
                    </td>
                  );
                }
                return (
                  <td
                    key={player.id}
                    className={point.leveledUp ? 'team-projection-table__cell team-projection-table__cell--levelup' : 'team-projection-table__cell'}
                    title={`${numberFormatter.format(Math.round(point.projectedExp))} EXP prevista`}
                  >
                    {point.projectedLevel}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
