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
    <v-card
      class="check-modal-card"
      :class="{ 'mobile-rotated-card': isMobile && isPortrait }"
    >
      <div
       class="modal-rotated"
       id="modal-content"
       :class="{ rotated: isMobile && isPortrait }"
      >
      <div class="modal-header">
        <v-tabs v-model="activeTab" color="primary" grow>
          <v-tab value="overview">Overview</v-tab>
          <v-tab value="history">History</v-tab>
        </v-tabs>
        <v-btn
          icon="mdi-close"
          variant="text"
          aria-label="Close dialog"
          @click="dialog = false"
        ></v-btn>
      </div>

      <v-window v-model="activeTab" class="modal-window">
        <v-window-item value="overview">
          <v-card-text class="check-details">
            <div class="description">
              <div class="check-details-header">
                <b>Details</b>
                <div class="check-controls">
                <v-menu :location-strategy="isMobile && isPortrait ? landscapeLocationStrategy : 'connected'"
                  location="bottom"
                  origin="top left"
                >
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" v-if="canOperate && check.notifications_muted" rounded="lg" variant="plain" icon="mdi-bell-cancel"></v-btn>
                    <v-btn v-bind="props" v-else-if="canOperate" class="notifications-icon" rounded="lg" variant="plain" icon="mdi-bell" ></v-btn>
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
                <v-menu :location-strategy="isMobile && isPortrait ? landscapeLocationStrategy : 'connected'"
                  location="bottom"
                  origin="top left">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" v-if="canOperate" rounded="lg" variant="plain" icon="mdi-dots-vertical"></v-btn>
                  </template>
                  <v-list class="menu">
                    <v-list-item @click="scheduleCheckNow(check)">
                      <v-list-item-title>Schedule now</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="openProcessResultDialog(check)">
                      <v-list-item-title>Process result</v-list-item-title>
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
        </v-window-item>

        <v-window-item value="history">
          <v-card-text class="history-tab">
            <div class="history-header">
              <div class="text-medium-emphasis">
                {{ historyResult?.total ?? 0 }} {{ (historyResult?.total ?? 0) === 1 ? 'event' : 'events' }}
              </div>
              <v-switch
                :model-value="historyStateChanges"
                label="Only state changes"
                color="primary"
                density="compact"
                hide-details
                class="history-state-changes"
                @update:model-value="updateHistoryStateChanges"
              ></v-switch>
              <v-btn
                icon="mdi-refresh"
                variant="text"
                aria-label="Refresh history"
                :disabled="historyLoading"
                @click="loadCheckHistory"
              ></v-btn>
            </div>

            <v-progress-linear v-if="historyLoading" indeterminate color="primary"></v-progress-linear>
            <v-alert v-else-if="historyError" type="error" variant="tonal" class="mb-4">
              <div class="d-flex align-center justify-space-between ga-2">
                <span>{{ historyError }}</span>
                <v-btn size="small" variant="text" @click="loadCheckHistory">Retry</v-btn>
              </div>
            </v-alert>
            <div v-else-if="historyResult?.total === 0" class="history-empty">
              No history events have been recorded for this check yet.
            </div>
            <div
              v-else
              class="history-list"
              :class="{ 'rotated-history-list': isMobile && isPortrait }"
              @touchstart="startHistoryTouch"
              @touchmove="moveHistoryTouch"
              @touchend="endHistoryTouch"
              @touchcancel="endHistoryTouch"
            >
              <v-card
                v-for="event in historyResult?.history ?? []"
                :key="event.timestamp"
                variant="flat"
                class="history-event"
              >
                <v-card-item>
                  <template #prepend>
                    <v-icon :color="getChipColor(event.status)" icon="mdi-circle-medium"></v-icon>
                  </template>
                  <v-card-title class="history-event-title">
                    <v-chip :color="getChipColor(event.status)" size="small" variant="tonal">
                      {{ event.status }}
                    </v-chip>
                    <span class="history-timestamp">{{ formatDateTime(event.timestamp) }}</span>
                  </v-card-title>
                </v-card-item>
                <v-card-text class="history-output">{{ event.output }}</v-card-text>
              </v-card>
            </div>

            <v-pagination
              v-if="historyResult && historyResult.total > historyPageSize"
              v-model="historyPage"
              :length="Math.ceil(historyResult.total / historyPageSize)"
              :total-visible="isMobile ? 5 : 7"
              density="comfortable"
              class="history-pagination"
            ></v-pagination>
          </v-card-text>
        </v-window-item>
      </v-window>

      </div>
    </v-card>
  </v-dialog>

  <!-- Process Result Dialog -->
  <v-dialog 
    v-model="processResultDialog"
    :max-width="isMobile ? '100%' : '500'"
    :fullscreen="isMobile"
    persistent
  >
    <v-card :class="{ 'mobile-rotated-card': isMobile && isPortrait }">
      <div
        class="process-result-content"
        :class="{ rotated: isMobile && isPortrait }"
      >
      <v-card-title>Process Check Result</v-card-title>
      <v-card-text>
        <div class="mt-4">
          <div class="mb-4">
            <label class="d-block mb-2">Status</label>
            <v-select
              v-model="processResultStatus"
              :items="[
                { title: 'OK (0)', value: 0 },
                { title: 'Warning (1)', value: 1 },
                { title: 'Critical (2)', value: 2 }
              ]"
              label="Select status"
            ></v-select>
          </div>

          <div class="mb-4">
            <label class="d-block mb-2">Output Message</label>
            <v-textarea
              v-model="processResultOutput"
              label="Result output"
              rows="4"
            ></v-textarea>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          text="Cancel"
          @click="processResultDialog = false"
          :disabled="processResultLoading"
        ></v-btn>
        <v-btn
          text="Submit"
          color="primary"
          @click="submitProcessResult"
          :loading="processResultLoading"
        ></v-btn>
      </v-card-actions>
      </div>
    </v-card>
  </v-dialog>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { CheckWithStatus } from '@/types/Check'
