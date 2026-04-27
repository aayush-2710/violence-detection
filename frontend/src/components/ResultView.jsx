'use client'
import VerdictCard from './VerdictCard'
import ConfidencePanel from './ConfidencePanel'
import SeverityIndicator from './SeverityIndicator'
import KeyframeStrip from './KeyframeStrip'
import ActionRow from './ActionRow'

export default function ResultView({ incident, onNewUpload, onToast, setIncidents }) {
    const ts = new Date(incident.timestamp).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
    })

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            {/* Result header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest mb-1">Analysis Complete</p>
                    <p className="text-[15px] text-text-secondary">
                        <span className="font-mono text-accent">#{incident.incident_id}</span>
                        <span className="mx-2 text-text-muted">·</span>
                        <span>{incident.filename}</span>
                        <span className="mx-2 text-text-muted">·</span>
                        <span className="font-mono text-[13px]">{ts}</span>
                    </p>
                </div>
                <button
                    onClick={onNewUpload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-[13px] text-text-secondary transition-all duration-150"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3D4560'; e.currentTarget.style.color = '#E8EAF0' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#252A3A'; e.currentTarget.style.color = '#7A8099' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                    New Upload
                </button>
            </div>

            {/* Two-col: verdict + confidence */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <VerdictCard prediction={incident.prediction} metadata={incident.metadata} />
                <ConfidencePanel prediction={incident.prediction} />
            </div>

            {/* Severity */}
            <div className="mb-4">
                <SeverityIndicator prediction={incident.prediction} />
            </div>

            {/* Keyframes */}
            {incident.keyframes_b64?.length > 0 && (
                <div className="mb-4">
                    <KeyframeStrip keyframes={incident.keyframes_b64} />
                </div>
            )}

            {/* Actions */}
            <ActionRow
                incident={incident}
                onToast={onToast}
                setIncidents={setIncidents}
            />
        </div>
    )
}