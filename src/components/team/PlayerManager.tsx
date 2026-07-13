import { useRef, useState } from 'react';
import type { TeamPlayer } from '../../domain/team/types';
import { exportTeamData } from '../../storage/teamStorage';

interface PlayerManagerProps {
  players: TeamPlayer[];
  onAdd: (name: string) => void;
  onRename: (playerId: string, newName: string) => void;
  onRemove: (playerId: string) => void;
  onImport: (json: string) => { ok: boolean; error?: string };
}

export function PlayerManager({ players, onAdd, onRename, onRemove, onImport }: PlayerManagerProps) {
  const [nameInput, setNameInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNameInput('');
  }

  function startEditing(player: TeamPlayer) {
    setEditingId(player.id);
    setEditingName(player.name);
  }

  function commitEditing() {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
  }

  function handleRemove(player: TeamPlayer) {
    if (window.confirm(`Remover "${player.name}" e todo o histórico de EXP associado? Esta ação não pode ser desfeita.`)) {
      onRemove(player.id);
    }
  }

  function handleExport() {
    const json = exportTeamData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipa-tibia-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        const result = onImport(text);
        setImportError(result.ok ? null : (result.error ?? 'Falha ao importar.'));
      })
      .finally(() => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  }

  return (
    <div className="team-player-manager">
      <div className="team-player-manager__add">
        <input
          type="text"
          placeholder="Nome do jogador"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button type="button" onClick={handleAdd}>
          Adicionar jogador
        </button>
      </div>

      {players.length === 0 ? (
        <p className="chart-empty-state">Ainda não há jogadores. Adiciona o primeiro acima.</p>
      ) : (
        <ul className="team-player-manager__list">
          {players.map((player) => (
            <li key={player.id}>
              {editingId === player.id ? (
                <input
                  type="text"
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={commitEditing}
                  onKeyDown={(e) => e.key === 'Enter' && commitEditing()}
                />
              ) : (
                <span className="team-player-manager__name">{player.name}</span>
              )}
              <div className="team-player-manager__actions">
                <button type="button" onClick={() => startEditing(player)}>
                  Renomear
                </button>
                <button type="button" className="team-player-manager__remove" onClick={() => handleRemove(player)}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="team-player-manager__backup">
        <button type="button" onClick={handleExport}>
          Exportar backup (JSON)
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Importar backup
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} hidden />
      </div>
      {importError && <p className="field-error">{importError}</p>}
    </div>
  );
}
