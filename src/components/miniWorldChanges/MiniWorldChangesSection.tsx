import { useTibiaDayClock } from '../../hooks/useTibiaDayClock';
import { useMiniWorldChangesHistory } from '../../hooks/useMiniWorldChangesHistory';
import { MiniWorldChangesCard } from './MiniWorldChangesCard';
import { MiniWorldChangesSubmitForm } from './MiniWorldChangesSubmitForm';
import { MiniWorldChangesReferenceList } from './MiniWorldChangesReferenceList';
import { MiniWorldChangesHistoryList } from './MiniWorldChangesHistoryList';

const ACCENT_COLOR = '#c9a227';

export function MiniWorldChangesSection() {
  const { dateKey } = useTibiaDayClock();
  const history = useMiniWorldChangesHistory();
  const todayEntry = history.find((entry) => entry.date === dateKey);

  return (
    <section className="tibiadrome-section">
      <MiniWorldChangesCard todayEntry={todayEntry} />
      <MiniWorldChangesSubmitForm dateKey={dateKey} accentColor={ACCENT_COLOR} />
      <MiniWorldChangesReferenceList />
      <MiniWorldChangesHistoryList history={history} />
    </section>
  );
}