import { formatDateTime } from '@/utils/Datetime';
import { mapPerformanceData } from '@/types/PerformanceData';
import { getCheckHistory, getCheckPerformanceData, muteNotificaton, scheduleCheckNow, unmuteNotificaton, processCheckResult, type CheckResultPayload } from '@/api/pinglow';
import type { CheckHistoryPage } from '@/types/Check';
import type { ChartData, Point } from 'chart.js';
import PerformanceDataChart from './PerformanceDataChart.vue'


const emit = defineEmits(['refresh-check'])
const props = defineProps<{ check: CheckWithStatus, canOperate: boolean }>();
const canOperate = computed(() => props.canOperate);

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
const activeTab = ref('overview');
const selectedCheck = ref<CheckWithStatus | null>(null);
const historyPageSize = 10;
const historyPage = ref(1);
const historyStateChanges = ref(false);
const historyResult = ref<CheckHistoryPage | null>(null);
const historyLoading = ref(false);
const historyError = ref('');
let historyRequestId = 0;
let historyTouchStartY: number | null = null;
const chartDataset = ref<ChartData<'line', Point[], unknown>>({
  datasets: []
});

function startHistoryTouch(event: TouchEvent) {
  if (!isMobile.value || !isPortrait.value) return;

  historyTouchStartY = event.touches[0]?.clientY ?? null;
  event.stopPropagation();
}

function moveHistoryTouch(event: TouchEvent) {
  if (!isMobile.value || !isPortrait.value || historyTouchStartY === null) return;

  const touch = event.touches[0];
  const list = event.currentTarget;

  if (!touch || !(list instanceof HTMLElement)) return;

  event.preventDefault();
  event.stopPropagation();
  list.scrollLeft -= touch.clientY - historyTouchStartY;
  historyTouchStartY = touch.clientY;
}

function endHistoryTouch(event: TouchEvent) {
  if (!isMobile.value || !isPortrait.value) return;

  historyTouchStartY = null;
  event.stopPropagation();
}

// Process result dialog state
const processResultDialog = ref(false);
const processResultStatus = ref<number>(0);
const processResultOutput = ref<string>('');
const processResultLoading = ref(false);

async function loadCheckHistory() {
  if (!selectedCheck.value) return;

  const requestId = ++historyRequestId;
  historyLoading.value = true;
  historyError.value = '';
  historyResult.value = null;

  try {
    const result = await getCheckHistory(
      selectedCheck.value,
      historyPage.value,
      historyPageSize,
      historyStateChanges.value
    );
    if (requestId === historyRequestId) historyResult.value = result;
  } catch (error) {
    console.error('Failed to load check history:', error);
    if (requestId === historyRequestId) {
      historyError.value = 'Unable to load check history.';
    }
  } finally {
    if (requestId === historyRequestId) historyLoading.value = false;
  }
}

watch([activeTab, historyPage, selectedCheck], ([tab]) => {
  if (tab === 'history') {
    void loadCheckHistory();
  } else {
    historyRequestId++;
    historyLoading.value = false;
  }
});

