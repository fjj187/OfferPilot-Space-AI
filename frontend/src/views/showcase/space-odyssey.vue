<script lang="tsx" setup>
import type { CSSProperties } from 'vue'

interface SceneTheme {
  line: string
  dot: string
  activeDot: string
  primary: string
  secondary: string
  planet: string
  planetGlow: string
  planetShadow: string
  atmosphere: string
  ring: string
}

interface SceneItem {
  id: string
  navLabel: string
  eyebrow: string
  title: string
  summary: string
  bullets: string[]
  primaryAction: string
  secondaryAction: string
  detail: string
  theme: SceneTheme
  shellBackground: string
  glowA: string
  glowB: string
  nebula: string
  planetSize: string
  planetRight: string
  planetBottom: string
  craftTop: string
  craftRight: string
  craftRotate: string
  craftScale: number
}

interface OrbitSlot {
  left: number
  top: number
  visible: boolean
}

interface VisualSlot {
  x: string
  y: string
  scale: number
  opacity: number
  blur: number
  rotate: number
  zIndex: number
}

const transitionMs = 980
const cycleDurationMs = 6200
const centerSlot = 2
let scrollHosts: Array<Window | HTMLElement> = []
let restoreBottomAfterTransition = false

const scenes: SceneItem[] = [
  {
    id: 'secure',
    navLabel: 'Secure & defend',
    eyebrow: 'Orbital resilience',
    title: 'Secure & defend',
    summary: 'Shielding critical missions with secure constellations, sovereign payloads, and always-on observation.',
    bullets: [
      'Protected communication relays for multi-domain operations',
      'Rapid deployment payload buses for defense and civil response',
      'Mission control surfaces built for long-horizon resilience'
    ],
    primaryAction: 'Request briefing',
    secondaryAction: 'Capability deck',
    detail: 'Sovereign systems with resilient communications and secure mission choreography.',
    theme: {
      line: 'rgba(186, 234, 255, 0.22)',
      dot: 'rgba(255, 255, 255, 0.86)',
      activeDot: '#6bf2eb',
      primary: '#73f5eb',
      secondary: '#d9f3ff',
      planet: 'radial-gradient(circle at 35% 28%, #96fffd 0%, #2fcfc4 22%, #144969 48%, #091220 70%, #04070f 100%)',
      planetGlow: 'rgba(89, 240, 234, 0.38)',
      planetShadow: 'rgba(1, 4, 12, 0.88)',
      atmosphere: 'rgba(119, 255, 244, 0.7)',
      ring: 'rgba(107, 242, 235, 0.26)'
    },
    shellBackground: 'linear-gradient(124deg, #071123 0%, #0a1630 34%, #0d2846 60%, #03060d 100%)',
    glowA: 'radial-gradient(circle at 0% 0%, rgba(73, 238, 226, 0.55) 0%, rgba(73, 238, 226, 0) 42%)',
    glowB: 'radial-gradient(circle at 78% 18%, rgba(111, 166, 255, 0.24) 0%, rgba(111, 166, 255, 0) 32%)',
    nebula: 'linear-gradient(115deg, rgba(28, 48, 79, 0.9) 0%, rgba(7, 12, 26, 0.12) 42%, rgba(2, 2, 5, 0.6) 100%)',
    planetSize: '38vw',
    planetRight: '-8vw',
    planetBottom: '-12vh',
    craftTop: '14%',
    craftRight: '26%',
    craftRotate: '-24deg',
    craftScale: 1
  },
  {
    id: 'travel',
    navLabel: 'Travel & navigate',
    eyebrow: 'Lunar pathways',
    title: 'Travel & navigate',
    summary: 'Guiding human and robotic missions through deep space routes, docking choreography, and planetary approach.',
    bullets: [
      'Flight systems ready for cislunar logistics and rendezvous',
      'High-precision guidance tuned for extreme-distance missions',
      'Crew-support architectures for long duration exploration'
    ],
    primaryAction: 'View mission paths',
    secondaryAction: 'Trajectory notes',
    detail: 'Navigation-first systems shaped for cislunar travel, rendezvous, and approach.',
    theme: {
      line: 'rgba(210, 222, 255, 0.25)',
      dot: 'rgba(255, 255, 255, 0.85)',
      activeDot: '#b7cbff',
      primary: '#b7cbff',
      secondary: '#ecf1ff',
      planet: 'radial-gradient(circle at 40% 32%, #f1f2ff 0%, #b4b8d8 24%, #69558a 52%, #241733 74%, #09060d 100%)',
      planetGlow: 'rgba(154, 177, 255, 0.35)',
      planetShadow: 'rgba(5, 3, 10, 0.9)',
      atmosphere: 'rgba(201, 212, 255, 0.52)',
      ring: 'rgba(193, 208, 255, 0.22)'
    },
    shellBackground: 'linear-gradient(126deg, #140b26 0%, #291348 38%, #4f2450 72%, #09070b 100%)',
    glowA: 'radial-gradient(circle at 6% 6%, rgba(94, 121, 255, 0.5) 0%, rgba(94, 121, 255, 0) 38%)',
    glowB: 'radial-gradient(circle at 72% 16%, rgba(255, 202, 126, 0.22) 0%, rgba(255, 202, 126, 0) 30%)',
    nebula: 'linear-gradient(110deg, rgba(52, 23, 82, 0.92) 0%, rgba(65, 18, 62, 0.48) 40%, rgba(7, 6, 10, 0.7) 100%)',
    planetSize: '34vw',
    planetRight: '-5vw',
    planetBottom: '-7vh',
    craftTop: '12%',
    craftRight: '24%',
    craftRotate: '-18deg',
    craftScale: 0.94
  },
  {
    id: 'explore',
    navLabel: 'Explore',
    eyebrow: 'Solar system frontier',
    title: 'Explore',
    summary: 'A pivotal partner in international science and exploration missions across the Solar System and beyond.',
    bullets: [
      'The world leader in orbital infrastructures',
      'Top industrial partner for Lunar Gateway and Axiom missions',
      'Mission-ready payloads built for planetary science'
    ],
    primaryAction: 'Learn more',
    secondaryAction: 'Discover all',
    detail: 'Bold exploration systems for science missions, lunar gateways, and commercial stations.',
    theme: {
      line: 'rgba(255, 229, 229, 0.24)',
      dot: 'rgba(255, 255, 255, 0.88)',
      activeDot: '#ffffff',
      primary: '#ffffff',
      secondary: '#ffe7d9',
      planet: 'radial-gradient(circle at 30% 26%, #f3c68c 0%, #a66a3b 20%, #58341f 42%, #20130f 62%, #090606 100%)',
      planetGlow: 'rgba(255, 155, 50, 0.34)',
      planetShadow: 'rgba(12, 2, 0, 0.86)',
      atmosphere: 'rgba(255, 194, 117, 0.28)',
      ring: 'rgba(255, 255, 255, 0.2)'
    },
    shellBackground: 'linear-gradient(129deg, #920014 0%, #ac081e 34%, #b63500 62%, #d26b00 100%)',
    glowA: 'radial-gradient(circle at 6% 2%, rgba(94, 255, 235, 0.72) 0%, rgba(94, 255, 235, 0.08) 20%, rgba(94, 255, 235, 0) 42%)',
    glowB: 'radial-gradient(circle at 5% 88%, rgba(17, 148, 131, 0.58) 0%, rgba(17, 148, 131, 0) 26%)',
    nebula: 'linear-gradient(118deg, rgba(151, 5, 29, 0.82) 0%, rgba(167, 23, 19, 0.5) 40%, rgba(219, 113, 0, 0.38) 78%, rgba(0, 0, 0, 0.05) 100%)',
    planetSize: '42vw',
    planetRight: '-10vw',
    planetBottom: '-19vh',
    craftTop: '8%',
    craftRight: '22%',
    craftRotate: '-28deg',
    craftScale: 1.05
  },
  {
    id: 'observe',
    navLabel: 'Observe & protect',
    eyebrow: 'Earth pulse',
    title: 'Observe & protect',
    summary: 'Persistent observation for weather, climate, oceans, and crisis response with instruments tuned for clarity.',
    bullets: [
      'Continuous earth observation with precise revisit cadence',
      'Integrated telemetry for environmental and civil alerts',
      'Data products designed for rapid interpretation'
    ],
    primaryAction: 'See observations',
    secondaryAction: 'Open dashboard',
    detail: 'Observation constellations designed for insight, resilience, and crisis response.',
    theme: {
      line: 'rgba(212, 247, 255, 0.25)',
      dot: 'rgba(255, 255, 255, 0.82)',
      activeDot: '#baf5ff',
      primary: '#baf5ff',
      secondary: '#e7fbff',
      planet: 'radial-gradient(circle at 38% 28%, #f6ffff 0%, #79cdf6 18%, #15567f 42%, #0b223b 66%, #050911 100%)',
      planetGlow: 'rgba(100, 208, 255, 0.32)',
      planetShadow: 'rgba(1, 6, 15, 0.9)',
      atmosphere: 'rgba(164, 233, 255, 0.62)',
      ring: 'rgba(140, 227, 255, 0.18)'
    },
    shellBackground: 'linear-gradient(126deg, #04121c 0%, #0a2331 38%, #13445c 70%, #092030 100%)',
    glowA: 'radial-gradient(circle at 14% 10%, rgba(100, 224, 255, 0.46) 0%, rgba(100, 224, 255, 0) 33%)',
    glowB: 'radial-gradient(circle at 82% 18%, rgba(111, 255, 220, 0.18) 0%, rgba(111, 255, 220, 0) 28%)',
    nebula: 'linear-gradient(120deg, rgba(7, 24, 39, 0.5) 0%, rgba(16, 54, 76, 0.35) 42%, rgba(4, 10, 17, 0.72) 100%)',
    planetSize: '39vw',
    planetRight: '-8vw',
    planetBottom: '-14vh',
    craftTop: '16%',
    craftRight: '24%',
    craftRotate: '-20deg',
    craftScale: 0.9
  },
  {
    id: 'connect',
    navLabel: 'Connect',
    eyebrow: 'Constellation links',
    title: 'Connect',
    summary: 'Bringing governments, operators, and infrastructure programs together with high-bandwidth orbital links.',
    bullets: [
      'Multi-orbit relay systems for critical connectivity',
      'Adaptive payload buses for evolving bandwidth demand',
      'Ground-to-orbit experience wrapped in one program stack'
    ],
    primaryAction: 'Open network map',
    secondaryAction: 'Partnership notes',
    detail: 'Connectivity systems that keep data, people, and missions in orbit together.',
    theme: {
      line: 'rgba(221, 222, 255, 0.22)',
      dot: 'rgba(255, 255, 255, 0.82)',
      activeDot: '#7ff8dc',
      primary: '#7ff8dc',
      secondary: '#f0ecff',
      planet: 'radial-gradient(circle at 38% 30%, #d2c8ff 0%, #8672ff 22%, #3c2f8f 50%, #1b1843 72%, #080814 100%)',
      planetGlow: 'rgba(126, 113, 255, 0.36)',
      planetShadow: 'rgba(3, 3, 12, 0.9)',
      atmosphere: 'rgba(168, 158, 255, 0.56)',
      ring: 'rgba(152, 140, 255, 0.22)'
    },
    shellBackground: 'linear-gradient(126deg, #170f3b 0%, #2c1f72 40%, #352d87 69%, #120f2d 100%)',
    glowA: 'radial-gradient(circle at 2% 8%, rgba(124, 249, 219, 0.45) 0%, rgba(124, 249, 219, 0) 34%)',
    glowB: 'radial-gradient(circle at 80% 12%, rgba(180, 108, 255, 0.2) 0%, rgba(180, 108, 255, 0) 30%)',
    nebula: 'linear-gradient(114deg, rgba(43, 29, 103, 0.48) 0%, rgba(35, 26, 85, 0.44) 38%, rgba(7, 8, 17, 0.7) 100%)',
    planetSize: '35vw',
    planetRight: '-5vw',
    planetBottom: '-8vh',
    craftTop: '15%',
    craftRight: '25%',
    craftRotate: '-22deg',
    craftScale: 0.92
  }
]

