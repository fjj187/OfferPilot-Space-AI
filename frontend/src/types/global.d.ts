interface Window {
  $ModalMessage: import('naive-ui').MessageProviderInst
  $ModalNotification: import('naive-ui').NotificationProviderInst
  $ModalDialog: import('naive-ui').DialogProviderInst
  $ModalLoadingBar: import('naive-ui').LoadingBarProviderInst
  __routeMetrics?: {
    getSnapshot: () => {
      windowMs: number
      authProbeAttempts: number
      redirectDecisions: number
      notFoundHits: number
      routeTransitions: number
    }
    reset: () => void
  }
}
