<script setup lang="ts">
import type { AdminSessionListItem } from '@/services/admin/admin-api'
import { listAdminSessions } from '@/services/admin/admin-api'
import {
  getRemoteInterviewSessionDetail,
} from '@/services/interview/interview-session-api'

type SessionStatusFilter = 'all' | 'in_progress' | 'completed' | 'aborted'
type DateRangeFilter = 'all' | 'today' | '7d' | '30d'

const loading = ref(false)
const errorMessage = ref('')
const keyword = ref('')
const statusFilter = ref<SessionStatusFilter>('all')
const dateRangeFilter = ref<DateRangeFilter>('all')
const sessions = ref<AdminSessionListItem[]>([])

const detailLoading = ref(false)
const detailErrorMessage = ref('')
const selectedSessionKey = ref('')
const sessionDetail = ref<Awaited<ReturnType<typeof getRemoteInterviewSessionDetail>>>(null)

const getSessionStatus = (session: AdminSessionListItem) => session.status

const getSessionStatusLabel = (status: ReturnType<typeof getSessionStatus>) => {
  if (status === 'completed') return '已完成'
  if (status === 'in_progress') return '进行中'
  return '异常中断'
}

const isWithinDateRange = (value: string, range: DateRangeFilter) => {
  if (range === 'all') return true

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()
  if (range === 'today') {
    return date.toDateString() === now.toDateString()
  }

  const diffMs = now.getTime() - date.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (range === '7d') return diffDays <= 7
  return diffDays <= 30
}

const filteredSessions = computed(() => {
  const query = keyword.value.trim().toLowerCase()

  return sessions.value.filter((item) => {
    const matchesKeyword = !query || [
      item.sessionId,
      item.threadId,
      item.topic,
      item.questionTitle,
      item.latestUserMessage,
      item.latestAssistantMessage
    ].some(value => value?.toLowerCase().includes(query))

    const status = getSessionStatus(item)
    const matchesStatus = statusFilter.value === 'all' || status === statusFilter.value
    const matchesDate = isWithinDateRange(item.updatedAt, dateRangeFilter.value)

    return matchesKeyword && matchesStatus && matchesDate
  })
})

const selectedSessionSummary = computed(() => {
  if (!selectedSessionKey.value) return null

  return sessions.value.find(item => `${ item.sessionId }::${ item.threadId }` === selectedSessionKey.value) ?? null
})

const resetSessionDetail = () => {
  selectedSessionKey.value = ''
  sessionDetail.value = null
  detailErrorMessage.value = ''
  detailLoading.value = false
}

const loadSessionDetail = async (sessionId: string, threadId: string) => {
  detailLoading.value = true
  detailErrorMessage.value = ''

  try {
    sessionDetail.value = await getRemoteInterviewSessionDetail(sessionId, threadId)
    if (!sessionDetail.value) {
      detailErrorMessage.value = '当前会话暂无详情数据'
    }
  }
  catch (error) {
    sessionDetail.value = null
    detailErrorMessage.value = error instanceof Error ? error.message : '会话详情加载失败'
  }
  finally {
    detailLoading.value = false
  }
}

const loadSessions = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    sessions.value = await listAdminSessions()

    if (selectedSessionSummary.value) {
      await loadSessionDetail(selectedSessionSummary.value.sessionId, selectedSessionSummary.value.threadId)
    }
    else if (selectedSessionKey.value) {
      resetSessionDetail()
    }
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '会话列表加载失败'
  }
  finally {
    loading.value = false
  }
}

const inspectSession = async (sessionId: string, threadId: string) => {
  const nextKey = `${ sessionId }::${ threadId }`

  if (selectedSessionKey.value === nextKey) {
    resetSessionDetail()
    return
  }

  selectedSessionKey.value = nextKey
  sessionDetail.value = null
  await loadSessionDetail(sessionId, threadId)
}

onMounted(() => {
  void loadSessions()
})
</script>