const orbitSlots = ref<OrbitSlot[]>([
  { left: 20.4, top: 53.8, visible: true },
  { left: 36.8, top: 69.2, visible: true },
  { left: 50.0, top: 74.1, visible: true },
  { left: 64.9, top: 70.0, visible: true },
  { left: 81.2, top: 56.1, visible: true }
])

const visualSlots: VisualSlot[] = [
  { x: '-29vw', y: '24vh', scale: 0.9, opacity: 0.15, blur: 22, rotate: -12, zIndex: 1 },
  { x: '-35vw', y: '42vh', scale: 0.76, opacity: 0.11, blur: 26, rotate: 12, zIndex: 1 },
  { x: '0vw', y: '0vh', scale: 1, opacity: 1, blur: 0, rotate: 0, zIndex: 6 },
  { x: '21vw', y: '-21vh', scale: 1.06, opacity: 0.24, blur: 15, rotate: -8, zIndex: 3 },
  { x: '40vw', y: '15vh', scale: 0.84, opacity: 0.14, blur: 24, rotate: 15, zIndex: 1 }
]

const offscreenOrbitLeft = { left: -10, top: 40 }
const offscreenOrbitRight = { left: 110, top: 40 }

const router = useRouter()
const orbitOrder = ref([0, 1, 2, 3, 4])
const activeIndex = ref(orbitOrder.value[centerSlot])
const autoplay = ref(true)
const isTransitioning = ref(false)
const pendingTargetIndex = ref<number | null>(null)
const takeoverTick = ref(0)
const orbitOverrides = ref<Record<number, CSSProperties>>({})
const orbitGhost = ref<{
  sceneIndex: number
  left: number
  top: number
  label: string
  active: boolean
} | null>(null)
const orbitProgress = ref(0)
const headerRef = ref<HTMLElement | null>(null)
const headerFade = ref(0)
let settleTimer: ReturnType<typeof setTimeout> | null = null
let progressRaf: number | null = null
let cycleStartTime = 0

