'use client'
import dynamic from 'next/dynamic'
import SessionLog from './SessionLog'

const PolyhedronOrb = dynamic(() => import('./PolyhedronOrb'), { ssr: false })

export default function Sidebar({ incidents, activeIncident, onSelect }) {
    return (
        <aside
            className="flex flex-col border-r border-border overflow-hidden flex-shrink-0"
            style={{ width: 260, background: '#0E1019' }}
        >
            <div className="flex-1 overflow-y-auto">
                <SessionLog incidents={incidents} activeIncident={activeIncident} onSelect={onSelect} />
            </div>
            <div className="flex-shrink-0 flex justify-center items-center py-4 border-t border-border">
                <PolyhedronOrb />
            </div>
        </aside>
    )
}