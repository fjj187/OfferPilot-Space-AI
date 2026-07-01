<script lang="tsx" setup>
import type { CSSProperties } from 'vue'

type ScenePalette = {
  base: [number, number, number]
  glowA: [number, number, number]
  glowB: [number, number, number]
}

const props = defineProps<{
  isPerformanceMode: boolean
  sceneId: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let gl: WebGLRenderingContext | null = null
let animationFrame = 0
let program: WebGLProgram | null = null
let positionBuffer: WebGLBuffer | null = null
let lastFrameTime = 0
let startTime = 0
let uniformResolution: WebGLUniformLocation | null = null
let uniformTime: WebGLUniformLocation | null = null
let uniformBase: WebGLUniformLocation | null = null
let uniformGlowA: WebGLUniformLocation | null = null
let uniformGlowB: WebGLUniformLocation | null = null
let uniformPerformanceMode: WebGLUniformLocation | null = null
let currentPalette: ScenePalette | null = null
let transitionFromPalette: ScenePalette | null = null
let transitionToPalette: ScenePalette | null = null
let transitionStartTime = 0
const paletteTransitionMs = 1000

const scenePalettes: Record<string, ScenePalette> = {
  overview: {
    base: [0.220, 0.000, 0.000],
    glowA: [0.722, 0.345, 0.000],
    glowB: [0.537, 0.000, 0.098]
  },
  library: {
    base: [0.000, 0.220, 0.236],
    glowA: [0.000, 0.358, 0.382],
    glowB: [0.014, 0.220, 0.247]
  },
  mock: {
    base: [0.004, 0.141, 0.341],
    glowA: [0.051, 0.204, 0.522],
    glowB: [0.008, 0.188, 0.353]
  },
  feedback: {
    base: [0.004, 0.345, 0.514],
    glowA: [0.004, 0.435, 0.494],
    glowB: [0.004, 0.435, 0.494]
  },
  report: {
    base: [0.024, 0.224, 0.455],
    glowA: [0.110, 0.588, 0.796],
    glowB: [0.094, 0.306, 0.553]
  }
}

const fallbackStyle = computed<CSSProperties>(() => {
  const palette = currentPalette || scenePalettes[props.sceneId] || scenePalettes.overview

  return {
    background: `
      radial-gradient(circle at 14% 18%, rgb(${ Math.round(palette.glowA[0] * 255) } ${ Math.round(palette.glowA[1] * 255) } ${ Math.round(palette.glowA[2] * 255) } / 0.32) 0%, transparent 38%),
      radial-gradient(circle at 82% 22%, rgb(${ Math.round(palette.glowB[0] * 255) } ${ Math.round(palette.glowB[1] * 255) } ${ Math.round(palette.glowB[2] * 255) } / 0.22) 0%, transparent 36%),
      rgb(${ Math.round(palette.base[0] * 255) } ${ Math.round(palette.base[1] * 255) } ${ Math.round(palette.base[2] * 255) })
    `
  }
})

const mixNumber = (from: number, to: number, progress: number) => from + (to - from) * progress

const mixColor = (
  from: [number, number, number],
  to: [number, number, number],
  progress: number
): [number, number, number] => [
  mixNumber(from[0], to[0], progress),
  mixNumber(from[1], to[1], progress),
  mixNumber(from[2], to[2], progress)
]

const mixPalette = (from: ScenePalette, to: ScenePalette, progress: number): ScenePalette => ({
  base: mixColor(from.base, to.base, progress),
  glowA: mixColor(from.glowA, to.glowA, progress),
  glowB: mixColor(from.glowB, to.glowB, progress)
})

const easePaletteProgress = (progress: number) => {
  const clamped = Math.min(Math.max(progress, 0), 1)
  const x1 = 0.215
  const y1 = 0.61
  const x2 = 0.355
  const y2 = 1
  let t = clamped

  for (let index = 0; index < 4; index += 1) {
    const inverseT = 1 - t
    const curveX = 3 * inverseT * inverseT * t * x1 + 3 * inverseT * t * t * x2 + t * t * t
    const slopeX = 3 * inverseT * inverseT * x1 + 6 * inverseT * t * (x2 - x1) + 3 * t * t * (1 - x2)
    if (Math.abs(slopeX) < 0.001) break
    t -= (curveX - clamped) / slopeX
    t = Math.min(Math.max(t, 0), 1)
  }

  const inverseT = 1 - t
  return 3 * inverseT * inverseT * t * y1 + 3 * inverseT * t * t * y2 + t * t * t
}

const resolvePaletteForScene = (sceneId: string) => scenePalettes[sceneId] || scenePalettes.overview

const resolveRenderPalette = (now: number) => {
  if (!transitionFromPalette || !transitionToPalette) {
    currentPalette = currentPalette || resolvePaletteForScene(props.sceneId)
    return currentPalette
  }

  const rawProgress = (now - transitionStartTime) / paletteTransitionMs
  const progress = easePaletteProgress(rawProgress)
  currentPalette = mixPalette(transitionFromPalette, transitionToPalette, progress)

  if (rawProgress >= 1) {
    currentPalette = transitionToPalette
    transitionFromPalette = null
    transitionToPalette = null
  }

  return currentPalette
}

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_base;
  uniform vec3 u_glowA;
  uniform vec3 u_glowB;
  uniform float u_performanceMode;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float softCircle(vec2 uv, vec2 center, float radius, float softness) {
    float distanceToCenter = distance(uv, center);
    return 1.0 - smoothstep(radius, radius + softness, distanceToCenter);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 aspectUv = vec2(uv.x * (u_resolution.x / u_resolution.y), uv.y);
    float time = u_time;

    vec3 color = u_base;
    float glowA = softCircle(aspectUv, vec2(0.20 + sin(time * 0.08) * 0.02, 0.78), 0.38, 0.34);
    float glowB = softCircle(aspectUv, vec2(1.16 + cos(time * 0.06) * 0.02, 0.30), 0.42, 0.36);
    float nebula = softCircle(aspectUv, vec2(0.74, 0.55), 0.52, 0.48);

    color += u_glowA * glowA * 0.34;
    color += u_glowB * glowB * 0.24;
    color += mix(u_glowA, u_glowB, uv.x) * nebula * 0.10;

    vec2 starField = uv * vec2(88.0, 50.0);
    vec2 starGrid = floor(starField);
    vec2 starLocal = fract(starField) - 0.5;
    float starSeed = hash(starGrid);
    float starShape = 1.0 - smoothstep(0.045, 0.09, length(starLocal));
    float starMask = step(0.994, starSeed) * starShape;
    color += vec3(0.88, 0.94, 1.0) * starMask * 0.42;

    float vignette = smoothstep(0.92, 0.18, distance(uv, vec2(0.52, 0.46)));
    color *= 0.64 + vignette * 0.58;

    gl_FragColor = vec4(color, 1.0);
  }
`

const compileShader = (type: number, source: string) => {
  if (!gl) return null
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

const createProgram = () => {
  if (!gl) return null

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
  if (!vertexShader || !fragmentShader) return null

  const nextProgram = gl.createProgram()
  if (!nextProgram) return null

  gl.attachShader(nextProgram, vertexShader)
  gl.attachShader(nextProgram, fragmentShader)
  gl.linkProgram(nextProgram)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(nextProgram, gl.LINK_STATUS)) {
    gl.deleteProgram(nextProgram)
    return null
  }

  return nextProgram
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas || !gl) return

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio))
  const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)
  }
}

const renderBackdrop = (now: number) => {
  if (!gl || !program || !canvasRef.value) return

  const isPaletteTransitioning = Boolean(transitionFromPalette && transitionToPalette)
  const minFrameGap = isPaletteTransitioning ? 16 : props.isPerformanceMode ? 66 : 33
  if (now - lastFrameTime < minFrameGap) {
    animationFrame = window.requestAnimationFrame(renderBackdrop)
    return
  }

  lastFrameTime = now
  resizeCanvas()

  const palette = resolveRenderPalette(now)
  gl.useProgram(program)
  gl.uniform2f(uniformResolution, canvasRef.value.width, canvasRef.value.height)
  gl.uniform1f(uniformTime, (now - startTime) / 1000)
  gl.uniform3fv(uniformBase, palette.base)
  gl.uniform3fv(uniformGlowA, palette.glowA)
  gl.uniform3fv(uniformGlowB, palette.glowB)
  gl.uniform1f(uniformPerformanceMode, props.isPerformanceMode ? 1 : 0)
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  animationFrame = window.requestAnimationFrame(renderBackdrop)
}

const startRendering = () => {
  if (animationFrame) return
  startTime = performance.now()
  lastFrameTime = 0
  animationFrame = window.requestAnimationFrame(renderBackdrop)
}

const stopRendering = () => {
  if (!animationFrame) return
  window.cancelAnimationFrame(animationFrame)
  animationFrame = 0
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  currentPalette = resolvePaletteForScene(props.sceneId)

  gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: 'high-performance',
    stencil: false
  })
  if (!gl) return

  program = createProgram()
  if (!program) return

  positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1
    ]),
    gl.STATIC_DRAW
  )

  const positionLocation = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  uniformResolution = gl.getUniformLocation(program, 'u_resolution')
  uniformTime = gl.getUniformLocation(program, 'u_time')
  uniformBase = gl.getUniformLocation(program, 'u_base')
  uniformGlowA = gl.getUniformLocation(program, 'u_glowA')
  uniformGlowB = gl.getUniformLocation(program, 'u_glowB')
  uniformPerformanceMode = gl.getUniformLocation(program, 'u_performanceMode')

  startRendering()
})

watch(() => props.sceneId, (nextSceneId) => {
  const nextPalette = resolvePaletteForScene(nextSceneId)
  transitionFromPalette = currentPalette || resolvePaletteForScene(props.sceneId)
  transitionToPalette = nextPalette
  transitionStartTime = performance.now()
  startRendering()
})

onBeforeUnmount(() => {
  stopRendering()
  if (gl && positionBuffer) {
    gl.deleteBuffer(positionBuffer)
  }
  if (gl && program) {
    gl.deleteProgram(program)
  }
  gl = null
  program = null
  positionBuffer = null
})
</script>

<template>
  <div
    class="gpu-backdrop"
    :style="fallbackStyle"
  >
    <canvas
      ref="canvasRef"
      class="gpu-backdrop-canvas"
      aria-hidden="true"
    />
  </div>
</template>

<style lang="scss" scoped>
.gpu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  transform: translateZ(0);
}

.gpu-backdrop-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
