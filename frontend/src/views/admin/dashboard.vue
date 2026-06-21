<script setup lang="ts">
import { getAdminDashboard } from '@/services/admin/admin-api'

const loading = ref(false)
const errorMessage = ref('')
const dashboard = ref<Awaited<ReturnType<typeof getAdminDashboard>> | null>(null)

const metrics = computed(() => {
  const baseMetrics = dashboard.value?.metrics
  if (!baseMetrics) return []

  return [
    {
      label: '累计会话',
      value: baseMetrics.totalSessions,
      hint: `今日新增 ${ baseMetrics.todaySessions }`
    },
    {
      label: '累计报告',
      value: baseMetrics.totalReports,
      hint: `今日生成 ${ baseMetrics.todayReports }`
    },
    {
      label: '报告成功率',
      value: `${ baseMetrics.reportSuccessRate }%`,
      hint: '按后台聚合口径计算'
    },
    {
      label: '异常会话',
      value: baseMetrics.abnormalSessions,
      hint: '用于排查异常链路'
    }
  ]
})

const recentSessions = computed(() => dashboard.value?.recentSessions || [])
const recentReports = computed(() => dashboard.value?.recentReports || [])

const loadDashboard = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    dashboard.value = await getAdminDashboard()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '后台数据加载失败'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadDashboard()
})
</script>

<template>
  <section class="admin-page">
    <div class="page-title">
      <div>
        <p>Dashboard</p>
        <h1>数据看板</h1>
      </div>
      <button
        type="button"
        :disabled="loading"
        @click="loadDashboard"
      >
        {{ loading ? '刷新中...' : '刷新数据' }}
      </button>
    </div>

    <p
      v-if="errorMessage"
      class="error-banner"
    >
      {{ errorMessage }}
    </p>

    <div class="metric-grid">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-card"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <p>{{ metric.hint }}</p>
      </article>
    </div>

    <div class="panel-grid">
      <article class="data-panel">
        <h2>最近会话</h2>
        <div
          v-for="item in recentSessions"
          :key="`${item.sessionId}-${item.threadId}`"
          class="list-row"
        >
          <strong>{{ item.questionTitle || item.topic || '未命名会话' }}</strong>
          <span>{{ item.messageCount }} 条消息 · {{ item.updatedAt }}</span>
        </div>
        <p
          v-if="!recentSessions.length && !loading"
          class="empty-text"
        >
          暂无会话数据
        </p>
      </article>

      <article class="data-panel">
        <h2>最近报告</h2>
        <div
          v-for="item in recentReports"
          :key="item.id"
          class="list-row"
        >
          <strong>{{ item.summaryHeadline || item.topic || '未命名报告' }}</strong>
          <span>{{ item.score }} 分 · {{ item.createdAt }}</span>
        </div>
        <p
          v-if="!recentReports.length && !loading"
          class="empty-text"
        >
          暂无报告数据
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-title {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;

  p {
    margin: 0 0 4px;
    color: rgb(103 232 249 / 0.88);
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: #f8fbff;
    font-size: clamp(36px, 4.6vw, 50px);
    letter-spacing: -0.04em;
  }

  button {
    min-height: 50px;
    padding: 0 18px;
    border: 1px solid rgb(129 212 250 / 0.18);
    border-radius: 999px;
    background:
      linear-gradient(135deg, rgb(103 232 249 / 0.18), rgb(34 197 94 / 0.16));
    color: #eff6ff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 14px 30px rgb(2 6 23 / 0.22);
  }
}

.error-banner {
  margin: 0;
  padding: 16px 18px;
  border: 1px solid rgb(248 113 113 / 0.22);
  border-radius: 20px;
  background: rgb(69 10 10 / 0.42);
  color: #fecaca;
  font-size: 15px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.metric-card,
.data-panel {
  border: 1px solid rgb(129 212 250 / 0.12);
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgb(8 22 40 / 0.88), rgb(6 17 32 / 0.8));
  box-shadow: 0 24px 80px rgb(2 6 23 / 0.28);
  backdrop-filter: blur(18px);
}

.metric-card {
  padding: 24px;

  span,
  p {
    color: rgb(217 234 255 / 0.66);
  }

  span {
    font-size: 15px;
  }

  strong {
    display: block;
    margin: 14px 0 8px;
    color: #f8fbff;
    font-size: 36px;
    letter-spacing: -0.05em;
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
  }
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.data-panel {
  min-height: 280px;
  padding: 24px;

  h2 {
    margin: 0 0 16px;
    color: #f8fbff;
    font-size: 22px;
  }
}

.list-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
  border-top: 1px solid rgb(129 212 250 / 0.08);

  strong {
    color: #eff6ff;
    font-size: 16px;
    line-height: 1.6;
  }

  span {
    color: rgb(217 234 255 / 0.62);
    font-size: 14px;
  }
}

.empty-text {
  color: rgb(217 234 255 / 0.62);
  font-size: 15px;
}

@media (max-width: 920px) {
  .page-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .metric-grid,
  .panel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
