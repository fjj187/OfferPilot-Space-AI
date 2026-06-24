import { getStoredInterviewReports } from '../storage/interview-report-store.js'
import { getStoredInterviewSessions } from '../storage/interview-session-store.js'
import {
  createApiKeyPreview,
  createModelId,
  decodeApiKey,
  getStoredModelConfig,
  getStoredModelConfigs,
  updateStoredModelConfigs,
  upsertStoredModelConfig
} from '../storage/model-config-store.js'
import type {
  AdminModelConfigDTO,
  CreateModelConfigPayload,
  ModelConnectivityTestResult,
  StoredModelConfig,
  UpdateModelConfigPayload
} from '../types/model-config.js'

type StoredSession = ReturnType<typeof getStoredInterviewSessions>[number]
type StoredReport = ReturnType<typeof getStoredInterviewReports>[number]

const isToday = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.toDateString() === new Date().toDateString()
}

const buildRecentTrend = (values: string[]) => {
  const today = new Date()

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(today)
    current.setDate(today.getDate() - (6 - index))
    const label = `${ current.getMonth() + 1 }-${ current.getDate() }`
    const count = values.filter((value) => {
      const date = new Date(value)
      return !Number.isNaN(date.getTime()) && date.toDateString() === current.toDateString()
    }).length

    return {
      label,
      count
    }
  })
}

const deriveSessionStatus = (session: StoredSession) => {
  if (session.messages.length <= 0) return 'aborted' as const
  if ([...session.messages].reverse().find(item => item.role === 'assistant')?.content?.trim()) return 'completed' as const
  if ([...session.messages].reverse().find(item => item.role === 'user')?.content?.trim()) return 'in_progress' as const
  return 'aborted' as const
}

const deriveReportScore = (report: StoredReport) => {
  if (!report.totalCount) return 0
  return Math.round((report.answeredCount / report.totalCount) * 100)
}

const deriveReportGenerateStatus = (report: StoredReport) => {
  return report.summaryHeadline?.trim() || report.summaryBody?.trim()
    ? 'generated' as const
    : 'incomplete' as const
}

const normalizeTextField = (value: unknown) => String(value || '').trim()

const normalizeBooleanField = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value
  return fallback
}

const toAdminModelConfig = (model: StoredModelConfig): AdminModelConfigDTO => ({
  modelId: model.modelId,
  displayName: model.displayName,
  provider: model.provider,
  baseUrl: model.baseUrl,
  modelName: model.modelName,
  apiKeyPreview: model.apiKeyPreview,
  enabled: model.enabled,
  isDefault: model.isDefault,
  supportsStream: model.supportsStream,
  enableThinking: model.enableThinking,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
  lastTestedAt: model.lastTestedAt,
  lastTestStatus: model.lastTestStatus,
  lastTestMessage: model.lastTestMessage
})

const findNextDefaultModelId = (models: StoredModelConfig[], excludedModelId?: string) => {
  return models.find(model => model.modelId !== excludedModelId && model.enabled)?.modelId || null
}

const buildModelRecord = (
  payload: CreateModelConfigPayload | UpdateModelConfigPayload,
  currentModel?: StoredModelConfig
): StoredModelConfig => {
  const now = new Date().toISOString()
  const normalizedApiKey = normalizeTextField(payload.apiKey)

  return {
    modelId: currentModel?.modelId || createModelId(),
    displayName: normalizeTextField(payload.displayName),
    provider: payload.provider || currentModel?.provider || 'openai-compatible',
    baseUrl: normalizeTextField(payload.baseUrl),
    modelName: normalizeTextField(payload.modelName),
    encryptedApiKey: normalizedApiKey
      ? Buffer.from(normalizedApiKey, 'utf8').toString('base64')
      : currentModel?.encryptedApiKey,
    apiKeyPreview: normalizedApiKey
      ? createApiKeyPreview(normalizedApiKey)
      : currentModel?.apiKeyPreview,
    enabled: normalizeBooleanField(payload.enabled, currentModel?.enabled ?? true),
    isDefault: normalizeBooleanField(payload.isDefault, currentModel?.isDefault ?? false),
    supportsStream: normalizeBooleanField(payload.supportsStream, currentModel?.supportsStream ?? true),
    enableThinking: normalizeBooleanField(payload.enableThinking, currentModel?.enableThinking ?? false),
    createdAt: currentModel?.createdAt || now,
    updatedAt: now,
    lastTestedAt: currentModel?.lastTestedAt,
    lastTestStatus: currentModel?.lastTestStatus,
    lastTestMessage: currentModel?.lastTestMessage
  }
}

