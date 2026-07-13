import { useMemo, useState } from 'react';
import { useTeamData } from '../../hooks/useTeamData';
import {
  computePlayerPeriodStats,
  daysToNextLevel,
  projectPlayerLevels,
  todayDateKey,
  upcomingMondays,
  type ProjectionPoint,
} from '../../domain/team/calculations';
import { PlayerManager } from './PlayerManager';
import { DailyUpdateForm } from './DailyUpdateForm';
import { TeamSummaryCards } from './TeamSummaryCards';
import { TeamOverviewTable, type TeamOverviewRow } from './TeamOverviewTable';
import { PlayerHistoryPanel } from './PlayerHistoryPanel';
import { ProjectionTable } from './ProjectionTable';
import { ProjectionChart } from './ProjectionChart';

export function TeamSection() {
  const { players, records, addPlayer, renamePlayer, removePlayer, upsertRecord, deleteRecord, importData } = useTeamData();
  const [baselineDate, setBaselineDate] = useState(() => todayDateKey());

  const mondays = useMemo(() => upcomingMondays(todayDateKey()), []);

  const { rows, totalExpGained, teamAvgPerDay, projectionsByPlayer } = useMemo(() => {
    const nextRows: TeamOverviewRow[] = [];
    const nextProjections: Record<string, ProjectionPoint[] | null> = {};
    let expSum = 0;
    let avgSum = 0;
    let avgCount = 0;

    for (const player of players) {
      const result = computePlayerPeriodStats(records, player.id, baselineDate);

      if (!result.ok) {
        nextRows.push({
          playerId: player.id,
          name: player.name,
          status: result.reason,
          currentLevel: null,
          currentExp: null,
          avgPerDay: null,
          daysToNext: null,
          projectedLevelEndOfYear: null,
        });
        nextProjections[player.id] = null;
        continue;
      }

      const { stats } = result;
      expSum += stats.expGained;
      avgSum += stats.avgPerDay;
      avgCount += 1;

      const projections = projectPlayerLevels(stats.currentExp, stats.currentDate, stats.currentLevel, stats.avgPerDay, mondays);
      nextProjections[player.id] = projections;

      nextRows.push({
        playerId: player.id,
        name: player.name,
        status: 'ok',
        currentLevel: stats.currentLevel,
        currentExp: stats.currentExp,
        avgPerDay: stats.avgPerDay,
        daysToNext: daysToNextLevel(stats.currentExp, stats.currentLevel, stats.avgPerDay),
        projectedLevelEndOfYear: projections.length > 0 ? projections[projections.length - 1].projectedLevel : stats.currentLevel,
      });
    }

    return {
      rows: nextRows,
      totalExpGained: expSum,
      teamAvgPerDay: avgCount > 0 ? avgSum / avgCount : 0,
      projectionsByPlayer: nextProjections,
    };
  }, [players, records, baselineDate, mondays]);

  function handleDailySubmit(date: string, values: { playerId: string; exp: number }[]) {
    for (const { playerId, exp } of values) {
      upsertRecord(playerId, date, exp);
    }
  }

  return (
    <section className="tibiadrome-section">
      <h3>Equipa — Evolução de EXP</h3>

      <PlayerManager players={players} onAdd={addPlayer} onRename={renamePlayer} onRemove={removePlayer} onImport={importData} />

      <div className="character-panel__block">
        <h4>Update diário</h4>
        <DailyUpdateForm players={players} records={records} onSubmit={handleDailySubmit} />
      </div>

      <div className="character-panel__block">
        <h4>Calcular a partir de</h4>
        <label className="team-baseline-picker">
          <input type="date" value={baselineDate} onChange={(e) => setBaselineDate(e.target.value)} />
        </label>
      </div>

      <TeamSummaryCards playerCount={players.length} totalExpGained={totalExpGained} teamAvgPerDay={teamAvgPerDay} />
      <TeamOverviewTable rows={rows} />

      <PlayerHistoryPanel players={players} records={records} onEdit={upsertRecord} onDelete={deleteRecord} />

      <div className="character-panel__block">
        <h4>Previsão de níveis até 31/dez</h4>
        {players.length === 0 ? (
          <p className="chart-empty-state">Sem registos no período — adiciona jogadores e regista EXP para veres a previsão.</p>
        ) : (
          <>
            <ProjectionTable players={players} mondays={mondays} projectionsByPlayer={projectionsByPlayer} />
            <ProjectionChart players={players} mondays={mondays} projectionsByPlayer={projectionsByPlayer} />
          </>
        )}
      </div>
    </section>
  );
}
