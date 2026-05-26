<script setup lang="ts">
import ReportReviewMarkdown from '@/components/report/ReportReviewMarkdown.vue'
import { cleanReportQuestionTitle } from '@/utils/report/clean-report-question-title'
import { isReportQuestionUnanswered } from '@/utils/report/format-report-thread-dialogue'
import { formatReportDialogueText, formatReportPlainText } from '@/utils/report/format-report-plain-text'

interface ReportSnapshotItem {
  label: string
  value: string
}

interface ReportQuestionReviewItem {
  questionId: string
  questionTitle: string
  userAnswer: string
  referenceAnswer?: string
  aiFeedback?: string
}

const props = defineProps<{
  show: boolean
  hasSummary: boolean
  summaryHeadline: string
  summaryBody: string
  headerMeta: string[]
  focusAreas: string[]
  weaknessTags: string[]
  answerSnapshot: string[]
  questionReviews: ReportQuestionReviewItem[]
  suggestionList: string[]
  snapshotItems: ReportSnapshotItem[]
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  continuePractice: []
  continueMock: []
}>()

const documentHeadline = computed(() => {
  return props.summaryHeadline || '本轮模拟已经生成复盘报告'
})

const documentSummary = computed(() => {
  return props.summaryBody || '这轮训练已经形成阶段性复盘结论，建议先阅读完整报告，再决定继续补练还是再做一轮模拟。'
})

const documentConclusions = computed(() => {
  const weaknessA = props.weaknessTags[0] || '结构表达'
  const weaknessB = props.weaknessTags[1] || '案例细节'
  return [
    `当前最明显的问题集中在“${ weaknessA }”，回答已经碰到关键点，但还不够完整。`,
    `第二个信号是“${ weaknessB }”，说明当前表达还缺少更有说服力的细节支撑。`,
    '建议先看完整报告确认问题，再决定是按弱项补练，还是再做一轮模拟验证。'
  ]
})

const hasQuestionReviews = computed(() => props.questionReviews.length > 0)

const isUnanswered = (userAnswer: string) => isReportQuestionUnanswered(userAnswer)

/** 资料参考答案：只展示资料原文要点，不再重复逐题复盘 */
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

const legacyEvidenceList = computed(() => [
  {
    title: '题目摘录',
    body: props.answerSnapshot[0] || '当前题目的回答已经开始覆盖主题，但还没有稳定展开。'
  },
  {
    title: '回答片段',
    body: props.answerSnapshot[1] || '当前回答偏短，结论、过程和结果之间的衔接还不完整。'
  },
  {
    title: '复盘依据',
    body: props.answerSnapshot[2] || documentSummary.value
  }
])

const analysisList = computed(() => {
  const areas = props.focusAreas.length ? props.focusAreas : ['结构表达', '案例细节', '结果指标']
  return areas.slice(0, 3).map((item) => ({
    title: item,
    summary: `当前这一轮在“${ item }”上已经暴露出明显信号，需要进入下一步收敛。`,
    action: `下一轮训练建议优先围绕“${ item }”做更定向的表达强化。`
  }))
})

