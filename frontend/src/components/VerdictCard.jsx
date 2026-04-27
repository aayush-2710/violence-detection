'use client'

const SEV_BORDER = {
    CLEAR: '#4FFFB0',
    SUSPICIOUS: '#FFB84F',
    'HIGH RISK': '#FF8C42',
    CRITICAL: '#FF5757',
}

export default function VerdictCard({ prediction, metadata }) {
    const isV = prediction?.is_violence
    const sev = prediction?.severity?.level || 'CLEAR'
    const conf = prediction?.confidence?.toFixed(2)
    const color = SEV_BORDER[sev] || '#4FFFB0'

    const meta = metadata || {}
    const chips = [
        meta.width && meta.height ? `${meta.width}×${meta.height}` : null,
        meta.fps ? `${meta.fps} FPS` : null,
        meta.duration_str || null,
        meta.total_frames ? `${meta.total_frames} frames` : null,
    ].filter(Boolean)

    return (
        <div
            className="rounded-xl p-6 border border-border"
            style={{
                background: '#141720',
                borderLeft: `4px solid ${color}`,
            }}
        >
            <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest mb-3">Classification</p>

            <p className="text-[32px] font-bold leading-none mb-2"
                style={{ color: isV ? '#FF5757' : '#4FFFB0' }}>
                {isV ? 'Violence Detected' : 'No Violence'}
            </p>

            <p className="text-[15px] text-text-secondary mb-6">
                Model confidence: <span className="font-mono">{conf}%</span>
            </p>

            {chips.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    {chips.map((c, i) => (
                        <span key={i} className="font-mono text-[11px] text-text-muted">{c}</span>
                    )).reduce((acc, el, i) => i === 0 ? [el] : [...acc,
                    <span key={`d${i}`} className="font-mono text-[11px] text-text-muted">·</span>, el
                    ], [])}
                </div>
            )}
        </div>
    )
}