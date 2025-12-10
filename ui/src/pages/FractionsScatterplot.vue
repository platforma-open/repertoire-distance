<script setup lang="ts">
import type { PredefinedGraphOption } from '@milaboratories/graph-maker';
import { GraphMaker } from '@milaboratories/graph-maker';
import '@milaboratories/graph-maker/styles';
import type { PColumnIdAndSpec, PColumnSpec } from '@platforma-sdk/model';
import { computed } from 'vue';
import { useApp } from '../app';

const app = useApp();

const defaultOptions = computed((): PredefinedGraphOption<'scatterplot'>[] | undefined => {
  const outputs = app.model.outputs as typeof app.model.outputs & {
    fractionsPCols?: PColumnIdAndSpec[];
  };
  if (!outputs.fractionsPCols || outputs.fractionsPCols.length === 0) {
    return undefined;
  }

  const fractionsPCols = outputs.fractionsPCols;

  // Get fraction columns (columns with name "pl7.app/vdj/fraction")
  const fractionColumns = fractionsPCols.filter(
    (p: PColumnIdAndSpec) => p.spec.name === 'pl7.app/vdj/fraction',
  );

  if (fractionColumns.length === 0) {
    return undefined;
  }

  // Default options: compare first two samples' fractions
  const defaults: PredefinedGraphOption<'scatterplot'>[] = [
    {
      inputName: 'x',
      selectedSource: fractionColumns[0].spec,
    },
  ];

  // If we have at least two samples, use the second one for Y
  if (fractionColumns.length >= 2) {
    defaults.push({
      inputName: 'y',
      selectedSource: fractionColumns[1].spec,
    });
  }

  return defaults;
});

</script>

<template>
  <GraphMaker
    v-model="app.model.ui.fractionsState"
    :dataColumnPredicate="(spec:PColumnSpec) => spec.name == 'pl7.app/vdj/fraction'"
    chart-type="scatterplot"
    :p-frame="app.model.outputs.fractionsPf"
    :default-options="defaultOptions"
  />
</template>
