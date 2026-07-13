import type { PlayerMeta } from '../../constants/players';
import type { SoulCoreAssignment } from '../../domain/soulCore';
import type { CharacterId } from '../../domain/types';

interface SoulCoreAssignmentPanelProps {
  monsterListInput: string;
  onMonsterListInputChange: (value: string) => void;
  assignments: SoulCoreAssignment[];
  playersById: Record<CharacterId, PlayerMeta>;
}

/** Paste a block of monster names; each gets assigned to the first character (by priority) still missing it. */
export function SoulCoreAssignmentPanel({
  monsterListInput,
  onMonsterListInputChange,
  assignments,
  playersById,
}: SoulCoreAssignmentPanelProps) {
  return (
    <div className="soul-core-assignment">
      <label htmlFor="soul-core-monster-list">Colar lista de monstros (um por linha, ou separados por vírgula)</label>
      <textarea
        id="soul-core-monster-list"
        rows={5}
        placeholder={'ex:\nBlood Hand\nDusk Blob\nCliff Strider'}
        value={monsterListInput}
        onChange={(e) => onMonsterListInputChange(e.target.value)}
      />

      {assignments.length > 0 && (
        <table className="hunt-scenario-table" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>Monstro</th>
              <th>Atribuído a</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.monster}>
                <td>{assignment.monster}</td>
                <td>
                  {assignment.assignedTo ? (
                    <span style={{ color: playersById[assignment.assignedTo].accentColor, fontWeight: 'bold' }}>
                      {playersById[assignment.assignedTo].name}
                    </span>
                  ) : (
                    <span className="soul-core-assignment__done">Não é necessário</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
