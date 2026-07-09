import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HistoryEntry } from '../../domain/types';
import { levelForExperience } from '../../domain/experienceTable';

interface XpProgressChartProps {
  history: HistoryEntry[];
  accentColor: string;
}

const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const numberFormatter = new Intl.NumberFormat('pt-PT');

export function XpProgressChart({ history, accentColor }: XpProgressChartProps) {
  if (history.length < 2) {
    return (
      <div className="chart-empty-state">
        Regista pelo menos 2 leituras de XP para veres o gráfico de progressão.
      </div>
    );
  }

  const data = history.map((entry) => ({
    timestamp: entry.timestamp,
    experience: entry.experience,
    level: levelForExperience(entry.experience),
  }));

  return (
    <div className="xp-progress-chart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a3a2a" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) => dateFormatter.format(ts)}
            stroke="#c9a86a"
            fontSize={11}
          />
          <YAxis
            tickFormatter={(v) => numberFormatter.format(v)}
            stroke="#c9a86a"
            fontSize={11}
            width={70}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#241a12', border: '1px solid #5a4630', color: '#f0e0b8' }}
            labelFormatter={(ts) => dateFormatter.format(ts as number)}
            formatter={(value, name) => [numberFormatter.format(Number(value)), name === 'experience' ? 'XP' : name]}
          />
          <Line type="monotone" dataKey="experience" stroke={accentColor} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
