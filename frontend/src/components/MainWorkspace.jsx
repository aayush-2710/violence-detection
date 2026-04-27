'use client'
import { useState } from 'react'
import UploadZone from './UploadZone'
import ProcessingPanel from './ProcessingPanel'
import ResultView from './ResultView'

export default function MainWorkspace({ activeIncident, onAnalysisComplete, onToast, setActiveIncident, setIncidents }) {
    const [phase, setPhase] = useState('upload')  // upload | processing | result
    const [processingFile, setProcessingFile] = useState(null)

    const handleFileAccepted = (file) => {
        setProcessingFile(file)
        setPhase('processing')
    }

    const handleComplete = (result) => {
        const incident = { ...result, acknowledged: false }
        onAnalysisComplete(incident)
        setPhase('result')
        const color = result.prediction?.is_violence ? '#FF5757' : '#4FFFB0'
        window.dispatchEvent(new CustomEvent('orb:setColor', { detail: { color } }))
        setTimeout(() => window.dispatchEvent(new CustomEvent('orb:setColor', { detail: { color: '#3D4560' } })), 3000)
    }

    const handleError = (msg) => {
        setPhase('upload')
        setProcessingFile(null)
        onToast(msg, 'error', 8000)
    }

    const handleNewUpload = () => {
        setPhase('upload')
        setProcessingFile(null)
    }

    return (
        <main className="flex-1 overflow-y-auto p-8" style={{ background: '#0C0E13' }}>
            {phase === 'upload' && (
                <UploadZone onFileAccepted={handleFileAccepted} />
            )}
            {phase === 'processing' && (
                <ProcessingPanel
                    file={processingFile}
                    onComplete={handleComplete}
                    onError={handleError}
                />
            )}
            {phase === 'result' && activeIncident && (
                <ResultView
                    incident={activeIncident}
                    onNewUpload={handleNewUpload}
                    onToast={onToast}
                    setIncidents={setIncidents}
                />
            )}
        </main>
    )
}