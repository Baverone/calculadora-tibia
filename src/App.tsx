import { useState } from 'react';
import { UTILITY_TAB_IDS, type AppTabId, type UtilityTabId } from './domain/types';
import { PLAYERS } from './constants/players';
import { TabsBar } from './components/layout/TabsBar';
import { PlayerPanel } from './components/layout/PlayerPanel';
import { UtilityTabsBar } from './components/layout/UtilityTabsBar';
import { loadTab, saveTab } from './storage/activeTab';
import { TimersPanel } from './components/timers/TimersPanel';
import { TibiadromeSection } from './components/tibiadrome/TibiadromeSection';
import { RashidCard } from './components/rashid/RashidCard';
import { StaminaCalculator } from './components/stamina/StaminaCalculator';
import { CelestaHuntsPanel } from './components/hunt/CelestaHuntsPanel';
import { ArrowsCalculator } from './components/arrows/ArrowsCalculator';

const APP_TAB_IDS: readonly AppTabId[] = [...PLAYERS.map((player) => player.id), 'utilities'];

function App() {
  // A app abre onde ficou da última vez. Sem nada guardado (primeira visita,
  // ou localStorage bloqueado) abre no primeiro boneco, como sempre abriu.
  const [activeTab, setActiveTab] = useState<AppTabId>(() => loadTab('main', APP_TAB_IDS) ?? PLAYERS[0].id);
  const [activeUtilityTab, setActiveUtilityTab] = useState<UtilityTabId>(
    () => loadTab('utility', UTILITY_TAB_IDS) ?? 'hunts'
  );

  function changeTab(id: AppTabId) {
    setActiveTab(id);
    saveTab('main', id);
  }

  function changeUtilityTab(id: UtilityTabId) {
    setActiveUtilityTab(id);
    saveTab('utility', id);
  }

  const showingUtilities = activeTab === 'utilities';

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Calculadora de Experiência do Tibia</h1>
      </header>

      <TimersPanel />

      <RashidCard />

      <TibiadromeSection />

      <TabsBar activeId={activeTab} onChange={changeTab} />

      {showingUtilities && <UtilityTabsBar activeId={activeUtilityTab} onChange={changeUtilityTab} />}

      {/* Os painéis ficam todos montados (só escondidos) para que um filtro ou
          um campo meio preenchido não se perca ao trocar de separador. */}
      <section className={showingUtilities ? 'app-utilities' : 'app-utilities app-utilities--hidden'}>
        <div className={activeUtilityTab === 'hunts' ? 'app-utilities__pane' : 'app-utilities__pane app-utilities__pane--hidden'}>
          <CelestaHuntsPanel />
        </div>
        <div className={activeUtilityTab === 'stamina' ? 'app-utilities__pane' : 'app-utilities__pane app-utilities__pane--hidden'}>
          <StaminaCalculator />
        </div>
        <div className={activeUtilityTab === 'arrows' ? 'app-utilities__pane' : 'app-utilities__pane app-utilities__pane--hidden'}>
          <ArrowsCalculator />
        </div>
      </section>

      <main className="app-main">
        {PLAYERS.map((player) => (
          <PlayerPanel key={player.id} player={player} isActive={player.id === activeTab} />
        ))}
      </main>
    </div>
  );
}

export default App;
