import { useEffect, useRef } from "react"
import * as THREE from "three"

export function WebGLShader() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sceneRef = useRef<{
        scene: THREE.Scene | null
        camera: THREE.OrthographicCamera | null
        renderer: THREE.WebGLRenderer | null
        mesh: THREE.Mesh | null
        uniforms: any
        animationId: number | null
    }>({
        scene: null,
        camera: null,
        renderer: null,
        mesh: null,
        uniforms: null,
        animationId: null,
    })

    useEffect(() => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const { current: refs } = sceneRef

        const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

        const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

        // Paleta do projeto: cyan #22d3ee, blue #3b82f6, purple #d946ef
        vec3 cyan   = vec3(0.133, 0.827, 0.933);
        vec3 blue   = vec3(0.231, 0.510, 0.965);
        vec3 purple = vec3(0.851, 0.275, 0.937);

        float d = length(p) * distortion;

        // Três ondas levemente defasadas
        float w1 = p.x * (1.0 + d);
        float w2 = p.x;
        float w3 = p.x * (1.0 - d);

        float i1 = 0.05 / abs(p.y + sin((w1 + time) * xScale) * yScale);
        float i2 = 0.05 / abs(p.y + sin((w2 + time + 0.6) * xScale) * yScale);
        float i3 = 0.05 / abs(p.y + sin((w3 + time + 1.2) * xScale) * yScale);

        // Mistura as três cores da paleta
        vec3 color = cyan * i1 + blue * i2 + purple * i3;

        // Reduz intensidade para não ofuscar o texto da frente
        color *= 0.18;

        gl_FragColor = vec4(color, 1.0);
      }
    `

        const initScene = () => {
            refs.scene = new THREE.Scene()
            refs.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' })
            refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
            refs.renderer.setClearColor(new THREE.Color(0x000000))

            refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

            refs.uniforms = {
                resolution: { value: [window.innerWidth, window.innerHeight] },
                time: { value: 0.0 },
                xScale: { value: 1.0 },
                yScale: { value: 0.5 },
                distortion: { value: 0.05 },
            }

            const position = [
                -1.0, -1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, 1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, 1.0, 0.0,
                1.0, 1.0, 0.0,
            ]

            const positions = new THREE.BufferAttribute(new Float32Array(position), 3)
            const geometry = new THREE.BufferGeometry()
            geometry.setAttribute("position", positions)

            const material = new THREE.RawShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: refs.uniforms,
                side: THREE.DoubleSide,
            })

            refs.mesh = new THREE.Mesh(geometry, material)
            refs.scene.add(refs.mesh)

            handleResize()
        }

        const isMobile = window.innerWidth < 768
        let frameCount = 0

        const animate = () => {
            frameCount++
            if (refs.uniforms) refs.uniforms.time.value += 0.004
            // Em mobile, renderiza a cada 2 frames para economizar GPU
            if (!isMobile || frameCount % 2 === 0) {
                if (refs.renderer && refs.scene && refs.camera) {
                    refs.renderer.render(refs.scene, refs.camera)
                }
            }
            refs.animationId = requestAnimationFrame(animate)
        }

        const handleResize = () => {
            if (!refs.renderer || !refs.uniforms) return
            const width = window.innerWidth
            const height = window.innerHeight
            refs.renderer.setSize(width, height, false)
            refs.uniforms.resolution.value = [width, height]
        }

        initScene()
        animate()
        window.addEventListener("resize", handleResize)

        return () => {
            if (refs.animationId) cancelAnimationFrame(refs.animationId)
            window.removeEventListener("resize", handleResize)
            if (refs.mesh) {
                refs.scene?.remove(refs.mesh)
                refs.mesh.geometry.dispose()
                if (refs.mesh.material instanceof THREE.Material) {
                    refs.mesh.material.dispose()
                }
            }
            refs.renderer?.dispose()
        }
    }, [])

    return (
        <>
            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 w-full h-full"
                style={{ zIndex: -1 }}
            />
            {/* Overlay escuro para garantir legibilidade do texto */}
            <div
                className="fixed top-0 left-0 w-full h-full pointer-events-none"
                style={{
                    zIndex: -1,
                    background: 'linear-gradient(to bottom, rgba(2,6,23,0.88) 0%, rgba(2,6,23,0.78) 50%, rgba(2,6,23,0.88) 100%)'
                }}
            />
        </>
    )
}
