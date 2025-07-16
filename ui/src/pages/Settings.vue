<script setup lang="ts">
import type { PlRef } from '@platforma-sdk/model';
import { plRefsEqual } from '@platforma-sdk/model';
import { PlBtnGhost, PlDropdownRef, PlElementList, PlSlideModal, randomString } from '@platforma-sdk/ui-vue';
import { useApp } from '../app';
import DistanceCard from './DistanceCard.vue';
import { getMetricLabel } from './util';

const app = useApp();

function setAbundanceRef(abundanceRef?: PlRef) {
  app.model.args.abundanceRef = abundanceRef;
  let label = '';
  if (abundanceRef) {
    label = app.model.outputs.abundanceOptions?.find((o) => plRefsEqual(o.ref, abundanceRef))?.label ?? '';
  }
  app.model.ui.blockTitle = 'Repertoire Distance – ' + label;
}

const settingsAreShown = defineModel<boolean>({ required: true });

const addMetric = () => {
  app.model.ui.metrics.push({
    id: randomString(8),
    type: undefined,
    intersection: 'CDR3ntVJ',
    isExpanded: true,
  });
};
</script>

<template>
  <PlSlideModal v-model="settingsAreShown">
    <template #title>Settings</template>
    <PlDropdownRef
      v-model="app.model.args.abundanceRef" :options="app.model.outputs.abundanceOptions ?? []"
      label="Abundance"
      required
      @update:model-value="setAbundanceRef"
    />

    <PlBtnGhost icon="add" @click="addMetric">
      Add Metric
    </PlBtnGhost>

    <PlElementList
      v-model:items="app.model.ui.metrics"
      :get-item-key="(item) => item.id"
      :is-expanded="(item) => item.isExpanded"
      :on-expand="(item) => item.isExpanded = !item.isExpanded"
    >
      <template #item-title="{ item }">
        {{ item.type ? getMetricLabel(item.type) : 'New Metric' }}
      </template>
      <template #item-content="{ index }">
        <DistanceCard v-model="app.model.ui.metrics[index]" />
      </template>
    </PlElementList>
  </PlSlideModal>
</template>
