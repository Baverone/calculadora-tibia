import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TeamPlayer } from '../../domain/team/types';
import type { ProjectionPoint } from '../../domain/team/calculations';

interface ProjectionChartProps {
  players: TeamPlayer[];
  mondays: string[];
  projectionsByPlayer: Record<string, ProjectionPoint[] | null>;
}

// Cycles through a fixed palette since the player list is dynamic (unlike the
// 3 fixed characters elsewhere in the app, which each have their own color).
const PALETTE = ['#c0392b', '#27ae60', '#8e44ad', '#2980b9', '#d4af37', '#16a085', '#e67e22', '#c0392b'];

const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });

export function ProjectionChart({ players, mondays, projectionsByPlayer }: ProjectionChartProps) {
  if (players.length === 0 || mondays.length === 0) {
    return <p className="chart-empty-state">Sem dados para o gráfico.</p>;
  }

  const data = mondays.map((date, weekIndex) => {
    const row: Record<string, number | string> = { date };
    for (const player of players) {
      const point = projectionsByPlayer[player.id]?.[weekIndex];
      if (point) row[player.name] = point.projectedLevel;
    }
    return row;
  });

  return (
    <div className="team-projection-chart">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a3a2a" />
          <XAxis dataKey="date" tickFormatter={(d) => dateFormatter.format(new Date(`${d}T12:00:00Z`))} stroke="#c9a86a" fontSize={11} />
          <YAxis stroke="#c9a86a" fontSize={11} width={50} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#241a12', border: '1px solid #5a4630', color: '#f0e0b8' }}
            labelFormatter={(d) => dateFormatter.format(new Date(`${d}T12:00:00Z`))}
          />
          <Legend />
          {players.map((player, i) => (
            <Line
              key={player.id}
              type="monotone"
              dataKey={player.name}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
