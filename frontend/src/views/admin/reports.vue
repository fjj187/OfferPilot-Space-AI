<script setup lang="ts">
import type { AdminReportListItem } from '@/services/admin/admin-api'
import { listAdminReports } from '@/services/admin/admin-api'
import { getRemoteInterviewReportBySessionId } from '@/services/interview/interview-report-api'

type ScoreRangeFilter = 'all' | '90+' | '80-89' | '60-79' | '<60'
type ReportStatusFilter = 'all' | 'generated' | 'incomplete'

const loading = ref(false)
const errorMessage = ref('')
const keyword = ref('')
const scoreRangeFilter = ref<ScoreRangeFilter>('all')
const reportStatusFilter = ref<ReportStatusFilter>('all')
const reports = ref<AdminReportListItem[]>([])

const detailLoading = ref(false)
const detailErrorMessage = ref('')
const selectedReportSessionId = ref('')
const reportDetail = ref<Awaited<ReturnType<typeof getRemoteInterviewReportBySessionId>>>(null)

const getDerivedReportScore = (report: AdminReportListItem) => report.score

const getScoreRange = (score: number): Exclude<ScoreRangeFilter, 'all'> => {
  if (score >= 90) return '90+'
  if (score >= 80) return '80-89'
  if (score >= 60) return '60-79'
  return '<60'
}

const getReportGenerateStatus = (report: AdminReportListItem) => report.generateStatus

const getReportGenerateStatusLabel = (status: ReturnType<typeof getReportGenerateStatus>) => {
  return status === 'generated' ? '已生成' : '摘要不完整'
}

const filteredReports = computed(() => {
  const query = keyword.value.trim().toLowerCase()

  return reports.value.filter((item) => {
    const matchesKeyword = !query || [
      item.id,
      item.sessionId,
      item.topic,
      item.summaryHeadline,
      item.summaryBody,
      item.primaryWeakness
    ].some(value => value?.toLowerCase().includes(query))

    const scoreRange = getScoreRange(getDerivedReportScore(item))
    const generateStatus = getReportGenerateStatus(item)
    const matchesScore = scoreRangeFilter.value === 'all' || scoreRange === scoreRangeFilter.value
    const matchesStatus = reportStatusFilter.value === 'all' || generateStatus === reportStatusFilter.value

    return matchesKeyword && matchesScore && matchesStatus
  })
})

const selectedReportSummary = computed(() => {
  if (!selectedReportSessionId.value) return null
  return reports.value.find(item => item.sessionId === selectedReportSessionId.value) ?? null
})

const resetReportDetail = () => {
  selectedReportSessionId.value = ''
  reportDetail.value = null
  detailErrorMessage.value = ''
  detailLoading.value = false
}

const loadReportDetail = async (sessionId: string) => {
  detailLoading.value = true
  detailErrorMessage.value = ''

  try {
    reportDetail.value = await getRemoteInterviewReportBySessionId(sessionId)
    if (!reportDetail.value) {
      detailErrorMessage.value = '当前报告暂无详情数据'
    }
  }
  catch (error) {
    reportDetail.value = null
    detailErrorMessage.value = error instanceof Error ? error.message : '报告详情加载失败'
  }
  finally {
    detailLoading.value = false
  }
}

const loadReports = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    reports.value = await listAdminReports()

    if (selectedReportSummary.value) {
      await loadReportDetail(selectedReportSummary.value.sessionId)
    }
    else if (selectedReportSessionId.value) {
      resetReportDetail()
    }
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '报告列表加载失败'
  }
  finally {
    loading.value = false
  }
}

const inspectReport = async (sessionId: string) => {
  if (selectedReportSessionId.value === sessionId) {
    resetReportDetail()
    return
  }

  selectedReportSessionId.value = sessionId
  reportDetail.value = null
  await loadReportDetail(sessionId)
}

onMounted(() => {
  void loadReports()
})
</script>

