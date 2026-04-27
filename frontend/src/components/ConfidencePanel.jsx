'use client'
import { useEffect, useRef } from 'react'

function ConfBar({ label, value, color }) {
    const fillRef = useRef(null)

    useEffect(() => {
        const el = fillRef.current
        if (!el) return
        el.style.width = '0%'
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { el.style.width = `${value}%` })
        })
    }, [value])

    return (
        <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] text-text-secondary">{label}</span>
                <span className="font-mono text-[13px]" style={{ color }}>{value.toFixed(2)}%</span>
            </div>
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: '#1C2030' }}>
                <div
                    ref={fillRef}
                    className="h-full rounded-full transition-all duration-[600ms] ease-out"
                    style={{ width: '0%', background: color }}
                />
            </div>
        </div>
    )
}

export default function ConfidencePanel({ prediction }) {
    const vc = prediction?.violence_confidence || 0
    const nc = prediction?.nonviolence_confidence || 0
    const arch = prediction?.architecture || 'CNN + LSTM'
    const backbone = prediction?.backbone || 'MobileNetV2'
    const threshold = prediction?.threshold_used ?? 50

    return (
        <div className="rounded-xl p-6 border border-border" style={{ background: '#141720' }}>
            <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest mb-5">Confidence Breakdown</p>
            <ConfBar label="Violence" value={vc} color="#FF5757" />
            <ConfBar label="Non-Violence" value={nc} color="#4FFFB0" />
            <p className="font-mono text-[11px] text-text-muted text-center pt-4 border-t border-border">
                Threshold: {threshold}% · {arch} · {backbone}
            </p>
        </div>
    )
}