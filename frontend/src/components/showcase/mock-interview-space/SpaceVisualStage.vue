<script lang="tsx" setup>
import type { CSSProperties } from 'vue'
import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import type { SceneItem } from '@/constants/showcase/mockInterviewSpaceScenes'

interface VisualSlot {
  x: number
  y: number
  scale: number
  opacity: number
  rotate: number
  zIndex: number
}

interface VisualLayerState {
  x: number
  y: number
  scale: number
  opacity: number
  rotate: number
  zIndex: number
}

interface VisualMotionProfile {
  xBias: number
  yBias: number
  arcX: number
  arcY: number
  midScale: number
  rotateSwing: number
  durationFactor: number
  ease: string
}

const props = defineProps<{
  activeSceneIndexBySlot: number
  centerSlot: number
  lastOrbitDirection: 1 | -1
  orderedSceneIndexes: number[]
  scenes: SceneItem[]
  transitionMs: number
}>()

gsap.registerPlugin(MotionPathPlugin)

const visualSlots: VisualSlot[] = [
  {
    x: -0.52,
    y: -0.32,
    scale: 1,
    opacity: 0.84,
    rotate: 0,
    zIndex: 3
  },
  {
    x: -0.88,
    y: 0.34,
    scale: 1,
    opacity: 0.9,
    rotate: 0,
    zIndex: 3
  },
  {
    x: 0.24,
    y: -0.34,
    scale: 1,
    opacity: 1,
    rotate: 0,
    zIndex: 6
  },
  {
    x: -0.08,
    y: 0.24,
    scale: 1,
    opacity: 0.82,
    rotate: 0,
    zIndex: 2
  },
  {
    x: 0.66,
    y: 0.32,
    scale: 1,
    opacity: 0.86,
    rotate: 0,
    zIndex: 2
  }
]

const visualMotionProfiles: Record<SceneItem['id'], VisualMotionProfile> = {
  overview: {
    xBias: -0.18,
    yBias: -0.28,
    arcX: -0.12,
    arcY: -0.18,
    midScale: 0.06,
    rotateSwing: -5,
    durationFactor: 1,
    ease: 'power3.inOut'
  },
  library: {
    xBias: -0.28,
    yBias: 0.22,
    arcX: -0.2,
    arcY: 0.12,
    midScale: 0.04,
    rotateSwing: 7,
    durationFactor: 0.94,
    ease: 'sine.inOut'
  },
  mock: {
    xBias: 0.32,
    yBias: -0.18,
    arcX: 0.24,
    arcY: -0.3,
    midScale: 0.09,
    rotateSwing: -10,
    durationFactor: 1.08,
    ease: 'expo.inOut'
  },
  feedback: {
    xBias: 0.04,
    yBias: 0.34,
    arcX: -0.08,
    arcY: 0.28,
    midScale: 0.05,
    rotateSwing: 12,
    durationFactor: 0.98,
    ease: 'power2.inOut'
  },
  report: {
    xBias: 0.26,
    yBias: 0.16,
    arcX: 0.18,
    arcY: 0.18,
    midScale: 0.07,
    rotateSwing: 8,
    durationFactor: 1.04,
    ease: 'circ.inOut'
  }
}

const visualColumnRef = ref<HTMLElement | null>(null)
const visualLayerRefs = ref<Array<HTMLElement | null>>(Array.from({
  length: props.scenes.length
}, () => null))
const visualLayerStates = ref<Array<VisualLayerState | null>>(Array.from({
  length: props.scenes.length
}, () => null))

const planetStyleFor = (scene: SceneItem, sceneIndex: number): CSSProperties => {
  const slotIndex = props.orderedSceneIndexes.indexOf(sceneIndex)
  const isHeroPlanet = slotIndex === props.centerSlot
  const isLowerRightPlanet = slotIndex === 4
  const size = 'min(18vw, 360px)'

  return {
    width: size,
    height: size,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    background: scene.theme.planet,
    '--planet-texture': scene.theme.planet,
    '--planet-shadow': scene.theme.planetShadow,
    opacity: isHeroPlanet ? '1' : isLowerRightPlanet ? '0.62' : '0.72'
  } as CSSProperties
}

const sceneLayerClass = (sceneIndex: number) => ({
  'is-active': sceneIndex === props.activeSceneIndexBySlot,
  'is-trailing': sceneIndex !== props.activeSceneIndexBySlot
})

const setVisualLayerRef = (element: Element | null, index: number) => {
  visualLayerRefs.value[index] = element instanceof HTMLElement ? element : null
}

const resolveVisualLayerState = (sceneIndex: number): VisualLayerState => {
  const host = visualColumnRef.value
  const slotIndex = props.orderedSceneIndexes.indexOf(sceneIndex)
  const slot = visualSlots[Math.max(slotIndex, 0)]
  const width = host?.clientWidth ?? 960
  const height = host?.clientHeight ?? 560

  return {
    x: slot.x * width,
    y: slot.y * height,
    scale: slot.scale,
    opacity: slot.opacity,
    rotate: slot.rotate,
    zIndex: slot.zIndex
  }
}

