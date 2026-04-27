'use client'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

function DownloadButton({ label, url, filename, icon }) {
    const [loading, setLoading] = useState(false)

    const handle = async () => {
        setLoading(true)
        try {
            const r = await fetch(url)
            if (!r.ok) throw new Error()
            const blob = await r.blob()
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = filename
            a.click()
            URL.revokeObjectURL(a.href)
        } catch {
            alert(`Failed to download ${label}.`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handle}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-[13px] text-text-secondary transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = '#3D4560'; e.currentTarget.style.color = '#E8EAF0' } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#252A3A'; e.currentTarget.style.color = '#7A8099' }}
        >
            {loading ? (
                <span className="block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />
            ) : icon}
            {label}
        </button>
    )
}

export default function ActionRow({ incident, onToast, setIncidents }) {
    const id = incident?.incident_id
    const [acknowledged, setAcknowledged] = useState(false)
    const [falseAlarmSent, setFalseAlarmSent] = useState(false)

    const tgStatus = incident?.telegram_status
    const tgChip = tgStatus?.sent
        ? { label: '✓ Alert Sent', color: '#4FFFB0' }
        : tgStatus?.message === 'Not triggered (no violence).'
            ? { label: '— No Alert', color: '#454D65' }
            : { label: '✗ Alert Failed', color: '#FF5757' }

    const handleAcknowledge = () => {
        setAcknowledged(true)
        setIncidents(prev => prev.map(inc =>
            inc.incident_id === id ? { ...inc, acknowledged: true } : inc
        ))
        onToast('Incident acknowledged.', 'success', 3000)
    }

    const handleFalseAlarm = async () => {
        if (falseAlarmSent) return
        setFalseAlarmSent(true)
        try {
            await fetch(`${API}/false-alarm`, { method: 'POST' })
        } catch { }
        onToast('Thanks for your feedback. It will be used for future retraining of the model.', 'info', 5000)
    }

    const DownIcon = (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    )

    return (
        <div className="rounded-xl border border-border p-5 flex flex-wrap items-center gap-3"
            style={{ background: '#141720' }}>

            {/* Acknowledge */}
            <button
                onClick={handleAcknowledge}
                disabled={acknowledged}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: acknowledged ? '#1C2030' : '#4FFFB0', color: acknowledged ? '#7A8099' : '#0C0E13', border: acknowledged ? '1px solid #252A3A' : 'none' }}
                onMouseEnter={e => { if (!acknowledged) e.currentTarget.style.background = '#3de89e' }}
                onMouseLeave={e => { if (!acknowledged) e.currentTarget.style.background = '#4FFFB0' }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
                {acknowledged ? 'Acknowledged' : 'Acknowledge'}
            </button>

            {/* Downloads */}
            <DownloadButton
                label="Download Report"
                url={`${API}/download-report/${id}`}
                filename={`report_${id}.pdf`}
                icon={DownIcon}
            />
            <DownloadButton
                label="Frames ZIP"
                url={`${API}/download-frames/${id}`}
                filename={`frames_${id}.zip`}
                icon={DownIcon}
            />
            {incident?.has_gif && (
                <DownloadButton
                    label="Violent GIF"
                    url={`${API}/download-gif/${id}`}
                    filename={`violence_${id}.gif`}
                    icon={DownIcon}
                />
            )}

            {/* False Alarm */}
            <button
                onClick={handleFalseAlarm}
                disabled={falseAlarmSent}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: 'rgba(255,87,87,0.35)', color: 'rgba(255,87,87,0.75)' }}
                onMouseEnter={e => { if (!falseAlarmSent) { e.currentTarget.style.borderColor = 'rgba(255,87,87,0.6)'; e.currentTarget.style.color = '#FF5757' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,87,87,0.35)'; e.currentTarget.style.color = 'rgba(255,87,87,0.75)' }}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {falseAlarmSent ? 'Reported' : 'False Alarm'}
            </button>

            {/* Telegram status — right-aligned */}
            <div className="ml-auto font-mono text-[11px] px-3 py-1.5 rounded-full border border-border bg-raised"
                style={{ color: tgChip.color }}>
                {tgChip.label}
            </div>
        </div>
    )
}