import { nextTick, ref } from 'vue'
import type { Ref } from 'vue'

interface UseMockInterviewSpaceScrollOptions {
  pageRef: Ref<HTMLElement | null>
  headerRef: Ref<HTMLElement | null>
  contentSectionRef: Ref<HTMLElement | null>
  contentPanelRef: Ref<HTMLElement | null>
  contentLeadRef: Ref<HTMLElement | null>
  pauseAutoplay: () => void
  pauseAutoplayFromContent: () => void
}

export function useMockInterviewSpaceScroll(options: UseMockInterviewSpaceScrollOptions) {
  let scrollDelayTimer: ReturnType<typeof setTimeout> | null = null
  let scrollAnimationFrame: number | null = null
  let scrollStateFrame: number | null = null
  let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null

  const isAutoScrolling = ref(false)
  const isUserScrolling = ref(false)
  const headerFade = ref(0)
  const contentRevealTarget = ref(0)
  const headerHeight = ref(112)

  const resolveContentRevealTarget = () => {
    const host = options.pageRef.value
    const target = options.contentLeadRef.value ?? options.contentPanelRef.value ?? options.contentSectionRef.value
    if (!host || !target) return 0

    const hostRect = host.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    return Math.max(host.scrollTop + (targetRect.top - hostRect.top), 0)
  }

  const resolveScrollTop = () => {
    return options.pageRef.value?.scrollTop ?? 0
  }

  const hasReachedContentZone = () => {
    const scrollTop = resolveScrollTop()
    return scrollTop >= Math.max(contentRevealTarget.value - 120, 0)
  }

  const hasReturnedToOrbitZone = () => {
    const scrollTop = resolveScrollTop()
    return scrollTop <= Math.max(contentRevealTarget.value - 40, 0)
  }

  const easeInOutCinematic = (t: number) => {
    return 1 - (1 - t) ** 4
  }

  const animateScrollTo = (top: number, duration: number) => {
    const host = options.pageRef.value
    if (!host) return

    if (scrollAnimationFrame !== null) {
      window.cancelAnimationFrame(scrollAnimationFrame)
      scrollAnimationFrame = null
    }

    const startTop = host.scrollTop
    const maxScrollTop = Math.max(host.scrollHeight - host.clientHeight, 0)
    const destination = Math.min(Math.max(top, 0), maxScrollTop)
    const distance = destination - startTop
    if (Math.abs(distance) < 2) {
      host.scrollTop = destination
      isAutoScrolling.value = false
      return
    }

    const startTime = performance.now()
    isAutoScrolling.value = true

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInOutCinematic(progress)
      host.scrollTop = startTop + distance * eased

      if (progress < 1) {
        scrollAnimationFrame = window.requestAnimationFrame(tick)
        return
      }

      host.scrollTop = destination
      scrollAnimationFrame = null
      isAutoScrolling.value = false
    }

    scrollAnimationFrame = window.requestAnimationFrame(tick)
  }

  const scrollToSceneContent = (delay = 120, duration = 980) => {
    if (scrollDelayTimer) {
      window.clearTimeout(scrollDelayTimer)
      scrollDelayTimer = null
    }

    scrollDelayTimer = window.setTimeout(() => {
      nextTick(() => {
        refreshScrollMetrics()
        animateScrollTo(contentRevealTarget.value, duration)
      })
      scrollDelayTimer = null
    }, delay)
  }

  const scrollToContentPreview = () => {
    options.pauseAutoplay()
    nextTick(() => {
      refreshScrollMetrics()
      if (contentRevealTarget.value <= resolveScrollTop()) return

      animateScrollTo(contentRevealTarget.value, 980)
    })
  }

  const handleWheelDuringAutoScroll = (event: WheelEvent) => {
    if (!isAutoScrolling.value) return
    event.preventDefault()
  }

  const syncScrollState = () => {
    const currentHeaderHeight = headerHeight.value
    if (!currentHeaderHeight) {
      headerFade.value = 0
      return
    }

    const scrollTop = resolveScrollTop()
    const start = currentHeaderHeight
    headerFade.value = scrollTop > start ? 1 : 0

    if (scrollTop >= Math.max(contentRevealTarget.value - 120, 0)) {
      options.pauseAutoplayFromContent()
    }
  }

  const refreshScrollMetrics = () => {
    headerHeight.value = options.headerRef.value?.offsetHeight ?? 112
    contentRevealTarget.value = resolveContentRevealTarget()
  }

  const updateHeaderFade = () => {
    if (scrollIdleTimer) {
      window.clearTimeout(scrollIdleTimer)
    }
    isUserScrolling.value = true
    scrollIdleTimer = window.setTimeout(() => {
      isUserScrolling.value = false
      scrollIdleTimer = null
    }, 140)

    if (scrollStateFrame !== null) return
    scrollStateFrame = window.requestAnimationFrame(() => {
      scrollStateFrame = null
      syncScrollState()
    })
  }

  const clearScrollTimers = () => {
    if (scrollDelayTimer) {
      window.clearTimeout(scrollDelayTimer)
      scrollDelayTimer = null
    }
    if (scrollAnimationFrame !== null) {
      window.cancelAnimationFrame(scrollAnimationFrame)
      scrollAnimationFrame = null
    }
    if (scrollStateFrame !== null) {
      window.cancelAnimationFrame(scrollStateFrame)
      scrollStateFrame = null
    }
    if (scrollIdleTimer) {
      window.clearTimeout(scrollIdleTimer)
      scrollIdleTimer = null
    }
  }

  return {
    contentRevealTarget,
    headerFade,
    isAutoScrolling,
    isUserScrolling,
    animateScrollTo,
    clearScrollTimers,
    handleWheelDuringAutoScroll,
    hasReachedContentZone,
    hasReturnedToOrbitZone,
    refreshScrollMetrics,
    scrollToContentPreview,
    scrollToSceneContent,
    updateHeaderFade
  }
}
