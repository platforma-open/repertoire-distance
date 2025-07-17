<script setup lang="ts">
import type { Metric } from '@platforma-open/milaboratories.repertoire-distance-2.model';
import type { ListOption } from '@platforma-sdk/ui-vue';
import { PlDropdown } from '@platforma-sdk/ui-vue';
import { metricTypeOptions } from './util';

const intersectionOptions: ListOption<string | undefined>[] = [
  { label: 'CDR3nt|V|J', value: 'CDR3ntVJ' },
  { label: 'CDR3aa|V|J', value: 'CDR3aaVJ' },
  { label: 'CDR3nt', value: 'CDR3nt' },
  { label: 'CDR3aa', value: 'CDR3aa' },
];

const props = defineModel<Metric>({ default: {
  type: undefined,
  intersection: 'CDR3ntVJ',
} });

</script>

<template>
  <div class="d-flex flex-column gap-24">
    <PlDropdown
      v-model="props.type" :options="metricTypeOptions"
      label="Type"
      required
    />

    <PlDropdown
      v-model="props.intersection" :options="intersectionOptions"
      label="Intersection"
      required
    />
  </div>
</template>

<!-- @click="removeMetric(index)" -->
