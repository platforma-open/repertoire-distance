import type { GraphMakerState } from "@milaboratories/graph-maker";
import {
  flattenColumnContextDomain,
  graphMakerPlugin,
  transferableGraphState,
} from "@milaboratories/graph-maker/plugin";
import type { MetricUI } from "@platforma-open/milaboratories.repertoire-distance-2.kind";
import { kind } from "@platforma-open/milaboratories.repertoire-distance-2.kind";
import type { InferOutputsType, PColumnIdAndSpec } from "@platforma-sdk/model";
import { BlockModelV3, DataModelBuilder, isPColumnSpec } from "@platforma-sdk/model";
import type { BlockArgs, BlockData, LegacyBlockArgs, LegacyBlockUiState } from "./types";

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

export const createDefaultMetrics = (): MetricUI[] => [
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
export const createPeptideMetrics = (): MetricUI[] => [
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

// The heatmap is a graph-maker plugin instance: it owns its own view state and
// builds its own PFrame from the columns handed to it as anchors.
const heatmap = graphMakerPlugin.create({
  pluginId: "heatmap",
  // Where a chart saved before the plugin enters the chain.
  transferAt: "v1",
  config: {
    chartType: "heatmap",
    initialTitle: "Distance Analysis",
    initialTemplate: "heatmap",
    initialState: {
      currentTab: "settings",
      layersSettings: {
        heatmap: { normalizationDirection: null },
        heatmapClustered: { normalizationDirection: null },
      },
    },
  },
});

const blockDataModel = new DataModelBuilder({ kind })
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
  // A chart saved before the heatmap became a plugin instance: hand the plugin
  // what survives the move. The data mapping does not — the old ids name
  // columns in a frame built the old way — so it is left to `defaultOptions`.
  .transfer(heatmap, (data) => ({
    state: transferableGraphState(data.graphState),
    selection: undefined,
    chartType: "heatmap" as const,
    readonlyInputs: [],
    allowChartDeleting: false,
    allowTitleEditing: false,
  }))
  // A block created from a template starts on the params its kind accepted;
  // one created by hand gets the default metric set and an unpicked input.
  // `datasetLabel` stays unset either way — the UI snapshots it from the
  // dataset options once they resolve.
  .init(({ params }) => ({
    abundanceRef: params?.abundanceRef,
    metrics: params?.metrics ?? createDefaultMetrics(),
    lastAppliedModality: params?.lastAppliedModality,
    customBlockLabel: params?.customBlockLabel ?? "",
    datasetLabel: undefined,
    graphState: defaultGraphState(),
  }));

export const platforma = BlockModelV3.create({ dataModel: blockDataModel, kind })

  // The block's own overlap columns are the anchors; the plugin discovers what
  // else in the project can be bound to them. The two sample axes carry their
  // side in `contextDomain`, so a plain sample-metadata column is discovered
  // once per side and enters the frame qualified for it.
  .plugin(heatmap, {
    anchorColumns: (ctx) => ctx.outputs?.resolve("pf")?.getPColumns(),
  })

  .args<BlockArgs>((data) => {
    if (data.abundanceRef === undefined) throw new Error("Abundance dataset is required");
    if (data.metrics.length === 0) throw new Error("At least one metric is required");
    for (const metric of data.metrics) {
      if (metric.type === undefined) throw new Error("Metric type is required");
      if (metric.intersection === undefined) throw new Error("Metric intersection is required");
    }
    return {
      abundanceRef: data.abundanceRef,
      // Project only the fields the workflow consumes. `isExpanded` is UI-only
      // (metric section open/closed) — including it would make expand/collapse
      // change args and re-activate the Run button.
      metrics: data.metrics.map((m) => ({
        id: m.id,
        type: m.type,
        intersection: m.intersection,
        downsampling: m.downsampling,
      })),
    };
  })

  // Inverse of the kind's init-params contract. `lastAppliedModality` travels
  // with `metrics` because it is what stops the UI from reseeding the list on
  // the applied input. `datasetLabel` is re-snapshotted from the dataset
  // options, and `graphState` is heatmap view state.
  .templateParams((data) => ({
    abundanceRef: data.abundanceRef,
    metrics: data.metrics,
    lastAppliedModality: data.lastAppliedModality,
    customBlockLabel: data.customBlockLabel,
  }))

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

  // Specs as the plugin's frame holds them, which is not how the workflow wrote
  // them: the plugin moves an axis role out of `contextDomain` and into
  // `domain`. The UI builds its default options from these, so describing the
  // axes any other way asks the chart for axes the frame does not have.
  .output("heatmapPCols", (ctx) => {
    const pCols = ctx.outputs?.resolve("pf")?.getPColumns();
    if (pCols === undefined) return undefined;
    return pCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: flattenColumnContextDomain(c.spec),
        }) satisfies PColumnIdAndSpec,
    );
  })

  .output("overlapMetricTable", (ctx) => {
    const pCols = ctx.outputs?.resolve("pf")?.getPColumns();
    if (pCols === undefined) return undefined;
    // Match both the current spec name and the legacy VDJ-prefixed one so
    // projects with cached output from an older block version still resolve.
    // @TODO: Drop the legacy lookup once no projects with old cached outputs remain (2026-05-27).
    const overlapColumn = pCols.find(
      (p) => p.spec.name === "pl7.app/overlap" || p.spec.name === "pl7.app/vdj/overlap",
    );
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
