<script setup lang="ts">
import type { EChartsCoreOption } from 'echarts/core'
import { computed } from 'vue'

import AnalyticsChartPanel from '@/components/analytics/AnalyticsChartPanel.vue'
import BaseECharts from '@/components/analytics/BaseECharts.vue'
import type {
  InterviewAnalyticsChartClickPayload,
  InterviewAnalyticsDashboardData,
  InterviewDistributionItem,
  InterviewMetricCard,
  InterviewWeaknessRankItem
} from '@/types/interview-analytics'

const props = withDefaults(defineProps<{
  data?: InterviewAnalyticsDashboardData
  title?: string
  subtitle?: string
  timeRangeText?: string
  loading?: boolean
  error?: string
  active?: boolean
}>(), {
  title: 'AI 面试训练数据驾驶舱',
  subtitle: '聚焦训练次数、能力结构、评分趋势和主题覆盖。',
  timeRangeText: '最近 14 次训练',
  error: '',
  active: true
})

const emit = defineEmits<{
  metricClick: [metric: InterviewMetricCard]
  chartClick: [payload: InterviewAnalyticsChartClickPayload]
  refresh: []
}>()

const chartColors = ['#57d7ff', '#52f0c4', '#ffcf5c', '#ff8f70', '#8fa7ff', '#7bd985']

const hasData = computed(() => Boolean(props.data))

const isEmptyDistribution = (items?: InterviewDistributionItem[]) => !items?.some(item => item.value > 0)

const metricToneClass = (metric: InterviewMetricCard) => `analytics-dashboard__metric--${ metric.tone ?? 'blue' }`

const weaknessToneClass = (item: InterviewWeaknessRankItem) => `analytics-dashboard__weakness-item--${ item.tone ?? 'orange' }`

const maxWeaknessValue = computed(() => {
  const values = props.data?.weaknessRanking?.map(item => item.value) ?? []
  return Math.max(...values, 1)
})

const maxHeatmapValue = computed(() => {
  const values = props.data?.trainingHeatmap?.map(item => item.value) ?? []
  return Math.max(...values, 1)
})

const weaknessPercent = (value: number) => `${ Math.max(8, Math.round((value / maxWeaknessValue.value) * 100)) }%`

const heatmapLevel = (value: number) => {
  if (value <= 0) return 0
  return Math.max(1, Math.min(4, Math.ceil((value / maxHeatmapValue.value) * 4)))
}

const radarOption = computed<EChartsCoreOption>(() => {
  const abilityRadar = props.data?.abilityRadar ?? []

  return {
    color: ['#57d7ff'],
    tooltip: {
      trigger: 'item'
    },
    radar: {
      radius: '62%',
      indicator: abilityRadar.map(item => ({
        name: item.name,
        max: item.max
      })),
      splitNumber: 4,
      axisName: {
        color: 'rgba(229, 244, 255, 0.82)',
        fontSize: 12
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(148, 199, 255, 0.18)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 199, 255, 0.14)'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(87, 215, 255, 0.04)', 'rgba(87, 215, 255, 0.01)']
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            name: '能力得分',
            value: abilityRadar.map(item => item.value),
            areaStyle: {
              color: 'rgba(87, 215, 255, 0.18)'
            },
            lineStyle: {
              width: 2
            },
            symbolSize: 5
          }
        ]
      }
    ]
  }
})

const scoreTrendOption = computed<EChartsCoreOption>(() => {
  const scoreTrend = props.data?.scoreTrend ?? []

  return {
    color: ['#52f0c4'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        show: false
      }
    },
    grid: {
      top: 24,
      right: 18,
      bottom: 28,
      left: 38
    },
    xAxis: {
      type: 'category',
      data: scoreTrend.map(item => item.label),
      axisLine: {
        lineStyle: {
          color: 'rgba(188, 221, 255, 0.22)'
        }
      },
      axisLabel: {
        color: 'rgba(229, 244, 255, 0.72)'
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 199, 255, 0.12)'
        }
      },
      axisLabel: {
        color: 'rgba(229, 244, 255, 0.72)'
      }
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: scoreTrend.map(item => item.score),
        symbolSize: 7,
        areaStyle: {
          color: 'rgba(82, 240, 196, 0.14)'
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  }
})

const buildPieOption = (items: InterviewDistributionItem[]): EChartsCoreOption => ({
  color: chartColors,
  tooltip: {
    trigger: 'item'
  },
  legend: {
    bottom: 0,
    textStyle: {
      color: 'rgba(229, 244, 255, 0.72)'
    }
  },
  series: [
    {
      type: 'pie',
      radius: ['48%', '70%'],
      center: ['50%', '43%'],
      avoidLabelOverlap: true,
      label: {
        color: 'rgba(246, 251, 255, 0.9)',
        formatter: '{b}'
      },
      labelLine: {
        lineStyle: {
          color: 'rgba(229, 244, 255, 0.34)'
        }
      },
      data: items
    }
  ]
})

