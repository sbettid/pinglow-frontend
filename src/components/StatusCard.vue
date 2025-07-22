<template>
  <v-card outlined class="pa-6" :class="[cardColor, 'card']">
      <v-card-title>{{ check.name }}</v-card-title>
      <v-card-subtitle class="last-checked">
        Checked: {{ new Date(check.last_checked).toLocaleString() }}
      </v-card-subtitle>
      <v-card-text>
        {{ check.output }}
      </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Check } from '@/types/Check'

const props = defineProps<{ check: Check }>();

const cardColor = computed(() => {
  switch (props.check.status) {
    case 'ok':
      return 'bg-green-lighten-4'
    case 'warn':
      return 'bg-orange-lighten-4'
    case 'fail':
      return 'bg-red-lighten-4'
    default:
      return 'bg-grey-lighten-4'
  }
})

</script>

<style scoped>
.last-checked {
  white-space: normal;
}
</style>