const activeScene = computed(() => scenes[activeIndex.value])
const visibleBullets = computed(() => activeScene.value.bullets.slice(0, 2))

const activeSceneIndexBySlot = computed(() => orbitOrder.value[centerSlot])

const sceneShellStyle = computed<CSSProperties>(() => ({
  background: activeScene.value.shellBackground,
  '--scene-line': activeScene.value.theme.line,
  '--scene-primary': activeScene.value.theme.primary,
  '--scene-secondary': activeScene.value.theme.secondary,
  '--scene-dot': activeScene.value.theme.dot,
  '--scene-dot-active': activeScene.value.theme.activeDot
} as CSSProperties))

const headerStyle = computed<CSSProperties>(() => {
  const fade = headerFade.value
  const blurActive = fade < 0.02
  return {
    opacity: String(1 - fade),
    transform: `translateY(${fade * -14}px)`,
    pointerEvents: fade > 0.98 ? 'none' : 'auto',
    backdropFilter: blurActive ? 'blur(14px)' : 'none',
    WebkitBackdropFilter: blurActive ? 'blur(14px)' : 'none',
    '--header-mask-opacity': String(1 - fade),
    '--header-border-opacity': String(0.08 * (1 - fade)),
    '--header-bg-opacity': String(Math.max(0, 0.92 - fade * 0.92))
  } as CSSProperties
})

const glowAStyle = computed<CSSProperties>(() => ({
  background: activeScene.value.glowA
}))

const glowBStyle = computed<CSSProperties>(() => ({
  background: activeScene.value.glowB
}))

const nebulaStyle = computed<CSSProperties>(() => ({
  background: activeScene.value.nebula
}))

const planetVars = (scene: SceneItem): CSSProperties => ({
  '--planet-atmosphere': scene.theme.atmosphere,
  '--planet-ring': scene.theme.ring
} as CSSProperties)

const planetStyle = (scene: SceneItem): CSSProperties => ({
  width: `min(${scene.planetSize}, 760px)`,
  height: `min(${scene.planetSize}, 760px)`,
  right: scene.planetRight,
  bottom: scene.planetBottom,
  background: scene.theme.planet,
  boxShadow: `0 0 80px ${scene.theme.planetGlow}, inset -80px -80px 140px ${scene.theme.planetShadow}`
})

const craftStyle = (scene: SceneItem): CSSProperties => ({
  top: scene.craftTop,
  right: scene.craftRight,
  transform: `rotate(${scene.craftRotate}) scale(${scene.craftScale})`
})

const sceneLayerStyle = (index: number): CSSProperties => {
  const slotIndex = orbitOrder.value.indexOf(index)
  const slot = visualSlots[Math.max(slotIndex, 0)]
  return {
    opacity: slot.opacity,
    zIndex: String(slot.zIndex),
    filter: `blur(${slot.blur}px)`,
    transform: `translate3d(${slot.x}, ${slot.y}, 0) rotate(${slot.rotate}deg) scale(${slot.scale})`
  }
}

const orbitStopStyle = (index: number): CSSProperties => {
  const override = orbitOverrides.value[index]
  if (override) {
    const slotIndex = orbitOrder.value.indexOf(index)
    return {
      ...override,
      zIndex: String(slotIndex >= centerSlot ? 12 - slotIndex : 6 - slotIndex)
    }
  }
  const slotIndex = orbitOrder.value.indexOf(index)
  const slot = orbitSlots.value[slotIndex]
  if (!slot) {
    return { left: '50%', top: '82%', opacity: '0' }
  }
  return {
    left: `${slot.left}%`,
    top: `${slot.top}%`,
    opacity: slot.visible ? '1' : '0',
    zIndex: String(slotIndex >= centerSlot ? 12 - slotIndex : 6 - slotIndex)
  }
}

