import { useRotationClock } from '../../hooks/useRotationClock';
import { useTibiadromeHistory } from '../../hooks/useTibiadromeHistory';
import { ROTATION_ANCHOR } from '../../data/tibiadrome/rotationAnchor';
import { RotationCard } from './RotationCard';
import { ModifiersSubmitForm } from './ModifiersSubmitForm';
import { ModifiersReferenceList } from './ModifiersReferenceList';
import { ModifiersHistoryList } from './ModifiersHistoryList';

const ACCENT_COLOR = '#c9a227';

export function TibiadromeSection() {
  const state = useRotationClock(ROTATION_ANCHOR);
  const history = useTibiadromeHistory();

  const currentEntry = history.find((entry) => entry.rotation === state.number);

  return (
    <section className="tibiadrome-section">
      <RotationCard
        state={state}
        now={Date.now()}
        currentModifiers={currentEntry?.modifiers ?? null}
        isCurrentRotationRecorded={Boolean(currentEntry)}
      />

      <ModifiersSubmitForm rotationNumber={state.number} accentColor={ACCENT_COLOR} />
      <ModifiersReferenceList />
      <ModifiersHistoryList history={history} />
    </section>
  );
}
