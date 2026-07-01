<script lang="tsx" setup>
import type { CSSProperties } from 'vue'
import gsap from 'gsap'
import type { SceneItem } from '@/constants/showcase/mockInterviewSpaceScenes'
import SpaceTexturedPlanet from './SpaceTexturedPlanet.vue'

interface VisualSlot {
  x: number
  y: number
  scale: number
  opacity: number
  rotate: number
  zIndex: number
  blur: number
  brightness: number
}

interface VisualLayerState {
  x: number
  y: number
  scale: number
  opacity: number
  rotate: number
  zIndex: number
  blur: number
  brightness: number
}

interface PlanetTextureConfig {
  fitMode?: 'cover' | 'contain'
  imageStyle?: CSSProperties
  src: string
}

const props = defineProps<{
  activeSceneIndexBySlot: number
  centerSlot: number
  lastOrbitDirection: 1 | -1
  orderedSceneIndexes: number[]
  scenes: SceneItem[]
  transitionMs: number
}>()

const visualColumnRef = ref<HTMLElement | null>(null)
const visualLayerRefs = ref<Array<HTMLElement | null>>(Array.from({
  length: props.scenes.length
}, () => null))
const visualLayerStates = ref<Array<VisualLayerState | null>>(Array.from({
  length: props.scenes.length
}, () => null))
let visualTimeline: gsap.core.Timeline | null = null

const planetTextureMap: Partial<Record<SceneItem['id'], PlanetTextureConfig>> = {
  overview: {
    src: `${import.meta.env.BASE_URL}DroitStock_630232299_Medium.jpg`,
    imageStyle: {
      objectPosition: '50% 46%',
      transform: 'translate(-50%, -50%) scale(2.18)',
      filter: 'saturate(1.08) contrast(1.28) brightness(0.92)'
    }
  },
  mock: {
    src: `${import.meta.env.BASE_URL}DroitStock_1493827434_Medium.jpg`,
    imageStyle: {
      objectPosition: '50% 50%',
      transform: 'translate(-50%, -50%) scale(1.1)',
      filter: 'saturate(1.08) contrast(1.04) brightness(1.02)'
    }
  },
  library: {
    src: `${import.meta.env.BASE_URL}DroitStock_923338027_Medium.jpg`,
    imageStyle: {
      objectPosition: '45% 48%',
      transform: 'translate(-50%, -50%) scale(1.38)',
      filter: 'saturate(1.06) contrast(1.08) brightness(0.96)'
    }
  },
  feedback: {
    src: `${import.meta.env.BASE_URL}PIA18033~orig.jpg`,
    imageStyle: {
      objectPosition: '50% 52%',
      transform: 'translate(-50%, -50%) scale(1.22)',
      filter: 'saturate(1.12) contrast(1.08) brightness(1.03)'
    }
  },
  report: {
    src: `${import.meta.env.BASE_URL}DroitStock_55808438_Medium.jpg`,
    imageStyle: {
      objectPosition: '50% 54%',
      transform: 'translate(-50%, -50%) scale(1.48)',
      filter: 'saturate(1.1) contrast(1.08) brightness(1)'
    }
  }
}

const resolveVisualSlotProfiles = (stageWidth: number, stageHeight: number): VisualSlot[] => {
  const viewportWidth = typeof window === 'undefined' ? stageWidth : window.innerWidth
  const widthUnit = Math.max(stageWidth, viewportWidth, 360)
  const heightUnit = Math.min(Math.max(stageHeight, 320), 720)
  const compactRatio = stageWidth < 760 ? 0.82 : 1

  return [
    {
      x: -0.39 * widthUnit * compactRatio,
      y: -0.2 * heightUnit,
      scale: 0.54,
      opacity: 0.34,
      rotate: -8,
      zIndex: 1,
      blur: 8.8,
      brightness: 0.64
    },
    {
      x: -0.38 * widthUnit * compactRatio,
      y: 0.28 * heightUnit,
      scale: 0.78,
      opacity: 0.72,
      rotate: -7,
      zIndex: 4,
      blur: 4.2,
      brightness: 0.82
    },
    {
      x: 0.16 * widthUnit,
      y: -0.02 * heightUnit,
      scale: 1.38,
      opacity: 1,
      rotate: -1,
      zIndex: 9,
      blur: 0,
      brightness: 1.12
    },
    {
      x: 0.5 * widthUnit * compactRatio,
      y: 0.34 * heightUnit,
      scale: 0.8,
      opacity: 0.74,
      rotate: 7,
      zIndex: 5,
      blur: 3.6,
      brightness: 0.88
    },
    {
      x: 0.5 * widthUnit * compactRatio,
      y: -0.18 * heightUnit,
      scale: 0.56,
      opacity: 0.36,
      rotate: 8,
      zIndex: 1,
      blur: 8.4,
      brightness: 0.66
    }
  ]
}

