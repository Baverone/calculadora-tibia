import { useMemo } from 'react';
import { RING_POINT_COSTS, RING_SLICE_COUNTS, WHEEL_MECHANICS } from '../../domain/wheel/mechanics';
import { computeDomainProgress } from '../../domain/wheel/mechanics';
import type { DomainAllocation, WheelDomain } from '../../domain/wheel/types';

interface WheelDiagramProps {
  domains: WheelDomain[];
  allocations: DomainAllocation[];
  vocationName: string;
  accentColor: string;
  onNodeClick: (domainId: string, ring: number) => void;
}

interface PositionedNode {
  domainIndex: number;
  domainId: string;
  ring: number;
  x: number;
  y: number;
  dedicationName?: string;
  convictionName?: string;
  unlocked: boolean;
}

const CX = 300;
const CY = 300;
const HUB_RADIUS = 26;
const RING_RADII = [26, 64, 106, 154, 202, 254];
const DOMAIN_GAP_DEG = 6;

function polar(r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function dedicationLabel(name: string): string {
  const category = WHEEL_MECHANICS.dedicationPerks.categories.find((c) => c.id === name);
  return category?.label ?? name;
}

export function WheelDiagram({ domains, allocations, vocationName, accentColor, onNodeClick }: WheelDiagramProps) {
  const { nodes, lines, domainLabels } = useMemo(() => {
    const nodes: PositionedNode[] = [];
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const domainLabels: { x: number; y: number; text: string }[] = [];
    const domainSpan = 90 - DOMAIN_GAP_DEG;

    domains.forEach((domain, domainIndex) => {
      const allocation = allocations.find((a) => a.domainId === domain.id);
      const progress = computeDomainProgress(domain.id, allocation?.points ?? 0);

      const domainStart = domainIndex * 90 + DOMAIN_GAP_DEG / 2;
      const domainEnd = domainStart + domainSpan;
      domainLabels.push({ ...toXY(RING_RADII[RING_RADII.length - 1] + 26, (domainStart + domainEnd) / 2), text: domain.revelationPerk.name });

      let prevRingNodes: PositionedNode[] = [];

      RING_SLICE_COUNTS.forEach((sliceCount, ringIdx) => {
        const ring = ringIdx + 1;
        const r0 = RING_RADII[ringIdx];
        const r1 = RING_RADII[ringIdx + 1];
        const radius = (r0 + r1) / 2;
        const currentRingNodes: PositionedNode[] = [];

        for (let s = 0; s < sliceCount; s++) {
          const angle = domainStart + ((s + 0.5) / sliceCount) * domainSpan;
          const [x, y] = polar(radius, angle);
          const dedicationMatch = domain.nodes?.dedication.filter((n) => n.ring === ring)[s];
          const convictionMatch = domain.nodes?.conviction.filter((n) => n.ring === ring)[s];
          const node: PositionedNode = {
            domainIndex,
            domainId: domain.id,
            ring,
            x,
            y,
            dedicationName: dedicationMatch?.name,
            convictionName: convictionMatch?.name,
            unlocked: progress.slicesFilledPerRing[ringIdx] > s,
          };
          nodes.push(node);
          currentRingNodes.push(node);

          const nearestPrev = prevRingNodes.reduce<PositionedNode | null>((closest, candidate) => {
            if (!closest) return candidate;
            const [cx1] = toAngleDelta(candidate, angle);
            const [cx0] = toAngleDelta(closest, angle);
            return cx1 < cx0 ? candidate : closest;
          }, null);
          if (nearestPrev) {
            lines.push({ x1: nearestPrev.x, y1: nearestPrev.y, x2: x, y2: y });
          } else {
            const [hx, hy] = polar(HUB_RADIUS, angle);
            lines.push({ x1: hx, y1: hy, x2: x, y2: y });
          }
        }
        prevRingNodes = currentRingNodes;
      });
    });

    function toXY(r: number, angle: number) {
      const [x, y] = polar(r, angle);
      return { x, y };
    }
    function toAngleDelta(node: PositionedNode, angle: number): [number] {
      const nodeAngle = (Math.atan2(node.y - CY, node.x - CX) * 180) / Math.PI + 90;
      return [Math.abs(((nodeAngle - angle + 540) % 360) - 180)];
    }

    return { nodes, lines, domainLabels };
  }, [domains, allocations]);

  return (
    <div className="wheel-diagram">
      <svg viewBox="0 0 600 600" role="img" aria-label={`Wheel of Destiny de ${vocationName}`}>
        <title>Wheel of Destiny de {vocationName}</title>
        {lines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="var(--border-gold)"
            strokeWidth={1.5}
          />
        ))}
        {RING_RADII.slice(1).map((r, i) => (
          <circle key={i} cx={CX} cy={CY} r={r} fill="none" stroke="var(--border-gold)" strokeWidth={0.5} strokeDasharray="2 4" opacity={0.4} />
        ))}
        {nodes.map((node, i) => (
          <g key={i} className="wheel-diagram__node-group" onClick={() => onNodeClick(node.domainId, node.ring)}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.ring <= 2 ? 9 : node.ring <= 4 ? 11 : 13}
              fill={node.unlocked ? accentColor : 'var(--bg-panel-alt)'}
              stroke={accentColor}
              strokeWidth={1.5}
              className="wheel-diagram__node"
            >
              <title>
                {node.convictionName ?? '—'} · {dedicationLabel(node.dedicationName ?? '')} · {RING_POINT_COSTS[node.ring - 1]} pts
              </title>
            </circle>
          </g>
        ))}
        <circle cx={CX} cy={CY} r={HUB_RADIUS} fill="var(--bg-panel-alt)" stroke={accentColor} strokeWidth={2} />
        <text x={CX} y={CY + 4} textAnchor="middle" className="wheel-diagram__hub-label">
          {vocationName}
        </text>
        {domainLabels.map((label, i) => (
          <text key={i} x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" className="wheel-diagram__domain-label">
            {label.text}
          </text>
        ))}
      </svg>
      <p className="wheel-diagram__hint">
        Clica num nó para preencheres os pontos até esse anel. Passa o rato por cima para veres o nome do perk.
      </p>
    </div>
  );
}
