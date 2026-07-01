import { computed, ref } from 'vue'
import type { CSSProperties, ComputedRef } from 'vue'
import type { SceneItem } from '@/constants/showcase/mockInterviewSpaceScenes'

export type OrbitNavOptions = {
  scrollToContent?: boolean
  pauseAutoplay?: boolean
  suppressSceneActivation?: boolean
  fastOrbit?: boolean
}

interface OrbitGhostItem {
  label: string
  style: CSSProperties
}

interface UseMockInterviewSpaceOrbitOptions {
  scenes: SceneItem[]
  initialActiveIndex?: number
  centerSlot: number
  transitionMs: number
  orbitSlots: ComputedRef<Array<{
    left: number
    top: number
    visible: boolean
  }>>
  offscreenOrbitLeft: {
    left: number
    top: number
  }
  offscreenOrbitRight: {
    left: number
    top: number
  }
  orbitMotionTransition: string
  scrollToSceneContent: (delay?: number, duration?: number) => void
}

export function useMockInterviewSpaceOrbit(options: UseMockInterviewSpaceOrbitOptions) {
  const resolveInitialOrbitOrder = () => {
    const sceneCount = options.scenes.length
    const initialIndex = options.initialActiveIndex ?? 0
    return Array.from({
      length: sceneCount
    }, (_, orderIndex) => {
      const offset = orderIndex - options.centerSlot
      return (initialIndex + offset + sceneCount) % sceneCount
    })
  }

  const orbitOrder = ref(resolveInitialOrbitOrder())
  const activeIndex = ref(orbitOrder.value[options.centerSlot])
  const displayIndex = ref(orbitOrder.value[options.centerSlot])
  const copySceneIndex = ref(orbitOrder.value[options.centerSlot])
  const orbitProgress = ref(0)
  const autoplay = ref(true)
  const autoplayPausedByContent = ref(false)
  const isOrbitPlayBursting = ref(false)
  const isOrbitTransitioning = ref(false)
  const isPanelTransitioning = ref(false)
  const isFastOrbitTransition = ref(false)
  const pendingTargetIndex = ref<number | null>(null)
  const orbitOverrides = ref<Record<number, CSSProperties>>({})
  const orbitGhosts = ref<OrbitGhostItem[]>([])
  const lastOrbitDirection = ref<1 | -1>(1)
  const isCopyVisible = ref(true)

  let progressTimer: ReturnType<typeof setInterval> | null = null
  let orbitPlayBurstTimer: ReturnType<typeof setTimeout> | null = null
  let orbitSettleTimer: ReturnType<typeof setTimeout> | null = null
  let copyRevealTimer: ReturnType<typeof setTimeout> | null = null

  const activeScene = computed(() => options.scenes[activeIndex.value])
  const displayScene = computed(() => options.scenes[displayIndex.value])
  const copyScene = computed(() => options.scenes[copySceneIndex.value])
  const activeSceneIndexBySlot = computed(() => orbitOrder.value[options.centerSlot])
  const orderedSceneIndexes = computed(() => orbitOrder.value)

  const clearAutoplay = () => {
    if (progressTimer) {
      window.clearInterval(progressTimer)
      progressTimer = null
    }
  }

  const pauseAutoplay = () => {
    autoplay.value = false
    orbitProgress.value = 0
    clearAutoplay()
  }

  const pauseAutoplayFromContent = () => {
    if (!autoplay.value) return
    autoplayPausedByContent.value = true
    pauseAutoplay()
  }

  const hideSceneCopy = () => {
    if (!isCopyVisible.value) return
    isCopyVisible.value = false
    if (copyRevealTimer) {
      window.clearTimeout(copyRevealTimer)
      copyRevealTimer = null
    }
  }

  const revealSceneCopy = (index: number) => {
    copySceneIndex.value = index
    if (copyRevealTimer) {
      window.clearTimeout(copyRevealTimer)
    }
    copyRevealTimer = window.setTimeout(() => {
      isCopyVisible.value = true
      copyRevealTimer = null
    }, 20)
  }

  const startPanelTransition = (index: number) => {
    isPanelTransitioning.value = true
    displayIndex.value = index
    revealSceneCopy(index)
    window.setTimeout(() => {
      isPanelTransitioning.value = false
    }, options.transitionMs)
  }

  const resolveOrbitTop = (slotIndex: number, top: number) => {
    if (slotIndex === 0 || slotIndex === options.orbitSlots.value.length - 1) {
      return `calc(${ top }% + 10px)`
    }
    return `${ top }%`
  }

  const setActiveByCenterSlot = (orbitOptions?: OrbitNavOptions) => {
    const nextIndex = orbitOrder.value[options.centerSlot]
    if (orbitOptions?.suppressSceneActivation) {
      return
    }
    activeIndex.value = nextIndex
    startPanelTransition(nextIndex)
  }

  const resolveOrbitTravel = (center: number, index: number) => {
    const forward = (index - center + options.scenes.length) % options.scenes.length
    const backward = (center - index + options.scenes.length) % options.scenes.length
    return {
      forward,
      backward,
      direction: (forward <= backward ? 1 : -1) as 1 | -1
    }
  }

  const shiftOrbitOrder = (order: number[], direction: 1 | -1, steps = 1) => {
    let nextOrder = [...order]
    for (let count = 0; count < steps; count += 1) {
      nextOrder = direction === 1
        ? [...nextOrder.slice(1), nextOrder[0]]
        : [nextOrder[nextOrder.length - 1], ...nextOrder.slice(0, nextOrder.length - 1)]
    }
    return nextOrder
  }

  const applySceneChange = (index: number, orbitOptions?: OrbitNavOptions) => {
    if (orbitOptions?.pauseAutoplay) {
      pauseAutoplay()
    }
    activeIndex.value = index
    orbitProgress.value = 0
    startPanelTransition(index)
    if (orbitOptions?.scrollToContent) {
      options.scrollToSceneContent()
    }
    if (autoplay.value) {
      startAutoplay()
    }
  }

  const triggerOrbitPlayBurst = () => {
    if (orbitPlayBurstTimer) {
      window.clearTimeout(orbitPlayBurstTimer)
      orbitPlayBurstTimer = null
    }
    isOrbitPlayBursting.value = false
    requestAnimationFrame(() => {
      isOrbitPlayBursting.value = true
      orbitPlayBurstTimer = window.setTimeout(() => {
        isOrbitPlayBursting.value = false
        orbitPlayBurstTimer = null
      }, 720)
    })
  }

  const resumeAutoplayFromOrbitControl = (burst = false) => {
    autoplayPausedByContent.value = false
    autoplay.value = true
    orbitProgress.value = 0
    if (burst) {
      triggerOrbitPlayBurst()
    }
  }

  const stepOrbit = (direction: 1 | -1, orbitOptions?: OrbitNavOptions) => {
    if (isOrbitTransitioning.value) return
    isOrbitTransitioning.value = true
    isFastOrbitTransition.value = Boolean(orbitOptions?.fastOrbit)
    orbitProgress.value = 0
    if (orbitOptions?.pauseAutoplay) {
      pauseAutoplay()
    } else {
      clearAutoplay()
    }
    if (orbitSettleTimer) {
      window.clearTimeout(orbitSettleTimer)
      orbitSettleTimer = null
    }
    orbitGhosts.value = []
    orbitOverrides.value = {}
    lastOrbitDirection.value = direction

    const currentOrder = [...orbitOrder.value]
    const exitingScene = direction === 1 ? currentOrder[0] : currentOrder[currentOrder.length - 1]
    const ghostStart = direction === 1 ? options.orbitSlots.value[0] : options.orbitSlots.value[options.orbitSlots.value.length - 1]
    const ghostEnd = direction === 1 ? options.offscreenOrbitLeft : options.offscreenOrbitRight
    const reenterStart = direction === 1 ? options.offscreenOrbitRight : options.offscreenOrbitLeft
    const reenterEnd = direction === 1 ? options.orbitSlots.value[options.orbitSlots.value.length - 1] : options.orbitSlots.value[0]
    const ghostStartSlotIndex = direction === 1 ? 0 : options.orbitSlots.value.length - 1
    const reenterEndSlotIndex = direction === 1 ? options.orbitSlots.value.length - 1 : 0
    const newOrder = shiftOrbitOrder(currentOrder, direction)

    orbitGhosts.value = [{
      label: options.scenes[exitingScene].navLabel,
      style: {
        left: `${ ghostStart.left }%`,
        top: resolveOrbitTop(ghostStartSlotIndex, ghostStart.top),
        opacity: '0.72',
        transition: 'none'
      }
    }]

    orbitOrder.value = newOrder
    orbitOverrides.value = {
      [exitingScene]: {
        left: `${ reenterStart.left }%`,
        top: `${ reenterStart.top }%`,
        opacity: '0',
        pointerEvents: 'none',
        transition: 'none'
      }
    }

    setActiveByCenterSlot(orbitOptions)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const motionTransition = orbitOptions?.fastOrbit
          ? 'left 0.36s cubic-bezier(0.2, 0.9, 0.24, 1.02), top 0.36s cubic-bezier(0.2, 0.9, 0.24, 1.02), opacity 0.22s ease'
          : options.orbitMotionTransition
        orbitOverrides.value = {
          [exitingScene]: {
            left: `${ reenterEnd?.left ?? 50 }%`,
            top: resolveOrbitTop(reenterEndSlotIndex, reenterEnd?.top ?? 82),
            opacity: '1',
            transition: motionTransition
          }
        }
        if (orbitGhosts.value.length) {
          orbitGhosts.value = orbitGhosts.value.map(ghost => ({
            ...ghost,
            style: {
              left: `${ ghostEnd.left }%`,
              top: `${ ghostEnd.top }%`,
              opacity: '0',
              transition: motionTransition
            }
          }))
        }
      })
    })

    orbitSettleTimer = window.setTimeout(() => {
      orbitOverrides.value = {}
      orbitGhosts.value = []
      orbitSettleTimer = null

      if (pendingTargetIndex.value !== null) {
        const target = pendingTargetIndex.value
        const { forward, backward, direction: nextDirection } = resolveOrbitTravel(orbitOrder.value[options.centerSlot], target)
        if (forward === 0 && backward === 0) {
          isOrbitTransitioning.value = false
          isFastOrbitTransition.value = false
          pendingTargetIndex.value = null
          applySceneChange(target, {
            ...orbitOptions,
            suppressSceneActivation: false
          })
          if (autoplay.value) {
            startAutoplay()
          }
          return
        }
        if (forward > 1 || backward > 1) {
          isOrbitTransitioning.value = false
          stepOrbit(nextDirection, {
            ...orbitOptions,
            suppressSceneActivation: true,
            fastOrbit: true
          })
          return
        }
        isOrbitTransitioning.value = false
        pendingTargetIndex.value = null
        stepOrbit(nextDirection, {
          ...orbitOptions,
          suppressSceneActivation: false,
          fastOrbit: true
        })
        return
      }

      isOrbitTransitioning.value = false
      isFastOrbitTransition.value = false
      if (autoplay.value) {
        startAutoplay()
      }
    }, orbitOptions?.fastOrbit ? 380 : options.transitionMs + 80)
  }

  const navigateToScene = (index: number, orbitOptions?: OrbitNavOptions) => {
    if (index === activeSceneIndexBySlot.value) {
      pendingTargetIndex.value = null
      applySceneChange(index, orbitOptions)
      return
    }
    hideSceneCopy()
    if (isOrbitTransitioning.value) {
      pendingTargetIndex.value = index
      return
    }

    const center = activeSceneIndexBySlot.value
    const { forward, backward, direction } = resolveOrbitTravel(center, index)
    if (forward > 1 || backward > 1) {
      pendingTargetIndex.value = index
      stepOrbit(direction, {
        ...orbitOptions,
        suppressSceneActivation: true,
        fastOrbit: true
      })
      return
    }
    pendingTargetIndex.value = null
    stepOrbit(direction, orbitOptions)
  }

  const requestSceneChange = (index: number, orbitOptions?: OrbitNavOptions) => {
    if (index === activeSceneIndexBySlot.value && index === displayIndex.value && !isPanelTransitioning.value && !isOrbitTransitioning.value) {
      if (orbitOptions?.pauseAutoplay) {
        pauseAutoplay()
      }
      if (orbitOptions?.scrollToContent) {
        options.scrollToSceneContent(0)
      }
      return
    }
    navigateToScene(index, orbitOptions)
  }

  const startAutoplay = () => {
    clearAutoplay()
    if (!autoplay.value) return
    progressTimer = window.setInterval(() => {
      orbitProgress.value += 0.02
      if (orbitProgress.value >= 1) {
        orbitProgress.value = 0
        requestSceneChange((activeIndex.value + 1) % options.scenes.length)
      }
    }, 120)
  }

  const goToNext = () => {
    resumeAutoplayFromOrbitControl()
    pendingTargetIndex.value = null
    hideSceneCopy()
    stepOrbit(-1)
  }

  const goToPrev = () => {
    resumeAutoplayFromOrbitControl()
    pendingTargetIndex.value = null
    hideSceneCopy()
    stepOrbit(1)
  }

  const handleOrbitStopClick = (index: number) => {
    resumeAutoplayFromOrbitControl()
    navigateToScene(index)
  }

  const toggleAutoplay = () => {
    if (autoplay.value) {
      autoplayPausedByContent.value = false
      autoplay.value = false
      clearAutoplay()
      return
    }

    resumeAutoplayFromOrbitControl(true)
    startAutoplay()
  }

  const orbitClass = (index: number) => ({
    'is-active': !isFastOrbitTransition.value && index === activeIndex.value,
    'is-center-node': index === activeSceneIndexBySlot.value
  })

  const orbitStopStyle = (index: number): CSSProperties => {
    const override = orbitOverrides.value[index]
    if (override) {
      const slotIndex = orbitOrder.value.indexOf(index)
      return {
        ...override,
        zIndex: String(slotIndex >= options.centerSlot ? 12 - slotIndex : 6 - slotIndex)
      }
    }
    const slotIndex = orbitOrder.value.indexOf(index)
    const slot = options.orbitSlots.value[slotIndex]
    if (!slot) {
      return {
        left: '50%',
        top: '82%',
        opacity: '0'
      }
    }
    return {
      left: `${ slot.left }%`,
      top: resolveOrbitTop(slotIndex, slot.top),
      opacity: slot.visible ? '1' : '0',
      zIndex: String(slotIndex >= options.centerSlot ? 12 - slotIndex : 6 - slotIndex)
    }
  }

  const clearOrbitTimers = () => {
    clearAutoplay()
    if (orbitPlayBurstTimer) {
      window.clearTimeout(orbitPlayBurstTimer)
      orbitPlayBurstTimer = null
    }
    if (orbitSettleTimer) {
      window.clearTimeout(orbitSettleTimer)
      orbitSettleTimer = null
    }
    if (copyRevealTimer) {
      window.clearTimeout(copyRevealTimer)
      copyRevealTimer = null
    }
    orbitGhosts.value = []
    orbitOverrides.value = {}
  }

  /** 无轨道动画地切到指定场景，用于登出/登录门控前后统一回到总览态 */
  const snapToScene = (index: number) => {
    clearOrbitTimers()
    autoplayPausedByContent.value = false
    pauseAutoplay()
    pendingTargetIndex.value = null
    isOrbitTransitioning.value = false
    isFastOrbitTransition.value = false
    isPanelTransitioning.value = false
    isOrbitPlayBursting.value = false
    orbitProgress.value = 0

    const sceneCount = options.scenes.length
    orbitOrder.value = Array.from({
      length: sceneCount
    }, (_, orderIndex) => {
      const offset = orderIndex - options.centerSlot
      return (index + offset + sceneCount) % sceneCount
    })
    activeIndex.value = index
    displayIndex.value = index
    copySceneIndex.value = index
    isCopyVisible.value = true
  }

  return {
    activeIndex,
    activeScene,
    activeSceneIndexBySlot,
    autoplay,
    autoplayPausedByContent,
    clearAutoplay,
    clearOrbitTimers,
    copyScene,
    displayIndex,
    displayScene,
    goToNext,
    goToPrev,
    handleOrbitStopClick,
    isCopyVisible,
    isFastOrbitTransition,
    isOrbitPlayBursting,
    isOrbitTransitioning,
    isPanelTransitioning,
    lastOrbitDirection,
    orbitClass,
    orbitGhosts,
    orbitOrder,
    orbitProgress,
    orbitStopStyle,
    orderedSceneIndexes,
    pauseAutoplay,
    pauseAutoplayFromContent,
    requestSceneChange,
    snapToScene,
    startAutoplay,
    toggleAutoplay
  }
}