const planetStyleFor = (scene: SceneItem, sceneIndex: number): CSSProperties => {
  const slotIndex = props.orderedSceneIndexes.indexOf(sceneIndex)
  const isActiveScene = sceneIndex === props.activeSceneIndexBySlot
  const isLowerRightPlanet = slotIndex === 4
  const isEarthSizedPlanet = scene.id === 'feedback' || scene.id === 'report'
  const hasTexture = Boolean(planetTextureMap[scene.id])
  const size = isEarthSizedPlanet ? 'min(21vw, 420px)' : 'min(18vw, 360px)'

  return {
    width: size,
    height: size,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    ...(hasTexture ? {} : {
      background: scene.theme.planet
    }),
    '--planet-texture': scene.theme.planet,
    '--planet-shadow': scene.theme.planetShadow,
    opacity: isActiveScene ? '1' : isLowerRightPlanet ? '0.62' : '0.72'
  } as CSSProperties
}

const sceneLayerClass = (sceneIndex: number) => ({
  'is-active': sceneIndex === props.activeSceneIndexBySlot,
  'is-trailing': sceneIndex !== props.activeSceneIndexBySlot
})

const planetShellClass = (scene: SceneItem) => ({
  'is-earth-planet': scene.id === 'feedback',
  'is-library-planet': scene.id === 'library',
  'is-report-planet': scene.id === 'report',
  'is-saturn-planet': scene.id === 'overview',
  'is-textured-planet': Boolean(planetTextureMap[scene.id])
})

const planetTextureFor = (scene: SceneItem) => planetTextureMap[scene.id]

const isSaturnScene = (scene: SceneItem) => scene.id === 'overview'

const setVisualLayerRef = (element: Element | null, index: number) => {
  visualLayerRefs.value[index] = element instanceof HTMLElement ? element : null
}

const resolveVisualLayerState = (sceneIndex: number): VisualLayerState => {
  const host = visualColumnRef.value
  const slotIndex = props.orderedSceneIndexes.indexOf(sceneIndex)
  const isActiveScene = sceneIndex === props.activeSceneIndexBySlot
  const width = host?.clientWidth ?? 960
  const height = host?.clientHeight ?? 560
  const slots = resolveVisualSlotProfiles(width, height)
  const slot = slots[Math.max(slotIndex, 0)] ?? slots[props.centerSlot]

  return {
    x: slot.x,
    y: slot.y,
    scale: slot.scale,
    opacity: slot.opacity,
    rotate: slot.rotate,
    zIndex: isActiveScene ? slot.zIndex + 12 : slot.zIndex,
    blur: slot.blur,
    brightness: slot.brightness
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
    opacity: state.opacity,
    filter: `blur(${ state.blur }px) brightness(${ state.brightness })`
  })
  visualLayerStates.value[sceneIndex] = state
}

