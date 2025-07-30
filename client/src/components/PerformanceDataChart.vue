<template>
    <Line :data="props.data" :options="chartOptions" />
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
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
import { computed } from 'vue';

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

console.log(min);
console.log(max)

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
      min: min.value - (min.value * 0.05),
      max: max.value + (max.value * 0.05),
    }
  }
}
});

</script>