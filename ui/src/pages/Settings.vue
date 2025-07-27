<script setup lang="ts">
import type { PlRef } from '@platforma-sdk/model';
import { plRefsEqual } from '@platforma-sdk/model';
import { PlDropdownRef, PlElementList, PlBtnSecondary, PlAlert } from '@platforma-sdk/ui-vue';
import { getRawPlatformaInstance } from '@platforma-sdk/model';
import { asyncComputed } from '@vueuse/core';
import { useApp } from '../app';
import { getMetricLabel } from './util';
import DistanceCard from './DistanceCard.vue';
import { useMetrics } from './metrics';

const app = useApp();
const { metrics, addMetric } = useMetrics();

function setAbundanceRef(abundanceRef?: PlRef) {
  app.model.args.abundanceRef = abundanceRef;
  if (abundanceRef) {
    const label = app.model.outputs.abundanceOptions?.find((o) => plRefsEqual(o.ref, abundanceRef))?.label ?? '';
    if (label) {
      app.model.ui.blockTitle = 'Repertoire Distance – ' + label;
    }
  }
}

const isEmpty = asyncComputed(async () => {
  if (app.model.outputs.overlapMetricTable === undefined) return undefined;
  return (await getRawPlatformaInstance().pFrameDriver.getShape(app.model.outputs.overlapMetricTable)).rows === 0;
});
</script>

<template>
  <PlDropdownRef
    v-model="app.model.args.abundanceRef"
    :options="app.model.outputs.abundanceOptions ?? []"
    label="Abundance"
    required
    @update:model-value="setAbundanceRef"
  />

  <PlAlert v-if="isEmpty === true" type="warn" :style="{ width: '320px' }">
    <template #title>Empty dataset selection</template>
    The input dataset you have selected is empty.
    Please choose a different dataset.
  </PlAlert>

  <PlElementList
    v-model:items="metrics"
    :get-item-key="(item) => item.id"
    :is-expanded="(item) => item.isExpanded === true"
    :on-expand="(item) => item.isExpanded = !item.isExpanded"
    :disable-dragging="true"
  >
    <template #item-title="{ item }">
      {{ item.type ? getMetricLabel(item.type) : 'New Metric' }}
    </template>
    <template #item-content="{ index }">
      <DistanceCard v-model="metrics[index]" />
    </template>
  </PlElementList>

  <PlBtnSecondary icon="add" @click="addMetric">
    Add Metric
  </PlBtnSecondary>
</template>