const sceneLayerClass = (index: number) => ({
  'is-active': index === activeIndex.value
})

const orbitClass = (index: number) => ({
  'is-active': index === activeIndex.value
})

const setActiveByCenterSlot = () => {
  activeIndex.value = orbitOrder.value[centerSlot]
  takeoverTick.value += 1
}

const clearTimers = () => {
  if (settleTimer) {
    window.clearTimeout(settleTimer)
    settleTimer = null
  }
  if (progressRaf !== null) {
    window.cancelAnimationFrame(progressRaf)
    progressRaf = null
  }
}

const getScrollMetrics = (host: Window | HTMLElement) => {
  if (host === window) {
    const doc = document.documentElement
    const scrollTop = window.scrollY || window.pageYOffset || doc.scrollTop || 0
    const clientHeight = window.innerHeight
    const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight)
    return {
      scrollTop,
      clientHeight,
      scrollHeight,
      maxScrollTop: Math.max(scrollHeight - clientHeight, 0)
    }
  }

  return {
    scrollTop: host.scrollTop,
    clientHeight: host.clientHeight,
    scrollHeight: host.scrollHeight,
    maxScrollTop: Math.max(host.scrollHeight - host.clientHeight, 0)
  }
}

const isNearBottom = (host: Window | HTMLElement) => {
  const { scrollTop, clientHeight, scrollHeight } = getScrollMetrics(host)
  return scrollTop + clientHeight >= scrollHeight - 12
}

const clampScrollHosts = (pinToBottom = false) => {
  scrollHosts.forEach(host => {
    const { scrollTop, maxScrollTop } = getScrollMetrics(host)
    const nextScrollTop = pinToBottom ? maxScrollTop : Math.min(scrollTop, maxScrollTop)

    if (host === window) {
      window.scrollTo(0, nextScrollTop)
      return
    }

    host.scrollTop = nextScrollTop
  })
}

const stopAutoplay = () => {
  if (progressRaf !== null) {
    window.cancelAnimationFrame(progressRaf)
    progressRaf = null
  }
}

const scheduleProgressLoop = () => {
  stopAutoplay()
  if (!autoplay.value || isTransitioning.value) return
  cycleStartTime = performance.now() - orbitProgress.value * cycleDurationMs

  const tick = (now: number) => {
    if (!autoplay.value || isTransitioning.value) {
      progressRaf = null
      return
    }
    orbitProgress.value = Math.min((now - cycleStartTime) / cycleDurationMs, 1)
    if (orbitProgress.value >= 1) {
      orbitProgress.value = 0
      progressRaf = null
      stepOrbit(1)
      return
    }
    progressRaf = window.requestAnimationFrame(tick)
  }

  progressRaf = window.requestAnimationFrame(tick)
}

const stepOrbit = (direction: 1 | -1) => {
  if (isTransitioning.value) return
  isTransitioning.value = true
  restoreBottomAfterTransition = scrollHosts.some(host => isNearBottom(host))
  stopAutoplay()
  orbitProgress.value = 0
  if (settleTimer) {
    window.clearTimeout(settleTimer)
    settleTimer = null
  }
  orbitGhost.value = null
  orbitOverrides.value = {}

  const currentOrder = [...orbitOrder.value]
  const exitingScene = direction === 1 ? currentOrder[0] : currentOrder[currentOrder.length - 1]
  const ghostStart = direction === 1 ? orbitSlots.value[0] : orbitSlots.value[orbitSlots.value.length - 1]
  const ghostEnd = direction === 1 ? offscreenOrbitLeft : offscreenOrbitRight
  const newOrder = direction === 1
    ? [...currentOrder.slice(1), currentOrder[0]]
    : [currentOrder[currentOrder.length - 1], ...currentOrder.slice(0, currentOrder.length - 1)]

  orbitGhost.value = {
    sceneIndex: exitingScene,
    left: ghostStart.left,
    top: ghostStart.top,
    label: scenes[exitingScene].navLabel,
    active: false
  }

  orbitOrder.value = newOrder
  orbitOverrides.value = {
    [exitingScene]: {
      left: `${ direction === 1 ? offscreenOrbitRight.left : offscreenOrbitLeft.left }%`,
      top: `${ direction === 1 ? offscreenOrbitRight.top : offscreenOrbitLeft.top }%`,
      opacity: '0',
      transition: 'none'
    }
  }
  setActiveByCenterSlot()

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      orbitOverrides.value = {
        [exitingScene]: {
          left: `${ direction === 1 ? orbitSlots.value[orbitSlots.value.length - 1]?.left ?? 50 : orbitSlots.value[0]?.left ?? 50 }%`,
          top: `${ direction === 1 ? orbitSlots.value[orbitSlots.value.length - 1]?.top ?? 82 : orbitSlots.value[0]?.top ?? 82 }%`,
          opacity: '1'
        }
      }
      if (orbitGhost.value) {
        orbitGhost.value = {
          ...orbitGhost.value,
          left: ghostEnd.left,
          top: ghostEnd.top,
          active: true
        }
      }
    })
  })

  settleTimer = window.setTimeout(() => {
    orbitOverrides.value = {}
    orbitGhost.value = null
    isTransitioning.value = false
    settleTimer = null
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clampScrollHosts(restoreBottomAfterTransition)
        restoreBottomAfterTransition = false
        updateHeaderFade()
      })
    })
    if (autoplay.value) {
      scheduleProgressLoop()
    }

    if (pendingTargetIndex.value !== null) {
      const target = pendingTargetIndex.value
      navigateToScene(target)
    }
  }, transitionMs + 80)
}

const resetAutoplay = () => {
  orbitProgress.value = 0
  scheduleProgressLoop()
}

const goToNext = () => {
  pendingTargetIndex.value = null
  stepOrbit(1)
  resetAutoplay()
}

