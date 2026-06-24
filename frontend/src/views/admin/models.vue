<script setup lang="ts">
import type {
  AdminModelConnectivityTestResult,
  AdminModelListItem,
  AdminModelProvider
} from '@/services/admin/admin-api'
import {
  createAdminModel,
  listAdminModels,
  testAdminModel,
  updateAdminModel,
  updateAdminModelDefault,
  updateAdminModelStatus
} from '@/services/admin/admin-api'

type ModelStatusFilter = 'all' | 'enabled' | 'disabled'
type ModelProviderFilter = 'all' | AdminModelProvider

interface ModelFormState {
  displayName: string
  provider: AdminModelProvider
  baseUrl: string
  modelName: string
  apiKey: string
  enabled: boolean
  isDefault: boolean
  supportsStream: boolean
  enableThinking: boolean
}

const providerOptions: Array<{ value: AdminModelProvider, label: string }> = [
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'moonshot', label: 'Moonshot' },
  { value: 'qwen', label: 'Qwen' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'custom', label: 'Custom' }
]

const createDefaultForm = (): ModelFormState => ({
  displayName: '',
  provider: 'openai-compatible',
  baseUrl: '',
  modelName: '',
  apiKey: '',
  enabled: true,
  isDefault: false,
  supportsStream: true,
  enableThinking: false
})

const loading = ref(false)
const errorMessage = ref('')
const keyword = ref('')
const statusFilter = ref<ModelStatusFilter>('all')
const providerFilter = ref<ModelProviderFilter>('all')
const models = ref<AdminModelListItem[]>([])
const testingModelId = ref('')
const saving = ref(false)
const statusUpdatingModelId = ref('')
const defaultUpdatingModelId = ref('')
const latestTestResult = ref<Record<string, AdminModelConnectivityTestResult>>({})

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingModelId = ref('')
const formErrorMessage = ref('')
const modelForm = reactive<ModelFormState>(createDefaultForm())

const getProviderLabel = (provider: AdminModelProvider) => {
  return providerOptions.find(option => option.value === provider)?.label || provider
}

const filteredModels = computed(() => {
  const query = keyword.value.trim().toLowerCase()

  return models.value.filter((item) => {
    const matchesKeyword = !query || [
      item.modelId,
      item.displayName,
      item.provider,
      item.baseUrl,
      item.modelName,
      item.apiKeyPreview
    ].some(value => value?.toLowerCase().includes(query))

    const matchesStatus = statusFilter.value === 'all'
      || (statusFilter.value === 'enabled' ? item.enabled : !item.enabled)
    const matchesProvider = providerFilter.value === 'all' || item.provider === providerFilter.value

    return matchesKeyword && matchesStatus && matchesProvider
  })
})

const resetForm = () => {
  Object.assign(modelForm, createDefaultForm())
  formErrorMessage.value = ''
  editingModelId.value = ''
}

const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

const openCreateDialog = () => {
  dialogMode.value = 'create'
  dialogVisible.value = true
  resetForm()
}

const openEditDialog = (model: AdminModelListItem) => {
  dialogMode.value = 'edit'
  dialogVisible.value = true
  editingModelId.value = model.modelId
  formErrorMessage.value = ''
  Object.assign(modelForm, {
    displayName: model.displayName,
    provider: model.provider,
    baseUrl: model.baseUrl,
    modelName: model.modelName,
    apiKey: '',
    enabled: model.enabled,
    isDefault: model.isDefault,
    supportsStream: model.supportsStream,
    enableThinking: model.enableThinking
  })
}

const loadModels = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    models.value = await listAdminModels()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '模型列表加载失败'
  }
  finally {
    loading.value = false
  }
}

const saveModel = async () => {
  formErrorMessage.value = ''
  saving.value = true

  try {
    const payload = {
      ...modelForm,
      displayName: modelForm.displayName.trim(),
      baseUrl: modelForm.baseUrl.trim(),
      modelName: modelForm.modelName.trim(),
      apiKey: modelForm.apiKey.trim()
    }

    if (dialogMode.value === 'create') {
      await createAdminModel(payload)
    }
    else if (editingModelId.value) {
      await updateAdminModel(editingModelId.value, payload)
    }

    await loadModels()
    closeDialog()
  }
  catch (error) {
    formErrorMessage.value = error instanceof Error ? error.message : '模型保存失败'
  }
  finally {
    saving.value = false
  }
}

const toggleModelStatus = async (model: AdminModelListItem) => {
  statusUpdatingModelId.value = model.modelId
  errorMessage.value = ''

  try {
    await updateAdminModelStatus(model.modelId, !model.enabled)
    await loadModels()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '模型状态更新失败'
  }
  finally {
    statusUpdatingModelId.value = ''
  }
}

const markDefaultModel = async (model: AdminModelListItem) => {
  defaultUpdatingModelId.value = model.modelId
  errorMessage.value = ''

  try {
    await updateAdminModelDefault(model.modelId)
    await loadModels()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '默认模型设置失败'
  }
  finally {
    defaultUpdatingModelId.value = ''
  }
}

