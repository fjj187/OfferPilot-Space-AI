<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  body: string
  asideMinWidth?: string
}>(), {
  asideMinWidth: '320px'
})

const slots = useSlots()
const hasAside = computed(() => Boolean(slots.aside))
</script>

<template>
  <header
    class="space-scene-header"
    :class="{ 'has-aside': hasAside }"
    :style="{ '--scene-header-aside-min': props.asideMinWidth }"
  >
    <div class="space-scene-header-copy">
      <h2>{{ title }}</h2>
      <p>{{ body }}</p>
    </div>

    <div
      v-if="hasAside"
      class="space-scene-header-aside"
    >
      <slot name="aside"></slot>
    </div>
  </header>
</template>

<style scoped lang="scss">
.space-scene-header {
  display: grid;
  gap: 34px;
  align-items: start;
}

.space-scene-header.has-aside {
  grid-template-columns: minmax(0, 1fr) minmax(var(--scene-header-aside-min), 0.98fr);
}

.space-scene-header-copy {
  min-width: 0;
  max-width: 880px;
}

.space-scene-header h2 {
  margin: 0;
  color: #fff;
  font-size: clamp(36px, 5vw, 70px);
  font-weight: 600;
  line-height: 0.98;
}

.space-scene-header p {
  max-width: 760px;
  margin: 16px 0 0;
  color: rgb(237 244 255 / 0.82);
  font-size: 16px;
  line-height: 1.7;
}

.space-scene-header-aside {
  min-width: 0;
}

@media (max-width: 1100px) {
  .space-scene-header.has-aside {
    grid-template-columns: 1fr;
  }
}
</style>
