import type { Ref } from 'vue';
import { computed, watch } from 'vue';
import once from 'lodash.once';
import type { Metric } from '@platforma-open/milaboratories.repertoire-distance-2.model';
import { useApp } from '../app';

export const useMetrics = () => {
  useMigrationMetrics();

  const app = useApp();
  const metrics = computed((): Metric[] => app.model.args.metrics);

  const addMetric = () => {
    const newId = `metric-${Date.now()}`;
    metrics.value.push({
      id: newId,
      type: undefined,
      intersection: undefined,
      downsampling: {
        type: 'none',
        valueChooser: 'auto',
      },
      isExpanded: true, // Auto-expand new metrics
    });
  };

  return { metrics, addMetric };
};

const useMigrationMetrics = once(() => {
  const app = useApp();
  // Migrate metrics from old format if necessary
  // This can be expanded in the future if needed
  if (!app.model.args.metrics || app.model.args.metrics.length === 0) {
    // Initialize with default metrics if empty
    app.updateArgs((args) => {
      if (!args.metrics || args.metrics.length === 0) {
        args.metrics = [
          {
            id: 'f1-cdr3ntvj',
            type: 'F1',
            intersection: 'CDR3ntVJ',
            downsampling: {
              type: 'hypergeometric',
              valueChooser: 'auto',
            },
            isExpanded: false,
          },
        ];
      }
    });
  }
});
