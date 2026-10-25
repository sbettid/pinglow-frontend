<template>
  <v-app>
    <v-app-bar flat>
      <v-toolbar-title>Pinglow</v-toolbar-title>
      <v-text-field
        v-if="auth.isAuthenticated"
        v-model="searchQuery"
        label="Search checks or groups"
        placeholder="Search checks or groups"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        density="compact"
        clearable
        hide-details
        class="toolbar-search"
      />
      <v-spacer />
      <template v-if="auth.user">
        <span class="mr-4 auth-user">{{ auth.user.user }} · {{ auth.user.role }}</span>
        <v-btn icon="mdi-logout" variant="text" aria-label="Log out" @click="signOut" />
      </template>
      <v-btn v-else prepend-icon="mdi-login" variant="text" aria-label="Log in" @click="auth.login">Sign in</v-btn>
    </v-app-bar>
    <v-main>
      <v-progress-circular v-if="auth.loading" indeterminate class="ma-6" aria-label="Loading" />
      <v-alert v-else-if="!auth.isAuthenticated" type="info" class="ma-4">Sign in to access Pinglow!</v-alert>
      <v-container v-else class="checks-container">
        <div v-if="visibleGroups.length > 0" class="group-actions">
          <v-btn
            size="small"
            prepend-icon="mdi-arrow-expand-all"
            variant="text"
            @click="expandAllGroups"
          >
            Expand all
          </v-btn>
          <v-btn
            size="small"
            prepend-icon="mdi-arrow-collapse-all"
            variant="text"
            @click="collapseAllGroups"
          >
            Collapse all
          </v-btn>
        </div>
        <v-alert v-if="visibleGroups.length === 0 && ungroupedChecks.length === 0" type="info" variant="tonal">
          No checks match your search.
        </v-alert>
        <v-row>
          <v-col
            v-for="group in pagedGroups"
            :key="group.id"
            cols="12"
            md="6"
            class="d-flex"
          >
            <v-card class="group-card flex-grow-1" variant="outlined">
              <v-btn
                block
                variant="text"
                class="group-toggle"
                :aria-expanded="isGroupExpanded(group.id)"
                :aria-label="`${isGroupExpanded(group.id) ? 'Collapse' : 'Expand'} ${group.name}`"
                @click="toggleGroup(group.id)"
              >
                <span class="group-toggle-content">
                  <span class="group-name" :title="group.name">{{ group.name }}</span>
                  <span class="status-summary" aria-label="Check status summary">
                    <v-chip
                      v-for="status in group.statuses"
                      :key="status.status"
                      :color="getStatusColor(status.status)"
                      size="x-small"
                      variant="tonal"
                      class="status-chip"
                    >
                      {{ formatStatus(status.status) }} {{ status.count }}
                    </v-chip>
                  </span>
                  <span class="text-medium-emphasis group-summary">
                    {{ group.checks.length }} {{ group.checks.length === 1 ? 'check' : 'checks' }}
                  </span>
                  <v-icon
                    class="group-chevron"
                    :icon="isGroupExpanded(group.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  />
                </span>
              </v-btn>
              <v-expand-transition>
                <div v-if="isGroupExpanded(group.id)">
                  <v-divider />
                  <v-card-text class="group-check-list">
                    <StatusCard
                      v-for="check in group.checks"
                      :key="check.check_name"
                      :check="check"
                      :can-operate="auth.canOperate"
                      class="group-check-card"
                      @refresh-check="refreshCheckStatus(check.check_name)"
                    />
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>
        <v-row v-if="ungroupedChecks.length > 0" class="ungrouped-checks">
          <v-col
            v-for="check in ungroupedChecks"
            :key="check.check_name"
            cols="12"
            md="6"
            class="d-flex"
          >
            <StatusCard
              :check="check"
              :can-operate="auth.canOperate"
              class="flex-grow-1"
              @refresh-check="refreshCheckStatus(check.check_name)"
            />
          </v-col>
        </v-row>
        <div v-if="pageCount > 1" class="pagination-container">
          <v-pagination
            v-model="currentPage"
            :length="pageCount"
            :total-visible="mobile ? 5 : 7"
            density="comfortable"
            rounded="circle"
          />
        </div>
      </v-container>
    </v-main>
    <v-footer app class="footer">
      <div class="footer-content">
        <img src="/pinglow_transparent.svg" alt="Pinglow" class="footer-logo" />
        <span class="footer-text">Kubernetes-ready monitoring engine</span>
      </div>
    </v-footer>
  </v-app>
</template>
<script setup lang="ts">
import {computed, ref, onMounted, watch} from 'vue'
import {useDisplay} from 'vuetify'
import StatusCard from './components/StatusCard.vue'
import type { Check, CheckWithStatus } from '@/types/Check'
import { getChecks, getCheckStatus } from './api/pinglow';
import { useAuthStore } from './stores/auth';
import { filterChecks, paginateGroups } from './utils/checkGroups';

const auth = useAuthStore();

const checks = ref<Check[]>([]);

