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
import 'chartjs-adapter-date-fns'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale
)

const props = defineProps<{
  data: ChartData<'line', Point[], unknown>}>();


const chartOptions: ChartOptions<'line'> = {
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
      }
    }
  }
};
</script>