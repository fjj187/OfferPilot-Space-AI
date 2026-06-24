import { computed, onMounted, ref } from 'vue'
import { listEnabledModels } from '@/services/model/model-api'
import type { EnabledModelListItem } from '@/services/model/model-api'

interface UseEnabledModelsOptions {
  initialSelectedModelId?: string
}

export function useEnabledModels(options: UseEnabledModelsOptions = {}) {
  const enabledModels = ref<EnabledModelListItem[]>([])
  const isLoadingEnabledModels = ref(false)
  const enabledModelsError = ref('')
  const selectedModelId = ref(options.initialSelectedModelId?.trim() || '')

  const selectedModel = computed(() => {
    const exactMatch = enabledModels.value.find(item => item.modelId === selectedModelId.value)
    if (exactMatch) return exactMatch
    return enabledModels.value.find(item => item.isDefault) || enabledModels.value[0] || null
  })

  const selectedModelDisplayName = computed(() => selectedModel.value?.displayName || '系统默认模型')

  const refreshEnabledModels = async () => {
    isLoadingEnabledModels.value = true
    enabledModelsError.value = ''

    try {
      const models = await listEnabledModels()
      enabledModels.value = models

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

  onMounted(() => {
    void refreshEnabledModels()
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
