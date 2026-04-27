'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const TYPE_COLORS = {
    success: '#4FFFB0',
    error: '#FF5757',
    info: '#5B8CFF',
}

function Toast({ toast, onDismiss }) {
    const color = TYPE_COLORS[toast.type] || '#5B8CFF'
    return (
        <div
            className="flex items-start gap-3 rounded-xl border border-border px-4 py-3 animate-slide-up"
            style={{ background: '#1C2030', borderLeft: `3px solid ${color}`, minWidth: 280, maxWidth: 380 }}
        >
            <p className="text-[13px] text-text-primary flex-1 leading-snug">{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 mt-0.5"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    )
}

export default function ToastContainer({ toasts, onDismiss }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    if (!mounted) return null

    return createPortal(
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
            {toasts.slice(-3).map(t => (
                <Toast key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>,
        document.body
    )
}