const topicDistributionOption = computed<EChartsCoreOption>(() => buildPieOption(props.data?.topicDistribution ?? []))

const practiceQuestionTypeOption = computed<EChartsCoreOption>(() => ({
  color: ['#57d7ff'],
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      show: false
    }
  },
  grid: {
    top: 16,
    right: 14,
    bottom: 26,
    left: 34
  },
  xAxis: {
    type: 'category',
    data: props.data?.practiceQuestionTypeDistribution.map(item => item.name) ?? [],
    axisLine: {
      lineStyle: {
        color: 'rgba(188, 221, 255, 0.22)'
      }
    },
    axisLabel: {
      color: 'rgba(229, 244, 255, 0.72)'
    },
    axisTick: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    splitLine: {
      lineStyle: {
        color: 'rgba(148, 199, 255, 0.12)'
      }
    },
    axisLabel: {
      color: 'rgba(229, 244, 255, 0.72)'
    }
  },
  series: [
    {
      type: 'bar',
      data: props.data?.practiceQuestionTypeDistribution.map(item => item.value) ?? [],
      barWidth: 22,
      itemStyle: {
        borderRadius: [8, 8, 0, 0]
      }
    }
  ]
}))

const handleChartClick = (chartId: string, event: {
  name?: string
  value?: unknown
  dataIndex?: number
}) => {
  emit('chartClick', {
    chartId,
    name: event.name,
    value: event.value,
    dataIndex: event.dataIndex
  })
}

</script>

<template>
  <section class="analytics-dashboard">
    <header class="analytics-dashboard__hero">
      <div>
        <span class="analytics-dashboard__eyebrow">{{ timeRangeText }}</span>
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>
      <div class="analytics-dashboard__actions">
        <slot name="actions"></slot>
        <button
          type="button"
          class="analytics-dashboard__refresh"
          @click="emit('refresh')"
        >
          刷新
        </button>
      </div>
    </header>

    <div
      v-if="loading"
      class="analytics-dashboard__full-state"
    >
      数据加载中
    </div>
    <div
      v-else-if="error"
      class="analytics-dashboard__full-state analytics-dashboard__full-state--error"
    >
      {{ error }}
    </div>
    <div
      v-else-if="!hasData"
      class="analytics-dashboard__full-state"
    >
      暂无训练分析数据
    </div>
    <template v-else>
      <div class="analytics-dashboard__metrics">
        <button
          v-for="metric in data?.metrics"
          :key="metric.key"
          type="button"
          class="analytics-dashboard__metric"
          :class="metricToneClass(metric)"
          @click="emit('metricClick', metric)"
        >
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small v-if="metric.trendText">{{ metric.trendText }}</small>
        </button>
      </div>

      <div class="analytics-dashboard__grid">
        <AnalyticsChartPanel
          title="能力雷达"
          caption="表达、逻辑、专业与岗位匹配综合视图"
          :loading="false"
          :empty="!data?.abilityRadar.length"
        >
          <BaseECharts
            :option="radarOption"
            :height="300"
            :active="active"
            @chart-click="handleChartClick('abilityRadar', $event)"
          />
        </AnalyticsChartPanel>

        <AnalyticsChartPanel
          title="评分趋势"
          caption="最近训练得分变化"
          :loading="false"
          :empty="!data?.scoreTrend.length"
        >
          <BaseECharts
            :option="scoreTrendOption"
            :height="300"
            :active="active"
            @chart-click="handleChartClick('scoreTrend', $event)"
          />
        </AnalyticsChartPanel>

        <AnalyticsChartPanel
          title="训练主题分布"
          caption="Vue 3、性能优化、浏览器等主题覆盖比例"
          :loading="false"
          :empty="isEmptyDistribution(data?.topicDistribution)"
        >
          <BaseECharts
            :option="topicDistributionOption"
            :height="300"
            :active="active"
            @chart-click="handleChartClick('topicDistribution', $event)"
          />
        </AnalyticsChartPanel>

        <AnalyticsChartPanel
          title="专项题型分布"
          caption="概念理解、代码分析、场景追问占比"
          :loading="false"
          :empty="isEmptyDistribution(data?.practiceQuestionTypeDistribution)"
        >
          <BaseECharts
            :option="practiceQuestionTypeOption"
            :height="300"
            :active="active"
            @chart-click="handleChartClick('practiceQuestionTypeDistribution', $event)"
          />
        </AnalyticsChartPanel>
      </div>

      <section
        v-if="data?.weaknessRanking?.length"
        class="analytics-dashboard__weakness"
      >
        <header>
          <h3>薄弱项排行</h3>
          <p>按复盘报告和训练记录中的弱项标签聚合。</p>
        </header>
        <ol>
          <li
            v-for="item in data.weaknessRanking"
            :key="item.name"
            :class="weaknessToneClass(item)"
          >
            <div class="analytics-dashboard__weakness-head">
              <strong>{{ item.name }}</strong>
              <span>{{ item.value }} 次</span>
            </div>
            <div class="analytics-dashboard__weakness-track">
              <span :style="{ width: weaknessPercent(item.value) }"></span>
            </div>
            <small v-if="item.detail">{{ item.detail }}</small>
          </li>
        </ol>
      </section>

      <section
        v-if="data?.trainingHeatmap?.length"
        class="analytics-dashboard__heatmap"
      >
        <header>
          <h3>训练热力概览</h3>
          <p>按日期汇总模拟面试和复盘记录，观察最近训练节奏。</p>
        </header>
        <div class="analytics-dashboard__heatmap-grid">
          <span
            v-for="day in data.trainingHeatmap"
            :key="day.date"
            class="analytics-dashboard__heatmap-day"
            :class="`analytics-dashboard__heatmap-day--${ heatmapLevel(day.value) }`"
            :title="`${ day.label } · ${ day.value } 条记录`"
          >
            <strong>{{ day.value }}</strong>
            <small>{{ day.label }}</small>
          </span>
        </div>
      </section>

      <section
        v-if="data?.activityFeed?.length"
        class="analytics-dashboard__activity"
      >
        <header>
          <h3>实时训练动态</h3>
          <p>记录最近的模拟面试、专项训练和复盘行为。</p>
        </header>
        <ul>
          <li
            v-for="activity in data.activityFeed"
            :key="activity.id"
          >
            <span :class="`analytics-dashboard__activity-dot analytics-dashboard__activity-dot--${ activity.type ?? 'mock' }`"></span>
            <div>
              <strong>{{ activity.title }}</strong>
              <small v-if="activity.description">{{ activity.description }}</small>
            </div>
            <time>{{ activity.timeText }}</time>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<style lang="scss" scoped>