const syncVisualLayers = (immediate = false) => {
  visualTimeline?.kill()
  visualTimeline = null

  if (immediate) {
    props.scenes.forEach((_, sceneIndex) => {
      applyVisualLayerState(sceneIndex, resolveVisualLayerState(sceneIndex))
    })
    return
  }

  const motionDuration = Math.max(props.transitionMs / 1000, 1.18)
  visualTimeline = gsap.timeline({
    defaults: {
      overwrite: 'auto'
    },
    onComplete: () => {
      props.scenes.forEach((_, sceneIndex) => {
        const layer = visualLayerRefs.value[sceneIndex]
        const target = visualLayerStates.value[sceneIndex]
        if (layer && target) {
          layer.style.zIndex = String(target.zIndex)
        }
      })
      visualTimeline = null
    }
  })

  props.scenes.forEach((_, sceneIndex) => {
    const layer = visualLayerRefs.value[sceneIndex]
    if (!layer) return

    const target = resolveVisualLayerState(sceneIndex)
    const previous = visualLayerStates.value[sceneIndex] ?? target

    gsap.killTweensOf(layer)
    layer.style.zIndex = String(Math.max(previous.zIndex, target.zIndex))
    visualLayerStates.value[sceneIndex] = target

    // 同一条补间同时处理位移、大小和清晰度，避免星球先离轨再回位。
    visualTimeline?.to(layer, {
      x: target.x,
      y: target.y,
      scale: target.scale,
      rotation: target.rotate,
      opacity: target.opacity,
      filter: `blur(${ target.blur }px) brightness(${ target.brightness })`,
      duration: motionDuration,
      ease: 'power2.inOut'
    }, 0)
  })
}

/** 登录大爆炸：星球从中心向轨道位分发展开 */
const playBigBangReveal = (): Promise<void> => {
  return new Promise((resolve) => {
    const host = visualColumnRef.value
    if (!host) {
      resolve()
      return
    }

    props.scenes.forEach((_, sceneIndex) => {
      const layer = visualLayerRefs.value[sceneIndex]
      if (!layer) return

      gsap.killTweensOf(layer)
      gsap.set(layer, {
        x: 0,
        y: 0,
        scale: 0.06,
        opacity: 0,
        rotation: 0,
        filter: 'blur(6px) brightness(0.72)'
      })
      layer.style.zIndex = '1'
    })

    const timeline = gsap.timeline({
      onComplete: () => {
        props.scenes.forEach((_, sceneIndex) => {
          const target = resolveVisualLayerState(sceneIndex)
          const layer = visualLayerRefs.value[sceneIndex]
          if (layer) {
            layer.style.zIndex = String(target.zIndex)
          }
          visualLayerStates.value[sceneIndex] = target
        })
        resolve()
      }
    })

    props.scenes.forEach((_, sceneIndex) => {
      const layer = visualLayerRefs.value[sceneIndex]
      const target = resolveVisualLayerState(sceneIndex)
      if (!layer) return

      const isHero = sceneIndex === props.activeSceneIndexBySlot
      const delay = 0.18 + sceneIndex * 0.09

      timeline.to(layer, {
        x: target.x,
        y: target.y,
        scale: target.scale * (isHero ? 1.06 : 1),
        opacity: target.opacity,
        rotation: target.rotate,
        filter: `blur(${ target.blur }px) brightness(${ target.brightness })`,
        duration: isHero ? 1.15 : 0.95,
        ease: isHero ? 'power4.out' : 'power3.out'
      }, delay)

      if (isHero) {
        timeline.to(layer, {
          scale: target.scale,
          duration: 0.35,
          ease: 'power2.inOut'
        }, delay + 1.05)
      }
    })
  })
}

const clearVisualLayerTweens = () => {
  visualTimeline?.kill()
  visualTimeline = null
  visualLayerRefs.value.forEach((layer) => {
    if (layer) {
      gsap.killTweensOf(layer)
    }
  })
}

defineExpose({
  clearVisualLayerTweens,
  playBigBangReveal,
  syncVisualLayers
})
</script>

