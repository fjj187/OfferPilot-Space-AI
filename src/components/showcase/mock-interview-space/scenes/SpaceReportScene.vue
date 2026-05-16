<script setup lang="tsx">
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'

interface ReportOverviewStatItem {
  label: string
  value: string
  note: string
}

interface ReportSnapshotItem {
  label: string
  value: string
}

interface ReportHistoryItem {
  topic: string
  answeredCount: number
  totalCount: number
  weaknessTags: string[]
}

defineProps<{
  navLabel: string
  sectionTitle: string
  sectionBody: string
  headerMeta: string[]
  overviewStats: ReportOverviewStatItem[]
  primaryWeakness: string
  weaknessTags: string[]
  snapshotItems: ReportSnapshotItem[]
  suggestionList: string[]
  latestHistory: ReportHistoryItem | null
  currentTopicLabel: string
  topicLabelMap: Record<string, string>
  hasSummary: boolean
}>()

const emit = defineEmits<{
  continueMock: []
  backLibrary: []
  openHistory: []
  openWorkbenchReport: []
}>()
</script>

<template>
  <div class="report-scene-standalone">
    <SpaceSceneHeader
      :title="sectionTitle"
      :body="sectionBody"
    />

    <div class="report-scene-shell">
      <div class="report-scene-container">
        <div class="report-scene-hero">
          <div>
            <div class="report-scene-kicker">Recent mission report</div>
            <h3>{{ hasSummary ? '真实复盘摘要已接入当前宇宙场景' : '当前先按最新训练结果生成规则型复盘' }}</h3>
            <p>
              {{ hasSummary
                ? `当前承接的是 ${currentTopicLabel} 这轮训练的最近复盘结果。`
                : '当前还没有独立 summary，先使用最近一轮训练 session 生成可读摘要。' }}
            </p>
          </div>
          <div class="report-scene-hero-meta">
            <span
              v-for="item in headerMeta"
              :key="item"
              class="report-scene-meta-pill"
            >
              {{ item }}
            </span>
          </div>
        </div>

        <section class="report-scene-section">
          <div class="report-scene-card-label">本轮概览</div>
          <div class="report-scene-inline-stats">
            <article
              v-for="item in overviewStats"
              :key="item.label"
              class="report-scene-inline-stat"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.note }}</small>
            </article>
          </div>
        </section>

        <section class="report-scene-section">
          <div class="report-scene-card-label">核心洞察</div>
          <div class="report-scene-weakness-head">
            <strong>{{ primaryWeakness }}</strong>
            <span>{{ weaknessTags.length }} 个标签</span>
          </div>
          <div
            v-if="weaknessTags.length"
            class="report-scene-tags"
          >
            <span
              v-for="tag in weaknessTags.slice(0, 4)"
              :key="tag"
              class="report-scene-tag"
            >
              {{ tag }}
            </span>
          </div>
          <div class="report-scene-snapshot compact">
            <div
              v-for="item in snapshotItems.slice(0, 2)"
              :key="item.label"
              class="report-scene-snapshot-row"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <ul class="report-scene-suggestions">
            <li
              v-for="item in suggestionList.slice(0, 2)"
              :key="item"
            >
              {{ item }}
            </li>
          </ul>
        </section>

        <section class="report-scene-section">
          <div class="report-scene-card-label">下一步动作</div>
          <div class="report-scene-actions">
            <button
              type="button"
              class="report-scene-action primary"
              @click="emit('continueMock')"
            >
              继续模拟面试
            </button>
            <button
              type="button"
              class="report-scene-action"
              @click="emit('backLibrary')"
            >
              返回资料库
            </button>
            <button
              type="button"
              class="report-scene-action"
              @click="emit('openHistory')"
            >
              查看训练历史
            </button>
            <button
              type="button"
              class="report-scene-action ghost"
              @click="emit('openWorkbenchReport')"
            >
              打开旧版报告页
            </button>
          </div>
        </section>

        <section class="report-scene-section">
          <div class="report-scene-card-label">最近历史摘要</div>
          <article
            v-if="latestHistory"
            class="report-scene-history-item"
          >
            <div>
              <strong>{{ topicLabelMap[latestHistory.topic] || latestHistory.topic }}</strong>
              <span>{{ latestHistory.answeredCount }} / {{ latestHistory.totalCount }} 题</span>
            </div>
            <p>{{ latestHistory.weaknessTags[0] || '暂无稳定弱项' }}</p>
          </article>
          <p
            v-else
            class="report-scene-empty"
          >
            当前还没有历史摘要，完成一轮训练后这里会开始沉淀记录。
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.report-scene-shell {
  display: block;
}