const assertValidModelPayload = (payload: CreateModelConfigPayload | UpdateModelConfigPayload) => {
  if (!normalizeTextField(payload.displayName)) {
    throw new Error('模型名称不能为空')
  }

  if (!normalizeTextField(payload.baseUrl)) {
    throw new Error('接口地址不能为空')
  }

  if (!normalizeTextField(payload.modelName)) {
    throw new Error('模型标识不能为空')
  }
}

export class AdminService {
  getDashboard() {
    const sessions = getStoredInterviewSessions()
    const reports = getStoredInterviewReports()
    const generatedReports = reports.filter(report => deriveReportGenerateStatus(report) === 'generated')

    return {
      metrics: {
        totalSessions: sessions.length,
        todaySessions: sessions.filter(session => isToday(session.updatedAt)).length,
        totalReports: reports.length,
        todayReports: reports.filter(report => isToday(report.createdAt)).length,
        abnormalSessions: sessions.filter(session => deriveSessionStatus(session) === 'aborted').length,
        reportSuccessRate: reports.length ? Math.round((generatedReports.length / reports.length) * 100) : 0
      },
      trends: {
        sessions7d: buildRecentTrend(sessions.map(item => item.updatedAt)),
        reports7d: buildRecentTrend(reports.map(item => item.createdAt))
      },
      recentSessions: sessions.slice(0, 5).map(session => ({
        sessionId: session.sessionId,
        threadId: session.threadId,
        topic: session.topic,
        questionTitle: session.questionTitle,
        messageCount: session.messages.length,
        status: deriveSessionStatus(session),
        updatedAt: session.updatedAt
      })),
      recentReports: reports.slice(0, 5).map(report => ({
        id: report.id,
        sessionId: report.sessionId,
        topic: report.topic,
        summaryHeadline: report.summaryHeadline,
        score: deriveReportScore(report),
        generateStatus: deriveReportGenerateStatus(report),
        createdAt: report.createdAt
      }))
    }
  }

  listSessions() {
    return getStoredInterviewSessions().map(session => ({
      sessionId: session.sessionId,
      threadId: session.threadId,
      topic: session.topic,
      questionTitle: session.questionTitle,
      messageCount: session.messages.length,
      latestUserMessage: [...session.messages].reverse().find(item => item.role === 'user')?.content || '',
      latestAssistantMessage: [...session.messages].reverse().find(item => item.role === 'assistant')?.content || '',
      updatedAt: session.updatedAt,
      status: deriveSessionStatus(session)
    }))
  }

  listReports() {
    return getStoredInterviewReports().map(report => ({
      id: report.id,
      sessionId: report.sessionId,
      threadId: report.threadId,
      topic: report.topic,
      questionTitle: report.questionTitle,
      summaryHeadline: report.summaryHeadline,
      summaryBody: report.summaryBody,
      primaryWeakness: report.primaryWeakness,
      weaknessTags: report.weaknessTags,
      answeredCount: report.answeredCount,
      totalCount: report.totalCount,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      score: deriveReportScore(report),
      generateStatus: deriveReportGenerateStatus(report)
    }))
  }

  listModels() {
    return getStoredModelConfigs().map(toAdminModelConfig)
  }

  createModel(payload: CreateModelConfigPayload) {
    assertValidModelPayload(payload)

    const nextModel = buildModelRecord(payload)
    const currentModels = getStoredModelConfigs()
    const shouldBecomeDefault = nextModel.isDefault || !currentModels.some(model => model.isDefault && model.enabled)

    const persistedModels = updateStoredModelConfigs((models) => {
      const normalizedModels = models.map(model => ({
        ...model,
        isDefault: shouldBecomeDefault ? false : model.isDefault
      }))

      normalizedModels.push({
        ...nextModel,
        isDefault: shouldBecomeDefault
      })

      return normalizedModels
    })

    return toAdminModelConfig(
      persistedModels.find(model => model.modelId === nextModel.modelId) || nextModel
    )
  }