<template>
  <section
    ref="visualColumnRef"
    class="visual-column"
  >
    <svg
      class="saturn-ring-guide"
      viewBox="0 0 1600 720"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        class="saturn-ring-guide-back"
        d="M 0 220 C 410 48, 990 48, 1600 214"
      />
      <path
        class="saturn-ring-guide-front"
        d="M 1600 214 C 1716 390, 1632 630, 1428 642 C 1220 654, 1084 432, 916 356 C 690 486, 472 648, 112 578 C -36 550, -42 356, 0 220"
      />
      <path
        class="saturn-ring-guide-link"
        d="M 0 220 C 410 48, 990 48, 1600 214 C 1716 390, 1632 630, 1428 642 C 1220 654, 1084 432, 916 356 C 690 486, 472 648, 112 578 C -36 550, -42 356, 0 220"
      />
    </svg>

    <div
      v-for="(scene, index) in scenes"
      :key="scene.id"
      :ref="(element) => setVisualLayerRef(element, index)"
      class="visual-layer"
      :class="sceneLayerClass(index)"
    >
      <div
        class="planet-shell"
        :class="planetShellClass(scene)"
        :style="planetStyleFor(scene, index)"
      >
        <SpaceTexturedPlanet
          v-if="planetTextureFor(scene)"
          :src="planetTextureFor(scene)!.src"
          :fit-mode="planetTextureFor(scene)!.fitMode"
          :image-style="planetTextureFor(scene)!.imageStyle"
          :show-shade="!isSaturnScene(scene)"
        />
        <span
          v-if="isSaturnScene(scene)"
          class="saturn-planet-shadow"
          aria-hidden="true"
        ></span>
        <span
          v-if="isSaturnScene(scene)"
          class="saturn-asteroids"
          aria-hidden="true"
        ></span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.visual-column {
  position: relative;
  min-height: 560px;
  overflow: visible;
  isolation: isolate;
  transform: translateZ(0);
}

.saturn-ring-guide {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(100vw + 18px);
  height: min(58vw, 680px);
  pointer-events: none;
  opacity: 0.38;
  transform: translate(-50%, -48%);
  transform-origin: center;
  z-index: 0;
}

.saturn-ring-guide path {
  fill: none;
  stroke: rgb(220 244 255 / 0.34);
  stroke-width: 1.2;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.saturn-ring-guide-back {
  stroke-dasharray: 3 13;
  opacity: 0.48;
}

.saturn-ring-guide-front {
  stroke-dasharray: 42 18;
  opacity: 0.68;
}

.saturn-ring-guide-link {
  stroke: rgb(235 251 255 / 0.46);
  stroke-dasharray: 8 18;
  opacity: 0.62;
}

.visual-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform, opacity;
  opacity: 0;
  transform: translate3d(0, 0, 0);
  transform-origin: 50% 50%;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  contain: layout paint;
}

.planet-shell {
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  will-change: transform, opacity;
  background:
    radial-gradient(circle at 34% 28%, rgb(255 255 255 / 0.5), transparent 0 19%),
    radial-gradient(circle at 28% 30%, rgb(157 244 255 / 0.16), transparent 0 44%),
    linear-gradient(128deg, transparent 0 42%, rgb(0 0 0 / 0.36) 74%, rgb(0 0 0 / 0.58) 100%),
    var(--planet-texture);
  box-shadow:
    0 0 34px rgb(113 238 255 / 0.12),
    inset -18px -18px 34px var(--planet-shadow);
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  transition: opacity 0.32s ease;
}

.planet-shell.is-textured-planet {
  z-index: 20;
  background: transparent;
  box-shadow:
    0 0 28px rgb(132 222 255 / 0.22),
    0 0 70px rgb(66 185 255 / 0.16),
    18px 28px 58px rgb(3 7 18 / 0.36),
    inset 18px 16px 24px rgb(255 255 255 / 0.16),
    inset -34px -42px 58px rgb(0 6 24 / 0.48);
  transform: translate3d(0, 0, 0);
}

.planet-shell.is-saturn-planet {
  overflow: visible;
  box-shadow:
    0 0 18px rgb(255 222 160 / 0.26),
    0 0 52px rgb(230 132 60 / 0.22),
    0 0 112px rgb(112 50 24 / 0.18),
    18px 30px 62px rgb(3 4 10 / 0.5),
    inset 18px 12px 26px rgb(255 221 156 / 0.18),
    inset -38px -42px 64px rgb(3 6 14 / 0.68);
}

.planet-shell.is-report-planet {
  box-shadow:
    0 0 30px rgb(255 122 96 / 0.16),
    0 0 82px rgb(153 42 82 / 0.18),
    18px 30px 62px rgb(4 3 12 / 0.46),
    inset 18px 14px 26px rgb(255 206 174 / 0.13),
    inset -38px -44px 68px rgb(8 3 18 / 0.62);
}

