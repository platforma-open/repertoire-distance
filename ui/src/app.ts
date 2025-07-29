import { model } from '@platforma-open/milaboratories.repertoire-distance-2.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import DistanceGraph from './pages/DistanceGraph.vue';

export const sdkPlugin = defineApp(model, () => {
  return {
    routes: {
      '/': () => DistanceGraph,
    },
  };
});

export const useApp = sdkPlugin.useApp;
