<script lang="tsx" setup>
import type { CSSProperties } from 'vue'
import type { SceneItem } from '@/constants/showcase/mockInterviewSpaceScenes'

interface OrbitGhostItem {
  label: string
  style: CSSProperties
}

defineProps<{
  autoplay: boolean
  isFastOrbitTransition: boolean
  isOrbitPlayBursting: boolean
  isPlayReady: boolean
  orbitGhosts: OrbitGhostItem[]
  orbitProgress: number
  orbitClass: (index: number) => Record<string, boolean>
  orbitStopStyle: (index: number) => CSSProperties
  scenes: SceneItem[]
}>()

defineEmits<{
  next: []
  prev: []
  select: [index: number]
  toggle: []
}>()
</script>

<template>
  <section
    class="orbit-rail"
    :class="{ 'is-fast-orbit-transition': isFastOrbitTransition }"
  >
    <svg
      class="orbit-svg"
      viewBox="0 0 1200 220"
      preserveAspectRatio="none"
    >
      <path d="M -40 88 C 120 110, 250 132, 418 148 C 556 160, 670 160, 810 148 C 972 134, 1088 112, 1240 88" />
    </svg>

    <div class="orbit-controls">
      <button
        type="button"
        class="orbit-arrow"
        @click="$emit('prev')"
      >
        <span class="i-lucide-chevron-left"></span>
      </button>

      <button
        type="button"
        class="orbit-play"
        :class="{
          'is-ready': isPlayReady,
          'is-bursting': isOrbitPlayBursting
        }"
        @click="$emit('toggle')"
      >
        <span class="orbit-play-burst"></span>
        <svg
          class="orbit-progress"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            class="orbit-progress-track"
            cx="50"
            cy="50"
            r="44"
          />
          <circle
            class="orbit-progress-value"
            cx="50"
            cy="50"
            r="44"
            :style="{ strokeDashoffset: String(276.46 * (1 - orbitProgress)) }"
          />
        </svg>
        <span :class="autoplay ? 'i-lucide-pause' : 'i-lucide-play'"></span>
      </button>

      <button
        type="button"
        class="orbit-arrow"
        @click="$emit('next')"
      >
        <span class="i-lucide-chevron-right"></span>
      </button>
    </div>

    <button
      v-for="(scene, index) in scenes"
      :key="scene.id"
      type="button"
      class="orbit-stop"
      :class="orbitClass(index)"
      :style="orbitStopStyle(index)"
      @click="$emit('select', index)"
    >
      <span class="orbit-label">{{ scene.navLabel }}</span>
      <span class="orbit-dot"></span>
    </button>

    <div
      v-for="(ghost, ghostIndex) in orbitGhosts"
      :key="`orbit-ghost-${ghost.label}-${ghostIndex}`"
      class="orbit-stop orbit-ghost"
      :style="ghost.style"
    >
      <span class="orbit-label">{{ ghost.label }}</span>
      <span class="orbit-dot"></span>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.orbit-rail {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100vh - 300px);
  z-index: 60;
  height: 250px;
  pointer-events: none;
}

.orbit-svg {
  width: 100%;
  height: 100%;
}

.orbit-svg path {
  fill: none;
  stroke: var(--scene-line);
  stroke-width: 1.4;
  filter: drop-shadow(0 0 12px rgb(255 255 255 / 0.1));
}

.orbit-controls {
  position: absolute;
  left: 50%;
  top: 73.5%;
  display: flex;
  align-items: center;
  gap: 18px;
  transform: translate(-50%, -50%);
  z-index: 4;
  pointer-events: auto;
}

.orbit-arrow,
.orbit-play,
.orbit-stop {
  font: inherit;
}

.orbit-arrow,
.orbit-play {
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
}

.orbit-arrow {
  width: 34px;
  height: 34px;
  border: 0;
  background: transparent;
  color: rgb(255 255 255 / 0.88);
  font-size: 18px;
}

.orbit-play {
  position: relative;
  width: 42px;
  height: 42px;
  border: 1px solid rgb(255 255 255 / 0.4);
  background: rgb(255 255 255 / 0.05);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.12);
  font-size: 15px;
  overflow: visible;
  transition:
    border-color 0.22s ease,
    background 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.22s ease;
}

.orbit-play.is-ready {
  border-color: rgb(167 206 255 / 0.72);
  background: rgb(110 169 255 / 0.12);
  box-shadow:
    0 0 0 1px rgb(167 206 255 / 0.16),
    0 0 22px rgb(87 159 255 / 0.14),
    inset 0 1px 0 rgb(255 255 255 / 0.18);
}

.orbit-play-burst {
  position: absolute;
  inset: -8px;
  border-radius: 999px;
  border: 1px solid rgb(167 206 255 / 0.42);
  opacity: 0;
  pointer-events: none;
}

.orbit-play.is-bursting .orbit-play-burst {
  animation: orbitPlayBurst 0.72s ease-out forwards;
}

.orbit-progress {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.orbit-progress-track,
.orbit-progress-value {
  fill: none;
  stroke-width: 1.4;
}

.orbit-progress-track {
  stroke: rgb(255 255 255 / 0.14);
}

.orbit-progress-value {
  stroke: rgb(255 255 255 / 0.88);
  stroke-linecap: round;
  stroke-dasharray: 276.46;
  transition: stroke-dashoffset 0.12s linear;
}

.orbit-stop {
  position: absolute;
  width: 132px;
  height: 84px;
  padding: 0;
  border: 0;
  background: transparent;
  transform: translate(-50%, -50%);
  cursor: pointer;
  pointer-events: auto;
  transition:
    left 1.04s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    top 1.04s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    opacity 0.3s ease;
}

.orbit-rail.is-fast-orbit-transition .orbit-stop {
  transition:
    left 0.36s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    top 0.36s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    opacity 0.22s ease;
}

.orbit-label {
  position: absolute;
  left: 50%;
  top: -2px;
  color: rgb(255 255 255 / 0.84);
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  transform: translateX(-50%);
  transition: color 0.3s ease, top 0.3s ease, font-size 0.3s ease;
}

.orbit-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--scene-dot);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 4px transparent;
  transition: transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
}

.orbit-stop.is-active .orbit-label {
  top: -10px;
  color: #fff;
  font-size: 16px;
}

.orbit-stop.is-active .orbit-dot {
  background: var(--scene-dot-active);
  box-shadow: 0 0 0 6px rgb(255 255 255 / 0.08);
  transform: translate(-50%, -50%) scale(1.08);
}

.orbit-stop.is-center-node .orbit-dot {
  opacity: 0;
  box-shadow: none;
  transform: translate(-50%, -50%) scale(0.6);
}

.orbit-ghost {
  pointer-events: none;
  opacity: 0.72;
}

@keyframes orbitPlayBurst {
  0% {
    opacity: 0.72;
    transform: scale(0.82);
  }

  70% {
    opacity: 0.28;
    transform: scale(1.42);
  }

  100% {
    opacity: 0;
    transform: scale(1.7);
  }
}

@media (max-width: 780px) {
  .orbit-label {
    font-size: 15px;
  }
}
</style>
