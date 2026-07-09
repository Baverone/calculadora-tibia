interface ProgressBarProps {
  percent: number;
  accentColor: string;
}

export function ProgressBar({ percent, accentColor }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="progress-bar">
      <div
        className="progress-bar__fill"
        style={{ width: `${clamped}%`, backgroundColor: accentColor }}
      />
      <span className="progress-bar__label">{clamped.toFixed(2)}%</span>
    </div>
  );
}
