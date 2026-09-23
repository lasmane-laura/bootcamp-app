import { useState } from 'react';
import { CATEGORICAL, INK } from './chartTokens';

const SIZE = 220;
const CENTER = SIZE / 2;
const OUTER_R = 90;
const INNER_R = 54;
const PAD_DEGREES = ((2 / OUTER_R) * 180) / Math.PI;

const STATUS_LABELS = { draft: 'Draft', ready: 'Ready', passed: 'Passed', failed: 'Failed', skipped: 'Skipped' };

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSlice(startAngle, endAngle) {
  const pad = Math.min(PAD_DEGREES / 2, (endAngle - startAngle) / 4);
  const start = startAngle + pad;
  const end = endAngle - pad;
  const largeArc = end - start > 180 ? 1 : 0;
  const outerStart = polarToCartesian(CENTER, CENTER, OUTER_R, start);
  const outerEnd = polarToCartesian(CENTER, CENTER, OUTER_R, end);
  const innerStart = polarToCartesian(CENTER, CENTER, INNER_R, start);
  const innerEnd = polarToCartesian(CENTER, CENTER, INNER_R, end);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function textColorForFill(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16) / 255;
  const g = parseInt(c.substr(2, 2), 16) / 255;
  const b = parseInt(c.substr(4, 2), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? '#111' : '#fff';
}

function TestCoverageDonutChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <p style={{ color: INK.muted }}>No test cases yet.</p>;
  }

  let cumulative = 0;
  const slices = data.map((d, i) => {
    const ratio = d.count / total;
    const startAngle = cumulative * 360;
    cumulative += ratio;
    const endAngle = cumulative * 360;
    return {
      ...d,
      color: CATEGORICAL[i],
      ratio,
      startAngle,
      endAngle,
      path: d.count > 0 ? describeDonutSlice(startAngle, endAngle) : null,
    };
  });

  const hovered = hoverIndex !== null ? slices[hoverIndex] : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <button style={toggleButtonStyle} onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'View chart' : 'View as table'}
        </button>
      </div>

      {showTable ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: `2px solid ${INK.axis}` }}>
              <th style={cellStyle}>Status</th>
              <th style={cellStyle}>Count</th>
              <th style={cellStyle}>Share</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((s) => (
              <tr key={s.status} style={{ borderBottom: `1px solid ${INK.gridline}` }}>
                <td style={cellStyle}>{STATUS_LABELS[s.status] || s.status}</td>
                <td style={cellStyle}>{s.count}</td>
                <td style={cellStyle}>{Math.round(s.ratio * 1000) / 10}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: `${SIZE}px`, flexShrink: 0 }}>
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Test coverage by status">
              {slices.map(
                (s, i) =>
                  s.path && (
                    <path
                      key={s.status}
                      d={s.path}
                      fill={s.color}
                      opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.45}
                      onMouseEnter={() => setHoverIndex(i)}
                      onMouseLeave={() => setHoverIndex(null)}
                    />
                  )
              )}

              {slices.map((s, i) => {
                if (s.ratio < 0.08) return null;
                const midAngle = (s.startAngle + s.endAngle) / 2;
                const pos = polarToCartesian(CENTER, CENTER, (OUTER_R + INNER_R) / 2, midAngle);
                return (
                  <text
                    key={s.status}
                    x={pos.x}
                    y={pos.y}
                    dy="0.35em"
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill={textColorForFill(s.color)}
                    pointerEvents="none"
                  >
                    {Math.round(s.ratio * 100)}%
                  </text>
                );
              })}

              <text x={CENTER} y={CENTER - 4} textAnchor="middle" fontSize={26} fontWeight={700} fill={INK.primary}>
                {total}
              </text>
              <text x={CENTER} y={CENTER + 16} textAnchor="middle" fontSize={10} fill={INK.muted}>
                test cases
              </text>
            </svg>

            {hovered && (
              <div
                style={{
                  ...tooltipStyle,
                  left: '50%',
                  top: '-0.5rem',
                }}
              >
                <div style={{ fontWeight: 700 }}>{STATUS_LABELS[hovered.status] || hovered.status}</div>
                <div style={{ color: INK.muted, fontSize: '0.75rem' }}>
                  {hovered.count} case{hovered.count === 1 ? '' : 's'} &middot; {Math.round(hovered.ratio * 1000) / 10}%
                </div>
              </div>
            )}
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {slices.map((s) => (
              <li key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ ...swatchStyle, background: s.color }} />
                <span style={{ color: INK.primary, minWidth: '56px' }}>{STATUS_LABELS[s.status] || s.status}</span>
                <span style={{ color: INK.muted }}>{s.count}</span>
              </li>
            ))}
          </ul>
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

const swatchStyle = { width: '10px', height: '10px', borderRadius: '2px', display: 'inline-block', flexShrink: 0 };
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

export default TestCoverageDonutChart;
