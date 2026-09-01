import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RectangleProps } from 'recharts';
import type { HistoryEntry } from '../../domain/types';
import { computeDailyGains, computeDailyXpTrend } from '../../domain/historyStats';

interface XpProgressChartProps {
  history: HistoryEntry[];
  accentColor: string;
}

type ChartMode = 'combined' | 'daily';

const MODES: { id: ChartMode; label: string }[] = [
  { id: 'combined', label: 'Nível & XP' },
  { id: 'daily', label: 'XP por dia' },
];

/** `null` = o histórico todo. */
const PERIODS: { days: number | null; label: string }[] = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
  { days: null, label: 'Tudo' },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });
const numberFormatter = new Intl.NumberFormat('pt-PT');
const signedNumberFormatter = new Intl.NumberFormat('pt-PT', { signDisplay: 'exceptZero' });

const GAIN_NEGATIVE = '#e74c3c';
const DAILY_BAR_COLOR = '#7a6a4a';
const AVG7_COLOR = '#d4af37';
const BLEND_COLOR = '#6fa8c9';
const tooltipStyle = { backgroundColor: '#241a12', border: '1px solid #5a4630', color: '#f0e0b8' } as const;

/** Compact XP for the right-hand axis in Tibia's own notation (kk = milhão, kkk = mil milhões). */
function formatXpTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} kkk`;
  if (abs >= 1_000_000) return `${Math.round(value / 1_000_000)} kk`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)} k`;
  return numberFormatter.format(value);
}

export function XpProgressChart({ history, accentColor }: XpProgressChartProps) {
  const [mode, setMode] = useState<ChartMode>('combined');
  const [periodDays, setPeriodDays] = useState<number | null>(30);

  // A janela é ancorada à leitura mais recente e não a "agora": se a recolha
  // falhar dois dias, "últimos 7 dias" continua a mostrar sete dias de dados
  // em vez de encolher para cinco.
  const visibleHistory = useMemo(() => {
    if (periodDays === null || history.length === 0) return history;
    const last = history[history.length - 1].timestamp;
    const from = last - periodDays * MS_PER_DAY;
    return history.filter((entry) => entry.timestamp >= from);
  }, [history, periodDays]);

  const periodToggle = (
    <div className="chart-mode-toggle" role="tablist" aria-label="Período">
      {PERIODS.map((period) => {
        const isActive = periodDays === period.days;
        return (
          <button
            key={period.label}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'chart-mode-toggle__btn chart-mode-toggle__btn--active' : 'chart-mode-toggle__btn'}
            style={isActive ? { color: accentColor, borderColor: accentColor } : undefined}
            onClick={() => setPeriodDays(period.days)}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );

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
          São precisas pelo menos 2 leituras de XP para desenhar a progressão.
        </div>
      </div>
    );
  }

  const dailyData = computeDailyGains(visibleHistory);
  const trendData = computeDailyXpTrend(visibleHistory);

  return (
    <div className="xp-progress-chart">
      <div className="chart-controls">
        {toggle}
        {periodToggle}
      </div>
      {trendData.length === 0 ? (
        <div className="chart-empty-state">
          Não há leituras suficientes neste período. Experimenta um período maior.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
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
            <ComposedChart data={trendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a3a2a" />
              <XAxis
                dataKey="dayTimestamp"
                tickFormatter={(ts) => dateFormatter.format(ts)}
                stroke="#c9a86a"
                fontSize={11}
              />
              <YAxis
                yAxisId="level"
                orientation="left"
                stroke={accentColor}
                fontSize={11}
                width={44}
                allowDecimals={false}
                domain={[(min: number) => min - 1, (max: number) => max + 1]}
              />
              <YAxis
                yAxisId="xp"
                orientation="right"
                stroke="#c9a86a"
                fontSize={11}
                width={54}
                tickFormatter={formatXpTick}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(ts) => dateFormatter.format(ts as number)}
                formatter={(value, name) =>
                  value == null ? ['—', name] : [numberFormatter.format(Math.round(Number(value))), name]
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine yAxisId="xp" y={0} stroke="#5a4630" />
              <Bar
                yAxisId="xp"
                dataKey="dailyXp"
                name="XP/dia"
                isAnimationActive={false}
                shape={(props: RectangleProps & { payload?: { dailyXp: number } }) => {
                  const gained = props.payload?.dailyXp ?? 0;
                  return (
                    <Rectangle {...props} radius={[2, 2, 0, 0]} fill={gained >= 0 ? DAILY_BAR_COLOR : GAIN_NEGATIVE} fillOpacity={0.4} />
                  );
                }}
              />
              <Line
                yAxisId="xp"
                type="monotone"
                dataKey="avg7"
                name="Média 7d"
                stroke={AVG7_COLOR}
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="xp"
                type="monotone"
                dataKey="avgBlend"
                name="Média 7/15/30"
                stroke={BLEND_COLOR}
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
              <Line
                yAxisId="level"
                type="monotone"
                dataKey="level"
                name="Nível"
                stroke={accentColor}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
