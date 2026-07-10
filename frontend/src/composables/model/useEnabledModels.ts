import { computed, ref, watch } from 'vue'
import { listEnabledModels } from '@/services/model/model-api'
import type { EnabledModelListItem } from '@/services/model/model-api'

interface UseEnabledModelsOptions {
  enabled?: () => boolean
  initialSelectedModelId?: string
}

export function useEnabledModels(options: UseEnabledModelsOptions = {}) {
  const enabledModels = ref<EnabledModelListItem[]>([])
  const isLoadingEnabledModels = ref(false)
  const enabledModelsError = ref('')
  const hasLoadedEnabledModels = ref(false)
  const selectedModelId = ref(options.initialSelectedModelId?.trim() || '')
  const shouldLoadEnabledModels = computed(() => options.enabled?.() ?? true)

  const selectedModel = computed(() => {
    const exactMatch = enabledModels.value.find(item => item.modelId === selectedModelId.value)
    if (exactMatch) return exactMatch
    return enabledModels.value.find(item => item.isDefault) || enabledModels.value[0] || null
  })

  const selectedModelDisplayName = computed(() => selectedModel.value?.displayName || '系统默认模型')

  const refreshEnabledModels = async () => {
    if (!shouldLoadEnabledModels.value) return

    isLoadingEnabledModels.value = true
    enabledModelsError.value = ''

    try {
      const models = await listEnabledModels()
      enabledModels.value = models
      hasLoadedEnabledModels.value = true

      if (!models.some(item => item.modelId === selectedModelId.value)) {
        selectedModelId.value = models.find(item => item.isDefault)?.modelId || models[0]?.modelId || ''
      }
    } catch (error) {
      enabledModels.value = []
      selectedModelId.value = ''
      enabledModelsError.value = error instanceof Error ? error.message : '获取启用模型列表失败'
    } finally {
      isLoadingEnabledModels.value = false
    }
  }

  const updateSelectedModelId = (modelId: string) => {
    selectedModelId.value = modelId.trim()
  }

  watch(shouldLoadEnabledModels, (enabled) => {
    if (!enabled || hasLoadedEnabledModels.value || isLoadingEnabledModels.value) return
    void refreshEnabledModels()
  }, {
    immediate: true
  })

  return {
    enabledModels,
    isLoadingEnabledModels,
    enabledModelsError,
    selectedModel,
    selectedModelDisplayName,
    selectedModelId,
    refreshEnabledModels,
    updateSelectedModelId
  }
}
