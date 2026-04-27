'use client'

const LEVELS = [
    { key: 'CLEAR', color: '#4FFFB0', range: '0–40%' },
    { key: 'SUSPICIOUS', color: '#FFB84F', range: '40–60%' },
    { key: 'HIGH RISK', color: '#FF8C42', range: '60–80%' },
    { key: 'CRITICAL', color: '#FF5757', range: '80–100%' },
]

export default function SeverityIndicator({ prediction }) {
    const sev = prediction?.severity?.level || 'CLEAR'
    const conf = prediction?.violence_confidence?.toFixed(2) || '0.00'
    const active = LEVELS.find(l => l.key === sev) || LEVELS[0]
    const isCrit = sev === 'CRITICAL'

    return (
        <div
            className={`rounded-xl border flex items-center px-5 ${isCrit ? 'animate-border-pulse' : ''}`}
            style={{
                height: 56,
                background: `${active.color}0D`,
                borderColor: `${active.color}33`,
            }}
        >
            {/* Left: label */}
            <span className="font-mono text-[13px] font-semibold mr-6 flex-shrink-0" style={{ color: active.color }}>
                {sev}
            </span>

            {/* Center: gauge segments */}
            <div className="flex flex-1 gap-px">
                {LEVELS.map((lvl) => {
                    const isActive = lvl.key === sev
                    return (
                        <div
                            key={lvl.key}
                            className="flex-1 flex items-center justify-center text-[11px] font-mono transition-all duration-200"
                            style={{
                                height: 28,
                                background: isActive ? `${lvl.color}30` : '#1C2030',
                                color: isActive ? lvl.color : '#454D65',
                                fontWeight: isActive ? 600 : 400,
                                borderTop: isActive ? `1px solid ${lvl.color}55` : '1px solid #252A3A',
                                borderBottom: isActive ? `1px solid ${lvl.color}55` : '1px solid #252A3A',
                            }}
                        >
                            {lvl.key}
                        </div>
                    )
                })}
            </div>

            {/* Right: % */}
            <span className="font-mono text-[14px] font-semibold ml-6 flex-shrink-0" style={{ color: active.color }}>
                {conf}%
            </span>
        </div>
    )
}