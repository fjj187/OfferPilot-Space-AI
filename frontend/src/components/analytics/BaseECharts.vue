<script setup lang="ts">
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent
} from 'echarts/components'
import type { ECElementEvent, ECharts, EChartsCoreOption } from 'echarts/core'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch
} from 'vue'

use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
  CanvasRenderer
])

const props = withDefaults(defineProps<{
  option: EChartsCoreOption
  height?: number | string
}>(), {
  height: 260
})

const emit = defineEmits<{
  chartClick: [event: ECElementEvent]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
const chart = shallowRef<ECharts | null>(null)

let resizeObserver: ResizeObserver | null = null
let resizeFrame: number | null = null
let isUnmounted = false

const chartStyle = computed(() => {
  const height = typeof props.height === 'number' ? `${ props.height }px` : props.height

  return {
    height
  }
})

const resizeChart = () => {
  if (resizeFrame !== null) return

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null
    chart.value?.resize()
  })
}

const setChartOption = (option: EChartsCoreOption) => {
  chart.value?.setOption({
    animation: false,
    ...option
  }, {
    notMerge: true,
    lazyUpdate: true
  })
}

const setupChart = async () => {
  await nextTick()

  if (!chartRef.value || isUnmounted)
    return

  chart.value = init(chartRef.value, undefined, {
    renderer: 'canvas'
  })
  chart.value.on('click', event => emit('chartClick', event as ECElementEvent))
  setChartOption(props.option)

  resizeObserver = new ResizeObserver(() => resizeChart())
  resizeObserver.observe(chartRef.value)
}

watch(() => props.option, option => {
  setChartOption(option)
})

onMounted(() => {
  void setupChart()
})

onBeforeUnmount(() => {
  isUnmounted = true
  if (resizeFrame !== null) {
    window.cancelAnimationFrame(resizeFrame)
    resizeFrame = null
  }
  resizeObserver?.disconnect()
  resizeObserver = null
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div
    ref="chartRef"
    class="base-echarts"
    :style="chartStyle"
  ></div>
</template>

<style lang="scss" scoped>
.base-echarts {
  width: 100%;
  min-height: 220px;
}
</style>
