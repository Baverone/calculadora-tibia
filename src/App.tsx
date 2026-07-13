import { useState } from 'react';
import type { AppTabId } from './domain/types';
import { VOCATIONS } from './constants/vocations';
import { TabsBar } from './components/layout/TabsBar';
import { CharacterPanel } from './components/layout/CharacterPanel';
import { TimersPanel } from './components/timers/TimersPanel';
import { TibiadromeSection } from './components/tibiadrome/TibiadromeSection';
import { RashidCard } from './components/rashid/RashidCard';
import { MiniWorldChangesSection } from './components/miniWorldChanges/MiniWorldChangesSection';
import { TeamSection } from './components/team/TeamSection';

function App() {
  const [activeId, setActiveId] = useState<AppTabId>(VOCATIONS[0].id);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Calculadora de Experiência do Tibia</h1>
      </header>

      <TimersPanel />

      <TabsBar activeId={activeId} onChange={setActiveId} />

      {/* Kept mounted (like the character panels below) so a draft in the
          modifiers textarea never gets lost when switching tabs. */}
      <section className={activeId === 'utilities' ? 'app-utilities' : 'app-utilities app-utilities--hidden'}>
        <RashidCard />
        <TibiadromeSection />
        <MiniWorldChangesSection />
      </section>

      {/* Kept mounted too, so a draft in the daily-update form survives switching tabs. */}
      <section className={activeId === 'team' ? 'app-utilities' : 'app-utilities app-utilities--hidden'}>
        <TeamSection />
      </section>

      <main className="app-main">
        {/* All panels stay mounted so switching tabs never loses a character's draft input. */}
        {VOCATIONS.map((vocation) => (
          <CharacterPanel key={vocation.id} vocation={vocation} isActive={vocation.id === activeId} />
        ))}
      </main>
    </div>
  );
}

export default App;