const applyVisualLayerState = (sceneIndex: number, state: VisualLayerState) => {
  const layer = visualLayerRefs.value[sceneIndex]
  if (!layer) return

  layer.style.zIndex = String(state.zIndex)
  gsap.set(layer, {
    x: state.x,
    y: state.y,
    scale: state.scale,
    rotation: state.rotate,
    opacity: state.opacity
  })
  visualLayerStates.value[sceneIndex] = state
}

const animateVisualLayerState = (sceneIndex: number, direction: 1 | -1, immediate = false) => {
  const layer = visualLayerRefs.value[sceneIndex]
  if (!layer) return

  const target = resolveVisualLayerState(sceneIndex)
  const previous = visualLayerStates.value[sceneIndex] ?? target
  const host = visualColumnRef.value
  const width = host?.clientWidth ?? 960
  const height = host?.clientHeight ?? 560
  const scene = props.scenes[sceneIndex]
  const profile = visualMotionProfiles[scene.id]
  const isActiveTarget = sceneIndex === props.activeSceneIndexBySlot
  const travel = target.x - previous.x
  const verticalLift = (isActiveTarget ? -88 : -42) + Math.abs(target.rotate) * -0.6
  const entryPull = isActiveTarget ? 1 : 0.38
  const control = {
    x: previous.x + travel * 0.45 + (profile.xBias * width + profile.arcX * width * direction) * entryPull,
    y: Math.min(previous.y, target.y) + verticalLift + (profile.yBias * height + profile.arcY * height) * entryPull,
    scale: Math.max(previous.scale, target.scale) + profile.midScale * entryPull
  }
  const arrivalControl = {
    x: target.x - profile.arcX * width * 0.42 * direction * entryPull,
    y: target.y - profile.arcY * height * 0.36 * entryPull
  }

  gsap.killTweensOf(layer)
  layer.style.zIndex = String(Math.max(previous.zIndex, target.zIndex))

  if (immediate) {
    applyVisualLayerState(sceneIndex, target)
    return
  }

  const motionDuration = Math.max((props.transitionMs / 1000) * profile.durationFactor, 0.42)
  const timeline = gsap.timeline({
    defaults: {
      ease: profile.ease
    },
    onComplete: () => {
      layer.style.zIndex = String(target.zIndex)
    }
  })

  timeline.to(layer, {
    duration: motionDuration,
    motionPath: {
      path: [
        {
          x: previous.x,
          y: previous.y
        },
        {
          x: control.x + direction * 26,
          y: control.y
        },
        {
          x: arrivalControl.x,
          y: arrivalControl.y
        },
        {
          x: target.x,
          y: target.y
        }
      ],
      curviness: 1.25
    },
    scale: target.scale,
    rotation: target.rotate + (isActiveTarget ? profile.rotateSwing * direction : profile.rotateSwing * 0.24 * direction),
    opacity: target.opacity
  }, 0)

  timeline.to(layer, {
    duration: motionDuration * 0.42,
    rotation: target.rotate,
    ease: 'power2.out'
  }, motionDuration * 0.58)

  visualLayerStates.value[sceneIndex] = target
}

const syncVisualLayers = (immediate = false) => {
  props.scenes.forEach((_, sceneIndex) => {
    animateVisualLayerState(sceneIndex, props.lastOrbitDirection, immediate)
  })
}

const clearVisualLayerTweens = () => {
  visualLayerRefs.value.forEach((layer) => {
    if (layer) {
      gsap.killTweensOf(layer)
    }
  })
}

defineExpose({
  clearVisualLayerTweens,
  syncVisualLayers
})
</script>

<template>
  <section
    ref="visualColumnRef"
    class="visual-column"
  >
    <div
      v-for="(scene, index) in scenes"
      :key="scene.id"
      :ref="(element) => setVisualLayerRef(element, index)"
      class="visual-layer"
      :class="sceneLayerClass(index)"
    >
      <div
        class="planet-shell"
        :style="planetStyleFor(scene, index)"
      ></div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.visual-column {
  position: relative;
  min-height: 560px;
  overflow: visible;
  isolation: isolate;
}

.visual-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform, opacity;
  opacity: 0;
  transform-origin: 50% 50%;
  contain: layout paint;
}

.planet-shell {
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  will-change: transform, opacity;
  background:
    radial-gradient(circle at 34% 28%, rgb(255 255 255 / 0.42), transparent 0 18%),
    linear-gradient(128deg, transparent 0 42%, rgb(0 0 0 / 0.46) 74%, rgb(0 0 0 / 0.72) 100%),
    var(--planet-texture);
  box-shadow: inset -18px -18px 34px var(--planet-shadow);
  transform: translateZ(0);
  transition:
    background var(--scene-takeover-duration) var(--ease-orbit),
    opacity 0.32s ease;
}

@media (max-width: 1100px) {
  .visual-column {
    min-height: 420px;
  }
}
</style>