  updateModel(modelId: string, payload: UpdateModelConfigPayload) {
    const currentModel = getStoredModelConfig(modelId)
    if (!currentModel) {
      throw new Error('模型不存在')
    }

    assertValidModelPayload(payload)

    const nextModel = buildModelRecord(payload, currentModel)
    const persistedModels = updateStoredModelConfigs((models) => {
      const shouldBecomeDefault = nextModel.isDefault

      return models.map(model => {
        if (model.modelId === modelId) {
          return {
            ...nextModel,
            isDefault: shouldBecomeDefault ? true : model.isDefault
          }
        }

        if (shouldBecomeDefault) {
          return {
            ...model,
            isDefault: false
          }
        }

        return model
      })
    })

    return toAdminModelConfig(
      persistedModels.find(model => model.modelId === modelId) || nextModel
    )
  }

  updateModelStatus(modelId: string, enabled: boolean) {
    const currentModel = getStoredModelConfig(modelId)
    if (!currentModel) {
      throw new Error('模型不存在')
    }

    const persistedModels = updateStoredModelConfigs((models) => {
      return models.map(model => {
        if (model.modelId !== modelId) return model

        return {
          ...model,
          enabled,
          isDefault: enabled ? model.isDefault : false,
          updatedAt: new Date().toISOString()
        }
      }).map(model => ({ ...model }))
    })

    const targetModel = persistedModels.find(model => model.modelId === modelId)
    if (!targetModel) {
      throw new Error('模型不存在')
    }

    if (!enabled && currentModel.isDefault) {
      const fallbackDefaultModelId = findNextDefaultModelId(persistedModels, modelId)
      if (fallbackDefaultModelId) {
        return this.setDefaultModel(fallbackDefaultModelId)
      }
    }

    return toAdminModelConfig(targetModel)
  }

  setDefaultModel(modelId: string) {
    const currentModel = getStoredModelConfig(modelId)
    if (!currentModel) {
      throw new Error('模型不存在')
    }

    if (!currentModel.enabled) {
      throw new Error('请先启用模型，再设置为默认模型')
    }

    const persistedModels = updateStoredModelConfigs((models) => {
      return models.map(model => ({
        ...model,
        isDefault: model.modelId === modelId,
        updatedAt: model.modelId === modelId ? new Date().toISOString() : model.updatedAt
      }))
    })

    return toAdminModelConfig(
      persistedModels.find(model => model.modelId === modelId) || currentModel
    )
  }

  async testModel(modelId: string): Promise<ModelConnectivityTestResult> {
    const currentModel = getStoredModelConfig(modelId)
    if (!currentModel) {
      throw new Error('模型不存在')
    }

    const startedAt = Date.now()
    const checkedAt = new Date().toISOString()
    const apiKey = decodeApiKey(currentModel.encryptedApiKey)

    try {
      const response = await fetch(`${ currentModel.baseUrl.replace(/\/+$/, '') }/models`, {
        method: 'GET',
        headers: apiKey
          ? {
              Authorization: `Bearer ${ apiKey }`
            }
          : undefined
      })

      const result: ModelConnectivityTestResult = {
        ok: response.ok,
        latencyMs: Date.now() - startedAt,
        message: response.ok
          ? '连接成功，可访问模型服务。'
          : `连接失败，状态码 ${ response.status }。`,
        checkedAt
      }

      upsertStoredModelConfig({
        ...currentModel,
        updatedAt: currentModel.updatedAt,
        lastTestedAt: checkedAt,
        lastTestStatus: result.ok ? 'success' : 'failed',
        lastTestMessage: result.message
      })

      return result
    }
    catch (error) {
      const result: ModelConnectivityTestResult = {
        ok: false,
        latencyMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : '模型连通性测试失败',
        checkedAt
      }

      upsertStoredModelConfig({
        ...currentModel,
        updatedAt: currentModel.updatedAt,
        lastTestedAt: checkedAt,
        lastTestStatus: 'failed',
        lastTestMessage: result.message
      })

      return result
    }
  }
}
