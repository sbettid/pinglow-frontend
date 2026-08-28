<template>
  <v-app>
    <v-app-bar flat>
      <v-toolbar-title>Pinglow</v-toolbar-title>
      <v-spacer />
      <template v-if="auth.user">
        <span class="mr-4">{{ auth.user.user }} · {{ auth.user.role }}</span>
        <v-btn icon="mdi-logout" variant="text" aria-label="Log out" @click="signOut" />
      </template>
      <v-btn v-else prepend-icon="mdi-login" variant="text" aria-label="Log in" @click="auth.login">Sign in</v-btn>
    </v-app-bar>
    <v-main>
      <v-progress-circular v-if="auth.loading" indeterminate class="ma-6" aria-label="Loading" />
      <v-alert v-else-if="!auth.isAuthenticated" type="info" class="ma-4">Sign in to access Pinglow!</v-alert>
      <v-container v-else class="checks-container">
        <v-row>
          <v-col cols="12" sm="6" md="6" v-for="check in checksWithStatus" :key="check.check_name" class="d-flex">
            <StatusCard :check="check" :can-operate="auth.canOperate" class="flex-grow-1" @refresh-check="refreshCheckStatus(check.check_name)" />
          </v-col>
        </v-row>
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
import {ref, onMounted} from 'vue'
import StatusCard from './components/StatusCard.vue'
import type { Check, CheckWithStatus } from '@/types/Check'
import { getChecks, getCheckStatus } from './api/pinglow';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();

const checks = ref<Check[]>([]);

const checksWithStatus = ref<CheckWithStatus[]>([]);

onMounted(async () => {
  await auth.hydrate();
  if (!auth.isAuthenticated) return;
  checks.value = await getChecks()

  for (const check of checks.value) {

    const checkWithStatus = await getCheckStatus(check);

    checksWithStatus.value.push(checkWithStatus);
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

  checksWithStatus.value[checkIndex] = refreshedCheck;

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
</style>
