<template>
  <span class="streaming-cursor" />
</template>

<style lang="scss" scoped>
.streaming-cursor {
  display: inline-block;
  width: 8px;
  height: 1.15em;
  margin-left: 2px;
  border-radius: 999px;
  vertical-align: -2px;
  background: #6a7cf6;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 0.15;
  }

  50% {
    opacity: 1;
  }
}
</style>
