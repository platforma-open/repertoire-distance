<script setup lang="ts">
import type { PlRef } from "@platforma-sdk/model";
import { plRefsEqual } from "@platforma-sdk/model";
import { PlDropdownRef, PlElementList, PlBtnSecondary, PlAlert } from "@platforma-sdk/ui-vue";
import { getRawPlatformaInstance } from "@platforma-sdk/model";
import { asyncComputed } from "@vueuse/core";
import { computed } from "vue";
import { useApp } from "../app";
import { getMetricDisplayName } from "./util";
import DistanceCard from "./DistanceCard.vue";
import { useMetrics } from "./metrics";

const app = useApp();
const { metrics, addMetric } = useMetrics();

const abundanceRefModel = computed({
  get: () => app.model.data.abundanceRef,
  set: (selectedRef: PlRef | undefined) => {
    app.model.data.abundanceRef = selectedRef;
    // Snapshot the chosen dataset's human label into `data` so `.subtitle`
    // can derive the default block label without re-querying the result pool.
    app.model.data.datasetLabel = selectedRef
      ? (app.model.outputs.abundanceOptions?.find((o) => plRefsEqual(o.ref, selectedRef))?.label ??
        app.model.data.datasetLabel)
      : undefined;
  },
});

const isEmpty = asyncComputed(async () => {
  if (app.model.outputs.overlapMetricTable === undefined) return undefined;
  return (
    (await getRawPlatformaInstance().pFrameDriver.getShape(app.model.outputs.overlapMetricTable))
      .rows === 0
  );
});
</script>

<template>
  <PlDropdownRef
    v-model="abundanceRefModel"
    :options="app.model.outputs.abundanceOptions ?? []"
    label="Abundance"
    required
  />

  <PlAlert v-if="isEmpty === true" type="warn" :style="{ width: '320px' }">
    <template #title>Empty dataset selection</template>
    The input dataset you have selected is empty. Please choose a different dataset.
  </PlAlert>

  <PlElementList
    v-model:items="metrics"
    :get-item-key="(item) => item.id"
    :is-expanded="(item) => item.isExpanded === true"
    :on-expand="(item) => (item.isExpanded = !item.isExpanded)"
    :disable-dragging="true"
    style="width: 360px; max-width: 100%"
  >
    <template #item-title="{ item }">
      {{ getMetricDisplayName(item.type) }}
    </template>
    <template #item-content="{ index }">
      <DistanceCard v-model="metrics[index]" />
    </template>
  </PlElementList>

  <PlBtnSecondary icon="add" @click="addMetric"> Add Metric </PlBtnSecondary>
</template>
