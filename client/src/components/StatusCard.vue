<template>
<div>

    <v-card 
    outlined
    hover 
    class="pa-6" 
    :class="['card', cardColor]"
    min-width="270"
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
  <v-dialog 
    v-model="dialog" 
    :max-width="isMobile? '100%' : '800'" 
    class="transition-transform duration-300" 
    :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'"
    :fullscreen="isMobile"
  >
    <v-card>
      <div
       class="modal-rotated"
        :class="{ rotated: isMobile && isPortrait }"

      >
      <v-card-text class="check-details">
        <div class="description">
          <b>Details</b>
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
        </div>
        
          <performance-data-chart class="chart" :data="chartDataset"></performance-data-chart>
      </v-card-text>

      <v-card-actions class="actions">
        <v-spacer class="space"></v-spacer>

        <v-btn
          class="close"
          text="Close"
          @click="dialog = false"
        ></v-btn>
      </v-card-actions>
      </div>
    </v-card>
  </v-dialog>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { CheckWithStatus } from '@/types/Check'
import { formatDateTime } from '@/utils/Datetime';
import { mapPerformanceData } from '@/types/PerformanceData';
import { getCheckPerformanceData } from '@/api/pinglow';
import type { ChartData, Point } from 'chart.js';
import PerformanceDataChart from './PerformanceDataChart.vue'

const props = defineProps<{ check: CheckWithStatus }>();

const isMobile = ref(false)
const isPortrait = ref(false)

function updateDeviceState() {
  isMobile.value = window.innerWidth < 768
  isPortrait.value = window.matchMedia('(orientation: portrait)').matches
}

onMounted(() => {
  updateDeviceState()
  window.addEventListener('resize', updateDeviceState)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDeviceState)
})

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
  flex-grow: 1;
}

.rotated {
  transform: rotate(90deg);

  .check-details {
    height: 90dvw;
    width: 97dvh;
    padding: 15px;
  }

  .description {
    min-width: 200px;
    margin-top: 20px;
  }

  .chart {
    align-self: center;
    width: 70% !important;
    margin-top: 20px;
  }

  .actions {
    width: 97dvh;
    justify-content: center;

    .space {
      flex-grow: unset;
      width: 0;
      height: 0;
    }

    .close {
      padding-bottom: 20px;
    }
  }
}

@media (max-width: 768px) {
  .check-details {
    flex-direction: row;
  }
}
</style>