<template>
  <section class="admin-table-page">
    <div class="page-title">
      <div>
        <p>Reports</p>
        <h1>报告管理</h1>
      </div>
      <button
        type="button"
        :disabled="loading"
        @click="loadReports"
      >
        {{ loading ? '加载中...' : '重新加载' }}
      </button>
    </div>

    <div class="filter-bar">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索 reportId、sessionId、主题或报告摘要"
        type="search"
      >

      <select
        v-model="scoreRangeFilter"
        class="filter-select"
      >
        <option value="all">
          全部分数区间
        </option>
        <option value="90+">
          90 分以上
        </option>
        <option value="80-89">
          80-89 分
        </option>
        <option value="60-79">
          60-79 分
        </option>
        <option value="<60">
          60 分以下
        </option>
      </select>

      <select
        v-model="reportStatusFilter"
        class="filter-select"
      >
        <option value="all">
          全部生成状态
        </option>
        <option value="generated">
          已生成
        </option>
        <option value="incomplete">
          摘要不完整
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
            <th>报告</th>
            <th>弱项</th>
            <th>分数区间</th>
            <th>生成状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredReports"
            :key="item.id"
          >
            <td>
              <strong>{{ item.summaryHeadline || '未命名报告' }}</strong>
            </td>
            <td>{{ item.primaryWeakness || item.weaknessTags[0] || '-' }}</td>
            <td>{{ getScoreRange(getDerivedReportScore(item)) }}</td>
            <td>
              <span class="status-badge" :class="`is-${getReportGenerateStatus(item)}`">
                {{ getReportGenerateStatusLabel(getReportGenerateStatus(item)) }}
              </span>
            </td>
            <td>{{ item.createdAt }}</td>
            <td class="action-cell">
              <button
                type="button"
                class="inline-button"
                :disabled="detailLoading && selectedReportSessionId === item.sessionId"
                @click="inspectReport(item.sessionId)"
              >
                {{
                  detailLoading && selectedReportSessionId === item.sessionId
                    ? '加载中...'
                    : selectedReportSessionId === item.sessionId
                      ? '收回详情'
                      : '查看详情'
                }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p
        v-if="!filteredReports.length && !loading"
        class="empty-text"
      >
        暂无匹配报告
      </p>
    </div>

    <article
      v-if="selectedReportSummary"
      class="detail-card"
    >
      <div class="detail-header">
        <div>
          <p>Report Detail</p>
          <h2>{{ selectedReportSummary.summaryHeadline || '未命名报告' }}</h2>
          <span>{{ selectedReportSummary.id }} / {{ selectedReportSummary.sessionId }}</span>
        </div>
        <button
          type="button"
          class="ghost-button"
          @click="resetReportDetail"
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
        正在加载报告详情...
      </p>

      <template v-else-if="reportDetail">
        <div class="detail-metadata">
          <div>
            <span class="meta-label">主题</span>
            <strong>{{ reportDetail.topic || '-' }}</strong>
          </div>
          <div>
            <span class="meta-label">估算分数</span>
            <strong>{{ getDerivedReportScore(reportDetail) }} 分</strong>
          </div>
          <div>
            <span class="meta-label">创建时间</span>
            <strong>{{ reportDetail.createdAt }}</strong>
          </div>
        </div>

        <div class="detail-section">
          <span class="meta-label">摘要标题</span>
          <strong>{{ reportDetail.summaryHeadline || '-' }}</strong>
        </div>

        <div class="detail-section">
          <span class="meta-label">摘要正文</span>
          <p>{{ reportDetail.summaryBody || '暂无摘要正文' }}</p>
        </div>

        <div class="detail-section">
          <span class="meta-label">弱项标签</span>
          <div class="tag-list">
            <span
              v-for="tag in reportDetail.weaknessTags"
              :key="tag"
              class="tag-chip"
            >
              {{ tag }}
            </span>
            <span
              v-if="!reportDetail.weaknessTags.length"
              class="empty-text tag-empty"
            >
              暂无弱项标签
            </span>
          </div>
        </div>

        <div
          v-if="reportDetail.suggestedFocus?.length"
          class="detail-section"
        >
          <span class="meta-label">建议聚焦</span>
          <ul class="focus-list">
            <li
              v-for="focus in reportDetail.suggestedFocus"
              :key="focus"
            >
              {{ focus }}
            </li>
          </ul>
        </div>
      </template>
    </article>
  </section>
</template>

<style scoped lang="scss">
@use "./shared-admin-table";
</style>
