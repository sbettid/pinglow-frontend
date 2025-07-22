<template>
  <h1>Pinglow</h1>
  <v-container class="checks-container">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="6"
        v-for="check in checks"
        :key="check.id"
        class="d-flex"
      >
        <StatusCard :check="check"  class="flex-grow-1"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import StatusCard from './components/StatusCard.vue'
import type { Check } from '@/types/Check'


const checks = ref<Check[]>([
  {
  id: '1',
  name: 'Database Connection',
  status: 'ok',
  last_checked: new Date().toISOString(),
  output: 'Connection ok',
},
{
  id: '2',
  name: 'Internet connection',
  status: 'warn',
  last_checked: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
  output: 'Connection is as expected!',
},
]);
</script>

<style scoped>
.checks-container {
  margin-top: 20px;
}
</style>