const goToPrevious = () => {
  pendingTargetIndex.value = null
  stepOrbit(-1)
  resetAutoplay()
}

const navigateToScene = (index: number) => {
  if (index === activeSceneIndexBySlot.value) {
    pendingTargetIndex.value = null
    return
  }
  if (isTransitioning.value) {
    pendingTargetIndex.value = index
    return
  }

  const center = activeSceneIndexBySlot.value
  const forward = (index - center + scenes.length) % scenes.length
  const backward = (center - index + scenes.length) % scenes.length
  if (forward > 1 || backward > 1) {
    pendingTargetIndex.value = index
    stepOrbit(forward <= backward ? 1 : -1)
    resetAutoplay()
    return
  }

  pendingTargetIndex.value = null
  stepOrbit(forward <= backward ? 1 : -1)
  resetAutoplay()
}

const handleToggleAutoplay = () => {
  autoplay.value = !autoplay.value
  if (autoplay.value) {
    resetAutoplay()
    return
  }
  stopAutoplay()
}

const handleOpenInterviewCosmos = () => {
  clearTimers()
  router.push({ name: 'MockInterviewSpaceShowcase' })
}

const resolveScrollTop = () => {
  const host = scrollHosts[0]
  if (!host || host === window)
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0

  return host.scrollTop
}

const findScrollHosts = (element: HTMLElement | null) => {
  const hosts: HTMLElement[] = []
  let current = element?.parentElement ?? null
  while (current) {
    const styles = window.getComputedStyle(current)
    const overflowY = styles.overflowY
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
      hosts.push(current)
    current = current.parentElement
  }

  return hosts.length ? [...hosts, window] : [window]
}

const updateHeaderFade = () => {
  const headerHeight = headerRef.value?.offsetHeight ?? 112
  if (!headerHeight) {
    headerFade.value = 0
    return
  }

  const start = headerHeight
  headerFade.value = resolveScrollTop() > start ? 1 : 0
}

watch(autoplay, value => {
  if (value) {
    resetAutoplay()
    return
  }
  stopAutoplay()
})

onMounted(() => {
  setActiveByCenterSlot()
  resetAutoplay()
  scrollHosts = findScrollHosts(headerRef.value)
  updateHeaderFade()
  scrollHosts.forEach(host => host.addEventListener('scroll', updateHeaderFade, { passive: true }))
})

onBeforeUnmount(() => {
  scrollHosts.forEach(host => host.removeEventListener('scroll', updateHeaderFade))
  scrollHosts = []
  clearTimers()
})
</script>

<template>
  <div
    class="space-showcase"
    :style="sceneShellStyle"
  >
    <div class="space-noise"></div>
    <div
      class="space-glow glow-a"
      :style="glowAStyle"
    ></div>
    <div
      class="space-glow glow-b"
      :style="glowBStyle"
    ></div>
    <div
      class="space-nebula"
      :style="nebulaStyle"
    ></div>

    <header
      ref="headerRef"
      class="space-header"
      :style="headerStyle"
    >
      <div class="brand-lockup">
        <div class="brand-mark">
          <span class="i-lucide-orbit"></span>
        </div>
        <div>
          <div class="brand-name">Orbital Atelier</div>
          <div class="brand-meta">Scene study / cinematic interface</div>
        </div>
      </div>

      <nav class="space-nav">
        <a href="#">Who we are</a>
        <a href="#">Space Alliance</a>
        <a href="#">What we do</a>
        <a href="#">Innovation</a>
        <a href="#">Stories</a>
      </nav>

      <div class="header-tools">
        <button
          type="button"
          class="icon-tool"
          aria-label="Search"
        >
          <span class="i-lucide-search"></span>
        </button>
        <button
          type="button"
          class="back-link"
          @click="handleOpenInterviewCosmos"
        >
          Back to interview cosmos
        </button>
      </div>
    </header>

    <main class="space-stage">
      <div class="copy-column">
        <Transition
          mode="out-in"
          name="scene-copy"
        >
          <div
            :key="activeScene.id"
            class="copy-inner"
          >
            <div class="eyebrow">
              <span class="eyebrow-dot"></span>
              <span>{{ activeScene.eyebrow }}</span>
            </div>
            <h1>{{ activeScene.title }}</h1>
            <p class="summary">{{ activeScene.summary }}</p>

            <ul class="bullet-list">
              <li
                v-for="bullet in visibleBullets"
                :key="bullet"
              >
                {{ bullet }}
              </li>
            </ul>

            <div class="copy-actions">
              <button
                type="button"
                class="cta-primary"
              >
                {{ activeScene.primaryAction }}
              </button>
              <button
                type="button"
                class="cta-secondary"
              >
                <span>{{ activeScene.secondaryAction }}</span>
                <span class="i-lucide-arrow-right"></span>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <div class="visual-column">
        <div
          v-for="(scene, index) in scenes"
          :key="scene.id"
          class="visual-layer"
          :class="sceneLayerClass(index)"
          :style="sceneLayerStyle(index)"
        >
          <div
            class="planet-shell"
            :style="[planetVars(scene), planetStyle(scene)]"
          >
            <div class="planet-atmosphere"></div>
            <div class="planet-rings"></div>
            <div class="planet-cracks"></div>
            <div class="planet-shadow"></div>
          </div>

          <div
            class="spacecraft"
            :style="craftStyle(scene)"
          >
            <span class="panel left"></span>
            <span class="panel right"></span>
            <span class="arm top"></span>
            <span class="arm bottom"></span>
            <span class="core"></span>
            <span class="thruster"></span>
          </div>
        </div>
      </div>
    </main>

    <section
      ref="orbitRailRef"
      class="orbit-rail"
    >
      <svg
        class="orbit-svg"
        viewBox="0 0 1200 240"
        preserveAspectRatio="none"
      >
        <path d="M -40 72 C 132 104, 260 126, 424 142 C 552 154, 674 154, 812 146 C 964 137, 1096 116, 1240 86" />
      </svg>

      <div class="orbit-controls">
        <button
          type="button"
          class="orbit-arrow"
          aria-label="Previous scene"
          @click="goToPrevious"
        >
          <span class="i-lucide-chevron-left"></span>
        </button>

        <button
          type="button"
          class="orbit-play"
          :aria-label="autoplay ? 'Pause autoplay' : 'Resume autoplay'"
          @click="handleToggleAutoplay"
        >
          <svg
            class="orbit-progress"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              class="orbit-progress-track"
              cx="50"
              cy="50"
              r="44"
            />
            <circle
              class="orbit-progress-value"
              cx="50"
              cy="50"
              r="44"
              :style="{ strokeDashoffset: String(276.46 * (1 - orbitProgress)) }"
            />
          </svg>
          <span :class="autoplay ? 'i-lucide-pause' : 'i-lucide-play'"></span>
        </button>

        <button
          type="button"
          class="orbit-arrow"
          aria-label="Next scene"
          @click="goToNext"
        >
          <span class="i-lucide-chevron-right"></span>
        </button>
      </div>

      <button
        v-for="(scene, index) in scenes"
        :key="scene.id"
        type="button"
        class="orbit-stop"
        :class="orbitClass(index)"
        :style="orbitStopStyle(index)"
        @click="navigateToScene(index)"
      >
        <span class="orbit-label">{{ scene.navLabel }}</span>
        <span class="orbit-dot"></span>
      </button>

      <div
        v-if="orbitGhost"
        class="orbit-stop orbit-ghost"
        :style="{ left: `${orbitGhost.left}%`, top: `${orbitGhost.top}%` }"
      >
        <span class="orbit-label">{{ orbitGhost.label }}</span>
        <span class="orbit-dot"></span>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.space-showcase {
  position: relative;
  min-height: max(calc(100vh + 320px), 1280px);
  padding-bottom: 320px;
  overflow: visible;
  color: #fff;
  isolation: isolate;
  transition: background 1.15s cubic-bezier(0.22, 1, 0.36, 1);
  background-color: #071123;
}

