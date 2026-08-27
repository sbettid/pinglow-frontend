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
      
      <v-card-title class="text-wrap">
        {{ check.check_name }}
        <v-icon v-if="check.notifications_muted" class="notifications-icon" icon="mdi-bell-cancel" size="small"></v-icon>
         <v-icon v-if="check.passive" class="notifications-icon" icon="mdi-eye-check" size="small"></v-icon>
      </v-card-title>
      <v-card-subtitle v-if="check.timestamp !== null" class="last-checked">
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
       id="modal-content"
       :class="{ rotated: isMobile && isPortrait }"

      >
      <v-card-text class="check-details">
        <div class="description">
          <div class="check-details-header">
            <b>Details</b>
            <div class="check-controls">
            <v-menu :location-strategy="isMobile && isPortrait? landscapeLocationStrategy: 'connected'"
              location="bottom"
              origin="top left"
            >
              <template v-slot:activator="{ props }">
                 <v-btn v-bind="props" v-if="check.notifications_muted" rounded="lg" variant="plain" icon="mdi-bell-cancel"></v-btn>
                <v-btn v-bind="props" v-else class="notifications-icon" rounded="lg" variant="plain" icon="mdi-bell" ></v-btn>
              </template>
              <v-list class="menu">
                <v-list-item @click="muteNotifications(check, 60)">
                  <v-list-item-title>Mute for 1h</v-list-item-title>
                </v-list-item>
                <v-list-item @click="muteNotifications(check, 480)">
                  <v-list-item-title>Mute for 8h</v-list-item-title>
                </v-list-item>
                <v-list-item @click="muteNotifications(check, 1440)">
                  <v-list-item-title>Mute for 1 day</v-list-item-title>
                </v-list-item>
                <v-list-item @click="muteNotifications(check, 10080)">
                  <v-list-item-title>Mute for 1 week</v-list-item-title>
                </v-list-item>
                <v-list-item @click="muteNotifications(check, null)">
                  <v-list-item-title>Mute forever</v-list-item-title>
                </v-list-item>
                <v-list-item @click="unmuteNotifications(check)">
                  <v-list-item-title>Un-mute</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-menu :location-strategy="isMobile && isPortrait? landscapeLocationStrategy: 'connected'"
              location="bottom"
              origin="top left">
              <template v-slot:activator="{ props }">
                 <v-btn v-bind="props" rounded="lg" variant="plain" icon="mdi-dots-vertical"></v-btn>
              </template>
              <v-list class="menu">
                <v-list-item @click="scheduleCheckNow(check)">
                  <v-list-item-title>Schedule now</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            </div>
          </div>
          
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
          <div class="notifications-muted-message" v-if="check.notifications_muted">
            Notifications muted {{ check.notifications_muted_until !== null? "until " + check.notifications_muted_until: "" }}
          </div>
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
import { getCheckPerformanceData, muteNotificaton, scheduleCheckNow, unmuteNotificaton } from '@/api/pinglow';
import type { ChartData, Point } from 'chart.js';
import PerformanceDataChart from './PerformanceDataChart.vue'


const emit = defineEmits(['refresh-check'])
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
    case 'Pending':
      return 'bg-blue-lighten-4'
    default:
      return 'bg-purple-lighten-4'
  }
});


const dialog = ref(false);
const selectedCheck = ref<CheckWithStatus | null>(null);
const chartDataset = ref<ChartData<'line', Point[], unknown>>({
  datasets: []
});

async function muteNotifications(check: CheckWithStatus, durationMinutes: number | null) {

  let muteUntil = null;

  if (durationMinutes !== null) {
    const now = new Date();

    now.setMinutes(now.getMinutes() + durationMinutes);

    muteUntil = now.toISOString();
  }

  await muteNotificaton(check, muteUntil);

  emit("refresh-check");

}

async function unmuteNotifications(check: CheckWithStatus) {
  await unmuteNotificaton(check);
  emit("refresh-check");
}

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
    case 'Pending':
      return 'blue'
    default:
      return 'purple'
  }
}

const landscapeLocationStrategy = (
  data: any,
  _props: any,
  contentStyles: any
) => {
  const updateLocation = () => {
    const target = data.target.value
    const content = data.contentEl.value

    if (!target || !content || Array.isArray(target)) {
      return
    }

    const targetRect = target.getBoundingClientRect()

    // Unrotated menu dimensions
    const menuWidth = content.offsetWidth
    const menuHeight = content.offsetHeight

    // Visual dimensions after rotate(90deg)
    const visualWidth = menuHeight
    const visualHeight = menuWidth

    const gap = 4

    const visualLeft =
      targetRect.left - visualWidth - gap

    const visualTop = targetRect.top

    /*
     * Because transform-origin is center center,
     * CSS transforms the original box around its center.
     *
     * Convert the desired VISUAL top/left back into the
     * top/left of the untransformed overlay element.
     */
    const left =
      visualLeft -
      (menuWidth - visualWidth) / 2

    const top =
      visualTop -
      (menuHeight - visualHeight) / 2

    Object.assign(contentStyles.value, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      transform: 'rotate(90deg)',
      transformOrigin: 'center center',
    })
  }

  requestAnimationFrame(updateLocation)

  return {
    updateLocation,
  }
}


</script>

<style scoped>
.check-details {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.menu {
  min-width: 180px;
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

.notifications-icon {
  margin-top: -3px;
  color: #4f5b50;
}

.check-details-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .check-controls {
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
  }
}

.notifications-muted-message {
  color: #4f5b50;
  font-size: small;
}

@media (max-width: 768px) {
  .check-details {
    flex-direction: row;
  }
}
</style>
