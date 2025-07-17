import type { Metric, MetricUI } from '.';

export function convertMetricsUI(metrics: MetricUI[]): Metric[] {
  return metrics.map((metric) => ({
    type: metric.type,
    intersection: metric.intersection,
  }));
}