.space-showcase::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 420px;
  background:
    radial-gradient(circle at 50% 8%, rgb(255 255 255 / 0.08) 0%, rgb(255 255 255 / 0) 48%),
    linear-gradient(180deg, rgb(5 14 28 / 0) 0%, rgb(5 14 28 / 0.46) 28%, rgb(5 14 28 / 0.96) 100%);
  pointer-events: none;
}

.space-noise,
.space-nebula,
.space-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.space-noise {
  opacity: 0.16;
  background-image:
    radial-gradient(circle at 20% 18%, rgb(255 255 255 / 0.9) 0 1px, transparent 1.6px),
    radial-gradient(circle at 62% 11%, rgb(255 255 255 / 0.75) 0 1px, transparent 1.5px),
    radial-gradient(circle at 88% 26%, rgb(255 255 255 / 0.85) 0 1.2px, transparent 1.7px),
    radial-gradient(circle at 32% 44%, rgb(255 255 255 / 0.55) 0 1px, transparent 1.6px),
    radial-gradient(circle at 77% 58%, rgb(255 255 255 / 0.55) 0 1px, transparent 1.7px),
    radial-gradient(circle at 55% 82%, rgb(255 255 255 / 0.45) 0 1px, transparent 1.8px);
  background-size: 520px 320px, 560px 340px, 580px 360px, 500px 300px, 680px 420px, 620px 360px;
}

.space-nebula {
  mix-blend-mode: screen;
  opacity: 0.82;
  transition: background 1.15s cubic-bezier(0.22, 1, 0.36, 1);
}

.space-glow {
  filter: blur(18px);
  transition: background 1.15s cubic-bezier(0.22, 1, 0.36, 1);
}

.glow-a {
  inset: -10% auto auto -6%;
  width: 50vw;
  height: 42vw;
}

.glow-b {
  inset: auto -10% 6% auto;
  width: 44vw;
  height: 40vw;
}

.space-header {
  position: sticky;
  top: 0;
  z-index: 4;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 22px 28px;
  border-bottom: 1px solid rgb(255 255 255 / var(--header-border-opacity, 0.08));
  background: linear-gradient(180deg, rgb(7 15 30 / var(--header-bg-opacity, 0.86)) 0%, rgb(7 15 30 / 0.34) 100%);
  backdrop-filter: blur(14px);
  transition:
    opacity 0.5s ease,
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.5s ease,
    background 0.5s ease;
}

.space-header::after {
  content: "";
  position: absolute;
  inset: auto 0 -32px;
  height: 32px;
  background: linear-gradient(180deg, rgb(7 15 30 / calc(var(--header-mask-opacity, 1) * 0.34)) 0%, rgb(7 15 30 / 0) 100%);
  pointer-events: none;
  transition: opacity 0.5s ease, background 0.5s ease;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 16px;
  color: var(--scene-primary);
  background: rgb(255 255 255 / 0.06);
  font-size: 22px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06);
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
}

.brand-meta {
  margin-top: 4px;
  color: rgb(232 244 255 / 0.62);
  font-size: 12px;
}

.space-nav {
  display: flex;
  align-items: center;
  gap: 28px;
}

.space-nav a {
  color: rgb(250 252 255 / 0.9);
  font-size: 15px;
  transition: color 0.2s ease;
}

.space-nav a:hover {
  color: var(--scene-primary);
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-tool,
.back-link,
.orbit-arrow,
.orbit-play,
.cta-primary,
.cta-secondary,
.orbit-stop {
  font: inherit;
}

.icon-tool {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: #fff;
  cursor: pointer;
}

.back-link {
  height: 44px;
  padding: 0 18px;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: #fff;
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.back-link:hover {
  border-color: rgb(255 255 255 / 0.28);
  background: rgb(255 255 255 / 0.1);
}

.space-stage {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(300px, 500px) 1fr;
  gap: 10px;
  min-height: max(calc(100vh - 108px + 32px), 760px);
  padding: 12px 34px 36px;
}

.copy-column {
  position: relative;
  z-index: 6;
  min-height: 390px;
}

.copy-inner {
  position: absolute;
  inset: 8px auto auto 12px;
  width: min(500px, 100%);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--scene-secondary);
  font-size: 13px;
}

.eyebrow-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--scene-primary);
  box-shadow: 0 0 18px var(--scene-primary);
}

