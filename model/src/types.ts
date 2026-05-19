import type { GraphMakerState } from '@milaboratories/graph-maker';
import type { PlRef } from '@platforma-sdk/model';

export type DistanceType = 'F1' | 'F2' | 'D' |
  'sharedClonotypes' | 'correlation' | 'jaccard';

export type IntersectionType = 'CDR3ntVJ' | 'CDR3aaVJ' | 'CDR3nt' | 'CDR3aa';

export type Metric = {
  id: string;
  type: DistanceType | undefined;
  intersection: IntersectionType | undefined;
  downsampling: {
    type?: 'none' | 'top' | 'cumtop' | 'hypergeometric';
    valueChooser?: 'min' | 'fixed' | 'max' | 'auto';
    n?: number;
  };
  isExpanded?: boolean;
};

/** Unified V3 data: persisted state shaped on the UI's terms. */
export type BlockData = {
  abundanceRef?: PlRef;
  metrics: Metric[];
  customBlockLabel: string;
  /**
   * Human-readable label of the chosen abundance dataset, snapshotted by the
   * UI in the same gesture that picks `abundanceRef`. Consumed by `.subtitle`
   * so the default block label can be shown without re-querying the result
   * pool there.
   */
  datasetLabel?: string;
  graphState: GraphMakerState;
};

/** Projected args consumed by the workflow. */
export type BlockArgs = {
  abundanceRef: PlRef;
  metrics: Metric[];
};

/** Pre-V3 args shape, frozen snapshot for `upgradeLegacy`. */
export type LegacyBlockArgs = {
  abundanceRef?: PlRef;
  metrics: Metric[];
};

/** Pre-V3 UI state shape, frozen snapshot for `upgradeLegacy`. */
export type LegacyBlockUiState = {
  blockTitle: string;
  graphState: GraphMakerState;
};
