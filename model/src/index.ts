import type { GraphMakerState } from "@milaboratories/graph-maker";
import type { MetricUI } from "@platforma-open/milaboratories.repertoire-distance-2.kind";
import { kind } from "@platforma-open/milaboratories.repertoire-distance-2.kind";
import type {
  DatasetOption,
  InferOutputsType,
  PColumnIdAndSpec,
  PColumnSpec,
} from "@platforma-sdk/model";
import {
  BlockModelV3,
  buildDatasetOptions,
  createGlobalPObjectId,
  DataModelBuilder,
  getRelatedColumns,
  isHiddenFromGraphColumn,
  isHiddenFromUIColumn,
  isPColumnSpec,
} from "@platforma-sdk/model";
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
  // A block created from a template starts on the params its kind accepted;
  // one created by hand gets the default metric set and an unpicked input.
  // `datasetLabel` stays unset either way — the UI snapshots it from the
  // dataset options once they resolve.
  .init(({ params }) => ({
    abundanceRef: params?.abundanceRef,
    filterRef: params?.filterRef,
    metrics: params?.metrics ?? createDefaultMetrics(),
    lastAppliedModality: params?.lastAppliedModality,
    customBlockLabel: params?.customBlockLabel ?? "",
    datasetLabel: undefined,
    graphState: defaultGraphState(),
  }));

export const platforma = BlockModelV3.create({ dataModel: blockDataModel, kind })

  .args<BlockArgs>((data) => {
    if (data.abundanceRef === undefined) throw new Error("Abundance dataset is required");
    if (data.metrics.length === 0) throw new Error("At least one metric is required");
    for (const metric of data.metrics) {
      if (metric.type === undefined) throw new Error("Metric type is required");
      if (metric.intersection === undefined) throw new Error("Metric intersection is required");
    }
    return {
      abundanceRef: data.abundanceRef,
      ...(data.filterRef !== undefined && {
        inputFilter: createGlobalPObjectId(data.filterRef.blockId, data.filterRef.name),
      }),
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
    filterRef: data.filterRef,
    metrics: data.metrics,
    lastAppliedModality: data.lastAppliedModality,
    customBlockLabel: data.customBlockLabel,
  }))

  // Each abundance carries its subset columns (e.g. Repertoire Labeling labels) as filters.
  .output(
    "abundanceOptions",
    (ctx): DatasetOption[] =>
      buildDatasetOptions(ctx, {
        primary: (spec) => {
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
        // Only subsets keyed by the clonotype axis alone: a sample subset would drop whole samples.
        filter: (spec) =>
          isPColumnSpec(spec) &&
          spec.axesSpec.length === 1 &&
          spec.axesSpec[0].name !== "pl7.app/sampleId",
        requireEnrichments: false,
      }) ?? [],
  )

  // Same shape as `createPFrameForGraphs`, with the specs rewritten on the way
  // into the frame.
  //
  // The overlap matrix is keyed by two `pl7.app/sampleId` axes, and the "which
  // side of the pair" marker lives in their `contextDomain`, not their
  // `domain`. That is what makes sample metadata reach this block at all:
  // `domain` is matched by exact equality, so a marker placed there would make
  // both axes unequal to the plain `pl7.app/sampleId` every other block emits,
  // and `getRelatedColumns` below would find no labels, no metadata columns,
  // nothing to annotate the heatmap with. `contextDomain` is matched by
  // kinship instead, so the axes stay canonical for discovery while still
  // carrying the marker.
  //
  // Inside a PFrame, however, axes are joined by exact domain. Left the way
  // they arrive, the two sides would read as one axis and the matrix would
  // collapse onto its diagonal. So the marker is folded back into `domain`
  // here, on the column spec and on every axis, once discovery has already
  // happened. Both halves are needed: drop the fold and the frame is wrong,
  // move the marker back into `domain` upstream and the frame is bare.
  .outputWithStatus("pf", (ctx) => {
    const pCols = ctx.outputs?.resolve("pf")?.getPColumns();
    if (pCols == null || pCols?.some((v) => v.data === undefined)) return undefined;

    const suitableSpec = (spec: PColumnSpec) =>
      !isHiddenFromUIColumn(spec) && !isHiddenFromGraphColumn(spec);

    return ctx.createPFrame(
      getRelatedColumns(ctx, { predicate: suitableSpec, columns: pCols }).map((c) => {
        return {
          ...c,
          spec: {
            ...c.spec,
            domain: {
              ...c.spec.domain,
              ...c.spec.contextDomain,
            },
            axesSpec: c.spec.axesSpec.map((axis) => {
              return {
                ...axis,
                domain: {
                  ...axis.domain,
                  ...axis.contextDomain,
                },
              };
            }),
          },
        };
      }),
    );
  })

  .output("heatmapPCols", (ctx) => {
    const pCols = ctx.outputs?.resolve("pf")?.getPColumns();
    if (pCols === undefined) return undefined;
    return pCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: {
            ...c.spec,
            domain: {
              ...c.spec.domain,
              ...c.spec.contextDomain,
            },
            axesSpec: c.spec.axesSpec.map((axis) => {
              return {
                ...axis,
                domain: {
                  ...axis.domain,
                  ...axis.contextDomain,
                },
              };
            }),
          },
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
