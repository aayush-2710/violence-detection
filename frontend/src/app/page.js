'use client'
import { useState, useCallback } from 'react'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import MainWorkspace from '@/components/MainWorkspace'
import ToastContainer from '@/components/ToastContainer'

export default function Home() {
    const [incidents, setIncidents] = useState([])
    const [activeIncident, setActive] = useState(null)
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now()
        setToasts(t => [...t, { id, message, type }])
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
    }, [])

    const dismissToast = useCallback((id) => {
        setToasts(t => t.filter(x => x.id !== id))
    }, [])

    const addIncident = useCallback((incident) => {
        setIncidents(prev => [incident, ...prev])
        setActive(incident)
    }, [])

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-bg">
            <Topbar alertCount={incidents.filter(i => i.prediction?.is_violence && !i.acknowledged).length} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    incidents={incidents}
                    activeIncident={activeIncident}
                    onSelect={setActive}
                />
                <MainWorkspace
                    activeIncident={activeIncident}
                    onAnalysisComplete={addIncident}
                    onToast={addToast}
                    setActiveIncident={setActive}
                    setIncidents={setIncidents}
                />
            </div>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    )
}