<template>
<div>

    <v-card 
    outlined
    hover 
    class="pa-6" 
    :class="['card', cardColor]"
    min-width="300"
    @click="openModal(check)"
    >
      <v-card-title class="text-wrap">{{ check.check_name }}</v-card-title>
      <v-card-subtitle class="last-checked">
        Checked: {{ formatDateTime(check.timestamp) }}
      </v-card-subtitle>
      <v-card-text>
        {{ check.output }}
      </v-card-text>
    </v-card>

      <!-- Modal -->
  <v-dialog v-model="dialog" max-width="600">
    <v-card>
      <v-card-title>
        Details
      </v-card-title>

      <v-card-text class="check-details">
          <div>Status:
            <v-chip 
              small 
              :color="getChipColor(selectedCheck?.status)" 
              dark
              class="ml-2"
            >
              {{ selectedCheck?.status }}
            </v-chip>
          </div> 
          <div>Output: {{ selectedCheck?.output }}</div>
          <v-spacer></v-spacer>
          <performance-data-chart :data="chartDataset"></performance-data-chart>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          text="Close"
          @click="dialog = false"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CheckWithStatus } from '@/types/Check'
import { formatDateTime } from '@/utils/Datetime';
import { mapPerformanceData } from '@/types/PerformanceData';
import { getCheckPerformanceData } from '@/api/pinglow';
import type { ChartData, Point } from 'chart.js';
import PerformanceDataChart from './PerformanceDataChart.vue'

const props = defineProps<{ check: CheckWithStatus }>();

const cardColor = computed(() => {
  switch (props.check.status) {
    case 'Ok':
      return 'bg-green-lighten-4'
    case 'Warning':
      return 'bg-orange-lighten-4'
    case 'Critical':
      return 'bg-red-lighten-4'
    default:
      return 'bg-purple-lighten-4'
  }
});


const dialog = ref(false);
const selectedCheck = ref<CheckWithStatus | null>(null);
const chartDataset = ref<ChartData<'line', Point[], unknown>>({
  datasets: []
});

async function openModal(check: CheckWithStatus) {
  selectedCheck.value = check
  dialog.value = true

  const performanceData = await getCheckPerformanceData(check);

  const datasets = mapPerformanceData(performanceData);

  chartDataset.value = {datasets};
}

function getChipColor(status: string | undefined): string {
  switch (status) {
    case 'Ok':
      return 'green'
    case 'Warning':
      return 'orange'
    case 'Critical':
      return 'red'
    default:
      return 'grey'
  }
}

</script>

<style scoped>
.check-details {
  display: flex;
  flex-direction: column;
}
</style>
