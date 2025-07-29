import type { DistanceType } from '@platforma-open/milaboratories.repertoire-distance-2.model';

export function getMetricLabel(type: DistanceType): string {
  switch (type) {
    case 'F1':
      return 'F1 Overlap';
    case 'F2':
      return 'F2 Overlap';
    case 'D':
      return 'D Distance';
    case 'sharedClonotypes':
      return 'Shared Clonotypes';
    case 'correlation':
      return 'Correlation';
    case 'jaccard':
      return 'Jaccard Index';
    default:
      return 'Unknown Metric';
  }
}
