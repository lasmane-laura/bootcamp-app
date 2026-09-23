import { useState } from 'react';
import { CATEGORICAL, INK, formatShortDate } from './chartTokens';

const WIDTH = 640;
const HEIGHT = 240;
const MARGIN = { top: 34, right: 16, bottom: 34, left: 48 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_TICKS = [0, 25, 50, 75, 100];
const LINE_COLOR = CATEGORICAL[0];

function xFor(index, count) {
  if (count <= 1) return MARGIN.left + PLOT_WIDTH / 2;
  return MARGIN.left + (index / (count - 1)) * PLOT_WIDTH;
}

function yFor(passRate) {
  return MARGIN.top + (1 - passRate / 100) * PLOT_HEIGHT;
}

function PassRateTrendChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);

  if (data.length === 0) {
    return <p style={{ color: INK.muted }}>No test runs yet — run a suite to start tracking pass rate.</p>;
  }

  const points = data.map((d, i) => ({ ...d, x: xFor(i, data.length), y: d.passRate === null ? null : yFor(d.passRate) }));

  const segments = [];
  let current = [];
  points.forEach((p) => {
    if (p.y === null) {
      if (current.length) segments.push(current);
      current = [];
    } else {
      current.push(p);
    }
  });
  if (current.length) segments.push(current);

  const lastPoint = [...points].reverse().find((p) => p.y !== null);

  function handleMove(e) {
    const svg = e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
        <button style={toggleButtonStyle} onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'View chart' : 'View as table'}
        </button>
      </div>

      {showTable ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: `2px solid ${INK.axis}` }}>
              <th style={cellStyle}>Date</th>
              <th style={cellStyle}>Suite</th>
              <th style={cellStyle}>Pass rate</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.runId} style={{ borderBottom: `1px solid ${INK.gridline}` }}>
                <td style={cellStyle}>{formatShortDate(d.date)}</td>
                <td style={cellStyle}>{d.suiteName}</td>
                <td style={cellStyle}>{d.passRate === null ? '—' : `${d.passRate}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role="img"
            aria-label="Pass rate trend over the last test runs"
          >
            {Y_TICKS.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={WIDTH - MARGIN.right}
                  y1={yFor(tick)}
                  y2={yFor(tick)}
                  stroke={tick === 0 ? INK.axis : INK.gridline}
                  strokeWidth={1}
                />
                <text x={MARGIN.left - 8} y={yFor(tick)} dy="0.32em" textAnchor="end" fontSize={13} fill={INK.muted}>
                  {tick}%
                </text>
              </g>
            ))}

            {points.map((p, i) => (
              <text key={i} x={p.x} y={HEIGHT - 10} textAnchor="middle" fontSize={13} fill={INK.muted}>
                {formatShortDate(p.date)}
              </text>
            ))}

            {segments.map((seg, i) => (
              <path
                key={i}
                d={seg.map((p, i2) => `${i2 === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                fill="none"
                stroke={LINE_COLOR}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {points.map(
              (p, i) =>
                p.y !== null && <circle key={i} cx={p.x} cy={p.y} r={5} fill={LINE_COLOR} stroke={INK.surface} strokeWidth={2.5} />
            )}

            {lastPoint && (
              <text
                x={lastPoint.x}
                y={lastPoint.y - 14 < MARGIN.top ? lastPoint.y + 22 : lastPoint.y - 12}
                textAnchor="middle"
                fontSize={15}
                fontWeight={700}
                fill={INK.primary}
              >
                {lastPoint.passRate}%
              </text>
            )}

            {hovered && (
              <line
                x1={hovered.x}
                x2={hovered.x}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
                stroke={INK.axis}
                strokeWidth={1}
              />
            )}

            <rect
              x={MARGIN.left}
              y={MARGIN.top}
              width={PLOT_WIDTH}
              height={PLOT_HEIGHT}
              fill="transparent"
              onMouseMove={handleMove}
              onMouseLeave={() => setHoverIndex(null)}
            />
          </svg>

          {hovered && (
            <div
              style={{
                ...tooltipStyle,
                left: `${(hovered.x / WIDTH) * 100}%`,
                top: `${(MARGIN.top / HEIGHT) * 100}%`,
              }}
            >
              <div style={{ color: INK.secondary, fontSize: '0.8rem' }}>{formatShortDate(hovered.date)}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {hovered.passRate === null ? 'No decided results' : `${hovered.passRate}%`}
              </div>
              <div style={{ color: INK.muted, fontSize: '0.8rem' }}>{hovered.suiteName}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const toggleButtonStyle = {
  fontSize: '0.75rem',
  padding: '0.2rem 0.5rem',
  border: `1px solid ${INK.axis}`,
  borderRadius: '4px',
  background: INK.surface,
  cursor: 'pointer',
};

const cellStyle = { padding: '0.4rem 0.5rem' };

const tooltipStyle = {
  position: 'absolute',
  transform: 'translate(-50%, -100%)',
  background: '#fff',
  border: `1px solid ${INK.axis}`,
  borderRadius: '6px',
  padding: '0.4rem 0.6rem',
  fontSize: '0.8rem',
  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
};

export default PassRateTrendChart;