.analytics-dashboard {
  display: grid;
  gap: 18px;
  padding: 22px;
  border: 1px solid rgb(148 199 255 / 0.14);
  border-radius: 8px;
  background:
    radial-gradient(circle at 18% 0%, rgb(87 215 255 / 0.14), transparent 34%),
    radial-gradient(circle at 82% 16%, rgb(82 240 196 / 0.1), transparent 28%),
    #06101f;
  color: #f6fbff;
}

.analytics-dashboard__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.analytics-dashboard__eyebrow {
  color: #52f0c4;
  font-size: 13px;
  font-weight: 700;
}

.analytics-dashboard__hero h2 {
  margin: 8px 0 0;
  font-size: 24px;
  line-height: 1.25;
  letter-spacing: 0;
}

.analytics-dashboard__hero p {
  max-width: 680px;
  margin: 8px 0 0;
  color: rgb(224 238 255 / 0.72);
  font-size: 14px;
  line-height: 1.7;
}

.analytics-dashboard__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.analytics-dashboard__refresh {
  height: 38px;
  padding: 0 16px;
  border: 1px solid rgb(148 199 255 / 0.26);
  border-radius: 8px;
  background: rgb(87 215 255 / 0.1);
  color: #f6fbff;
  font: inherit;
  cursor: pointer;
}

.analytics-dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.analytics-dashboard__metric {
  display: grid;
  min-width: 0;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.045);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.analytics-dashboard__metric span {
  color: rgb(224 238 255 / 0.68);
  font-size: 13px;
}

.analytics-dashboard__metric strong {
  font-size: 26px;
  line-height: 1.1;
  letter-spacing: 0;
}

.analytics-dashboard__metric small {
  color: rgb(224 238 255 / 0.66);
  font-size: 12px;
}

.analytics-dashboard__metric--blue {
  box-shadow: inset 3px 0 0 #57d7ff;
}

.analytics-dashboard__metric--green {
  box-shadow: inset 3px 0 0 #52f0c4;
}

.analytics-dashboard__metric--orange {
  box-shadow: inset 3px 0 0 #ffcf5c;
}

.analytics-dashboard__metric--red {
  box-shadow: inset 3px 0 0 #ff8f70;
}

.analytics-dashboard__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.analytics-dashboard__activity {
  padding: 18px;
  border: 1px solid rgb(148 199 255 / 0.16);
  border-radius: 8px;
  background: rgb(7 17 32 / 0.78);
}

.analytics-dashboard__weakness {
  padding: 18px;
  border: 1px solid rgb(148 199 255 / 0.16);
  border-radius: 8px;
  background: rgb(7 17 32 / 0.78);
}

.analytics-dashboard__weakness header {
  margin-bottom: 14px;
}

