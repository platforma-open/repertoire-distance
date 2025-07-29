<script setup lang="ts">
import { ref, watch } from 'vue';
import { useApp } from '../app';
import type { GraphMakerProps } from '@milaboratories/graph-maker';
import type { PColumnIdAndSpec } from '@platforma-sdk/model';
import { GraphMaker } from '@milaboratories/graph-maker';
import '@milaboratories/graph-maker/styles';
import Settings from './Settings.vue';

const app = useApp();

function getDefaultOptions(heatmapPCols?: PColumnIdAndSpec[]) {
  if (!heatmapPCols) {
    return undefined;
  }

  function getIndex(name: string, pcols: PColumnIdAndSpec[]): number {
    return pcols.findIndex((p) => p.spec.name === name);
  }

  const defaults: GraphMakerProps['defaultOptions'] = [
    {
      inputName: 'x',
      selectedSource: heatmapPCols[getIndex('pl7.app/vdj/overlap', heatmapPCols)].spec.axesSpec[0],
    },
    {
      inputName: 'y',
      selectedSource: heatmapPCols[getIndex('pl7.app/vdj/overlap', heatmapPCols)].spec.axesSpec[1],
    },
    {
      inputName: 'value',
      selectedSource: heatmapPCols[getIndex('pl7.app/vdj/overlap', heatmapPCols)].spec,
    },
    {
      inputName: 'tabBy',
      selectedSource: heatmapPCols[getIndex('pl7.app/vdj/overlap', heatmapPCols)].spec.axesSpec[2],
    },
  ];

  return defaults;
}

// Steps needed to reset graph maker after changing input table
const defaultOptions = ref(getDefaultOptions(app.model.outputs.heatmapPCols));
const key = ref(defaultOptions.value ? JSON.stringify(defaultOptions.value) : '');

// Reset graph maker state to allow new selection of defaults
watch(() => app.model.outputs.heatmapPCols, (heatmapPCols) => {
  delete app.model.ui.graphState.optionsState;
  defaultOptions.value = getDefaultOptions(heatmapPCols);
  key.value = defaultOptions.value ? JSON.stringify(defaultOptions.value) : '';
});

</script>

<template>
  <GraphMaker
    :key="key"
    v-model="app.model.ui.graphState"
    chart-type="heatmap"
    :p-frame="app.model.outputs.pf"
    :default-options="defaultOptions"
  >
    <template #settingsSlot>
      <Settings/>
    </template>
  </GraphMaker>
</template>
