import type { LevelProgress } from '../../domain/types';
import { getShareExpRange } from '../../domain/shareExperience';
import { ProgressBar } from './ProgressBar';

interface LevelProgressCardProps {
  progress: LevelProgress;
  accentColor: string;
}

const numberFormatter = new Intl.NumberFormat('pt-PT');

export function LevelProgressCard({ progress, accentColor }: LevelProgressCardProps) {
  const shareRange = getShareExpRange(progress.currentLevel);

  return (
    <div className="level-progress-card">
      <div className="level-progress-card__levels">
        <div>
          <span className="level-progress-card__label">Nível atual</span>
          <span className="level-progress-card__value" style={{ color: accentColor }}>
            {progress.currentLevel}
          </span>
        </div>
        <div>
          <span className="level-progress-card__label">Próximo nível</span>
          <span className="level-progress-card__value">{progress.nextLevel}</span>
        </div>
      </div>

      <ProgressBar percent={progress.progressPercent} accentColor={accentColor} />

      <div className="level-progress-card__details">
        <span>
          XP em falta: <strong>{numberFormatter.format(progress.experienceToNextLevel)}</strong>
        </span>
        <span>
          XP no nível: <strong>{numberFormatter.format(progress.experienceIntoLevel)}</strong> /{' '}
          {numberFormatter.format(progress.experienceAtNextLevel - progress.experienceAtCurrentLevel)}
        </span>
      </div>

      <div className="level-progress-card__share" style={{ borderColor: accentColor }}>
        <span className="level-progress-card__label">Range de Share Exp</span>
        <span className="level-progress-card__share-value" style={{ color: accentColor }}>
          {shareRange.min} – {shareRange.max}
        </span>
      </div>
    </div>
  );
}