.copy-inner h1 {
  max-width: 7ch;
  font-size: clamp(46px, 5vw, 82px);
  line-height: 0.92;
}

.summary {
  max-width: 620px;
  margin-top: 16px;
  color: rgb(250 250 255 / 0.9);
  font-size: 15px;
  line-height: 1.45;
}

.bullet-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  padding-left: 22px;
}

.bullet-list li {
  color: rgb(251 252 255 / 0.92);
  font-size: 14px;
  line-height: 1.35;
}

.copy-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 22px;
}

.cta-primary,
.cta-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 154px;
  height: 54px;
  padding: 0 24px;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease;
}

.cta-primary {
  border: 1px solid rgb(255 255 255 / 0.26);
  background: rgb(255 255 255 / 0.06);
  color: #fff;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.12);
}

.cta-primary:hover,
.cta-secondary:hover {
  transform: translateY(-1px);
}

.cta-secondary {
  min-width: auto;
  padding: 0 6px;
  border: 0;
  background: transparent;
  color: var(--scene-secondary);
}

.visual-column {
  position: relative;
  min-height: 390px;
}

.visual-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform, opacity, filter;
  transition:
    transform 0.98s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.98s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.98s cubic-bezier(0.22, 1, 0.36, 1);
}

.visual-layer.is-active .planet-shell {
  animation: heroPlanetTakeover 0.98s cubic-bezier(0.22, 1, 0.36, 1);
}

.visual-layer.is-active .spacecraft {
  animation: craftSettle 0.98s cubic-bezier(0.22, 1, 0.36, 1);
}

.planet-shell {
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  transition:
    width 0.98s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.98s cubic-bezier(0.22, 1, 0.36, 1),
    right 0.98s cubic-bezier(0.22, 1, 0.36, 1),
    bottom 0.98s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.98s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.98s cubic-bezier(0.22, 1, 0.36, 1);
}

.planet-shell::before {
  content: "";
  position: absolute;
  inset: -4% -4% auto auto;
  width: 68%;
  height: 68%;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(255 255 255 / 0.58) 0%, rgb(255 255 255 / 0) 58%);
  filter: blur(12px);
  mix-blend-mode: screen;
  opacity: 0.72;
}

.planet-atmosphere,
.planet-rings,
.planet-cracks,
.planet-shadow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.planet-atmosphere {
  inset: -2%;
  border: 2px solid var(--planet-atmosphere);
  filter: blur(6px);
  opacity: 0.82;
}

.planet-rings {
  inset: 26% -8% auto -8%;
  height: 44%;
  border: 1px solid var(--planet-ring);
  border-left-color: transparent;
  border-right-color: transparent;
  transform: rotate(-16deg);
  opacity: 0.58;
}

.planet-cracks {
  background:
    radial-gradient(circle at 56% 58%, rgb(255 139 26 / 0.82) 0 1.1%, transparent 2.2%),
    radial-gradient(circle at 46% 64%, rgb(255 168 64 / 0.88) 0 1.2%, transparent 2.5%),
    radial-gradient(circle at 60% 70%, rgb(255 110 16 / 0.72) 0 0.95%, transparent 2.1%),
    radial-gradient(circle at 52% 74%, rgb(255 170 82 / 0.66) 0 1.1%, transparent 2.2%),
    radial-gradient(circle at 42% 56%, rgb(255 149 42 / 0.34) 0 0.8%, transparent 2.1%);
  mix-blend-mode: screen;
  opacity: 0.72;
}

.planet-shadow {
  background: linear-gradient(115deg, rgb(255 255 255 / 0) 10%, rgb(0 0 0 / 0.12) 42%, rgb(0 0 0 / 0.72) 100%);
}

.spacecraft {
  position: absolute;
  width: 284px;
  height: 156px;
  transform-origin: center;
  transition: top 0.98s cubic-bezier(0.22, 1, 0.36, 1), right 0.98s cubic-bezier(0.22, 1, 0.36, 1), transform 0.98s cubic-bezier(0.22, 1, 0.36, 1);
  filter: drop-shadow(0 26px 30px rgb(0 0 0 / 0.42));
}

.panel,
.core,
.arm,
.thruster {
  position: absolute;
  display: block;
}

.panel {
  top: 50%;
  width: 132px;
  height: 26px;
  margin-top: -13px;
  border: 1px solid rgb(206 197 170 / 0.28);
  border-radius: 6px;
  background:
    repeating-linear-gradient(90deg, rgb(13 13 18 / 0.98) 0 18px, rgb(41 42 56 / 0.95) 18px 20px),
    linear-gradient(180deg, rgb(69 63 64 / 0.4) 0%, rgb(15 15 16 / 0.96) 100%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.04), 0 0 16px rgb(0 0 0 / 0.24);
}

.panel.left {
  left: 0;
}

.panel.right {
  right: 0;
}

.core {
  left: 50%;
  top: 50%;
  width: 72px;
  height: 72px;
  margin-left: -36px;
  margin-top: -36px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 55% 55%, #162136 0%, #3b6ea1 20%, #f3c16d 22%, #a76f29 34%, #ded8c7 35%, #d9c28a 48%, #8c6f3f 68%, #f7df96 84%, #a77a2d 100%);
  box-shadow: inset -6px -10px 18px rgb(57 37 10 / 0.4), inset 5px 5px 12px rgb(255 243 205 / 0.48);
}

.core::before {
  content: "";
  position: absolute;
  inset: 14px;
  border-radius: 50%;
  border: 6px solid rgb(236 224 177 / 0.86);
}

