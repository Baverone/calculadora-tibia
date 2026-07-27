import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RectangleProps } from 'recharts';
import type { HistoryEntry } from '../../domain/types';
import { levelForExperience } from '../../domain/experienceTable';
import { computeDailyGains } from '../../domain/historyStats';

interface XpProgressChartProps {
  history: HistoryEntry[];
  accentColor: string;
}

type ChartMode = 'level' | 'experience' | 'daily';

const MODES: { id: ChartMode; label: string }[] = [
  { id: 'level', label: 'Nível' },
  { id: 'experience', label: 'XP total' },
  { id: 'daily', label: 'XP por dia' },
];

const dateTimeFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });
const numberFormatter = new Intl.NumberFormat('pt-PT');
const signedNumberFormatter = new Intl.NumberFormat('pt-PT', { signDisplay: 'exceptZero' });

const GAIN_NEGATIVE = '#e74c3c';
const tooltipStyle = { backgroundColor: '#241a12', border: '1px solid #5a4630', color: '#f0e0b8' } as const;

export function XpProgressChart({ history, accentColor }: XpProgressChartProps) {
  const [mode, setMode] = useState<ChartMode>('level');

  const toggle = (
    <div className="chart-mode-toggle" role="tablist" aria-label="Tipo de gráfico">
      {MODES.map((m) => {
        const isActive = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'chart-mode-toggle__btn chart-mode-toggle__btn--active' : 'chart-mode-toggle__btn'}
            style={isActive ? { color: accentColor, borderColor: accentColor } : undefined}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );

  if (history.length < 2) {
    return (
      <div className="xp-progress-chart">
        {toggle}
        <div className="chart-empty-state">
          Regista pelo menos 2 leituras de XP para veres o gráfico de progressão.
        </div>
      </div>
    );
  }

  const lineData = history.map((entry) => ({
    timestamp: entry.timestamp,
    experience: entry.experience,
    level: levelForExperience(entry.experience),
  }));

  const dailyData = computeDailyGains(history);

  return (
    <div className="xp-progress-chart">
      {toggle}
      {mode === 'daily' && dailyData.length === 0 ? (
        <div className="chart-empty-state">
          Regista leituras em dias diferentes para veres a XP feita por dia.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          {mode === 'daily' ? (
            <BarChart data={dailyData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a3a2a" />
              <XAxis
                dataKey="dayTimestamp"
                tickFormatter={(ts) => dateFormatter.format(ts)}
                stroke="#c9a86a"
                fontSize={11}
              />
              <YAxis tickFormatter={(v) => numberFormatter.format(v)} stroke="#c9a86a" fontSize={11} width={70} />
              <Tooltip
                cursor={{ fill: 'rgba(201, 168, 106, 0.12)' }}
                contentStyle={tooltipStyle}
                labelFormatter={(ts) => dateFormatter.format(ts as number)}
                formatter={(value) => [signedNumberFormatter.format(Number(value)), 'XP nesse dia']}
              />
              <ReferenceLine y={0} stroke="#5a4630" />
              <Bar
                dataKey="experienceGained"
                isAnimationActive={false}
                shape={(props: RectangleProps & { payload?: { experienceGained: number } }) => {
                  const gained = props.payload?.experienceGained ?? 0;
                  return <Rectangle {...props} radius={[3, 3, 0, 0]} fill={gained >= 0 ? accentColor : GAIN_NEGATIVE} />;
                }}
              />
            </BarChart>
          ) : (
            <LineChart data={lineData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a3a2a" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => dateTimeFormatter.format(ts)}
                stroke="#c9a86a"
                fontSize={11}
              />
              <YAxis
                tickFormatter={(v) => numberFormatter.format(v)}
                stroke="#c9a86a"
                fontSize={11}
                width={mode === 'level' ? 44 : 70}
                allowDecimals={false}
                domain={mode === 'level' ? [(min: number) => min - 1, (max: number) => max + 1] : ['auto', 'auto']}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(ts) => dateTimeFormatter.format(ts as number)}
                formatter={(value) =>
                  mode === 'level'
                    ? [numberFormatter.format(Number(value)), 'Nível']
                    : [numberFormatter.format(Number(value)), 'XP']
                }
              />
              <Line type="monotone" dataKey={mode} stroke={accentColor} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
