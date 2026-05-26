import { computed } from "vue";
import type { Metric } from "@platforma-open/milaboratories.repertoire-distance-2.model";
import { useApp } from "../app";

export const useMetrics = () => {
  const app = useApp();
  const metrics = computed({
    get: () => app.model.data.metrics,
    set: (newMetrics: Metric[]) => {
      app.model.data.metrics = newMetrics;
    },
  });

  const addMetric = () => {
    metrics.value.push({
      id: `metric-${Date.now()}`,
      type: undefined,
      intersection: undefined,
      downsampling: {
        type: "none",
        valueChooser: "auto",
      },
      isExpanded: true,
    });
  };

  return { metrics, addMetric };
};