const runModelTest = async (model: AdminModelListItem) => {
  testingModelId.value = model.modelId
  errorMessage.value = ''

  try {
    latestTestResult.value = {
      ...latestTestResult.value,
      [model.modelId]: await testAdminModel(model.modelId)
    }
    await loadModels()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '模型连通测试失败'
  }
  finally {
    testingModelId.value = ''
  }
}

const getResolvedTestMessage = (model: AdminModelListItem) => {
  const runtimeResult = latestTestResult.value[model.modelId]
  if (runtimeResult) {
    return `${ runtimeResult.ok ? '最近测试成功' : '最近测试失败' } · ${ runtimeResult.latencyMs }ms`
  }

  if (model.lastTestedAt) {
    return `${ model.lastTestStatus === 'success' ? '最近测试成功' : '最近测试失败' } · ${ model.lastTestedAt }`
  }

  return '尚未执行连通测试'
}

onMounted(() => {
  void loadModels()
})
</script>

<template>
  <section class="admin-table-page admin-model-page">
    <div class="page-title">
      <div>
        <p>Models</p>
        <h1>模型管理</h1>
      </div>
      <div class="page-actions">
        <button
          type="button"
          :disabled="loading"
          @click="loadModels"
        >
          {{ loading ? '加载中...' : '刷新列表' }}
        </button>
        <button
          type="button"
          class="primary-button"
          @click="openCreateDialog"
        >
          新增模型
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索模型名称、供应商、地址或模型标识"
        type="search"
      >

      <select
        v-model="statusFilter"
        class="filter-select"
      >
        <option value="all">
          全部状态
        </option>
        <option value="enabled">
          已启用
        </option>
        <option value="disabled">
          已停用
        </option>
      </select>

      <select
        v-model="providerFilter"
        class="filter-select"
      >
        <option value="all">
          全部供应商
        </option>
        <option
          v-for="provider in providerOptions"
          :key="provider.value"
          :value="provider.value"
        >
          {{ provider.label }}
        </option>
      </select>
    </div>

    <p
      v-if="errorMessage"
      class="error-banner"
    >
      {{ errorMessage }}
    </p>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>模型</th>
            <th>供应商</th>
            <th>连接配置</th>
            <th>能力</th>
            <th>状态</th>
            <th>最近测试</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredModels"
            :key="item.modelId"
          >
            <td>
              <strong>{{ item.displayName }}</strong>
              <span>{{ item.modelId }}</span>
            </td>
            <td>{{ getProviderLabel(item.provider) }}</td>
            <td>
              <strong>{{ item.modelName }}</strong>
              <span>{{ item.baseUrl }}</span>
              <span>{{ item.apiKeyPreview || '未配置密钥' }}</span>
            </td>
            <td>
              <span>{{ item.supportsStream ? '支持流式' : '非流式' }}</span>
              <span>{{ item.enableThinking ? '已开思考' : '关闭思考' }}</span>
            </td>
            <td>
              <div class="status-stack">
                <span
                  class="status-badge"
                  :class="item.enabled ? 'is-completed' : 'is-aborted'"
                >
                  {{ item.enabled ? '已启用' : '已停用' }}
                </span>
                <span
                  v-if="item.isDefault"
                  class="status-badge is-generated"
                >
                  默认模型
                </span>
              </div>
            </td>
            <td>
              <strong>{{ getResolvedTestMessage(item) }}</strong>
              <span>{{ item.lastTestMessage || '可在保存后执行连通测试' }}</span>
            </td>
            <td class="action-cell action-column">
              <button
                type="button"
                class="inline-button"
                @click="openEditDialog(item)"
              >
                编辑
              </button>
              <button
                type="button"
                class="inline-button"
                :disabled="statusUpdatingModelId === item.modelId"
                @click="toggleModelStatus(item)"
              >
                {{
                  statusUpdatingModelId === item.modelId
                    ? '处理中...'
                    : item.enabled
                      ? '停用'
                      : '启用'
                }}
              </button>
              <button
                type="button"
                class="inline-button"
                :disabled="defaultUpdatingModelId === item.modelId || item.isDefault || !item.enabled"
                @click="markDefaultModel(item)"
              >
                {{
                  defaultUpdatingModelId === item.modelId
                    ? '设置中...'
                    : item.isDefault
                      ? '默认中'
                      : '设为默认'
                }}
              </button>
              <button
                type="button"
                class="inline-button"
                :disabled="testingModelId === item.modelId"
                @click="runModelTest(item)"
              >
                {{ testingModelId === item.modelId ? '测试中...' : '连通测试' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p
        v-if="!filteredModels.length && !loading"
        class="empty-text"
      >
        暂无匹配模型
      </p>
    </div>

    <div
      v-if="dialogVisible"
      class="dialog-mask"
      @click.self="closeDialog"
    >
      <section class="dialog-card">
        <div class="dialog-header">
          <div>
            <p>{{ dialogMode === 'create' ? 'Create Model' : 'Edit Model' }}</p>
            <h2>{{ dialogMode === 'create' ? '新增模型配置' : '编辑模型配置' }}</h2>
          </div>
          <button
            type="button"
            class="ghost-button"
            @click="closeDialog"
          >
            关闭
          </button>
        </div>

        <p
          v-if="formErrorMessage"
          class="error-banner"
        >
          {{ formErrorMessage }}
        </p>

        <div class="form-grid">
          <label class="field-block">
            <span>展示名称</span>
            <input
              v-model="modelForm.displayName"
              class="field-input"
              type="text"
              placeholder="例如：DeepSeek 面试主模型"
            >
          </label>

          <label class="field-block">
            <span>供应商</span>
            <select
              v-model="modelForm.provider"
              class="field-input field-select"
            >
              <option
                v-for="provider in providerOptions"
                :key="provider.value"
                :value="provider.value"
              >
                {{ provider.label }}
              </option>
            </select>
          </label>

          <label class="field-block field-span-2">
            <span>接口地址</span>
            <input
              v-model="modelForm.baseUrl"
              class="field-input"
              type="url"
              placeholder="https://api.example.com/v1"
            >
          </label>

          <label class="field-block">
            <span>模型标识</span>
            <input
              v-model="modelForm.modelName"
              class="field-input"
              type="text"
              placeholder="gpt-4o-mini / deepseek-chat"
            >
          </label>

          <label class="field-block">
            <span>{{ dialogMode === 'create' ? '接口密钥' : '更新密钥' }}</span>
            <input
              v-model="modelForm.apiKey"
              class="field-input"
              type="password"
              :placeholder="dialogMode === 'create' ? '请输入接口密钥' : '留空表示不修改密钥'"
            >
          </label>
        </div>

        <div class="toggle-grid">
          <label class="toggle-item">
            <input
              v-model="modelForm.enabled"
              type="checkbox"
            >
            <span>启用模型</span>
          </label>

          <label class="toggle-item">
            <input
              v-model="modelForm.isDefault"
              type="checkbox"
            >
            <span>设为默认模型</span>
          </label>

          <label class="toggle-item">
            <input
              v-model="modelForm.supportsStream"
              type="checkbox"
            >
            <span>支持流式输出</span>
          </label>

          <label class="toggle-item">
            <input
              v-model="modelForm.enableThinking"
              type="checkbox"
            >
            <span>启用思考模式</span>
          </label>
        </div>

        <div class="dialog-actions">
          <button
            type="button"
            class="ghost-button"
            @click="closeDialog"
          >
            取消
          </button>
          <button
            type="button"
            class="primary-button"
            :disabled="saving"
            @click="saveModel"
          >
            {{ saving ? '保存中...' : dialogMode === 'create' ? '创建模型' : '保存修改' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "./shared-admin-table";

.admin-model-page {
  .page-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .primary-button {
    min-height: 50px;
    padding: 0 18px;
    border: 1px solid rgb(103 232 249 / 0.22);
    border-radius: 999px;
    background: linear-gradient(135deg, rgb(16 185 129 / 0.28), rgb(59 130 246 / 0.24));
    color: #eff6ff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 14px 30px rgb(2 6 23 / 0.22);
  }

  .action-column {
    display: grid;
    gap: 10px;
  }

  .status-stack {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dialog-mask {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgb(2 6 23 / 0.62);
    backdrop-filter: blur(10px);
  }

  .dialog-card {
    width: min(860px, 100%);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding: 28px;
    border: 1px solid rgb(129 212 250 / 0.12);
    border-radius: 30px;
    background: linear-gradient(180deg, rgb(8 22 40 / 0.96), rgb(5 16 31 / 0.92));
    box-shadow: 0 30px 80px rgb(2 6 23 / 0.45);
  }

  .dialog-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;

    p {
      margin: 0 0 4px;
      color: rgb(103 232 249 / 0.88);
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      color: #f8fbff;
      font-size: 28px;
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .field-block {
    display: flex;
    flex-direction: column;
    gap: 10px;

    span {
      color: rgb(191 219 254 / 0.78);
      font-size: 14px;
      font-weight: 700;
    }
  }

  .field-span-2 {
    grid-column: span 2;
  }

  .field-input {
    min-height: 50px;
    padding: 0 16px;
    border: 1px solid rgb(129 212 250 / 0.14);
    border-radius: 18px;
    outline: none;
    background: rgb(7 20 39 / 0.68);
    color: #f8fbff;
    font-size: 15px;
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
  }

  .field-select {
    appearance: none;
  }

  .toggle-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 20px;
  }

  .toggle-item {
    display: flex;
    gap: 12px;
    align-items: center;
    min-height: 54px;
    padding: 0 16px;
    border: 1px solid rgb(129 212 250 / 0.1);
    border-radius: 20px;
    background: rgb(255 255 255 / 0.04);
    color: #eff6ff;
    font-size: 15px;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
}

@media (max-width: 920px) {
  .admin-model-page {
    .form-grid,
    .toggle-grid {
      grid-template-columns: 1fr;
    }

    .field-span-2 {
      grid-column: span 1;
    }

    .dialog-header,
    .dialog-actions {
      flex-direction: column;
    }
  }
}
</style>
