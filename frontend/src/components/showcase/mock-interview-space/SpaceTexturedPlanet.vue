<script lang="tsx" setup>
import type { CSSProperties } from 'vue'

defineProps<{
  alt?: string
  fitMode?: 'cover' | 'contain'
  imageStyle?: CSSProperties
  showShade?: boolean
  src: string
}>()
</script>

<template>
  <span
    class="space-textured-planet"
    :class="`is-${fitMode ?? 'cover'}`"
  >
    <img
      class="space-textured-planet__image"
      :src="src"
      :alt="alt ?? ''"
      decoding="async"
      draggable="false"
      :style="imageStyle"
    >
    <span
      v-if="(showShade ?? true) && (fitMode ?? 'cover') === 'cover'"
      class="space-textured-planet__shade"
    ></span>
  </span>
</template>

<style lang="scss" scoped>
.space-textured-planet {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  transform: translateZ(0);
  user-select: none;
}

.space-textured-planet.is-contain {
  inset: -42%;
  overflow: visible;
  border-radius: 0;
}

.space-textured-planet__image {
  position: absolute;
  left: 50%;
  top: 50%;
  display: block;
  width: 112%;
  height: 112%;
  border-radius: inherit;
  object-fit: cover;
  object-position: 50% 50%;
  transform: translate(-50%, -50%) scale(1.12);
  transform-origin: center;
  user-select: none;
}

.space-textured-planet.is-contain .space-textured-planet__image {
  width: 190%;
  height: 190%;
  border-radius: 0;
  object-fit: contain;
  transform: translate(-50%, -50%) scale(1);
}

.space-textured-planet__shade {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 34% 24%, rgb(255 255 255 / 0.28) 0%, transparent 22%),
    radial-gradient(circle at 46% 44%, transparent 0 58%, rgb(7 18 42 / 0.24) 78%, rgb(1 5 18 / 0.54) 100%),
    linear-gradient(132deg, rgb(255 255 255 / 0.16) 0%, transparent 31%, rgb(0 0 0 / 0.18) 68%, rgb(0 0 0 / 0.42) 100%);
  pointer-events: none;
}
</style>
