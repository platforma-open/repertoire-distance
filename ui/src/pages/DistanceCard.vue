<script setup lang="ts">
import type { Metric } from '@platforma-open/milaboratories.repertoire-distance-2.model';
import type { ListOption } from '@platforma-sdk/ui-vue';
import { PlBtnGroup, PlDropdown, PlNumberField } from '@platforma-sdk/ui-vue';

const metricTypeOptions: ListOption<string | undefined>[] = [
  { label: 'F1 Overlap', value: 'F1' },
  { label: 'F2 Overlap', value: 'F2' },
  { label: 'D Distance', value: 'D' },
  { label: 'Shared Clonotypes', value: 'sharedClonotypes' },
  { label: 'Correlation', value: 'correlation' },
  { label: 'Jaccard Index', value: 'jaccard' },
];

const intersectionOptions: ListOption<string | undefined>[] = [
  { label: 'CDR3nt|V|J', value: 'CDR3ntVJ' },
  { label: 'CDR3aa|V|J', value: 'CDR3aaVJ' },
  { label: 'CDR3nt', value: 'CDR3nt' },
  { label: 'CDR3aa', value: 'CDR3aa' },
];

const downsamplingOptions: ListOption<string | undefined>[] = [
  { label: 'None', value: 'none' },
  { label: 'Top N', value: 'top' },
  { label: 'Cumulative Top', value: 'cumtop' },
  { label: 'Random Sampling', value: 'hypergeometric' },
];

const props = defineModel<Metric>({
  required: true,
  default: {
    type: undefined,
    intersection: 'CDR3ntVJ',
    downsampling: {
      type: 'hypergeometric',
      valueChooser: 'auto',
    },
  },
});

</script>

<template>
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

  <PlDropdown
    v-model="props.downsampling.type" :options="downsamplingOptions"
    label="Downsampling"
    required
  />

  <PlNumberField
    v-if="props.downsampling.type === 'cumtop'"
    v-model="props.downsampling.n"
    label="Select % of the repertoire to include"
    :minValue="0"
    :maxValue="100"
    :step="1"
    required
  />

  <PlNumberField
    v-if="props.downsampling.type === 'top'"
    v-model="props.downsampling.n"
    label="Select Top N"
    :minValue="0"
    required
  />

  <PlBtnGroup
    v-if="props.downsampling.type === 'hypergeometric'"
    v-model="props.downsampling.valueChooser"
    :options="[
      { value: 'fixed', label: 'Fixed' },
      { value: 'min', label: 'Min' },
      { value: 'auto', label: 'Auto' },
      { value: 'max', label: 'Max' },
    ]"
  />

  <PlNumberField
    v-if="props.downsampling.valueChooser === 'fixed'"
    v-model="props.downsampling.n"
    label="Select N"
    :minValue="0"
    required
  />
</template>
