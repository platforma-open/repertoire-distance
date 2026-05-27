<script setup lang="ts">
import type { GraphMakerProps } from "@milaboratories/graph-maker";
import { GraphMaker } from "@milaboratories/graph-maker";
import type { PColumnIdAndSpec } from "@platforma-sdk/model";
import { computed } from "vue";
import { useApp } from "../app";
import Settings from "./Settings.vue";

const app = useApp();

// Spec name for the overlap value column.
// @TODO: Remove the legacy lookup once no projects with old cached outputs
// remain in the wild (2026-05-27). This is needed to prevent plot UI crash in
// block update
const OVERLAP_SPEC_NAMES = ["pl7.app/overlap", "pl7.app/vdj/overlap"] as const;

function findOverlap(pcols: PColumnIdAndSpec[]): PColumnIdAndSpec | undefined {
  for (const name of OVERLAP_SPEC_NAMES) {
    const found = pcols.find((p) => p.spec.name === name);
    if (found) return found;
  }
  return undefined;
}

function getDefaultOptions(heatmapPCols?: PColumnIdAndSpec[]) {
  if (!heatmapPCols) {
    return undefined;
  }

  const overlap = findOverlap(heatmapPCols);
  if (!overlap) return undefined;

  const defaults: GraphMakerProps["defaultOptions"] = [
    { inputName: "x", selectedSource: overlap.spec.axesSpec[0] },
    { inputName: "y", selectedSource: overlap.spec.axesSpec[1] },
    { inputName: "value", selectedSource: overlap.spec },
    { inputName: "tabBy", selectedSource: overlap.spec.axesSpec[2] },
  ];

  return defaults;
}

const defaultOptions = computed(() => getDefaultOptions(app.model.outputs.heatmapPCols));
</script>

<template>
  <GraphMaker
    v-model="app.model.data.graphState"
    chart-type="heatmap"
    :p-frame="app.model.outputs.pf"
    :default-options="defaultOptions"
  >
    <template #settingsSlot>
      <Settings />
    </template>
  </GraphMaker>
</template>
