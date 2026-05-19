import { platforma } from '@platforma-open/milaboratories.repertoire-distance-2.model';
import { defineAppV3 } from '@platforma-sdk/ui-vue';
import DistanceGraph from './pages/DistanceGraph.vue';

export const sdkPlugin = defineAppV3(platforma, () => {
  return {
    routes: {
      '/': () => DistanceGraph,
    },
  };
});

export const useApp = sdkPlugin.useApp;