const closeModal = () => emit('update:show', false)
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    class="report-preview-modal"
    size="huge"
    :bordered="false"
    :closable="false"
    :mask-closable="true"
    @update:show="emit('update:show', $event)"
  >
    <div class="report-preview-shell">
      <div class="report-preview-head">
        <div>
          <div class="report-preview-kicker">Review Report</div>
          <h2>{{ documentHeadline }}</h2>
          <p>{{ documentSummary }}</p>
        </div>
        <button
          type="button"
          class="report-preview-close"
          @click="closeModal"
        >
          关闭
        </button>
      </div>

      <div class="report-preview-meta">
        <span
          v-for="item in headerMeta"
          :key="item"
          class="report-preview-pill"
        >
          {{ item }}
        </span>
      </div>

      <div
        v-if="!hasSummary"
        class="report-preview-fallback-note"
      >
        当前还没有独立报告摘要，以下内容先按最近一轮训练记录生成阶段性复盘，方便你继续补练或再来一轮模拟。
      </div>

      <div class="report-preview-layout">
        <article class="report-preview-document">
          <section class="report-preview-section">
            <div class="report-preview-section-kicker">本轮结论</div>
            <ul class="report-preview-list">
              <li
                v-for="item in documentConclusions"
                :key="item"
              >
                {{ item }}
              </li>
            </ul>
          </section>

          <section
            v-if="hasQuestionReviews"
            class="report-preview-section"
          >
            <div class="report-preview-section-kicker">逐题复盘</div>
            <p class="report-preview-section-desc">
              每题固定为三部分：你的答案、正确答案、缺点和改进方向。
            </p>
            <div class="report-preview-evidence-list">
              <article
                v-for="(item, index) in questionReviews"
                :key="item.questionId"
                class="report-preview-evidence-item"
              >
                <strong>第 {{ index + 1 }} 题 · {{ cleanReportQuestionTitle(item.questionTitle) }}</strong>

                <div class="report-preview-review-block">
                  <span>我的答案</span>
                  <p class="report-preview-dialogue-text">{{ formatReportDialogueText(item.userAnswer, 2400) || '未作答' }}</p>
                </div>

                <div class="report-preview-review-block is-reference">
                  <span>正确答案</span>
                  <ReportReviewMarkdown
                    v-if="item.referenceAnswer"
                    :content="item.referenceAnswer"
                    variant="light"
                  />
                  <p
                    v-else
                    class="report-preview-empty-note"
                  >
                    本题暂无收录参考答案，请查看下方「资料参考答案」或回到资料库核对原文。
                  </p>
                </div>

                <div
                  v-if="item.aiFeedback"
                  class="report-preview-review-block is-feedback"
                >
                  <span>缺点和改进方向</span>
                  <ReportReviewMarkdown
                    :content="item.aiFeedback"
                    variant="light"
                  />
                </div>
                <div
                  v-else-if="isUnanswered(item.userAnswer)"
                  class="report-preview-review-block is-muted"
                >
                  <span>缺点和改进方向</span>
                  <p>本题未作答，请先对照正确答案理解要点后再补练。</p>
                </div>
              </article>
            </div>
          </section>

          <section
            v-if="materialReferenceList.length"
            class="report-preview-section"
          >
            <div class="report-preview-section-kicker">资料参考答案</div>
            <p class="report-preview-section-desc">
              来自本轮训练资料的原文要点，便于和逐题复盘对照，不再重复你的作答与 AI 反馈。
            </p>
            <div class="report-preview-evidence-list">
              <article
                v-for="item in materialReferenceList"
                :key="`ref-${ item.questionId }`"
                class="report-preview-evidence-item is-material-reference"
              >
                <strong>第 {{ item.order }} 题 · {{ item.title }}</strong>
                <ReportReviewMarkdown
                  :content="item.referenceAnswer"
                  variant="light"
                />
              </article>
            </div>
          </section>

          <section
            v-else-if="!hasQuestionReviews"
            class="report-preview-section"
          >
            <div class="report-preview-section-kicker">关键证据</div>
            <div class="report-preview-evidence-list">
              <article
                v-for="item in legacyEvidenceList"
                :key="item.title"
                class="report-preview-evidence-item"
              >
                <strong>{{ item.title }}</strong>
                <p>{{ item.body }}</p>
              </article>
            </div>
          </section>

          <section class="report-preview-section">
            <div class="report-preview-section-kicker">问题拆解</div>
            <div class="report-preview-analysis-list">
              <article
                v-for="item in analysisList"
                :key="item.title"
                class="report-preview-analysis-item"
              >
                <strong>{{ item.title }}</strong>
                <p>{{ item.summary }}</p>
                <small>{{ item.action }}</small>
              </article>
            </div>
          </section>
        </article>

        <aside class="report-preview-sidebar">
          <section class="report-preview-side-card">
            <div class="report-preview-section-kicker">训练建议</div>
            <ul class="report-preview-action-list">
              <li
                v-for="item in suggestionList.slice(0, 4)"
                :key="item"
              >
                {{ item }}
              </li>
            </ul>
          </section>

          <section class="report-preview-side-card">
            <div class="report-preview-section-kicker">下一步动作</div>
            <div class="report-preview-action-stack">
              <button
                type="button"
                class="report-preview-action primary"
                @click="emit('continuePractice')"
              >
                按弱项继续补练
              </button>
              <button
                type="button"
                class="report-preview-action"
                @click="emit('continueMock')"
              >
                再来一轮模拟
              </button>
            </div>
          </section>

          <section class="report-preview-side-card">
            <div class="report-preview-section-kicker">弱项标签</div>
            <div class="report-preview-tag-list">
              <span
                v-for="tag in weaknessTags.slice(0, 4)"
                :key="tag"
                class="report-preview-tag"
              >
                {{ tag }}
              </span>
            </div>
          </section>

          <section class="report-preview-side-card">
            <div class="report-preview-section-kicker">本轮记录</div>
            <div class="report-preview-record-list">
              <div
                v-for="item in snapshotItems.slice(0, 3)"
                :key="item.label"
                class="report-preview-record-item"
              >
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </n-modal>
</template>