.planet-shell.is-library-planet {
  box-shadow:
    0 0 28px rgb(77 231 255 / 0.2),
    0 0 80px rgb(0 112 255 / 0.22),
    18px 30px 66px rgb(2 7 22 / 0.52),
    inset 16px 14px 28px rgb(171 248 255 / 0.14),
    inset -42px -46px 72px rgb(1 8 32 / 0.66);
}

.planet-shell.is-textured-planet::before {
  position: absolute;
  inset: -8%;
  z-index: -1;
  content: '';
  border-radius: inherit;
  background:
    radial-gradient(circle at 42% 36%, rgb(170 241 255 / 0.24) 0%, transparent 42%),
    radial-gradient(circle, rgb(75 207 255 / 0.28) 0%, transparent 67%);
  filter: blur(6px);
  pointer-events: none;
}

.planet-shell.is-library-planet::before {
  background:
    radial-gradient(circle at 34% 24%, rgb(114 246 255 / 0.22) 0%, transparent 42%),
    radial-gradient(circle, rgb(0 136 255 / 0.22) 0%, transparent 67%);
  filter: blur(7px);
}

.planet-shell.is-library-planet::after {
  position: absolute;
  inset: 0;
  z-index: 2;
  content: '';
  border-radius: inherit;
  background:
    radial-gradient(circle at 29% 19%, rgb(193 255 255 / 0.16) 0%, transparent 21%),
    radial-gradient(circle at 48% 43%, transparent 0 55%, rgb(2 17 54 / 0.3) 77%, rgb(0 5 24 / 0.64) 100%),
    linear-gradient(132deg, rgb(153 246 255 / 0.08) 0%, transparent 28%, rgb(4 14 48 / 0.22) 66%, rgb(0 3 17 / 0.5) 100%);
  pointer-events: none;
}

.planet-shell.is-report-planet::before {
  background:
    radial-gradient(circle at 38% 30%, rgb(255 160 128 / 0.2) 0%, transparent 42%),
    radial-gradient(circle, rgb(202 62 112 / 0.2) 0%, transparent 68%);
  filter: blur(7px);
}

.planet-shell.is-report-planet::after {
  position: absolute;
  inset: 0;
  z-index: 2;
  content: '';
  border-radius: inherit;
  background:
    radial-gradient(circle at 34% 24%, rgb(255 232 202 / 0.18) 0%, transparent 23%),
    radial-gradient(circle at 45% 42%, transparent 0 56%, rgb(28 7 26 / 0.28) 78%, rgb(5 3 13 / 0.62) 100%),
    linear-gradient(132deg, rgb(255 186 144 / 0.1) 0%, transparent 31%, rgb(9 4 18 / 0.2) 66%, rgb(3 2 10 / 0.48) 100%);
  pointer-events: none;
}

.planet-shell.is-saturn-planet::before,
.planet-shell.is-saturn-planet::after {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 246%;
  height: 54%;
  content: '';
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -48%) rotate(-12deg);
  transform-origin: center;
}

.planet-shell.is-saturn-planet::before {
  z-index: -1;
  background:
    radial-gradient(ellipse at center, transparent 0 41%, rgb(50 13 12 / 0.28) 42%, rgb(118 38 22 / 0.5) 45%, transparent 46% 50%, rgb(152 45 24 / 0.64) 51%, rgb(229 102 38 / 0.7) 55%, rgb(72 20 16 / 0.46) 58%, transparent 59% 65%, rgb(168 58 26 / 0.36) 66%, rgb(84 24 18 / 0.46) 70%, transparent 71%),
    linear-gradient(90deg, transparent 0 6%, rgb(58 15 14 / 0.28) 18%, rgb(136 38 22 / 0.58) 40%, rgb(232 96 34 / 0.62) 54%, rgb(76 20 16 / 0.34) 82%, transparent 97%);
  filter: blur(1.2px) drop-shadow(0 0 12px rgb(166 48 24 / 0.42));
  opacity: 0.76;
}