<template>
  <section class="admin-table-page">
    <div class="page-title">
      <div>
        <p>Sessions</p>
        <h1>会话管理</h1>
      </div>
      <button
        type="button"
        :disabled="loading"
        @click="loadSessions"
      >
        {{ loading ? '加载中...' : '重新加载' }}
      </button>
    </div>

    <div class="filter-bar">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索 sessionId、threadId、主题或最近消息"
        type="search"
      >

      <select
        v-model="statusFilter"
        class="filter-select"
      >
        <option value="all">
          全部状态
        </option>
        <option value="in_progress">
          进行中
        </option>
        <option value="completed">
          已完成
        </option>
        <option value="aborted">
          异常中断
        </option>
      </select>

      <select
        v-model="dateRangeFilter"
        class="filter-select"
      >
        <option value="all">
          全部日期
        </option>
        <option value="today">
          今天
        </option>
        <option value="7d">
          最近 7 天
        </option>
        <option value="30d">
          最近 30 天
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
            <th>会话</th>
            <th>主题</th>
            <th>状态</th>
            <th>消息数</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredSessions"
            :key="`${item.sessionId}-${item.threadId}`"
          >
            <td>
              <strong>{{ item.questionTitle || '未命名会话' }}</strong>
            </td>
            <td>{{ item.topic || '-' }}</td>
            <td>
              <span class="status-badge" :class="`is-${getSessionStatus(item)}`">
                {{ getSessionStatusLabel(getSessionStatus(item)) }}
              </span>
            </td>
            <td>{{ item.messageCount }}</td>
            <td>{{ item.updatedAt }}</td>
            <td class="action-cell">
              <button
                type="button"
                class="inline-button"
                :disabled="detailLoading && selectedSessionKey === `${item.sessionId}::${item.threadId}`"
                @click="inspectSession(item.sessionId, item.threadId)"
              >
                {{
                  detailLoading && selectedSessionKey === `${item.sessionId}::${item.threadId}`
                    ? '加载中...'
                    : selectedSessionKey === `${item.sessionId}::${item.threadId}`
                      ? '收回详情'
                      : '查看详情'
                }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p
        v-if="!filteredSessions.length && !loading"
        class="empty-text"
      >
        暂无匹配会话
      </p>
    </div>

    <article
      v-if="selectedSessionSummary"
      class="detail-card"
    >
      <div class="detail-header">
        <div>
          <p>Session Detail</p>
          <h2>{{ selectedSessionSummary.questionTitle || '未命名会话' }}</h2>
          <span>{{ selectedSessionSummary.sessionId }} / {{ selectedSessionSummary.threadId }}</span>
        </div>
        <button
          type="button"
          class="ghost-button"
          @click="resetSessionDetail"
        >
          收回详情
        </button>
      </div>

      <p
        v-if="detailErrorMessage"
        class="error-banner"
      >
        {{ detailErrorMessage }}
      </p>

      <p
        v-else-if="detailLoading"
        class="empty-text"
      >
        正在加载会话详情...
      </p>

      <template v-else-if="sessionDetail">
        <div class="detail-metadata">
          <div>
            <span class="meta-label">主题</span>
            <strong>{{ sessionDetail.topic || '-' }}</strong>
          </div>
          <div>
            <span class="meta-label">状态</span>
            <strong>{{ getSessionStatusLabel(getSessionStatus(selectedSessionSummary)) }}</strong>
          </div>
          <div>
            <span class="meta-label">更新时间</span>
            <strong>{{ sessionDetail.updatedAt }}</strong>
          </div>
        </div>

        <div class="detail-message-list">
          <article
            v-for="(message, index) in sessionDetail.messages"
            :key="`${message.createdAt}-${index}`"
            class="detail-message"
            :class="`is-${message.role}`"
          >
            <header>
              <strong>{{ message.role === 'assistant' ? '面试官' : '候选人' }}</strong>
              <span>{{ message.createdAt }}</span>
            </header>
            <p>{{ message.content }}</p>
          </article>
        </div>
      </template>
    </article>
  </section>
</template>

<style scoped lang="scss">
@use "./shared-admin-table";
</style>
