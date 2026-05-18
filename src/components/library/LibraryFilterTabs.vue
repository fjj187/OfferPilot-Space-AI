<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface FilterTab {
  key: string
  label: string
}

interface Props {
  tabs: FilterTab[]
  activeKey: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [key: string]
}>()

const visibleCount = 6
const isOverflowOpen = ref(false)
const overflowTriggerRef = ref<HTMLElement | null>(null)
const overflowPopoverRef = ref<HTMLElement | null>(null)
const overflowPopoverStyle = ref<Record<string, string>>({})

const visibleTabs = computed(() => props.tabs.slice(0, visibleCount))
const overflowTabs = computed(() => props.tabs.slice(visibleCount))
const activeOverflowTab = computed(() => overflowTabs.value.find(tab => tab.key === props.activeKey) || null)

const isActive = (key: string) => props.activeKey === key

const handleTabClick = (key: string) => {
  emit('change', key)
}

const syncOverflowPopoverPosition = async () => {
  if (!isOverflowOpen.value || !overflowTriggerRef.value) return
  await nextTick()
  const triggerRect = overflowTriggerRef.value.getBoundingClientRect()
  const popoverEl = overflowPopoverRef.value
  const viewportWidth = window.innerWidth
  const targetWidth = Math.min(360, Math.max(280, triggerRect.width + 80))
  const renderedWidth = popoverEl?.offsetWidth || targetWidth
  const width = Math.min(renderedWidth, viewportWidth - 24)
  const left = Math.min(
    Math.max(12, triggerRect.left),
    viewportWidth - width - 12
  )
  const popoverHeight = popoverEl?.offsetHeight || 160
  const preferredTop = Math.max(12, triggerRect.top - popoverHeight - 12)
  const fallbackTop = Math.min(
    window.innerHeight - popoverHeight - 12,
    triggerRect.bottom + 12
  )
  const top = preferredTop >= 12 ? preferredTop : fallbackTop

  overflowPopoverStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`
  }
}

const toggleOverflow = () => {
  if (!overflowTabs.value.length) return
  isOverflowOpen.value = !isOverflowOpen.value
  if (isOverflowOpen.value) {
    void syncOverflowPopoverPosition()
  }
}

const handleViewportChange = () => {
  if (!isOverflowOpen.value) return
  void syncOverflowPopoverPosition()
}

const overflowTriggerLabel = computed(() => {
  if (activeOverflowTab.value) return activeOverflowTab.value.label
  return `更多 ${overflowTabs.value.length}+`
})

watch(isOverflowOpen, (open) => {
  if (!open) return
  void syncOverflowPopoverPosition()
})

onMounted(() => {
  window.addEventListener('resize', handleViewportChange)
  window.addEventListener('scroll', handleViewportChange, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('scroll', handleViewportChange, true)
})
</script>

<template>
  <div class="filter-row">
    <button
      v-for="tab in visibleTabs"
      :key="tab.key"
      type="button"
      class="filter-chip"
      :class="{ 'is-active': isActive(tab.key) }"
      @click="handleTabClick(tab.key)"
    >
      {{ tab.label }}
    </button>

    <button
      v-if="overflowTabs.length"
      ref="overflowTriggerRef"
      type="button"
      class="filter-chip filter-chip-expand"
      :class="{
        'is-active': Boolean(activeOverflowTab),
        'is-open': isOverflowOpen
      }"
      @click="toggleOverflow"
    >
      <span class="filter-chip-text">{{ overflowTriggerLabel }}</span>
      <span
        class="filter-chip-expand-icon"
        :class="{ 'is-open': isOverflowOpen }"
        aria-hidden="true"
      >+</span>
    </button>

    <Teleport to="body">
      <Transition name="filter-popover-fade">
        <div
          v-if="isOverflowOpen"
          ref="overflowPopoverRef"
          class="filter-popover"
          :style="overflowPopoverStyle"
        >
          <div class="filter-popover-title">更多分类</div>
          <div class="filter-popover-list">
            <button
              v-for="tab in overflowTabs"
              :key="tab.key"
              type="button"
              class="filter-popover-item"
              :class="{ 'is-active': isActive(tab.key) }"
              @click="handleTabClick(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.82);
  color: #66758f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.filter-chip:hover,
.filter-chip.is-open,
.filter-chip.is-active {
  border-color: #d8e0ff;
  background: #eef2ff;
  color: #5c72ef;
}

.filter-chip-expand {
  justify-content: space-between;
  min-width: 124px;
  gap: 10px;
}

.filter-chip-text {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-chip-expand-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 15px;
  line-height: 1;
  opacity: 0.72;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.filter-chip-expand-icon.is-open {
  opacity: 0.96;
  transform: rotate(45deg);
}

.filter-popover {
  position: fixed;
  z-index: 2000;
  min-width: 280px;
  max-width: calc(100vw - 24px);
  padding: 14px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 16px;
  background: rgb(24 20 60 / 0.96);
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.26);
  backdrop-filter: blur(16px);
}

.filter-popover::before {
  content: '';
  position: absolute;
  left: 28px;
  bottom: -6px;
  top: auto;
  right: auto;
  width: 12px;
  height: 12px;
  border-right: 1px solid rgb(255 255 255 / 0.12);
  border-bottom: 1px solid rgb(255 255 255 / 0.12);
  background: inherit;
  transform: rotate(45deg);
}

.filter-popover-title {
  color: rgb(246 249 255 / 0.94);
  font-size: 14px;
  font-weight: 600;
}

.filter-popover-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.filter-popover-item {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: rgb(239 244 255 / 0.92);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.filter-popover-item:hover,
.filter-popover-item.is-active {
  border-color: rgb(198 206 255 / 0.36);
  background: rgb(198 206 255 / 0.16);
  color: #fff;
}

.filter-popover-fade-enter-active,
.filter-popover-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  transform-origin: bottom right;
}

.filter-popover-fade-enter-from,
.filter-popover-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}
</style>
