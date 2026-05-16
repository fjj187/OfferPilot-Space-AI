<script setup lang="ts">
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'

interface PracticeDrill {
  id: string
  title: string
  desc: string
  value: string
}

interface PracticeOption {
  label: string
  value: string
}

const props = defineProps<{
  navLabel: string
  sectionTitle: string
  sectionBody: string
  primaryWeakness: string
  weaknessTags: string[]
}>()

const emit = defineEmits<{
  continueMock: []
  openReport: []
}>()

const fallbackWeaknessTags = ['结构化表达', '追问应对', '指标量化']
const zoneOptions: PracticeOption[] = [
  {
    label: 'Vue',
    value: 'vue'
  },
  {
    label: 'JavaScript',
    value: 'javascript'
  },
  {
    label: 'TypeScript',
    value: 'typescript'
  },
  {
    label: '工程化',
    value: 'engineering'
  },
  {
    label: '性能优化',
    value: 'performance'
  }
]

const questionCountOptions: PracticeOption[] = [
  {
    label: '5 题',
    value: '5'
  },
  {
    label: '10 题',
    value: '10'
  },
  {
    label: '15 题',
    value: '15'
  }
]

const difficultyOptions: PracticeOption[] = [
  {
    label: '基础',
    value: 'easy'
  },
  {
    label: '进阶',
    value: 'medium'
  },
  {
    label: '高阶',
    value: 'hard'
  }
]

const selectedWeakness = ref('')
const selectedZone = ref('vue')
const selectedQuestionType = ref('concept')
const selectedQuestionCount = ref('10')
const selectedDifficulty = ref('medium')

const displayedWeaknessTags = computed(() => {
  return props.weaknessTags.length ? props.weaknessTags.slice(0, 5) : fallbackWeaknessTags
})

const mainWeakness = computed(() => props.primaryWeakness || displayedWeaknessTags.value[0])

const practiceDrills = computed<PracticeDrill[]>(() => [
  {
    id: 'type-concept',
    title: '概念理解题',
    desc: '适合查漏补缺，要求把概念、边界和常见误区讲清楚。',
    value: 'concept'
  },
  {
    id: 'type-code',
    title: '代码分析题',
    desc: '适合训练读代码、找问题、解释执行结果和优化思路。',
    value: 'code'
  },
  {
    id: 'type-scenario',
    title: '场景追问题',
    desc: '适合把知识点放回项目语境，训练面试官连续追问时的表达。',
    value: 'scenario'
  }
])

const activeWeakness = computed(() => selectedWeakness.value || mainWeakness.value)
const selectedZoneLabel = computed(() => zoneOptions.find(item => item.value === selectedZone.value)?.label || 'Vue')
const selectedQuestionTypeLabel = computed(() => {
  return practiceDrills.value.find(item => item.value === selectedQuestionType.value)?.title || '概念理解题'
})
const selectedDifficultyLabel = computed(() => {
  return difficultyOptions.find(item => item.value === selectedDifficulty.value)?.label || '进阶'
})
</script>