.arm.top,
.arm.bottom {
  left: 50%;
  width: 12px;
  margin-left: -6px;
  border-radius: 999px;
  background: linear-gradient(180deg, #aaadb5 0%, #49505d 100%);
}

.arm.top {
  top: 14px;
  height: 32px;
}

.arm.bottom {
  bottom: 22px;
  height: 28px;
}

.thruster {
  left: 50%;
  bottom: 0;
  width: 18px;
  height: 44px;
  margin-left: -9px;
  border-radius: 999px 999px 18px 18px;
  background: linear-gradient(180deg, rgb(226 242 255 / 0.86) 0%, rgb(100 185 255 / 0.26) 35%, rgb(67 161 255 / 0) 100%);
  filter: blur(1px);
}

.orbit-rail {
  position: absolute;
  inset: auto 0 592px;
  z-index: 8;
  height: 244px;
  pointer-events: none;
}

.orbit-svg {
  display: none;
}

.orbit-svg path {
  fill: none;
  stroke: var(--scene-line);
  stroke-width: 1.4;
}

.orbit-controls {
  position: absolute;
  left: 50%;
  top: 74.1%;
  display: flex;
  align-items: center;
  gap: 18px;
  transform: translate(-50%, -50%);
  z-index: 18;
  pointer-events: auto;
}

.orbit-arrow,
.orbit-play {
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
}

.orbit-arrow {
  width: 34px;
  height: 34px;
  border: 0;
  background: transparent;
  color: rgb(255 255 255 / 0.88);
  font-size: 18px;
}

.orbit-play {
  width: 82px;
  height: 82px;
  position: relative;
  border: 1px solid rgb(255 255 255 / 0.4);
  background: rgb(255 255 255 / 0.05);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.12);
  font-size: 24px;
}

.orbit-progress {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.orbit-progress-track,
.orbit-progress-value {
  fill: none;
  stroke-width: 1.8;
}

.orbit-progress-track {
  stroke: rgb(255 255 255 / 0.14);
}

.orbit-progress-value {
  stroke: rgb(255 255 255 / 0.88);
  stroke-linecap: round;
  stroke-dasharray: 276.46;
  transition: stroke-dashoffset 0.12s linear;
}

.orbit-stop {
  position: absolute;
  width: 132px;
  height: 84px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%);
  transition:
    left 1.04s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    top 1.04s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    opacity 0.3s ease;
}

.orbit-label {
  position: absolute;
  left: 50%;
  bottom: 28px;
  color: rgb(255 255 255 / 0.84);
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  transform: translateX(-50%);
  transition: color 0.3s ease, bottom 0.3s ease, font-size 0.3s ease;
}

.orbit-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--scene-dot);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 6px transparent;
  transition: transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
}

.orbit-stop.is-active .orbit-label {
  bottom: 46px;
  color: #fff;
  font-size: 18px;
}

.orbit-stop.is-active .orbit-dot {
  background: var(--scene-dot-active);
  box-shadow: 0 0 0 10px rgb(255 255 255 / 0.08);
  transform: translate(-50%, -50%) scale(1.18);
}

.orbit-ghost {
  pointer-events: none;
  opacity: 0.72;
}

.scene-copy-enter-active,
.scene-copy-leave-active {
  transition: opacity 0.72s cubic-bezier(0.22, 1, 0.36, 1), transform 0.72s cubic-bezier(0.22, 1, 0.36, 1);
}

.scene-copy-enter-from,
.scene-copy-leave-to {
  opacity: 0;
  transform: translateY(22px);
}

@keyframes heroPlanetTakeover {
  0% {
    transform: scale(0.92);
    filter: blur(4px);
  }

  48% {
    transform: translateY(-1.4vh) scale(1.045);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes craftSettle {
  0% {
    opacity: 0.3;
    filter: blur(8px);
  }

  50% {
    opacity: 1;
    filter: blur(1px);
  }

  100% {
    opacity: 1;
    filter: none;
  }
}

@media (max-width: 1380px) {
  .space-nav {
    gap: 18px;
  }

  .space-stage {
    grid-template-columns: minmax(320px, 480px) 1fr;
  }
}

@media (max-width: 1120px) {
  .space-header {
    flex-wrap: wrap;
  }

  .space-nav {
    order: 3;
    width: 100%;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .space-stage {
    grid-template-columns: 1fr;
    padding-bottom: 248px;
  }

  .copy-column,
  .visual-column {
    min-height: 500px;
  }

  .visual-layer {
    opacity: 0 !important;
    filter: blur(0) !important;
    transform: translate3d(10vw, 0, 0) scale(0.98) !important;
  }

  .visual-layer.is-active {
    opacity: 1 !important;
    transform: translate3d(0, 0, 0) scale(1) !important;
  }

  .planet-shell {
    right: -10vw !important;
    bottom: -12vh !important;
    width: min(72vw, 560px) !important;
    height: min(72vw, 560px) !important;
  }

  .spacecraft {
    right: 18% !important;
    top: 8% !important;
    transform: rotate(-22deg) scale(0.82) !important;
  }
}

@media (max-width: 780px) {
  .space-header {
    padding: 18px;
  }

  .brand-name {
    font-size: 18px;
  }

  .header-tools {
    width: 100%;
    justify-content: space-between;
  }

  .back-link {
    flex: 1;
  }

  .space-stage {
    padding: 30px 18px 286px;
  }

  .copy-column,
  .visual-column {
    min-height: 500px;
  }

  .copy-inner h1 {
    font-size: clamp(48px, 16vw, 74px);
  }

  .summary,
  .bullet-list li {
    font-size: 16px;
  }

  .copy-actions {
    flex-wrap: wrap;
  }

  .cta-primary,
  .cta-secondary {
    width: 100%;
    min-width: 0;
  }

  .orbit-svg {
    display: none;
  }

  .orbit-label {
    font-size: 12px;
  }

  .orbit-stop.is-active .orbit-label {
    font-size: 14px;
  }

  .orbit-controls {
    top: 74%;
  }
}
</style>
