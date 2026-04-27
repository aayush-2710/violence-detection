'use client'

const SEVERITY_COLORS = {
    CLEAR: '#4FFFB0',
    SUSPICIOUS: '#FFB84F',
    'HIGH RISK': '#FF8C42',
    CRITICAL: '#FF5757',
}

function IncidentEntry({ incident, isActive, onClick }) {
    const sev = incident.prediction?.severity?.level || 'CLEAR'
    const color = SEVERITY_COLORS[sev] || '#7A8099'
    const conf = incident.prediction?.violence_confidence?.toFixed(1) || '0.0'
    const time = new Date(incident.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

    return (
        <button
            onClick={onClick}
            className="w-full text-left px-4 py-3 transition-colors duration-150 border-b border-border relative"
            style={{
                background: isActive ? '#1C2030' : 'transparent',
                borderLeft: isActive ? '2px solid #5B8CFF' : '2px solid transparent',
                paddingLeft: isActive ? 14 : 16,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#141720' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded-full flex-shrink-0"
                        style={{ width: 7, height: 7, background: color, boxShadow: `0 0 5px ${color}` }} />
                    <span className="text-[13px] text-text-primary truncate" style={{ maxWidth: 140 }}>
                        {incident.filename}
                    </span>
                </div>
                <span className="font-mono text-[11px] text-text-muted flex-shrink-0 ml-1">{time}</span>
            </div>
            <div className="mt-0.5 pl-[15px] font-mono text-[11px]" style={{ color }}>
                {sev} · {conf}%
            </div>
        </button>
    )
}

export default function SessionLog({ incidents, activeIncident, onSelect }) {
    return (
        <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-mono text-[11px] text-text-muted uppercase tracking-widest">Session Log</span>
                {incidents.length > 0 && (
                    <span className="font-mono text-[11px] text-text-muted bg-raised px-2 py-0.5 rounded-full border border-border">
                        {incidents.length}
                    </span>
                )}
            </div>

            {incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="mb-3 opacity-20">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <line key={i} x1={4} y1={8 + i * 5} x2={36} y2={8 + i * 5} stroke="#7A8099" strokeWidth="0.5" strokeDasharray="2 3" />
                            ))}
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <line key={i} x1={4 + i * 6} y1={4} x2={4 + i * 6} y2={36} stroke="#7A8099" strokeWidth="0.5" strokeDasharray="2 3" />
                            ))}
                        </svg>
                    </div>
                    <p className="text-[13px] text-text-secondary">No incidents this session</p>
                    <p className="text-[11px] text-text-muted mt-1">Analyzed videos will appear here</p>
                </div>
            ) : (
                incidents.map(inc => (
                    <IncidentEntry
                        key={inc.incident_id}
                        incident={inc}
                        isActive={activeIncident?.incident_id === inc.incident_id}
                        onClick={() => onSelect(inc)}
                    />
                ))
            )}
        </div>
    )
}