<template>
  <div class="practice-scene">
    <SpaceSceneHeader
      :title="sectionTitle"
      :body="sectionBody"
    />

    <section class="practice-layout">
      <div class="practice-main">
        <div class="weakness-panel">
          <div class="panel-label">第一步 · 查看当前弱点</div>
          <h3>{{ activeWeakness }}</h3>
          <p>先确认这轮要收敛的问题，再选择专项训练范围。</p>
          <div class="weakness-tags">
            <button
              v-for="tag in displayedWeaknessTags"
              :key="tag"
              type="button"
              :class="{ 'is-active': activeWeakness === tag }"
              @click="selectedWeakness = tag"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <div class="selector-panel">
          <div class="panel-label">第二步 · 选择专项专区</div>
          <div class="option-grid">
            <button
              v-for="zone in zoneOptions"
              :key="zone.value"
              type="button"
              class="option-chip"
              :class="{ 'is-active': selectedZone === zone.value }"
              @click="selectedZone = zone.value"
            >
              {{ zone.label }}
            </button>
          </div>
        </div>

        <div class="drill-grid">
          <button
            v-for="drill in practiceDrills"
            :key="drill.id"
            type="button"
            class="drill-card"
            :class="{ 'is-active': selectedQuestionType === drill.value }"
            @click="selectedQuestionType = drill.value"
          >
            <div class="drill-meta">题型</div>
            <h3>{{ drill.title }}</h3>
            <p>{{ drill.desc }}</p>
          </button>
        </div>
      </div>

      <aside class="practice-side">
        <div class="side-card">
          <div class="panel-label">第三步 · 设置题量和难度</div>
          <div class="side-option-group">
            <span>题数</span>
            <div class="side-options">
              <button
                v-for="option in questionCountOptions"
                :key="option.value"
                type="button"
                :class="{ 'is-active': selectedQuestionCount === option.value }"
                @click="selectedQuestionCount = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="side-option-group">
            <span>难度</span>
            <div class="side-options">
              <button
                v-for="option in difficultyOptions"
                :key="option.value"
                type="button"
                :class="{ 'is-active': selectedDifficulty === option.value }"
                @click="selectedDifficulty = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="side-card action-card">
          <div class="panel-label">第四步 · 开始训练</div>
          <h3>{{ selectedZoneLabel }} · {{ selectedQuestionTypeLabel }}</h3>
          <p>
            将围绕“{{ activeWeakness }}”生成 {{ selectedQuestionCount }} 道{{ selectedDifficultyLabel }}题，
            进入模拟面试后用追问验证是否真的掌握。
          </p>
          <div class="action-row">
            <button
              type="button"
              class="scene-action primary"
              @click="emit('continueMock')"
            >
              开始模拟面试
            </button>
            <button
              type="button"
              class="scene-action"
              @click="emit('openReport')"
            >
              查看报告
            </button>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped lang="scss">
.practice-scene {
  display: grid;
  gap: 24px;
}

.panel-label,
.drill-meta {
  color: var(--scene-primary);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.weakness-panel p,
.drill-card p,
.action-card p {
  margin: 14px 0 0;
  color: rgb(232 244 255 / 78%);
  font-size: 16px;
  line-height: 1.75;
}

.practice-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
  gap: 24px;
}

.practice-main,
.practice-side {
  display: grid;
  gap: 16px;
}

.weakness-panel,
.selector-panel,
.drill-card,
.side-card {
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 24px;
  background: rgb(255 255 255 / 6%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 6%);
  backdrop-filter: blur(16px);
}

.weakness-panel,
.selector-panel {
  padding: 24px;
}

.weakness-panel h3,
.side-card h3,
.drill-card h3 {
  margin: 9px 0 0;
  color: #fff;
  font-size: 24px;
}

.weakness-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.weakness-tags button,
.option-chip,
.side-options button {
  padding: 10px 14px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 999px;
  background: rgb(255 255 255 / 8%);
  color: rgb(244 250 255 / 88%);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}

.weakness-tags button:hover,
.weakness-tags button.is-active,
.option-chip:hover,
.option-chip.is-active,
.side-options button:hover,
.side-options button.is-active,
.drill-card:hover,
.drill-card.is-active {
  border-color: rgb(186 245 255 / 48%);
  background: rgb(186 245 255 / 14%);
  transform: translateY(-1px);
}

.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.drill-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.drill-card,
.side-card {
  padding: 20px;
}

.drill-card {
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}

.side-option-group {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.side-option-group > span {
  color: rgb(232 244 255 / 72%);
  font-size: 16px;
  font-weight: 700;
}

.side-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-row {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.scene-action {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 999px;
  background: rgb(255 255 255 / 8%);
  color: #fff;
  font: inherit;
  cursor: pointer;
  transition: background 0.22s ease, transform 0.22s ease;
}

.scene-action.primary {
  border-color: transparent;
  background: var(--scene-primary);
  color: #071521;
  font-weight: 800;
}

.scene-action:hover {
  background: rgb(255 255 255 / 14%);
  transform: translateY(-1px);
}

.scene-action.primary:hover {
  background: #fff;
}

@media (max-width: 1100px) {
  .practice-layout,
  .drill-grid {
    grid-template-columns: 1fr;
  }
}
</style>
