import type {
  DistanceType,
  IntersectionType,
} from "@platforma-open/milaboratories.repertoire-distance-2.model";

export function getMetricLabel(type: DistanceType): string {
  switch (type) {
    case "F1":
      return "F1 Overlap";
    case "F2":
      return "F2 Overlap";
    case "D":
      return "D distance";
    case "sharedClonotypes":
      return "Shared clonotypes";
    case "correlation":
      return "Correlation";
    case "jaccard":
      return "Jaccard index";
    default:
      return "Unknown Metric";
  }
}

export function getIntersectionLabel(intersection: IntersectionType): string {
  switch (intersection) {
    case "CDR3ntVJ":
      return "CDR3 nucleotide + V/J genes";
    case "CDR3aaVJ":
      return "CDR3 amino acid + V/J genes";
    case "CDR3nt":
      return "CDR3 nucleotide only";
    case "CDR3aa":
      return "CDR3 amino acid only";
    default:
      return "Unknown overlap";
  }
}

export function getMetricDisplayName(
  type: DistanceType | undefined,
  // intersection: IntersectionType | undefined,
): string {
  const metricPart = type ? getMetricLabel(type) : "Metric";
  // const overlapPart = intersection ? getIntersectionLabel(intersection) : 'overlap';
  return `${metricPart}`;
}
