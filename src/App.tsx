import { useState } from 'react';
import type { CharacterId } from './domain/types';
import { VOCATIONS } from './constants/vocations';
import { TabsBar } from './components/layout/TabsBar';
import { CharacterPanel } from './components/layout/CharacterPanel';
import { TimersPanel } from './components/timers/TimersPanel';

function App() {
  const [activeId, setActiveId] = useState<CharacterId>(VOCATIONS[0].id);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Calculadora de Experiência do Tibia</h1>
      </header>

      <TimersPanel />

      <TabsBar activeId={activeId} onChange={setActiveId} />

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
