'use client'
import { useEffect, useRef } from 'react'

export default function PolyhedronOrb() {
    const mountRef = useRef(null)
    const stateRef = useRef({ targetColor: '#3D4560', currentColor: '#3D4560', noiseT: 0 })

    useEffect(() => {
        let THREE, renderer, scene, camera, mesh, animId

        const init = async () => {
            THREE = await import('three')
            const el = mountRef.current
            if (!el) return

            const W = 160, H = 160
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
            renderer.setSize(W, H)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            el.appendChild(renderer.domElement)

            scene = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100)
            camera.position.z = 3.5

            const geo = new THREE.IcosahedronGeometry(1, 1)
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color('#3D4560'),
                wireframe: true,
            })
            mesh = new THREE.Mesh(geo, mat)
            scene.add(mesh)

            let rotSpeed = 0.003
            let targetRotX = 0, targetRotY = 0

            // Mouse tracking in sidebar
            const sidebar = el.closest('aside')
            const onMouseMove = (e) => {
                if (!sidebar) return
                const rect = sidebar.getBoundingClientRect()
                const nx = (e.clientX - rect.left) / rect.width - 0.5
                const ny = (e.clientY - rect.top) / rect.height - 0.5
                targetRotX = ny * 0.5
                targetRotY = nx * 0.5
                rotSpeed = 0.009
                mat.color.set('#5B8CFF')
            }
            const onMouseLeave = () => {
                rotSpeed = 0.003
                mat.color.set(stateRef.current.targetColor)
                targetRotX = 0
                targetRotY = 0
            }
            if (sidebar) {
                sidebar.addEventListener('mousemove', onMouseMove)
                sidebar.addEventListener('mouseleave', onMouseLeave)
            }

            const animate = () => {
                animId = requestAnimationFrame(animate)
                mesh.rotation.y += rotSpeed
                mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.05
                renderer.render(scene, camera)
            }
            animate()

            // Expose color setter
            stateRef.current._mat = mat
            stateRef.current._cleanup = () => {
                if (sidebar) {
                    sidebar.removeEventListener('mousemove', onMouseMove)
                    sidebar.removeEventListener('mouseleave', onMouseLeave)
                }
                cancelAnimationFrame(animId)
                geo.dispose()
                mat.dispose()
                renderer.dispose()
                if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
            }
        }

        init()
        return () => { stateRef.current._cleanup?.() }
    }, [])

    // Listen to custom events from ResultView
    useEffect(() => {
        const handler = (e) => {
            const mat = stateRef.current._mat
            if (!mat) return
            const color = e.detail?.color || '#3D4560'
            stateRef.current.targetColor = color
            mat.color.set(color)
        }
        window.addEventListener('orb:setColor', handler)
        return () => window.removeEventListener('orb:setColor', handler)
    }, [])

    return <div ref={mountRef} style={{ width: 160, height: 160, cursor: 'default' }} />
}