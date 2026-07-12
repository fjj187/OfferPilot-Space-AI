<script setup lang="ts">
import { computed } from 'vue'
import ReportReviewMarkdown from '@/components/report/ReportReviewMarkdown.vue'
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'
import { cleanReportQuestionTitle } from '@/utils/report/clean-report-question-title'
import { isReportQuestionUnanswered } from '@/utils/report/format-report-thread-dialogue'
import { formatReportDialogueText } from '@/utils/report/format-report-plain-text'

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

interface ReportQuestionReviewItem {
  questionId: string
  questionTitle: string
  userAnswer: string
  referenceAnswer?: string
  aiFeedback?: string
}

const props = defineProps<{
  navLabel: string
  sectionTitle: string
  sectionBody: string
  headerMeta: string[]
  generationSuccessVisible: boolean
  summaryHeadline: string
  summaryBody: string
  answerSnapshot: string[]
  questionReviews: ReportQuestionReviewItem[]
  focusAreas: string[]
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

const isUnanswered = (userAnswer: string) => isReportQuestionUnanswered(userAnswer)

const materialReferenceList = computed(() => (
  props.questionReviews
    .map((item, index) => ({
      order: index + 1,
      questionId: item.questionId,
      title: cleanReportQuestionTitle(item.questionTitle),
      referenceAnswer: item.referenceAnswer?.trim() || ''
    }))
    .filter(item => item.referenceAnswer)
))

const emit = defineEmits<{
  continueMock: []
  continuePractice: []
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
        <section class="report-scene-hero">
          <div class="report-scene-kicker">Round complete</div>
          <div
            v-if="generationSuccessVisible && hasSummary"
            class="report-scene-success-tip"
          >
            生成报告成功，已为你跳转到本轮复盘报告。
          </div>
          <h3>{{ hasSummary ? '这轮训练已经生成复盘报告' : '这轮训练已经结束' }}</h3>
          <p>{{ summaryBody }}</p>
          <div
            v-if="!hasSummary"
            class="report-scene-fallback-note"
          >
            当前还没有独立报告摘要，先按最近一轮训练记录生成阶段性复盘，方便你继续补练或回到模拟面试。
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

          <div class="report-scene-primary-actions">
            <button
              type="button"
              class="report-scene-action primary"
              @click="emit('openWorkbenchReport')"
            >
              {{ hasSummary ? '查看完整报告' : '查看阶段性报告' }}
            </button>
            <button
              type="button"
              class="report-scene-action"
              @click="emit('continuePractice')"
            >
              按弱项继续补练
            </button>
            <button
              type="button"
              class="report-scene-action"
              @click="emit('continueMock')"
            >
              再来一轮模拟
            </button>
          </div>
        </section>

        <section
          v-if="questionReviews.length"
          class="report-scene-section"
        >
          <div class="report-scene-card-label">逐题复盘</div>
          <p class="report-scene-section-desc">
            每题固定为三部分：我的答案、正确答案、缺点和改进方向。
          </p>
          <div class="report-scene-review-list">
            <article
              v-for="(item, index) in questionReviews"
              :key="item.questionId"
              class="report-scene-review-card"
            >
              <header class="report-scene-review-head">
                <span class="report-scene-review-index">第 {{ index + 1 }} 题</span>
                <strong>{{ cleanReportQuestionTitle(item.questionTitle) }}</strong>
              </header>

              <div class="report-scene-review-block">
                <span>我的答案</span>
                <p class="report-scene-dialogue-text">{{ formatReportDialogueText(item.userAnswer, 2400) || '未作答' }}</p>
              </div>

              <div class="report-scene-review-block reference">
                <span>正确答案</span>
                <ReportReviewMarkdown
                  v-if="item.referenceAnswer"
                  :content="item.referenceAnswer"
                  variant="dark"
                />
                <p
                  v-else
                  class="report-scene-empty-note"
                >
                  本题暂无收录参考答案，请查看下方「资料参考答案」或回到资料库核对原文。
                </p>
              </div>

              <div
                v-if="item.aiFeedback"
                class="report-scene-review-block feedback"
              >
                <span>缺点和改进方向</span>
                <ReportReviewMarkdown
                  :content="item.aiFeedback"
                  variant="dark"
                />
              </div>
              <div
                v-else-if="isUnanswered(item.userAnswer)"
                class="report-scene-review-block muted"
              >
                <span>缺点和改进方向</span>
                <p>本题未作答，请先对照正确答案理解要点后再补练。</p>
              </div>
            </article>
          </div>
        </section>

        <section
          v-if="materialReferenceList.length"
          class="report-scene-section"
        >
          <div class="report-scene-card-label">资料参考答案</div>
          <p class="report-scene-section-desc">
            来自本轮训练资料的原文要点，便于对照，不重复逐题复盘内容。
          </p>
          <div class="report-scene-review-list">
            <article
              v-for="item in materialReferenceList"
              :key="`ref-${ item.questionId }`"
              class="report-scene-review-card is-material-reference"
            >
              <header class="report-scene-review-head">
                <span class="report-scene-review-index">第 {{ item.order }} 题</span>
                <strong>{{ item.title }}</strong>
              </header>
              <div class="report-scene-review-block reference">
                <span>资料原文要点</span>
                <ReportReviewMarkdown
                  :content="item.referenceAnswer"
                  variant="dark"
                />
              </div>
            </article>
          </div>
        </section>

        <section class="report-scene-section">
          <div class="report-scene-card-label">接下来怎么做</div>
          <div class="report-scene-guidance-grid">
            <article class="report-scene-guide-card">
              <span>1</span>
              <strong>先看完整报告</strong>
              <p>把这轮的整体表现、问题分布和建议看完整，再决定下一步训练方式。</p>
            </article>
            <article class="report-scene-guide-card">
              <span>2</span>
              <strong>按弱项继续补练</strong>
              <p>如果你想马上收敛问题，直接进入专项补练会更高效。</p>
            </article>
            <article class="report-scene-guide-card">
              <span>3</span>
              <strong>回到模拟面试验证</strong>
              <p>补练之后再做一轮模拟，最容易看出问题有没有真的收住。</p>
            </article>
          </div>
        </section>

        <section class="report-scene-section">
          <div class="report-scene-card-label">快捷入口</div>
          <div class="report-scene-actions">
            <button
              type="button"
              class="report-scene-action ghost"
              @click="emit('openHistory')"
            >
              查看训练历史
            </button>
            <button
              type="button"
              class="report-scene-action ghost"
              @click="emit('backLibrary')"
            >
              返回资料库
            </button>
          </div>
        </section>

        <section
          v-if="latestHistory"
          class="report-scene-section compact"
        >
          <div class="report-scene-card-label">最近一轮记录</div>
          <article class="report-scene-history-item">
            <div>
              <strong>{{ topicLabelMap[latestHistory.topic] || latestHistory.topic }}</strong>
              <span>{{ latestHistory.answeredCount }} / {{ latestHistory.totalCount }} 题</span>
            </div>
            <p>{{ latestHistory.weaknessTags[0] || '已生成训练记录，可进入完整报告查看详情。' }}</p>
          </article>
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
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
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
  border-radius: 20px;
  background: linear-gradient(180deg, rgb(46 14 19 / 0.88) 0%, rgb(78 24 23 / 0.82) 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
}

.report-scene-hero h3 {
  margin-top: 12px;
  color: rgb(248 250 255 / 0.98);
  font-size: clamp(24px, 2.2vw, 32px);
  line-height: 1.2;
}

.report-scene-section-desc {
  margin-top: 10px;
  color: rgb(226 236 255 / 0.72);
  font-size: 15px;
  line-height: 1.7;
}

.report-scene-review-list {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.report-scene-review-card {
  padding: 16px 18px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 16px;
  background: rgb(255 255 255 / 0.03);
}

.report-scene-review-head {
  display: grid;
  gap: 8px;
}

.report-scene-review-index {
  color: rgb(139 246 220 / 0.88);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.report-scene-review-head strong {
  color: rgb(248 250 255 / 0.98);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.45;
}

.report-scene-review-block {
  margin-top: 14px;
}

.report-scene-review-block span {
  display: block;
  color: rgb(226 236 255 / 0.72);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.report-scene-review-block p {
  margin-top: 8px;
  color: rgb(233 241 255 / 0.9);
  font-size: 16px;
  line-height: 1.75;
  white-space: pre-wrap;
}

.report-scene-review-block.muted p,
.report-scene-empty-note {
  color: rgb(226 236 255 / 0.68);
  font-size: 15px;
  line-height: 1.75;
}

.report-scene-review-block :deep(.report-review-markdown) {
  margin-top: 8px;
}

.report-scene-review-block.reference span {
  color: rgb(178 220 255 / 0.78);
}

.report-scene-review-block.feedback span {
  color: rgb(255 214 170 / 0.82);
}

.report-scene-hero p,
.report-scene-guide-card p,
.report-scene-history-item p {
  margin-top: 12px;
  color: rgb(233 241 255 / 0.78);
  font-size: 16px;
  line-height: 1.75;
}

.report-scene-hero-meta,
.report-scene-actions,
.report-scene-primary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.report-scene-fallback-note {
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid rgb(178 206 255 / 0.18);
  border-radius: 14px;
  background: rgb(82 116 185 / 0.14);
  color: rgb(230 240 255 / 0.92);
  font-size: 14px;
  line-height: 1.7;
}

.report-scene-success-tip {
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid rgb(139 246 220 / 0.32);
  border-radius: 14px;
  background: rgb(25 120 100 / 0.18);
  color: rgb(223 255 248 / 0.94);
  font-size: 15px;
  line-height: 1.65;
}

.report-scene-hero-meta {
  margin-top: 18px;
}

.report-scene-primary-actions {
  margin-top: 20px;
}

.report-scene-meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 999px;
  background: rgb(49 15 20 / 0.46);
  color: rgb(249 251 255 / 0.94);
  font-size: 15px;
}

.report-scene-guidance-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.report-scene-guide-card {
  padding: 18px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 16px;
  background: rgb(255 255 255 / 0.03);
}

.report-scene-guide-card span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
  color: rgb(244 248 255 / 0.88);
  font-size: 14px;
  font-weight: 700;
}

.report-scene-guide-card strong,
.report-scene-history-item strong {
  display: block;
  margin-top: 14px;
  color: rgb(248 250 255 / 0.98);
  font-size: 18px;
  font-weight: 600;
}

.report-scene-actions {
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

.report-scene-section.compact {
  padding-top: 18px;
  padding-bottom: 18px;
}

.report-scene-history-item {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, rgb(60 19 20 / 0.92) 0%, rgb(92 30 24 / 0.86) 100%);
}

.report-scene-history-item div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.report-scene-history-item span {
  color: rgb(226 236 255 / 0.68);
  font-size: 15px;
}

.report-scene-history-item p {
  margin-bottom: 0;
}

@media (max-width: 1100px) {
  .report-scene-guidance-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .report-scene-history-item div,
  .report-scene-primary-actions,
  .report-scene-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
