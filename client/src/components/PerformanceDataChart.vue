<template>
    <Line ref="lineChart" :data="props.data" :options="chartOptions" />
</template>

<script setup lang="ts">
import { Line, type ChartComponentRef } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  type ChartData,
  type Point
} from 'chart.js'
import type { ChartOptions } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns'
import { computed, nextTick, onMounted, ref } from 'vue';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  zoomPlugin
)

const props = defineProps<{
  data: ChartData<'line', Point[], unknown>}>();


const pointData = computed(() => { 
  return props.data.datasets.flatMap(dataset => dataset.data.map(point => point.y));
})

const min = computed(() => {
  return Math.min(...pointData.value);
});

const max = computed(() => {
  return Math.max(...pointData.value);
});


const lineChart = ref<ChartComponentRef<'line'> | null>(null);

onMounted(() => {
  nextTick(() => {
    console.log("zooming")
    zoomToLastPercent(0.1);
  });
});

const chartOptions = computed<ChartOptions<'line'>>(() => {
  return {
  responsive: true,
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'minute',
        tooltipFormat: 'PPpp',
        displayFormats: {
          minute: 'MMM d, HH:mm',
        },

      },
      title: {
        display: true,
        text: 'Timestamp'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Performance'
      },
      min: min.value - (min.value * 0.025),
      max: max.value + (max.value * 0.025),
    }
  },
    plugins: {
    zoom: {
      limits: {
      x: {
        min: 'original',
        max: 'original',
        minRange: 10 // Prevent zooming in too far
      },
      y: {
        min: 'original',
        max: 'original',
        minRange: 5
      }
    },
      zoom: {
        wheel: {
          enabled: true 
        },
        pinch: {
          enabled: true
        },
        mode: 'x'
      },
      pan: {
        enabled: true,
        mode: 'x'
      }
    }
  }
}
});

function zoomToLastPercent(percent: number) {
  const chart = lineChart.value?.chart;
  if (!chart) return;

  const xScale = chart.scales['x'];
  if (!xScale) return;

  const fullMin = xScale.min;
  const fullMax = xScale.max;

  if (fullMin === undefined || fullMax === undefined) return;

  const range = fullMax - fullMin;
  const newMin = fullMax - range * percent;
  const newMax = fullMax;

  xScale.options.min = newMin;
  xScale.options.max = newMax;

  chart.update();
}
</script>