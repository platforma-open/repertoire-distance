<script setup lang="ts">
import type { GraphMakerProps } from "@milaboratories/graph-maker";
import { GraphMaker } from "@milaboratories/graph-maker";
import type { PColumnIdAndSpec } from "@platforma-sdk/model";
import { computed } from "vue";
import { useApp } from "../app";
import Settings from "./Settings.vue";

const app = useApp();

function getDefaultOptions(heatmapPCols?: PColumnIdAndSpec[]) {
  if (!heatmapPCols) {
    return undefined;
  }

  function getIndex(name: string, pcols: PColumnIdAndSpec[]): number {
    return pcols.findIndex((p) => p.spec.name === name);
  }

  const defaults: GraphMakerProps["defaultOptions"] = [
    {
      inputName: "x",
      selectedSource: heatmapPCols[getIndex("pl7.app/overlap", heatmapPCols)].spec.axesSpec[0],
    },
    {
      inputName: "y",
      selectedSource: heatmapPCols[getIndex("pl7.app/overlap", heatmapPCols)].spec.axesSpec[1],
    },
    {
      inputName: "value",
      selectedSource: heatmapPCols[getIndex("pl7.app/overlap", heatmapPCols)].spec,
    },
    {
      inputName: "tabBy",
      selectedSource: heatmapPCols[getIndex("pl7.app/overlap", heatmapPCols)].spec.axesSpec[2],
    },
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
