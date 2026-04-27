'use client'
import { useRef, useState } from 'react'

export default function UploadZone({ onFileAccepted }) {
    const inputRef = useRef(null)
    const [drag, setDrag] = useState(false)

    const validate = (file) => {
        const allowed = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/mpeg', 'video/x-msvideo']
        if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|avi|mov|mkv|mpeg4)$/i)) {
            return 'Unsupported format. Use MP4, AVI, MOV, or MKV.'
        }
        if (file.size > 200 * 1024 * 1024) return 'File exceeds 200MB limit.'
        return null
    }

    const handleFile = (file) => {
        const err = validate(file)
        if (err) { alert(err); return }
        onFileAccepted(file)
    }

    const onDrop = (e) => {
        e.preventDefault(); setDrag(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[70vh]">
            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="w-full max-w-2xl rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center py-16 px-8"
                style={{
                    borderColor: drag ? '#5B8CFF' : '#252A3A',
                    background: drag ? 'rgba(91,140,255,0.04)' : 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#5B8CFF'; e.currentTarget.style.background = 'rgba(91,140,255,0.04)' }}
                onMouseLeave={e => { if (!drag) { e.currentTarget.style.borderColor = '#252A3A'; e.currentTarget.style.background = 'transparent' } }}
            >
                <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]) }} />

                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A8099" strokeWidth="1.5" className="mb-5">
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>

                <p className="text-[17px] font-medium text-text-primary mb-2">Drop a video to analyze</p>
                <p className="text-[13px] text-text-secondary mb-6">MP4, AVI, MOV, MKV · Max 200MB · Up to 3 minutes</p>

                <button
                    type="button"
                    className="px-5 py-2 rounded-lg text-[14px] font-semibold transition-all duration-150"
                    style={{ background: '#4FFFB0', color: '#0C0E13' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#3de89e'}
                    onMouseLeave={e => e.currentTarget.style.background = '#4FFFB0'}
                    onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                >
                    Browse File
                </button>
            </div>

            {/* Model chips */}
            <div className="flex items-center gap-2 mt-6">
                {['CNN + LSTM', 'MobileNetV2', '128×128 Input'].map(label => (
                    <span key={label}
                        className="font-mono text-[11px] px-3 py-1 rounded-full border border-border bg-surface"
                        style={{ color: '#454D65' }}>
                        ● {label}
                    </span>
                ))}
            </div>
        </div>
    )
}