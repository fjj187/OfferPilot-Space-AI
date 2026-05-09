<script lang="ts" setup>
import FlowStepCard from '@/components/workbench/FlowStepCard.vue'
import GuidanceCard from '@/components/workbench/GuidanceCard.vue'
import LibraryCard from '@/components/workbench/LibraryCard.vue'
import OverviewHero from '@/components/workbench/OverviewHero.vue'
import PracticeQueueCard from '@/components/workbench/PracticeQueueCard.vue'
import ReviewSnapshotCard from '@/components/workbench/ReviewSnapshotCard.vue'
import TopicChips from '@/components/workbench/TopicChips.vue'
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import type {
  GuidanceAction,
  GuidanceCardItem,
  LibraryCardItem,
  OverviewTopicKey,
  PracticeQueueItem
} from './overview.data'
import {
  guidanceCards,
  interviewFlow,
  libraryCards,
  practiceQueue,
  quickTopics,
  reviewSnapshot
} from './overview.data'

const router = useRouter()

const activeTopic = ref<OverviewTopicKey>(quickTopics[0].key)
const selectedLibraryId = ref(libraryCards[0]?.id || '')
const selectedGuidanceId = ref(guidanceCards[0]?.id || '')
const selectedQueueId = ref(practiceQueue[0]?.id || '')

const topicLabelMap = quickTopics.reduce<Record<string, string>>((map, topic) => {
  map[topic.key] = topic.label
  return map
}, {})

const filteredLibraryCards = computed(() => {
  return libraryCards.filter(card => card.topics.includes(activeTopic.value))
})

const filteredGuidanceCards = computed(() => {
  return guidanceCards.filter(card => !card.topicKey || card.topicKey === activeTopic.value)
})

const rankedPracticeQueue = computed(() => {
  return [...practiceQueue].sort((prev, next) => {
    const prevScore = prev.topicKey === activeTopic.value ? 1 : 0
    const nextScore = next.topicKey === activeTopic.value ? 1 : 0
    return nextScore - prevScore
  })
})

const visiblePracticeQueue = computed(() => rankedPracticeQueue.value.slice(0, 3))

watch(filteredLibraryCards, list => {
  if (!list.length) return
  const exists = list.some(item => item.id === selectedLibraryId.value)
  if (!exists) {
    selectedLibraryId.value = list[0].id
  }
}, { immediate: true })

watch(filteredGuidanceCards, list => {
  if (!list.length) return
  const exists = list.some(item => item.id === selectedGuidanceId.value)
  if (!exists) {
    selectedGuidanceId.value = list[0].id
  }
}, { immediate: true })

watch(visiblePracticeQueue, list => {
  if (!list.length) return
  const exists = list.some(item => item.id === selectedQueueId.value)
  if (!exists) {
    selectedQueueId.value = list[0].id
  }
}, { immediate: true })

const buildLibraryQuery = (card?: LibraryCardItem) => {
  return {
    topic: activeTopic.value,
    ...(card ? { docType: card.docType, source: card.id } : {})
  }
}

const navigateByGuidance = (action: GuidanceAction, card?: GuidanceCardItem) => {
  const topic = card?.topicKey || activeTopic.value

  if (action === 'go-mock-interview') {
    router.push({
      name: 'WorkbenchMockInterview',
      query: {
        mode: 'guided',
        topic
      }
    })
    return
  }

  if (action === 'go-practice') {
    router.push({
      name: 'WorkbenchPractice',
      query: {
        topic,
        source: card?.id || 'overview'
      }
    })
    return
  }

  router.push({
    name: 'WorkbenchReport',
    query: {
      from: 'overview',
      topic
    }
  })
}

const handleHeroPrimaryAction = () => {
  router.push({
    name: 'WorkbenchLibrary',
    query: {
      topic: activeTopic.value,
      source: 'hero-import'
    }
  })
}

const handleHeroSecondaryAction = () => {
  router.push({
    name: 'WorkbenchReport',
    query: {
      from: 'hero',
      topic: activeTopic.value,
      sample: 'weekly'
    }
  })
}

const handleLibrarySelect = (id: string) => {
  selectedLibraryId.value = id
  const card = libraryCards.find(item => item.id === id)
  router.push({
    name: 'WorkbenchLibrary',
    query: buildLibraryQuery(card)
  })
}

const handleViewAll = () => {
  router.push({
    name: 'WorkbenchLibrary',
    query: {
      topic: activeTopic.value
    }
  })
}