<style scoped lang="scss">
.report-preview-modal :deep(.n-card) {
  width: min(1200px, calc(100vw - 48px));
  max-height: calc(100vh - 40px);
  padding: 0;
  border-radius: 28px;
  background: #f8fafc;
  overflow: hidden;
}

.report-preview-modal :deep(.n-card > .n-card__content) {
  max-height: calc(100vh - 40px);
  padding: 0;
  overflow: auto;
}

.report-preview-shell {
  padding: 30px;
}

.report-preview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.report-preview-kicker,
.report-preview-section-kicker {
  color: #5f72f5;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-preview-section-desc {
  margin-top: 10px;
  color: #64748b;
  font-size: 15px;
  line-height: 1.75;
}

.report-preview-head h2 {
  margin: 10px 0 0;
  color: #1f2746;
  font-size: 34px;
  line-height: 1.2;
}

.report-preview-head p,
.report-preview-evidence-item p,
.report-preview-analysis-item p {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.85;
}

.report-preview-close,
.report-preview-action {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid #dbe3f0;
  border-radius: 14px;
  background: white;
  color: #334155;
  font: inherit;
  cursor: pointer;
}

.report-preview-action.primary {
  border-color: transparent;
  background: linear-gradient(180deg, #6578f9 0%, #5567e8 100%);
  color: #fff;
}

.report-preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.report-preview-fallback-note {
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid #d7defd;
  border-radius: 16px;
  background: #eef2ff;
  color: #4c5fc7;
  font-size: 14px;
  line-height: 1.7;
}

.report-preview-pill,
.report-preview-tag {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-size: 14px;
}

.report-preview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.82fr);
  gap: 20px;
  margin-top: 24px;
}

.report-preview-document,
.report-preview-side-card {
  border: 1px solid #e6edf6;
  border-radius: 24px;
  background: #fff;
}

.report-preview-document {
  padding: 28px;
}

.report-preview-section + .report-preview-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #edf2f7;
}

.report-preview-list {
  display: grid;
  gap: 14px;
  margin: 16px 0 0;
  padding-left: 20px;
  color: #334155;
  font-size: 16px;
  line-height: 1.85;
}

.report-preview-evidence-list,
.report-preview-analysis-list {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.report-preview-evidence-item,
.report-preview-analysis-item {
  padding: 18px;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  background: #fbfdff;
}

.report-preview-evidence-item strong,
.report-preview-analysis-item strong,
.report-preview-record-item strong {
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.45;
}

.report-preview-review-block {
  margin-top: 14px;
}

.report-preview-review-block span {
  display: block;
  color: #64748b;
  font-size: 15px;
  font-weight: 600;
}

.report-preview-review-block p {
  margin-top: 8px;
  color: #334155;
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.report-preview-review-block.is-reference span {
  color: #2563eb;
}

.report-preview-review-block.is-feedback span {
  color: #b45309;
}

.report-preview-review-block.is-muted p,
.report-preview-empty-note {
  margin-top: 8px;
  color: #64748b;
  font-size: 15px;
  line-height: 1.75;
}

.report-preview-review-block :deep(.report-review-markdown) {
  margin-top: 8px;
}

.report-preview-evidence-item.is-material-reference p {
  margin-top: 10px;
}

.report-preview-analysis-item small {
  display: block;
  margin-top: 10px;
  color: #4f46e5;
  font-size: 14px;
  line-height: 1.75;
}

.report-preview-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-preview-side-card {
  padding: 22px;
}

.report-preview-action-stack {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.report-preview-action-list {
  display: grid;
  gap: 10px;
  margin: 14px 0 0;
  padding-left: 18px;
  color: #475569;
  font-size: 14px;
  line-height: 1.75;
}

.report-preview-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.report-preview-record-list {
  display: grid;
  gap: 14px;
  margin-top: 14px;
}

.report-preview-record-item span {
  color: #64748b;
  font-size: 14px;
}

.report-preview-record-item strong {
  display: block;
  margin-top: 8px;
  line-height: 1.75;
}

@media (max-width: 1100px) {
  .report-preview-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .report-preview-shell {
    padding: 18px;
  }

  .report-preview-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
