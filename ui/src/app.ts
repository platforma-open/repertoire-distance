import { convertMetricsUI, model } from '@platforma-open/milaboratories.repertoire-distance-2.model';
import { defineApp } from '@platforma-sdk/ui-vue';
import DistanceGraph from './pages/DistanceGraph.vue';
import MainPage from './pages/MainPage.vue';

export const sdkPlugin = defineApp(model, (app) => {
  watch(
    () => app.model.ui.metrics,
    debounce((metrics) => convertMetricsUI(toRaw(metrics)), 500),
    { deep: true, immediate: true },
  );

  return {
    routes: {
      '/': () => DistanceGraph,
    },
  };
});

export const useApp = sdkPlugin.useApp;
