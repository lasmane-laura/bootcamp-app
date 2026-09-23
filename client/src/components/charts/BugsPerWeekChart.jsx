import { useState } from 'react';
import { CATEGORICAL, INK, formatShortDate } from './chartTokens';

const WIDTH = 640;
const HEIGHT = 260;
const MARGIN = { top: 30, right: 16, bottom: 40, left: 40 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const MAX_BAR_WIDTH = 34;
const BAR_GAP = 3;

const OPENED_COLOR = CATEGORICAL[0];
const CLOSED_COLOR = CATEGORICAL[1];

function niceMax(value) {
  if (value <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  let niceResidual;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  else niceResidual = 10;
  return niceResidual * magnitude;
}

function roundedTopBarPath(x, y, w, h, r) {
  if (h <= 0) return '';
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return `M ${x} ${y + h}
          L ${x} ${y + radius}
          Q ${x} ${y} ${x + radius} ${y}
          L ${x + w - radius} ${y}
          Q ${x + w} ${y} ${x + w} ${y + radius}
          L ${x + w} ${y + h}
          Z`;
}

function BugsPerWeekChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);

  if (data.length === 0) {
    return <p style={{ color: INK.muted }}>No bug activity yet.</p>;
  }

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.opened, d.closed)));
  const yMax = niceMax(maxValue);
  const groupWidth = PLOT_WIDTH / data.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, (groupWidth * 0.8 - BAR_GAP) / 2);
  const pairWidth = barWidth * 2 + BAR_GAP;

  function yFor(value) {
    return MARGIN.top + PLOT_HEIGHT - (value / yMax) * PLOT_HEIGHT;
  }

  const groups = data.map((d, i) => {
    const groupStart = MARGIN.left + i * groupWidth + (groupWidth - pairWidth) / 2;
    return {
      ...d,
      groupX: MARGIN.left + i * groupWidth,
      openedX: groupStart,
      closedX: groupStart + barWidth + BAR_GAP,
      openedY: yFor(d.opened),
      closedY: yFor(d.closed),
      openedHeight: (d.opened / yMax) * PLOT_HEIGHT,
      closedHeight: (d.closed / yMax) * PLOT_HEIGHT,
    };
  });

  const hovered = hoverIndex !== null ? groups[hoverIndex] : null;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
          <span style={legendItemStyle}>
            <span style={{ ...swatchStyle, background: OPENED_COLOR }} /> Opened
          </span>
          <span style={legendItemStyle}>
            <span style={{ ...swatchStyle, background: CLOSED_COLOR }} /> Closed
          </span>
        </div>
        <button style={toggleButtonStyle} onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'View chart' : 'View as table'}
        </button>
      </div>

      {showTable ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: `2px solid ${INK.axis}` }}>
              <th style={cellStyle}>Week starting</th>
              <th style={cellStyle}>Opened</th>
              <th style={cellStyle}>Closed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.weekStart} style={{ borderBottom: `1px solid ${INK.gridline}` }}>
                <td style={cellStyle}>{formatShortDate(d.weekStart)}</td>
                <td style={cellStyle}>{d.opened}</td>
                <td style={cellStyle}>{d.closed}</td>
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
            aria-label="Bugs opened versus closed per week"
          >
            {yTicks.map((tick) => (
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
                  {tick}
                </text>
              </g>
            ))}

            {groups.map((g, i) => (
              <g key={i}>
                <path d={roundedTopBarPath(g.openedX, g.openedY, barWidth, g.openedHeight, 6)} fill={OPENED_COLOR} />
                <path d={roundedTopBarPath(g.closedX, g.closedY, barWidth, g.closedHeight, 6)} fill={CLOSED_COLOR} />
                {g.opened > 0 && (
                  <text
                    x={g.openedX + barWidth / 2}
                    y={g.openedY - 6}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={600}
                    fill={INK.secondary}
                  >
                    {g.opened}
                  </text>
                )}
                {g.closed > 0 && (
                  <text
                    x={g.closedX + barWidth / 2}
                    y={g.closedY - 6}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={600}
                    fill={INK.secondary}
                  >
                    {g.closed}
                  </text>
                )}
                <text x={g.groupX + groupWidth / 2} y={HEIGHT - 12} textAnchor="middle" fontSize={13} fill={INK.muted}>
                  {formatShortDate(g.weekStart)}
                </text>
                <rect
                  x={g.groupX}
                  y={MARGIN.top}
                  width={groupWidth}
                  height={PLOT_HEIGHT}
                  fill={hoverIndex === i ? 'rgba(0,0,0,0.03)' : 'transparent'}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              </g>
            ))}
          </svg>

          {hovered && (
            <div
              style={{
                ...tooltipStyle,
                left: `${((hovered.groupX + groupWidth / 2) / WIDTH) * 100}%`,
                top: `${(MARGIN.top / HEIGHT) * 100}%`,
              }}
            >
              <div style={{ color: INK.secondary, fontSize: '0.8rem' }}>Week of {formatShortDate(hovered.weekStart)}</div>
              <div style={{ fontSize: '0.95rem' }}>
                <strong>{hovered.opened}</strong> opened
              </div>
              <div style={{ fontSize: '0.95rem' }}>
                <strong>{hovered.closed}</strong> closed
              </div>
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

const legendItemStyle = { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: INK.secondary };
const swatchStyle = { width: '12px', height: '12px', borderRadius: '2px', display: 'inline-block' };
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

export default BugsPerWeekChart;
