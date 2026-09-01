import { useCharacterState } from '../../hooks/useCharacterState';
import { getLevelProgress } from '../../domain/levelProgress';
import type { PlayerMeta } from '../../constants/players';
import { LevelProgressCard } from '../xp/LevelProgressCard';
import { XpForecastCard } from '../xp/XpForecastCard';
import { XpProgressChart } from '../charts/XpProgressChart';
import { RecentHistoryList } from '../charts/RecentHistoryList';
import { SkillTrainingCalculator } from '../skillTraining/SkillTrainingCalculator';

interface PlayerPanelProps {
  player: PlayerMeta;
  isActive: boolean;
}

/**
 * Aviso de dados velhos. A recolha esteve dez dias parada sem ninguém dar por
 * isso porque a app mostrava o último valor que tinha, com a mesma cara de
 * sempre. Agora, se a leitura mais recente tiver 3+ dias, diz-se.
 */
const STALE_AFTER_DAYS = 3;

export function PlayerPanel({ player, isActive }: PlayerPanelProps) {
  const { history, currentExperience, loading, daysSinceLastReading } = useCharacterState(player.id);
  const progress = currentExperience !== null ? getLevelProgress(currentExperience) : null;
  const isStale = daysSinceLastReading !== null && daysSinceLastReading >= STALE_AFTER_DAYS;

  return (
    <section className={isActive ? 'character-panel' : 'character-panel character-panel--hidden'}>
      <header className="character-panel__header" style={{ borderColor: player.accentColor }}>
        <player.Icon className="character-panel__icon" />
        <div>
          <h2 style={{ color: player.accentColor }}>{player.name}</h2>
          <p>{player.tagline}</p>
        </div>
      </header>

      {isStale && (
        <p className="stale-warning">
          A leitura mais recente é de há {daysSinceLastReading} dias. A recolha diária pode estar parada — vê
          o Agendador de Tarefas no PC.
        </p>
      )}

      {loading && <p className="chart-empty-state">A carregar o histórico…</p>}

      {!loading && !progress && (
        <p className="chart-empty-state">
          Ainda não há histórico para o {player.name}. A recolha corre de hora a hora no PC e publica em
          data/scraped-history/{player.id}.json.
        </p>
      )}

      {progress && (
        <>
          <LevelProgressCard progress={progress} accentColor={player.accentColor} />

          <div className="character-panel__block">
            <h3>Progressão</h3>
            <XpProgressChart history={history} accentColor={player.accentColor} />
            <RecentHistoryList history={history} />
          </div>

          <div className="character-panel__block">
            <h3>Previsão</h3>
            <XpForecastCard
              history={history}
              currentExperience={currentExperience as number}
              accentColor={player.accentColor}
            />
          </div>

          <SkillTrainingCalculator player={player} />
        </>
      )}
    </section>
  );
}