.analytics-dashboard__weakness h3 {
  margin: 0;
  font-size: 16px;
}

.analytics-dashboard__weakness p {
  margin: 6px 0 0;
  color: rgb(224 238 255 / 0.66);
  font-size: 13px;
}

.analytics-dashboard__weakness ol {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.analytics-dashboard__weakness li {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.045);
}

.analytics-dashboard__weakness-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.analytics-dashboard__weakness-head strong {
  color: #f6fbff;
  font-size: 14px;
}

.analytics-dashboard__weakness-head span,
.analytics-dashboard__weakness small {
  color: rgb(224 238 255 / 0.62);
  font-size: 12px;
}

.analytics-dashboard__weakness-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
}

.analytics-dashboard__weakness-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #ffcf5c;
}

.analytics-dashboard__weakness-item--blue .analytics-dashboard__weakness-track span {
  background: #57d7ff;
}

.analytics-dashboard__weakness-item--green .analytics-dashboard__weakness-track span {
  background: #52f0c4;
}

.analytics-dashboard__weakness-item--red .analytics-dashboard__weakness-track span {
  background: #ff8f70;
}

.analytics-dashboard__heatmap {
  padding: 18px;
  border: 1px solid rgb(148 199 255 / 0.16);
  border-radius: 8px;
  background: rgb(7 17 32 / 0.78);
}

.analytics-dashboard__heatmap header {
  margin-bottom: 14px;
}

.analytics-dashboard__heatmap h3 {
  margin: 0;
  font-size: 16px;
}

.analytics-dashboard__heatmap p {
  margin: 6px 0 0;
  color: rgb(224 238 255 / 0.66);
  font-size: 13px;
}

.analytics-dashboard__heatmap-grid {
  display: grid;
  grid-template-columns: repeat(14, minmax(0, 1fr));
  gap: 8px;
}

.analytics-dashboard__heatmap-day {
  display: grid;
  min-width: 0;
  min-height: 54px;
  place-items: center;
  gap: 3px;
  padding: 8px 4px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.045);
}

.analytics-dashboard__heatmap-day strong {
  color: #f6fbff;
  font-size: 14px;
  line-height: 1;
}

.analytics-dashboard__heatmap-day small {
  color: rgb(224 238 255 / 0.58);
  font-size: 11px;
  line-height: 1;
}

.analytics-dashboard__heatmap-day--1 {
  background: rgb(87 215 255 / 0.12);
}

.analytics-dashboard__heatmap-day--2 {
  background: rgb(82 240 196 / 0.16);
}

.analytics-dashboard__heatmap-day--3 {
  background: rgb(82 240 196 / 0.24);
}

.analytics-dashboard__heatmap-day--4 {
  background: rgb(255 207 92 / 0.26);
}

.analytics-dashboard__activity header {
  margin-bottom: 12px;
}

.analytics-dashboard__activity h3 {
  margin: 0;
  font-size: 16px;
}

.analytics-dashboard__activity p {
  margin: 6px 0 0;
  color: rgb(224 238 255 / 0.66);
  font-size: 13px;
}

.analytics-dashboard__activity ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.analytics-dashboard__activity li {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.045);
}

.analytics-dashboard__activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #57d7ff;
}

.analytics-dashboard__activity-dot--practice {
  background: #52f0c4;
}

.analytics-dashboard__activity-dot--report {
  background: #ffcf5c;
}

.analytics-dashboard__activity-dot--library {
  background: #8fa7ff;
}

.analytics-dashboard__activity strong,
.analytics-dashboard__activity small {
  display: block;
}

.analytics-dashboard__activity small,
.analytics-dashboard__activity time {
  color: rgb(224 238 255 / 0.62);
  font-size: 12px;
}

.analytics-dashboard__full-state {
  display: grid;
  min-height: 360px;
  place-items: center;
  border: 1px dashed rgb(169 210 255 / 0.22);
  border-radius: 8px;
  color: rgb(224 238 255 / 0.72);
}

.analytics-dashboard__full-state--error {
  border-color: rgb(255 136 136 / 0.28);
  color: #ffc9bd;
}

@media (max-width: 1180px) {
  .analytics-dashboard__metrics,
  .analytics-dashboard__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .analytics-dashboard {
    padding: 16px;
  }

  .analytics-dashboard__hero {
    display: grid;
  }

  .analytics-dashboard__actions {
    justify-content: flex-start;
  }

  .analytics-dashboard__metrics,
  .analytics-dashboard__grid {
    grid-template-columns: 1fr;
  }

  .analytics-dashboard__heatmap-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .analytics-dashboard__activity li {
    grid-template-columns: 12px minmax(0, 1fr);
  }

  .analytics-dashboard__activity time {
    grid-column: 2;
  }
}
</style>
