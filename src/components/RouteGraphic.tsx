import type { CSSProperties } from 'react';

type RouteStage = 'welcome' | 'camera' | 'countdown' | 'preview' | 'finish';

type RouteGraphicProps = {
  stage: RouteStage;
  countdown?: number | null;
  className?: string;
};

type MarkerPosition = { x: number; y: number; progress: number };

const roadPath = 'M 12 68 L 84 48 H 230 L 306 14';
const markers: Record<RouteStage, MarkerPosition> = {
  welcome: { x: 12, y: 68, progress: 0 },
  camera: { x: 84, y: 48, progress: 25 },
  countdown: { x: 84, y: 48, progress: 25 },
  preview: { x: 248, y: 40, progress: 85 },
  finish: { x: 306, y: 14, progress: 100 },
};

export default function RouteGraphic({ stage, countdown, className = '' }: RouteGraphicProps) {
  const countdownPosition = countdown === 3
    ? { x: 120, y: 48, progress: 38 }
    : countdown === 2
      ? { x: 164, y: 48, progress: 53 }
      : countdown === 1
        ? { x: 208, y: 48, progress: 69 }
        : markers.countdown;
  const marker = stage === 'countdown' ? countdownPosition : markers[stage];

  return (
    <svg
      className={`route-graphic route-graphic--${stage} ${className}`.trim()}
      viewBox="0 0 320 82"
      role="img"
      aria-label={stage === 'finish' ? 'Finish line reached' : 'Race route progress'}
      style={{ '--route-progress': marker.progress } as CSSProperties}
    >
      <path className="route-graphic__road-edge" d={roadPath} pathLength="100" />
      <path className="route-graphic__road" d={roadPath} pathLength="100" />
      <path className="route-graphic__lane" d={roadPath} pathLength="100" />
      <path className="route-graphic__progress" d={roadPath} pathLength="100" />
      {stage === 'welcome' && (
        <circle className="route-graphic__runner" cx="12" cy="68" r="4">
          <animateMotion dur="1.7s" begin="0.3s" fill="freeze" path={roadPath} />
        </circle>
      )}
      <circle className="route-graphic__marker-halo" cx={marker.x} cy={marker.y} r="8" />
      <circle className="route-graphic__marker" cx={marker.x} cy={marker.y} r="4" />
      <g className="route-graphic__finish" aria-hidden="true">
        <path d="M299 7h6v6h-6zM305 13h6v6h-6zM299 19h6v6h-6zM311 7h6v6h-6zM311 19h6v6h-6z" />
      </g>
    </svg>
  );
}
