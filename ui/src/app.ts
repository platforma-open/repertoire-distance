import { model } from '@platforma-open/milaboratories.repertoire-distance-2.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import DistanceGraph from './pages/DistanceGraph.vue';
import FractionsScatterplot from './pages/FractionsScatterplot.vue';

export const sdkPlugin = defineApp(model, () => {
  return {
    routes: {
      '/': () => DistanceGraph,
      '/fractions': () => FractionsScatterplot,
    },
  };
});

export const useApp = sdkPlugin.useApp;
