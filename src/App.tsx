import { useMemo, useState } from 'react';
import type { AppTabId, TeamId } from './domain/types';
import { PLAYERS, TEAMS, customPlayerToMeta } from './constants/players';
import { useCustomPlayers } from './hooks/useCustomPlayers';
import { TabsBar } from './components/layout/TabsBar';
import { PlayerTabsBar } from './components/layout/PlayerTabsBar';
import { PlayerPanel } from './components/layout/PlayerPanel';
import { TimersPanel } from './components/timers/TimersPanel';
import { TibiadromeSection } from './components/tibiadrome/TibiadromeSection';
import { RashidCard } from './components/rashid/RashidCard';

function App() {
  const { customPlayers, addPlayer } = useCustomPlayers();

  const allPlayers = useMemo(
    () => [...PLAYERS, ...customPlayers.map((p, i) => customPlayerToMeta(p, i))],
    [customPlayers]
  );

  function playersForTeam(teamId: TeamId) {
    return allPlayers.filter((p) => p.teamId === teamId);
  }

  const [activeTab, setActiveTab] = useState<AppTabId>(TEAMS[0].id);
  const [activePlayerId, setActivePlayerId] = useState<string>(() => playersForTeam(TEAMS[0].id)[0].id);

  function handleTabChange(tab: AppTabId) {
    setActiveTab(tab);
    if (tab !== 'utilities') {
      const firstPlayer = playersForTeam(tab as TeamId)[0];
      if (firstPlayer) setActivePlayerId(firstPlayer.id);
    }
  }

  function handleAddPlayer(name: string) {
    if (activeTab === 'utilities') return;
    const created = addPlayer(name, activeTab as TeamId);
    setActivePlayerId(created.id);
  }

  const activeTeamPlayers = activeTab !== 'utilities' ? playersForTeam(activeTab as TeamId) : [];

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Calculadora de Experiência do Tibia</h1>
      </header>

      <TimersPanel />

      <TabsBar activeId={activeTab} onChange={handleTabChange} />

      {/* Kept mounted (like the player panels below) so a draft in the
          modifiers textarea never gets lost when switching tabs. */}
      <section className={activeTab === 'utilities' ? 'app-utilities' : 'app-utilities app-utilities--hidden'}>
        <RashidCard />
        <TibiadromeSection />
      </section>

      {activeTab !== 'utilities' && (
        <PlayerTabsBar
          players={activeTeamPlayers}
          activePlayerId={activePlayerId}
          onChange={setActivePlayerId}
          onAddPlayer={handleAddPlayer}
        />
      )}

      <main className="app-main">
        {/* All player panels stay mounted so switching sub-tabs never loses a draft input. */}
        {allPlayers.map((player) => (
          <PlayerPanel key={player.id} player={player} isActive={activeTab !== 'utilities' && player.id === activePlayerId} />
        ))}
      </main>
    </div>
  );
}

export default App;
