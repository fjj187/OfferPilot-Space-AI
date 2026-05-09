<script lang="ts" setup>
</script>

<template>
  <LayoutSlotCenterPanel v-bind="$attrs">
    <template
      v-if="$slots.sidebar"
      #left
    >
      <div
        min-h-0
        flex="1 ~ col"
        :class="[
          'select-none',
          'bg-no-repeat bg-cover bg-right',
          'bg-transparent'
        ]"
        :style="{
          background: 'radial-gradient(circle at top left, rgba(113, 135, 255, 0.1), transparent 34%), linear-gradient(180deg, #fbfcff 0%, #f4f7fb 100%)'
        }"
      >
        <div
          v-if="$slots['sidebar-header']"
          py="2px"
        >
          <slot name="sidebar-header"></slot>
        </div>
        <div
          flex="1"
          pl="16px"
          pr="8px"
          pt="20px"
          pb="48px"
          overflow-y-auto
        >
          <slot name="sidebar"></slot>
        </div>
        <div
          py="14px"
          pl="16px"
          pr="8px"
          pb="24px"
        >
          <slot name="sidebar-action"></slot>
        </div>
      </div>
    </template>
    <div
      h-full
      bg="#fefbff"
    >
      <slot name="default"></slot>
    </div>
  </LayoutSlotCenterPanel>
</template>

<style lang="scss" scoped>
</style>
