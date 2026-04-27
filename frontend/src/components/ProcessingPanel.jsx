'use client'
import { useEffect, useRef, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

const STAGES = [
    'Uploading video',
    'Extracting frames',
    'Preprocessing',
    'Running inference',
    'Complete',
]

export default function ProcessingPanel({ file, onComplete, onError }) {
    const [stageIdx, setStageIdx] = useState(0)
    const [elapsed, setElapsed] = useState(0)
    const done = useRef(false)

    useEffect(() => {
        const start = Date.now()
        const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
        return () => clearInterval(timer)
    }, [])

    // Simulate stages while API runs
    useEffect(() => {
        const delays = [600, 1200, 1800, 2800]
        const timers = delays.map((d, i) => setTimeout(() => { if (!done.current) setStageIdx(i + 1) }, d))
        return () => timers.forEach(clearTimeout)
    }, [])

    useEffect(() => {
        const run = async () => {
            try {
                const form = new FormData()
                form.append('file', file)
                const res = await fetch(`${API}/analyze`, { method: 'POST', body: form })
                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.detail || 'Analysis failed.')
                }
                const data = await res.json()
                done.current = true
                setStageIdx(4)
                setTimeout(() => onComplete(data), 500)
            } catch (e) {
                done.current = true
                onError(e.message || 'Analysis failed. Please try again.')
            }
        }
        run()
    }, [file])

    const progress = Math.round((stageIdx / (STAGES.length - 1)) * 100)

    return (
        <div className="flex items-center justify-center h-full min-h-[70vh]">
            <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-8">
                {/* File row */}
                <div className="flex items-center justify-between mb-7 pb-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-raised border border-border flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A8099" strokeWidth="2">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[13px] text-text-primary font-medium truncate" style={{ maxWidth: 200 }}>{file?.name}</p>
                            <p className="font-mono text-[11px] text-text-muted">{file ? (file.size / 1024).toFixed(1) + ' KB' : ''}</p>
                        </div>
                    </div>
                    <span className="font-mono text-[13px] text-text-secondary">{elapsed}s</span>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] font-semibold text-text-primary tracking-wide uppercase">Analyzing</p>
                    <span className="font-mono text-[13px]" style={{ color: '#5B8CFF' }}>{progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-[3px] rounded-full mb-6 overflow-hidden" style={{ background: '#1C2030' }}>
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, #5B8CFF, #4FFFB0)',
                        }}
                    />
                </div>

                {/* Stages */}
                <div className="flex flex-col gap-3">
                    {STAGES.map((stage, i) => {
                        const done_ = i < stageIdx
                        const active = i === stageIdx && stageIdx < STAGES.length
                        const pending = i > stageIdx

                        return (
                            <div key={stage} className="flex items-center gap-3">
                                {/* Indicator */}
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    {done_ && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4FFFB0" strokeWidth="2.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                    {active && (
                                        <span className="block rounded-full animate-pulse-dot"
                                            style={{ width: 8, height: 8, background: '#5B8CFF', boxShadow: '0 0 6px #5B8CFF' }} />
                                    )}
                                    {pending && (
                                        <span className="block rounded-full"
                                            style={{ width: 7, height: 7, background: '#252A3A', border: '1px solid #3D4560' }} />
                                    )}
                                </div>

                                <span className="text-[14px]"
                                    style={{ color: done_ ? '#4FFFB0' : active ? '#E8EAF0' : '#454D65' }}>
                                    {stage}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}