const checksWithStatus = ref<CheckWithStatus[]>([]);
const searchQuery = ref('');
const collapsedGroupIds = ref(new Set<string>());
const currentPage = ref(1);
const { mobile } = useDisplay();

const filteredChecks = computed(() => filterChecks(checksWithStatus.value, searchQuery.value));
const visibleGroups = computed(() => filteredChecks.value.groups);
const ungroupedChecks = computed(() => filteredChecks.value.ungrouped);
const pageSize = computed(() => mobile.value ? 4 : 8);
const pageCount = computed(() => Math.ceil(visibleGroups.value.length / pageSize.value));
const pagedGroups = computed(() => {
  return paginateGroups(visibleGroups.value, currentPage.value, pageSize.value);
});
function isGroupExpanded(groupId: string): boolean {
  return !collapsedGroupIds.value.has(groupId);
}

function toggleGroup(groupId: string): void {
  const collapsed = new Set(collapsedGroupIds.value);
  if (collapsed.has(groupId)) {
    collapsed.delete(groupId);
  } else {
    collapsed.add(groupId);
  }
  collapsedGroupIds.value = collapsed;
}

function expandAllGroups(): void {
  const collapsed = new Set(collapsedGroupIds.value);
  for (const group of visibleGroups.value) {
    collapsed.delete(group.id);
  }
  collapsedGroupIds.value = collapsed;
}

function collapseAllGroups(): void {
  collapsedGroupIds.value = new Set([
    ...collapsedGroupIds.value,
    ...visibleGroups.value.map(group => group.id),
  ]);
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Ok':
      return 'green';
    case 'Warning':
      return 'orange';
    case 'Critical':
      return 'red';
    case 'Pending':
      return 'blue';
    default:
      return 'purple';
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case 'Ok':
      return 'OK';
    case 'Warning':
      return 'Warn';
    case 'Critical':
      return 'Crit';
    case 'CheckError':
      return 'Error';
    case 'Pending':
      return 'Pend';
    default:
      return status;
  }
}

watch([searchQuery, mobile, pageSize], () => {
  currentPage.value = 1;
});

watch(pageCount, count => {
  if (currentPage.value > count) {
    currentPage.value = Math.max(count, 1);
  }
});

onMounted(async () => {
  await auth.hydrate();
  if (!auth.isAuthenticated) return;
  checks.value = await getChecks()

  for (const check of checks.value) {

    const checkWithStatus = await getCheckStatus(check);
    checksWithStatus.value.push({
      ...checkWithStatus,
      group_id: check.group_id,
      group_name: check.group_name,
    });
  }
})

async function signOut() { await auth.logout(); }

async function refreshCheckStatus(check_name: string) {

  const checkIndex = checks.value.findIndex(item => item.check_name == check_name);

  const check = checks.value[checkIndex];

  if (!check) {
    return;
  }

  const refreshedCheck = await getCheckStatus(check);

  checksWithStatus.value[checkIndex] = {
    ...refreshedCheck,
    group_id: check.group_id,
    group_name: check.group_name,
  };

}

</script>

<style>
#app {
  padding: 0;
}
</style>

<style scoped>
.pinglow-title {
  margin-top: 2rem;
}
.checks-container {
  margin-top: 20px;
}
.toolbar-search {
  width: min(40vw, 420px);
  min-width: 220px;
  margin-left: 24px;
}
.group-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.group-card {
  overflow: hidden;
  min-width: 0;
}
.group-check-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.group-check-card {
  width: 100%;
}
.group-check-list :deep(.card) {
  width: 100%;
  min-width: 0 !important;
}
.group-toggle {
  min-height: 64px;
  padding: 10px 16px;
  text-transform: none;
}
.group-toggle-content {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 10px;
}
.group-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
  flex: 1 1 auto;
  min-width: 40px;
}
.group-summary {
  white-space: nowrap;
  font-size: 0.8rem;
  flex: 0 0 auto;
}
.status-summary {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}
.status-chip {
  margin: 0;
}
.group-chevron {
  flex: 0 0 auto;
  margin-left: 2px;
}
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
.ungrouped-checks {
  margin-top: 12px;
}
.footer {
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  padding: 16px;
}
.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.footer-logo {
  height: 32px;
  width: auto;
}
.footer-text {
  font-size: 0.875rem;
  color: #666;
}
@media (max-width: 600px) {
  .checks-container {
    padding: 16px;
  }
  .toolbar-search {
    width: auto;
    min-width: 0;
    flex: 1;
    margin-left: 8px;
  }
  .auth-user {
    display: none;
  }
  .group-actions {
    justify-content: center;
    gap: 4px;
  }
  .group-toggle {
    padding: 10px 8px;
  }
  .group-toggle-content {
    flex-wrap: wrap;
    gap: 5px;
  }
  .group-name {
    font-size: 0.9rem;
    min-width: 32px;
    flex-basis: 100%;
  }
  .status-summary {
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
    flex-wrap: wrap;
  }
  .status-chip {
    font-size: 0.65rem;
  }
}
</style>
