import type { HistoryEntry } from '../../domain/types';
import { computeExperienceGains } from '../../domain/historyStats';

interface RecentHistoryListProps {
  history: HistoryEntry[];
  maxEntries?: number;
}

const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const numberFormatter = new Intl.NumberFormat('pt-PT');

export function RecentHistoryList({ history, maxEntries = 5 }: RecentHistoryListProps) {
  if (history.length === 0) return null;

  const gains = computeExperienceGains(history);
  const recentGains = gains.slice(-maxEntries).reverse();

  return (
    <ul className="recent-history-list">
      {recentGains.map((gain) => (
        <li key={gain.to.timestamp}>
          <span className="recent-history-list__date">
            {dateFormatter.format(gain.to.timestamp)}
            {gain.to.source === 'guildstats' && <span className="recent-history-list__source-tag">auto</span>}
          </span>
          <span className="recent-history-list__xp">{numberFormatter.format(gain.to.experience)} XP</span>
          <span className={gain.experienceGained >= 0 ? 'recent-history-list__gain positive' : 'recent-history-list__gain negative'}>
            {gain.experienceGained >= 0 ? '+' : ''}
            {numberFormatter.format(gain.experienceGained)}
          </span>
        </li>
      ))}
      {gains.length === 0 && (
        <li>
          <span className="recent-history-list__date">{dateFormatter.format(history[0].timestamp)}</span>
          <span className="recent-history-list__xp">{numberFormatter.format(history[0].experience)} XP</span>
        </li>
      )}
    </ul>
  );
}
