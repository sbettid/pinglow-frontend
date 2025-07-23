<template>
  <h1>Pinglow</h1>
  <v-container class="checks-container">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="6"
        v-for="check in checksWithStatus"
        :key="check.check_name"
        class="d-flex"
      >
        <StatusCard :check="check"  class="flex-grow-1"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import StatusCard from './components/StatusCard.vue'
import type { Check, CheckWithStatus } from '@/types/Check'
import { getChecks, getCheckStatus } from './api/pinglow';


const checks = ref<Check[]>([]);

const checksWithStatus = ref<CheckWithStatus[]>([]);

onMounted(async () => {
  checks.value = await getChecks()

  for (const check of checks.value) {
    const checkWithStatus = await getCheckStatus(check);

    checksWithStatus.value.push(checkWithStatus);
  }
})

</script>

<style scoped>
.checks-container {
  margin-top: 20px;
}
</style>
