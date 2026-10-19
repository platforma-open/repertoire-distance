import type { GraphMakerState } from "@milaboratories/graph-maker";
// The metric vocabulary lives in the kind: its init-params contract names these
// types and a kind cannot import from the model. Imported here for the shapes
// below that are built from them.
import type {
  Metric,
  MetricUI,
  Modality,
} from "@platforma-open/milaboratories.repertoire-distance-2.kind";
import type { PlRef } from "@platforma-sdk/model";

/** Unified V3 data: persisted state shaped on the UI's terms. */
export type BlockData = {
  abundanceRef?: PlRef;
  /** Subset column picked with the abundance in PlDatasetSelector (e.g. a Repertoire Labeling label). */
  filterRef?: PlRef;
  metrics: MetricUI[];
  customBlockLabel: string;
  /**
   * Human-readable label of the chosen abundance dataset (or subset), snapshotted by the
   * UI in the same gesture that picks `abundanceRef`. Consumed by `.subtitle`
   * so the default block label can be shown without re-querying the result
   * pool there.
   */
  datasetLabel?: string;
  /**
   * Modality the current `metrics` were seeded for. Set by the UI watcher that
   * reseeds defaults when the input modality changes (VDJ ↔ peptide). Stays
   * undefined on first input — the watcher treats that as a one-time adoption
   * pass so legacy V1 → V3 upgrades don't lose user-customized metrics.
   */
  lastAppliedModality?: Modality;
  graphState: GraphMakerState;
};

/** Projected args consumed by the workflow. */
export type BlockArgs = {
  abundanceRef: PlRef;
  inputFilter?: string;
  // `isExpanded` is UI-only and deliberately excluded so toggling a metric
  // section doesn't change args (and re-activate the Run button).
  metrics: Metric[];
};

/** Pre-V3 args shape, frozen snapshot for `upgradeLegacy`. */
export type LegacyBlockArgs = {
  abundanceRef?: PlRef;
  metrics: MetricUI[];
};

/** Pre-V3 UI state shape, frozen snapshot for `upgradeLegacy`. */
export type LegacyBlockUiState = {
  blockTitle: string;
  graphState: GraphMakerState;
};