.planet-shell.is-saturn-planet::after {
  z-index: 3;
  background:
    radial-gradient(ellipse at center, transparent 0 42%, rgb(62 15 13 / 0.18) 43%, rgb(130 35 20 / 0.34) 46%, transparent 47% 51%, rgb(183 55 24 / 0.52) 52%, rgb(245 103 34 / 0.58) 55%, rgb(101 27 17 / 0.36) 58%, transparent 59% 66%, rgb(152 45 22 / 0.24) 67%, rgb(79 22 17 / 0.34) 70%, transparent 71%),
    linear-gradient(90deg, transparent 0 8%, rgb(66 15 13 / 0.18) 22%, rgb(169 46 22 / 0.48) 44%, rgb(236 91 30 / 0.5) 55%, rgb(76 18 15 / 0.24) 80%, transparent 96%);
  filter: blur(0.35px) drop-shadow(0 0 12px rgb(168 45 22 / 0.36));
  opacity: 0.7;
  mask-image: linear-gradient(180deg, transparent 0%, transparent 35%, rgb(0 0 0 / 0.38) 47%, rgb(0 0 0 / 0.68) 55%, rgb(0 0 0 / 0.26) 65%, transparent 78%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, transparent 35%, rgb(0 0 0 / 0.38) 47%, rgb(0 0 0 / 0.68) 55%, rgb(0 0 0 / 0.26) 65%, transparent 78%, transparent 100%);
}

.saturn-planet-shadow {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

.saturn-planet-shadow {
  background:
    radial-gradient(ellipse 30% 18% at 48% 12%, rgb(8 4 5 / 0.48) 0%, rgb(18 8 8 / 0.34) 34%, transparent 72%),
    linear-gradient(170deg, transparent 0 44%, rgb(38 15 12 / 0.22) 49%, rgb(4 5 11 / 0.38) 58%, transparent 66%),
    radial-gradient(circle at 32% 24%, rgb(9 5 8 / 0.06) 0 22%, rgb(34 16 13 / 0.16) 50%, rgb(2 4 10 / 0.62) 100%),
    linear-gradient(132deg, rgb(10 4 8 / 0.1) 0%, transparent 30%, rgb(32 12 10 / 0.2) 54%, rgb(1 4 11 / 0.66) 100%);
}

.saturn-asteroids {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 4;
  width: 236%;
  height: 54%;
  pointer-events: none;
  transform: translate(-50%, -48%) rotate(-12deg);
}

.saturn-asteroids::before,
.saturn-asteroids::after {
  position: absolute;
  inset: 0;
  content: '';
  border-radius: 50%;
  background:
    radial-gradient(circle at 13% 55%, rgb(236 151 70 / 0.74) 0 1.8px, transparent 2.6px),
    radial-gradient(circle at 18% 49%, rgb(117 34 22 / 0.58) 0 1.2px, transparent 2px),
    radial-gradient(circle at 26% 58%, rgb(190 58 28 / 0.56) 0 1.5px, transparent 2.4px),
    radial-gradient(circle at 37% 52%, rgb(224 96 38 / 0.5) 0 1.3px, transparent 2.2px),
    radial-gradient(circle at 47% 59%, rgb(148 42 24 / 0.54) 0 1.8px, transparent 2.8px),
    radial-gradient(circle at 58% 51%, rgb(106 31 22 / 0.48) 0 1.1px, transparent 2px),
    radial-gradient(circle at 69% 57%, rgb(198 66 30 / 0.54) 0 1.7px, transparent 2.6px),
    radial-gradient(circle at 78% 50%, rgb(102 30 22 / 0.48) 0 1.2px, transparent 2.2px),
    radial-gradient(circle at 86% 56%, rgb(214 78 34 / 0.56) 0 1.9px, transparent 2.9px);
  filter: drop-shadow(0 0 3px rgb(158 42 22 / 0.44));
}

.saturn-asteroids::after {
  transform: rotate(180deg) scale(0.92);
  opacity: 0.68;
}

@media (max-width: 1100px) {
  .visual-column {
    min-height: 420px;
  }
}
</style>