function updateHistoryStateChanges(enabled: boolean | null) {
  historyStateChanges.value = enabled === true;
  if (historyPage.value !== 1) {
    historyPage.value = 1;
  } else if (activeTab.value === 'history') {
    void loadCheckHistory();
  }
}

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
  activeTab.value = 'overview'
  historyPage.value = 1
  historyStateChanges.value = false
  historyResult.value = null
  historyError.value = ''
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

function openProcessResultDialog(check: CheckWithStatus) {
  selectedCheck.value = check;
  processResultDialog.value = true;
  processResultStatus.value = 0;
  processResultOutput.value = '';
}

async function submitProcessResult() {
  if (!selectedCheck.value) return;

  processResultLoading.value = true;
  try {
    const payload: CheckResultPayload = {
      status: processResultStatus.value,
      output: processResultOutput.value,
    };

    await processCheckResult(selectedCheck.value, payload);
    
    processResultDialog.value = false;
    emit("refresh-check");
  } catch (error) {
    console.error('Failed to process check result:', error);
    alert('Failed to process check result');
  } finally {
    processResultLoading.value = false;
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
    const menuWidth = content.offsetWidth
    const menuHeight = content.offsetHeight
    const visualWidth = menuHeight
    const visualHeight = menuWidth
    const margin = 8
    const gap = 4
    const maxLeft = Math.max(margin, window.innerWidth - visualWidth - margin)
    const maxTop = Math.max(margin, window.innerHeight - visualHeight - margin)
    const leftOfTarget = targetRect.left - visualWidth - gap
    const rightOfTarget = targetRect.right + gap
    const desiredLeft = leftOfTarget >= margin ? leftOfTarget : rightOfTarget
    const visualLeft = Math.min(Math.max(desiredLeft, margin), maxLeft)
    const visualTop = Math.min(Math.max(targetRect.top, margin), maxTop)
    const left = visualLeft - (menuWidth - visualWidth) / 2
    const top = visualTop - (menuHeight - visualHeight) / 2

    Object.assign(contentStyles.value, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      transform: 'rotate(90deg)',
      transformOrigin: 'center center',
    })
  }

  requestAnimationFrame(updateLocation)

  return { updateLocation }
}

</script>

<style scoped>
.check-details {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.mobile-rotated-card {
  position: relative;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
}

.check-modal-card {
  height: min(82dvh, 760px);
  flex: 0 0 auto;
}

.modal-rotated {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.modal-rotated.rotated,
.process-result-content.rotated {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100dvh;
  height: 100vw;
  transform: translate(-50%, -50%) rotate(90deg);
  transform-origin: center;
}

.process-result-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.process-result-content :deep(.v-card-text) {
  flex: 1 1 auto;
  overflow-y: auto;
}

.process-result-content :deep(.v-card-actions) {
  flex: 0 0 auto;
  justify-content: flex-end;
}

.modal-header {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.modal-header :deep(.v-tabs) {
  flex: 1 1 auto;
  min-width: 0;
}

.modal-header :deep(.v-btn) {
  flex: 0 0 auto;
  margin-inline-end: 8px;
}

.modal-window {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.modal-window :deep(.v-window__container) {
  display: flex;
  flex: 1 1 0;
  height: 100%;
  min-height: 0;
}

.modal-window :deep(.v-window-item) {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  height: 100%;
  min-height: 0;
}

.chart {
  flex: 1 1 auto;
  min-height: 0;
  width: 100% !important;
  height: 320px;
}

.history-tab {
  flex: 1 1 auto;
  overflow: hidden;
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.history-state-changes {
  flex: 0 0 auto;
  margin-inline-start: auto;
  margin-inline-end: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
}

.history-event {
  flex: 0 0 auto;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.history-event-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.history-timestamp {
  font-size: 0.875rem;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.history-output {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  padding-top: 8px;
}

.history-empty {
  padding: 48px 16px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.history-pagination {
  flex: 0 0 auto;
  margin-top: auto;
}

.menu {
  min-width: 180px;
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
  .check-modal-card {
    height: 100dvh;
  }

  .check-details {
    height: 100%;
    overflow: hidden;
  }

  .chart {
    width: 100% !important;
    height: clamp(220px, 38vh, 360px) !important;
    max-height: 100%;
    flex: 1 1 0;
  }

  .history-tab {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .history-list {
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    touch-action: pan-y;
  }

  .history-event {
    width: 100%;
  }

  .rotated-history-list {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    touch-action: none;
  }

  .rotated-history-list .history-event {
    flex: 0 0 260px;
    align-self: flex-start;
    width: 260px;
  }
}
</style>
