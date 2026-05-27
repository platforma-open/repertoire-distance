import type { GraphMakerState } from "@milaboratories/graph-maker";
import type { InferOutputsType, PColumnIdAndSpec } from "@platforma-sdk/model";
import {
  BlockModelV3,
  createPFrameForGraphs,
  DataModelBuilder,
  isPColumnSpec,
} from "@platforma-sdk/model";
import type { BlockArgs, BlockData, LegacyBlockArgs, LegacyBlockUiState, Metric } from "./types";

export * from "./types";

const defaultGraphState = (): GraphMakerState => ({
  title: "Distance Analysis",
  template: "heatmap",
  currentTab: "settings",
  layersSettings: {
    heatmap: {
      normalizationDirection: null,
    },
    heatmapClustered: {
      normalizationDirection: null,
    },
  },
});

export const createDefaultMetrics = (): Metric[] => [
  {
    id: "f1-cdr3ntvj",
    type: "F1",
    intersection: "CDR3ntVJ",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "f2-cdr3ntvj",
    type: "F2",
    intersection: "CDR3ntVJ",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "jaccard-cdr3ntvj",
    type: "jaccard",
    intersection: "CDR3ntVJ",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "d-cdr3ntvj",
    type: "D",
    intersection: "CDR3ntVJ",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "shared-cdr3ntvj",
    type: "sharedClonotypes",
    intersection: "CDR3ntVJ",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "correlation-cdr3ntvj",
    type: "correlation",
    intersection: "CDR3ntVJ",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
];

// Peptide inputs have no V/J genes — sequence-only intersections only. Use
// amino-acid sequences as the default (most common for peptide discovery).
export const createPeptideMetrics = (): Metric[] => [
  {
    id: "f1-cdr3aa",
    type: "F1",
    intersection: "CDR3aa",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "f2-cdr3aa",
    type: "F2",
    intersection: "CDR3aa",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "jaccard-cdr3aa",
    type: "jaccard",
    intersection: "CDR3aa",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "d-cdr3aa",
    type: "D",
    intersection: "CDR3aa",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "shared-cdr3aa",
    type: "sharedClonotypes",
    intersection: "CDR3aa",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
  {
    id: "correlation-cdr3aa",
    type: "correlation",
    intersection: "CDR3aa",
    downsampling: { type: "hypergeometric", valueChooser: "auto" },
    isExpanded: false,
  },
];

// V1 stored only the synthesized "Repertoire Distance – {dataset}" string in
// `uiState.blockTitle`. Parse it back to seed `datasetLabel` so the subtitle
// stays populated for legacy projects without requiring the user to re-touch
// the dataset picker.
const LEGACY_TITLE_PREFIX = "Repertoire Distance – ";
function parseLegacyDatasetLabel(legacy: string | undefined): string | undefined {
  if (!legacy?.startsWith(LEGACY_TITLE_PREFIX)) return undefined;
  return legacy.slice(LEGACY_TITLE_PREFIX.length).trim() || undefined;
}

const blockDataModel = new DataModelBuilder()
  .from<BlockData>("V20260519")
  .upgradeLegacy<LegacyBlockArgs, LegacyBlockUiState>(({ args, uiState }) => ({
    abundanceRef: args?.abundanceRef,
    // Mirrors the previous V1 UI bootstrap (useMigrationMetrics): if a legacy
    // project landed with no metrics configured, seed the default set.
    metrics: args?.metrics && args.metrics.length > 0 ? args.metrics : createDefaultMetrics(),
    customBlockLabel: "",
    datasetLabel: parseLegacyDatasetLabel(uiState?.blockTitle),
    lastAppliedModality: "antibody_tcr",
    graphState: uiState?.graphState ?? defaultGraphState(),
  }))
  .init(() => ({
    abundanceRef: undefined,
    metrics: createDefaultMetrics(),
    customBlockLabel: "",
    datasetLabel: undefined,
    graphState: defaultGraphState(),
  }));

export const platforma = BlockModelV3.create(blockDataModel)

  .args<BlockArgs>((data) => {
    if (data.abundanceRef === undefined) throw new Error("Abundance dataset is required");
    if (data.metrics.length === 0) throw new Error("At least one metric is required");
    for (const metric of data.metrics) {
      if (metric.type === undefined) throw new Error("Metric type is required");
      if (metric.intersection === undefined) throw new Error("Metric intersection is required");
    }
    return {
      abundanceRef: data.abundanceRef,
      metrics: data.metrics,
    };
  })

  .output("abundanceOptions", (ctx) =>
    ctx.resultPool.getOptions(
      (spec) => {
        if (!isPColumnSpec(spec)) return false;

        // Check basic abundance criteria
        const hasCorrectAnnotations =
          spec.annotations?.["pl7.app/isAbundance"] === "true" &&
          spec.annotations?.["pl7.app/abundance/normalized"] === "false" &&
          spec.annotations?.["pl7.app/abundance/isPrimary"] === "true";

        // Check axes structure
        const hasCorrectAxes =
          spec.axesSpec?.length >= 2 && spec.axesSpec[0]?.name === "pl7.app/sampleId";

        // Filter out clustered abundance.
        const axis1Domain = spec.axesSpec?.[1]?.domain;
        const hasClusteringAlgorithm =
          // @TODO; Remove 'vdj' case once block versions with old namespace are not used (2026-05-27)
          axis1Domain?.["pl7.app/clustering/algorithm"] !== undefined ||
          axis1Domain?.["pl7.app/vdj/clustering/algorithm"] !== undefined;

        return hasCorrectAnnotations && hasCorrectAxes && !hasClusteringAlgorithm;
      },
      { label: { includeNativeLabel: false } },
    ),
  )

  .outputWithStatus("pf", (ctx) => {
    const pCols = ctx.outputs?.resolve("pf")?.getPColumns();
    if (pCols === undefined) return undefined;
    return createPFrameForGraphs(ctx, pCols);
  })

  .output("heatmapPCols", (ctx) => {
    const pCols = ctx.outputs?.resolve("pf")?.getPColumns();
    if (pCols === undefined) return undefined;
    return pCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        }) satisfies PColumnIdAndSpec,
    );
  })

  .output("overlapMetricTable", (ctx) => {
    const pCols = ctx.outputs?.resolve("pf")?.getPColumns();
    if (pCols === undefined) return undefined;
    const overlapColumn = pCols.find((p) => p.spec.name === "pl7.app/overlap");
    if (overlapColumn === undefined) return undefined;
    return ctx.createPTable({ columns: [overlapColumn] });
  })

  .output(
    "modality",
    (ctx) => {
      const spec = ctx.data.abundanceRef
        ? ctx.resultPool.getPColumnSpecByRef(ctx.data.abundanceRef)
        : undefined;
      if (!spec) return undefined;
      return spec.axesSpec[1]?.name === "pl7.app/variantKey" ? "peptide" : "antibody_tcr";
    },
    { retentive: true },
  )

  .output("isRunning", (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title(() => "Distance Analysis")

  .subtitle((ctx) => ctx.data.customBlockLabel || ctx.data.datasetLabel || "")

  .sections((_) => [{ type: "link" as const, href: "/" as const, label: "Distance Graph" }])

  .done();

export type Platforma = typeof platforma;
export type BlockOutputs = InferOutputsType<typeof platforma>;
