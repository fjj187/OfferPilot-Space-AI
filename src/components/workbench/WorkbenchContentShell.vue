<script lang="ts" setup>
interface Props {
  hasAside?: boolean
  asideWidth?: string
}

withDefaults(defineProps<Props>(), {
  hasAside: false,
  asideWidth: 'minmax(280px, 0.8fr)'
})
</script>

<template>
  <main class="content-page">
    <div
      class="content-shell"
      :class="{ 'has-aside': hasAside }"
      :style="hasAside ? { gridTemplateColumns: `minmax(0, 1.7fr) ${asideWidth}` } : {}"
    >
      <section class="content-main">
        <slot />
      </section>

      <aside
        v-if="hasAside && $slots.aside"
        class="content-aside"
      >
        <slot name="aside" />
      </aside>
    </div>
  </main>
</template>

<style lang="scss" scoped>
.content-page {
  flex: 1;
  min-height: 0;
  padding: 0 30px 8px;
}

.content-shell {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 28px;
  border: 1px solid #e8edf6;
  border-radius: 28px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
  overflow: hidden;
}

.content-shell.has-aside {
  display: grid;
  gap: 22px;
}

.content-main,
.content-aside {
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 12px;
}

.content-main {
  padding-right: 6px;
}

.content-aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1200px) {
  .content-shell.has-aside {
    grid-template-columns: 1fr;
  }
}
</style>
