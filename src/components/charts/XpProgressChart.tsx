import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Rectangle, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RectangleProps } from 'recharts';
import type { HistoryEntry } from '../../domain/types';
import { computeDailyGains } from '../../domain/historyStats';

interface XpProgressChartProps {
  history: HistoryEntry[];
  accentColor: string;
}

/** `null` = o histórico todo. */
const PERIODS: { days: number | null; label: string }[] = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
  { days: null, label: 'Tudo' },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const GAIN_NEGATIVE = '#e74c3c';
const tooltipStyle = { backgroundColor: '#241a12', border: '1px solid #5a4630', color: '#f0e0b8' } as const;

const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });
const numberFormatter = new Intl.NumberFormat('pt-PT');
const signedNumberFormatter = new Intl.NumberFormat('pt-PT', { signDisplay: 'exceptZero' });

/**
 * XP ganha em cada dia.
 *
 * Havia também um modo "Nível & XP" — XP acumulada, nível e três médias
 * móveis no mesmo par de eixos. Uma curva de XP total só sabe subir, por isso
 * dizia sempre a mesma coisa: que se anda para a frente. As barras por dia
 * mostram o que interessa mesmo, que é quais foram os dias bons e quais foram
 * os maus.
 */
export function XpProgressChart({ history, accentColor }: XpProgressChartProps) {
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

  const dailyData = useMemo(() => computeDailyGains(visibleHistory), [visibleHistory]);

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

  return (
    <div className="xp-progress-chart">
      <div className="chart-controls">{periodToggle}</div>

      {dailyData.length === 0 ? (
        <div className="chart-empty-state">
          {history.length < 2
            ? 'São precisas pelo menos 2 leituras de XP para desenhar a progressão.'
            : 'Não há leituras suficientes neste período. Experimenta um período maior.'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
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
        </ResponsiveContainer>
      )}
    </div>
  );
}
