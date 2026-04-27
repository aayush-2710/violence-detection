'use client'
import { useState } from 'react'
import LightboxModal from './LightboxModal'

export default function KeyframeStrip({ keyframes }) {
    const [lightbox, setLightbox] = useState(null)

    return (
        <div className="rounded-xl border border-border p-5" style={{ background: '#141720' }}>
            <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest mb-4">Key Frames</p>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${keyframes.length}, 1fr)` }}>
                {keyframes.map((b64, i) => (
                    <div
                        key={i}
                        className="relative rounded-md overflow-hidden border border-border cursor-zoom-in group"
                        style={{ aspectRatio: '16/9' }}
                        onClick={() => setLightbox(i)}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#3D4560'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#252A3A'}
                    >
                        <img
                            src={`data:image/jpeg;base64,${b64}`}
                            alt={`Frame ${i + 1}`}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        {/* Badge */}
                        <span
                            className="absolute bottom-1.5 left-1.5 font-mono text-[9px] px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(12,14,19,0.85)', color: '#7A8099' }}
                        >
                            F#{i + 1}
                        </span>
                        {/* Expand icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{ background: 'rgba(12,14,19,0.4)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8EAF0" strokeWidth="2">
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            {lightbox !== null && (
                <LightboxModal
                    keyframes={keyframes}
                    initialIndex={lightbox}
                    onClose={() => setLightbox(null)}
                />
            )}
        </div>
    )
}