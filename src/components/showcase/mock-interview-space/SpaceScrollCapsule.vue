<script lang="tsx" setup>
defineProps<{
  isUserScrolling: boolean
  visible?: boolean
}>()

defineEmits<{
  scroll: []
}>()
</script>

<template>
  <button
    type="button"
    class="scroll-capsule"
    :class="{ 'is-user-scrolling': isUserScrolling, 'is-hidden': visible === false }"
    aria-label="Scroll to content"
    @click="$emit('scroll')"
  >
    <span class="scroll-capsule-arrow i-lucide-arrow-down"></span>
  </button>
</template>

<style lang="scss" scoped>
.scroll-capsule {
  position: fixed;
  top: 50%;
  right: 54px;
  z-index: 26;
  display: grid;
  place-items: start center;
  width: 28px;
  height: 60px;
  padding-top: 20px;
  border: 1px solid rgb(255 255 255 / 0.42);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.02)),
    rgb(4 18 34 / 0.18);
  color: rgb(255 255 255 / 0.94);
  box-shadow:
    0 18px 42px rgb(5 16 31 / 0.28),
    inset 0 0 0 1px rgb(255 255 255 / 0.06);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transform: translateY(-50%);
  overflow: hidden;
  transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease, opacity 0.24s ease;
}

.scroll-capsule:hover {
  border-color: rgb(255 255 255 / 0.64);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.05)),
    rgb(4 18 34 / 0.26);
  transform: translateY(calc(-50% - 2px));
}

.scroll-capsule.is-user-scrolling {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: 0 10px 24px rgb(5 16 31 / 0.18);
}

.scroll-capsule.is-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(calc(-50% + 10px)) scale(0.92);
}

.scroll-capsule-arrow {
  font-size: 15px;
  transition: transform 0.85s cubic-bezier(0.22, 0.84, 0.24, 1);
}

.scroll-capsule:hover .scroll-capsule-arrow {
  transform: translateY(18px);
}

@media (max-width: 1100px) {
  .scroll-capsule {
    right: 22px;
    width: 24px;
    height: 52px;
    padding-top: 16px;
  }
}
</style>
