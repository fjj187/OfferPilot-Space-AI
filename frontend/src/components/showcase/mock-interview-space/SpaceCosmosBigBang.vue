<script lang="ts" setup>
const emit = defineEmits<{
  complete: []
}>()

const particles = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  angle: (360 / 28) * index,
  delay: `${ 0.04 + (index % 7) * 0.02 }s`,
  size: 3 + (index % 5),
  distance: `${ 22 + (index % 6) * 2.4 }vmax`
}))

const BANG_DURATION_MS = 1480

let completeTimer: ReturnType<typeof setTimeout> | null = null

const finish = () => {
  emit('complete')
}

onMounted(() => {
  completeTimer = window.setTimeout(finish, BANG_DURATION_MS)
})

onBeforeUnmount(() => {
  if (completeTimer) {
    window.clearTimeout(completeTimer)
    completeTimer = null
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      class="space-cosmos-bigbang"
      aria-hidden="true"
    >
      <div class="bigbang-flash"></div>
      <div class="bigbang-core"></div>
      <div class="bigbang-shockwave bigbang-shockwave--a"></div>
      <div class="bigbang-shockwave bigbang-shockwave--b"></div>
      <div class="bigbang-shockwave bigbang-shockwave--c"></div>
      <div class="bigbang-dust">
        <span
          v-for="particle in particles"
          :key="particle.id"
          class="bigbang-particle"
          :style="{
            '--particle-angle': `${ particle.angle }deg`,
            '--particle-delay': particle.delay,
            '--particle-size': `${ particle.size }px`,
            '--particle-distance': particle.distance
          }"
        ></span>
      </div>
      <div class="bigbang-vignette"></div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.space-cosmos-bigbang {
  position: fixed;
  inset: 0;
  z-index: 3500;
  pointer-events: none;
  overflow: hidden;
  background: rgb(3 6 14 / 0.35);
}

.bigbang-flash {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 24vmax;
  height: 24vmax;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.2);
  background: radial-gradient(circle, rgb(255 255 255 / 0.95) 0%, rgb(170 240 255 / 0.55) 28%, transparent 72%);
  animation: bigbang-flash 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.bigbang-core {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 8vmax;
  height: 8vmax;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  background: radial-gradient(circle, #fff 0%, rgb(118 247 234 / 0.9) 42%, transparent 72%);
  animation: bigbang-core 0.42s ease-out forwards;
}

.bigbang-shockwave {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 16vmax;
  height: 16vmax;
  border: 2px solid rgb(140 220 255 / 0.55);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.15);
  opacity: 0;
  animation: bigbang-shockwave 1.15s cubic-bezier(0.12, 0.85, 0.22, 1) forwards;
}

.bigbang-shockwave--b {
  animation-delay: 0.1s;
  border-color: rgb(118 247 234 / 0.42);
}

.bigbang-shockwave--c {
  animation-delay: 0.2s;
  border-color: rgb(180 140 255 / 0.32);
}

.bigbang-dust {
  position: absolute;
  inset: 0;
}

.bigbang-particle {
  position: absolute;
  left: 50%;
  top: 46%;
  width: var(--particle-size);
  height: var(--particle-size);
  border-radius: 50%;
  background: rgb(220 245 255 / 0.78);
  box-shadow: 0 0 10px rgb(118 247 234 / 0.45);
  transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(0);
  animation: bigbang-particle 1.05s cubic-bezier(0.15, 0.9, 0.2, 1) forwards;
  animation-delay: var(--particle-delay);
}

.bigbang-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 46%, transparent 0%, rgb(5 8 16 / 0.15) 42%, rgb(5 8 16 / 0.72) 100%);
  opacity: 0;
  animation: bigbang-vignette 1.2s ease forwards;
}

@keyframes bigbang-flash {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.15);
  }

  18% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2.8);
  }
}

@keyframes bigbang-core {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }

  30% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
  }
}

@keyframes bigbang-shockwave {
  0% {
    opacity: 0.85;
    transform: translate(-50%, -50%) scale(0.15);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(4.6);
  }
}

@keyframes bigbang-particle {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(0) scale(0.4);
  }

  20% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--particle-angle)) translateX(var(--particle-distance)) scale(0.2);
  }
}

@keyframes bigbang-vignette {
  0% {
    opacity: 0;
  }

  35% {
    opacity: 0.45;
  }

  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .space-cosmos-bigbang {
    display: none;
  }
}
</style>
