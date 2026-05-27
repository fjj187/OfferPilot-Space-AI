<script setup lang="tsx">
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'

interface OverviewSummaryItem {
  label: string
  value: string
  note: string
}

defineProps<{
  sectionTitle: string
  sectionBody: string
  progressPercent: number
  statusLabel: string
  summaryItems: OverviewSummaryItem[]
  primaryActionLabel: string
  /** 有报告弱项时补充说明专项训练如何承接 */
  practiceRouteNote?: string
}>()

const emit = defineEmits<{
  primaryAction: []
  openLibrary: []
  openPractice: []
  openReport: []
}>()
</script>

<template>
  <div class="overview-panel-shell">
    <SpaceSceneHeader
      :title="sectionTitle"
      :body="sectionBody"
    />

    <div class="overview-progress-card">
      <div class="overview-progress-head">
        <div>
          <div class="overview-progress-label">主任务区</div>
          <strong>{{ primaryActionLabel }}</strong>
        </div>
        <span>{{ progressPercent }}%</span>
      </div>
      <div class="overview-progress-track">
        <div
          class="overview-progress-fill"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
      <p>{{ statusLabel }}</p>
    </div>

    <div class="overview-summary-grid">
      <div
        v-for="item in summaryItems"
        :key="item.label"
        class="overview-summary-card"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.note }}</small>
      </div>
    </div>

    <div class="overview-route-card overview-summary-card">
      <span>训练路径</span>
      <strong>按资料练，或按弱项补练</strong>
      <small>
        想按资料练，请使用下方「查看资料」；想按弱项补练，请使用下方「去专项训练」。
      </small>
      <small
        v-if="practiceRouteNote"
        class="overview-route-card__note"
      >
        {{ practiceRouteNote }}
      </small>
    </div>

    <div class="overview-action-row">
      <button
        type="button"
        class="overview-action primary"
        @click="emit('primaryAction')"
      >
        {{ primaryActionLabel }}
      </button>
      <button
        type="button"
        class="overview-action"
        @click="emit('openLibrary')"
      >
        查看资料
      </button>
      <button
        type="button"
        class="overview-action"
        @click="emit('openPractice')"
      >
        去专项训练
      </button>
      <button
        type="button"
        class="overview-action"
        @click="emit('openReport')"
      >
        查看报告
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.overview-panel-shell {
  display: grid;
  gap: 16px;
  margin-top: 0;
}

.overview-progress-card,
.overview-summary-card {
  padding: 18px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 22px;
  background: rgb(10 18 34 / 0.5);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.overview-progress-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.overview-progress-label,
.overview-summary-card span {
  display: block;
  color: rgb(220 232 255 / 0.62);
  font-size: 15px;
}

.overview-progress-head strong,
.overview-summary-card strong {
  display: block;
  margin-top: 6px;
  color: #fff;
  font-size: 22px;
  font-weight: 600;
}

.overview-progress-head span {
  color: var(--scene-primary);
  font-size: 26px;
  font-weight: 600;
}

.overview-progress-track {
  height: 10px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
}

.overview-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--scene-primary) 0%, rgb(255 255 255 / 0.86) 100%);
}

.overview-progress-card p,
.overview-summary-card small {
  margin: 10px 0 0;
  color: rgb(228 238 255 / 0.72);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
}

.overview-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.overview-route-card strong {
  display: block;
  margin-top: 6px;
  color: #fff;
  font-size: 22px;
  font-weight: 600;
}

.overview-route-card__note {
  display: block;
  margin-top: 8px;
}

.overview-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.overview-action {
  height: 46px;
  padding: 0 18px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.24s ease, border-color 0.24s ease, transform 0.24s ease;
}

.overview-action.primary {
  border-color: rgb(255 255 255 / 0.06);
  background: var(--scene-primary);
  color: #081421;
}

.overview-action:hover {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.1);
  transform: translateY(-1px);
}

.overview-action.primary:hover {
  background: #fff;
}

@media (max-width: 1100px) {
  .overview-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
