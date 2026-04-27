'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function LightboxModal({ keyframes, initialIndex, onClose }) {
    const [idx, setIdx] = useState(initialIndex)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, keyframes.length - 1))
            if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [keyframes.length, onClose])

    if (!mounted) return null

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.88)' }}
            onClick={onClose}
        >
            <div className="relative max-w-3xl w-full mx-6" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-text-secondary hover:text-text-primary transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <img
                    src={`data:image/jpeg;base64,${keyframes[idx]}`}
                    alt={`Frame ${idx + 1}`}
                    className="w-full rounded-xl border border-border"
                />

                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={() => setIdx(i => Math.max(i - 1, 0))}
                        disabled={idx === 0}
                        className="px-4 py-2 rounded-lg border border-border text-[13px] text-text-secondary disabled:opacity-30 transition-colors"
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#3D4560'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#252A3A'}
                    >← Prev</button>
                    <span className="font-mono text-[12px] text-text-muted">Frame {idx + 1} of {keyframes.length}</span>
                    <button
                        onClick={() => setIdx(i => Math.min(i + 1, keyframes.length - 1))}
                        disabled={idx === keyframes.length - 1}
                        className="px-4 py-2 rounded-lg border border-border text-[13px] text-text-secondary disabled:opacity-30 transition-colors"
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#3D4560'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#252A3A'}
                    >Next →</button>
                </div>
            </div>
        </div>,
        document.body
    )
}