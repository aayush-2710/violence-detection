'use client'
import { useEffect, useState } from 'react'
import SystemStatus from './SystemStatus'

export default function Topbar({ alertCount }) {
    const [time, setTime] = useState('')

    useEffect(() => {
        const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }))
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])

    return (
        <header
            className="flex items-center justify-between px-5 border-b border-border"
            style={{
                height: 52,
                background: 'rgba(12,14,19,0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                flexShrink: 0,
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2.5 overflow-hidden">
                <img src="/logo.png" alt="VisionGuard" className="w-9 h-9 object-contain flex-shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
                <span className="text-text-primary font-semibold text-[25px] tracking-tight whitespace-nowrap">VisionGuard</span>
            </div>

            {/* Center */}
            <SystemStatus />

            {/* Right */}
            <div className="flex items-center gap-5">
                <span className="font-mono text-[13px] text-text-secondary tabular-nums">{time}</span>
                <div className="relative">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A8099" strokeWidth="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {alertCount > 0 && (
                        <span
                            className="absolute -top-1 -right-1 text-[9px] font-mono font-medium text-bg rounded-full flex items-center justify-center"
                            style={{ background: '#FFB84F', width: 14, height: 14 }}
                        >
                            {alertCount}
                        </span>
                    )}
                </div>
            </div>
        </header>
    )
}