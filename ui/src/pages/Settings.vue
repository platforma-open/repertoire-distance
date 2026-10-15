<script setup lang="ts">
import {
  createDefaultMetrics,
  createPeptideMetrics,
} from "@platforma-open/milaboratories.repertoire-distance-2.model";
import type { DatasetSelection, PlRef } from "@platforma-sdk/model";
import {
  createDatasetSelection,
  createPrimaryRef,
  getRawPlatformaInstance,
  plRefsEqual,
} from "@platforma-sdk/model";
import { PlAlert, PlBtnSecondary, PlDatasetSelector, PlElementList } from "@platforma-sdk/ui-vue";
import { asyncComputed } from "@vueuse/core";
import { computed, watch } from "vue";
import { useApp } from "../app";
import DistanceCard from "./DistanceCard.vue";
import { useMetrics } from "./metrics";
import { getMetricDisplayName } from "./util";

const app = useApp();
const { metrics, addMetric } = useMetrics();

// Re-seed metric defaults to match the input modality.
watch(
  () => app.model.outputs.modality,
  (modality) => {
    if (!modality) return;
    if (app.model.data.lastAppliedModality === modality) return;
    // Just needed for block update from non-modality aware version
    // @TODO; Remove once non-modality aware block versions are not used (2026-05-27)
    if (app.model.data.lastAppliedModality === undefined && modality === "antibody_tcr") {
      app.model.data.lastAppliedModality = "antibody_tcr";
      return;
    }
    app.model.data.metrics =
      modality === "peptide" ? createPeptideMetrics() : createDefaultMetrics();
    app.model.data.lastAppliedModality = modality;
  },
  { immediate: true },
);

// The subset's label when one is picked: it already carries the dataset as a prefix.
function optionLabel(ref: PlRef, filterRef: PlRef | undefined): string | undefined {
  const option = app.model.outputs.abundanceOptions?.find((o) =>
    plRefsEqual(o.primary.ref, ref, true),
  );
  const filter = filterRef
    ? option?.filters?.find((f) => plRefsEqual(f.ref, filterRef, true))
    : undefined;
  return (filter ?? option?.primary)?.label;
}

// A block created from a template arrives with `abundanceRef` already set but
// no label snapshot, which only the setter below writes. Take it from the
// options as soon as they resolve, so the subtitle is right without the user
// re-opening the picker.
watch(
  () => [app.model.data.abundanceRef, app.model.outputs.abundanceOptions] as const,
  ([ref]) => {
    if (!ref || app.model.data.datasetLabel !== undefined) return;
    const label = optionLabel(ref, app.model.data.filterRef);
    if (label !== undefined) app.model.data.datasetLabel = label;
  },
  { immediate: true },
);

const abundanceSelection = computed<DatasetSelection | undefined>({
  get: () => {
    const { abundanceRef, filterRef } = app.model.data;
    if (abundanceRef === undefined) return undefined;
    return createDatasetSelection(createPrimaryRef(abundanceRef, filterRef));
  },
  set: (selection) => {
    const selectedRef = selection?.primary.column;
    const filterRef = selection?.primary.filter;
    app.model.data.abundanceRef = selectedRef;
    app.model.data.filterRef = filterRef;
    // Snapshot the chosen dataset's human label into `data` so `.subtitle`
    // can derive the default block label without re-querying the result pool.
    app.model.data.datasetLabel = selectedRef
      ? (optionLabel(selectedRef, filterRef) ?? app.model.data.datasetLabel)
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
  <PlDatasetSelector
    v-model="abundanceSelection"
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
      {{ getMetricDisplayName(item.type, app.model.outputs.modality) }}
    </template>
    <template #item-content="{ index }">
      <DistanceCard v-model="metrics[index]" />
    </template>
  </PlElementList>

  <PlBtnSecondary icon="add" @click="addMetric"> Add Metric </PlBtnSecondary>
</template>