const handleGuidanceSelect = (id: string) => {
  selectedGuidanceId.value = id
  const card = guidanceCards.find(item => item.id === id)
  if (!card) return
  navigateByGuidance(card.action, card)
}

const handleQueueSelect = (id: string) => {
  selectedQueueId.value = id
  const queueItem = practiceQueue.find(item => item.id === id)
  if (!queueItem) return

  router.push({
    name: 'WorkbenchPractice',
    query: {
      topic: queueItem.topicKey,
      difficulty: queueItem.difficulty,
      questionCount: String(queueItem.questionCount),
      source: queueItem.id
    }
  })
}

const activeTopicLabel = computed(() => topicLabelMap[activeTopic.value] || '当前主题')

const handleTopicChange = (topic: string) => {
  activeTopic.value = topic as OverviewTopicKey
}
</script>

<template>
  <WorkbenchContentShell has-aside aside-width="minmax(240px, 315px)">
    <OverviewHero
      @primary-action="handleHeroPrimaryAction"
      @secondary-action="handleHeroSecondaryAction"
    />

    <TopicChips
      :topics="quickTopics"
      :active-topic="activeTopic"
      @change="handleTopicChange"
    />

    <div class="section-head">
      <div>
        <div class="section-kicker">资料库概览</div>
        <h2>最近导入的核心资料</h2>
        <p class="section-note">当前主题：{{ activeTopicLabel }}</p>
      </div>
      <n-button
        text
        type="primary"
        @click="handleViewAll"
      >
        查看全部
      </n-button>
    </div>

    <div class="library-grid">
      <LibraryCard
        v-for="card in filteredLibraryCards"
        :key="card.id"
        :id="card.id"
        :title="card.title"
        :meta="card.meta"
        :desc="card.desc"
        :accent="card.accent"
        :active="card.id === selectedLibraryId"
        @select="handleLibrarySelect"
      />
    </div>

    <div class="section-head compact">
      <div>
        <div class="section-kicker">训练闭环</div>
        <h2>一轮完整面试会怎么走</h2>
      </div>
    </div>

    <div class="flow-grid">
      <FlowStepCard
        v-for="step in interviewFlow"
        :key="step.id"
        :label="step.label"
        :detail="step.detail"
        :icon="step.icon"
      />
    </div>

    <template #aside>
      <section class="rail-card">
        <div class="rail-card-head">
          <div>
            <div class="section-kicker">AI 引导</div>
            <h3>建议你先做这些</h3>
            <p class="rail-note">会跟随当前主题切换入口建议</p>
          </div>
        </div>

        <div class="guidance-list">
          <GuidanceCard
            v-for="card in filteredGuidanceCards"
            :key="card.id"
            :id="card.id"
            :title="card.title"
            :desc="card.desc"
            :tone="card.tone"
            :active="card.id === selectedGuidanceId"
            @select="handleGuidanceSelect"
          />
        </div>
      </section>

      <section class="rail-card">
        <div class="rail-card-head">
          <div>
            <div class="section-kicker">专项训练队列</div>
            <h3>你的薄弱点分布</h3>
            <p class="rail-note">点击卡片会带着主题进入刷题页</p>
          </div>
          <span class="i-lucide-sliders-horizontal rail-icon"></span>
        </div>

        <div class="queue-list">
          <PracticeQueueCard
            v-for="item in visiblePracticeQueue"
            :key="item.id"
            :id="item.id"
            :title="item.title"
            :progress="item.progress"
            :note="item.note"
            :question-count="item.questionCount"
            :difficulty="item.difficulty"
            :active="item.id === selectedQueueId"
            @select="handleQueueSelect"
          />
        </div>
      </section>

      <ReviewSnapshotCard
        :title="reviewSnapshot.title"
        :status-text="reviewSnapshot.statusText"
        :score="reviewSnapshot.score"
        :delta="reviewSnapshot.delta"
        :highlights="reviewSnapshot.highlights"
        @open-report="navigateByGuidance('go-report')"
      />
    </template>
  </WorkbenchContentShell>
</template>

<style lang="scss" scoped>
.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.section-head h2,
.rail-card-head h3 {
  margin: 6px 0 0;
  font-size: 22px;
  color: #1f2746;
}

.section-note,
.rail-note {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #7b88a0;
}

.section-head.compact {
  margin-top: 20px;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 10px;
}

.rail-card {
  padding: 20px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.rail-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rail-icon {
  color: #93a0b6;
  font-size: 18px;
}

.guidance-list,
.queue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 1440px) {
  .library-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .flow-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 900px) {
  .library-grid,
  .flow-grid {
    grid-template-columns: 1fr;
  }
}
</style>