.report-scene-standalone {
  display: grid;
  gap: 24px;
}

.report-scene-kicker,
.report-scene-card-label {
  color: var(--scene-primary);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-scene-container {
  display: grid;
  gap: 16px;
}

.report-scene-hero,
.report-scene-section {
  padding: 22px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 24px;
  background: linear-gradient(180deg, rgb(46 14 19 / 0.88) 0%, rgb(78 24 23 / 0.82) 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.report-scene-hero h3 {
  margin-top: 14px;
  color: rgb(248 250 255 / 0.98);
  font-size: clamp(24px, 2.4vw, 34px);
  line-height: 1.2;
}

.report-scene-hero p,
.report-scene-empty,
.report-scene-history-item p {
  margin-top: 12px;
  color: rgb(233 241 255 / 0.78);
  font-size: 16px;
  line-height: 1.75;
}

.report-scene-hero-meta,
.report-scene-tags,
.report-scene-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.report-scene-hero-meta {
  margin-top: 18px;
}

.report-scene-meta-pill,
.report-scene-tag {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 999px;
  background: rgb(49 15 20 / 0.46);
  color: rgb(249 251 255 / 0.94);
  font-size: 15px;
  font-weight: 400;
}

.report-scene-snapshot {
  display: grid;
  gap: 14px;
  margin-top: 14px;
}

.report-scene-snapshot.compact {
  margin-top: 18px;
}

.report-scene-inline-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.report-scene-inline-stat {
  padding: 16px 18px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 18px;
  background: rgb(255 255 255 / 0.03);
}

.report-scene-inline-stat span {
  color: rgb(226 236 255 / 0.68);
  font-size: 15px;
}

.report-scene-inline-stat strong {
  display: block;
  margin-top: 10px;
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.1;
}

.report-scene-inline-stat small {
  display: block;
  margin-top: 10px;
  color: rgb(233 241 255 / 0.72);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
}

.report-scene-snapshot-row,
.report-scene-history-item div,
.report-scene-weakness-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.report-scene-snapshot-row span,
.report-scene-weakness-head span,
.report-scene-history-item span {
  color: rgb(226 236 255 / 0.68);
  font-size: 15px;
  font-weight: 400;
}

.report-scene-snapshot-row strong,
.report-scene-weakness-head strong,
.report-scene-history-item strong {
  color: rgb(248 250 255 / 0.98);
  font-size: 17px;
  font-weight: 600;
}

.report-scene-weakness-head {
  margin-top: 14px;
}

.report-scene-suggestions {
  display: grid;
  gap: 12px;
  margin-top: 14px;
  padding-left: 18px;
  color: rgb(239 245 255 / 0.86);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.75;
}

.report-scene-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}

.report-scene-action {
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 14px;
  background: linear-gradient(180deg, rgb(53 16 20 / 0.62) 0%, rgb(78 24 22 / 0.42) 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.report-scene-action:hover {
  transform: translateY(-1px);
  border-color: rgb(255 255 255 / 0.26);
  background: linear-gradient(180deg, rgb(63 19 24 / 0.72) 0%, rgb(89 28 25 / 0.52) 100%);
}

.report-scene-action.primary {
  border-color: rgb(139 246 220 / 0.34);
  background: linear-gradient(180deg, rgb(77 130 118 / 0.44) 0%, rgb(45 90 80 / 0.34) 100%);
}

.report-scene-action.ghost {
  color: rgb(232 239 255 / 0.82);
}

.report-scene-history-item {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 18px;
  background: linear-gradient(180deg, rgb(60 19 20 / 0.92) 0%, rgb(92 30 24 / 0.86) 100%);
}

.report-scene-history-item p {
  margin-bottom: 0;
}

@media (max-width: 1100px) {
  .report-scene-inline-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .report-scene-snapshot-row,
  .report-scene-history-item div,
  .report-scene-weakness-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
