'use client'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

export default function SystemStatus() {
    const [status, setStatus] = useState('checking')

    useEffect(() => {
        const check = async () => {
            try {
                const r = await fetch(`${API}/health`, { signal: AbortSignal.timeout(5000) })
                if (r.ok) setStatus('online')
            } catch {
                setStatus('error')
            }
        }
        check()
        const id = setInterval(check, 30000)
        return () => clearInterval(id)
    }, [])

    const cfg = {
        online: { dot: '#4FFFB0', label: 'SYSTEM ONLINE' },
        error: { dot: '#FF5757', label: 'MODEL ERROR' },
        checking: { dot: '#7A8099', label: 'CHECKING...' },
    }[status]

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface font-mono text-[12px]"
            style={{ color: '#7A8099' }}>
            <span
                className="rounded-full animate-pulse-dot"
                style={{ width: 7, height: 7, background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}`, display: 'inline-block' }}
            />
            {cfg.label}
        </div>
    )
}