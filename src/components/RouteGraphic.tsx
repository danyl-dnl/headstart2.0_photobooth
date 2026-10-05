import type { CSSProperties } from 'react';

type RouteStage = 'welcome' | 'camera' | 'countdown' | 'preview' | 'finish';

type RouteGraphicProps = {
  stage: RouteStage;
  countdown?: number | null;
  className?: string;
};

type MarkerPosition = { x: number; y: number; progress: number };

// One continuous route gives the marker and every lane marking the same path geometry.
const roadPath = 'M 8 68 C 38 68 52 50 83 50 S 125 64 151 54 S 190 29 220 35 S 264 57 281 43 S 300 21 310 12';
const markers: Record<RouteStage, MarkerPosition> = {
  welcome: { x: 8, y: 68, progress: 0 },
  camera: { x: 83, y: 50, progress: 25 },
  countdown: { x: 83, y: 50, progress: 25 },
  preview: { x: 281, y: 43, progress: 85 },
  finish: { x: 310, y: 12, progress: 100 },
};

export default function RouteGraphic({ stage, countdown, className = '' }: RouteGraphicProps) {
  const countdownPosition = countdown === 3
    ? { x: 120, y: 57, progress: 38 }
    : countdown === 2
      ? { x: 164, y: 47, progress: 53 }
      : countdown === 1
        ? { x: 208, y: 33, progress: 69 }
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
      <defs>
        <pattern id="route-grain" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="2" r=".45" fill="var(--cream)" opacity=".22" />
          <circle cx="5" cy="5" r=".35" fill="var(--cream)" opacity=".16" />
        </pattern>
        <pattern id="route-checks" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="var(--cream)" />
          <path d="M0 0h3v3H0zM3 3h3v3H3z" fill="var(--ink)" />
        </pattern>
      </defs>
      <path className="route-graphic__shadow" d={roadPath} pathLength="100" />
      <path className="route-graphic__road-edge" d={roadPath} pathLength="100" />
      <path className="route-graphic__shoulder" d={roadPath} pathLength="100" />
      <path className="route-graphic__road" d={roadPath} pathLength="100" />
      <path className="route-graphic__texture" d={roadPath} pathLength="100" />
      <path className="route-graphic__lane" d={roadPath} pathLength="100" />
      <path className="route-graphic__progress" d={roadPath} pathLength="100" />
      {stage === 'welcome' && (
        <circle className="route-graphic__runner" cx="0" cy="0" r="3.5">
          <animateMotion
            dur="5.8s"
            begin="0s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0; 0.82; 1"
            keyPoints="0; 1; 0"
            keySplines="0.42 0 0.58 1; 0.4 0 0.7 1"
            path={roadPath}
          />
        </circle>
      )}
      <circle className="route-graphic__marker-halo" cx={marker.x} cy={marker.y} r="8" />
      <circle className="route-graphic__marker" cx={marker.x} cy={marker.y} r="4" />
      <g className="route-graphic__finish" aria-hidden="true">
        <path d="M297 7h12v12h-12z" fill="url(#route-checks)" />
        <path d="M310 7v8m0 0 5-3-5-2" fill="none" stroke="var(--cream)" strokeWidth="1.4" />
      </g>
    </svg>
  );
}
