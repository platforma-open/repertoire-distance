import type { GraphMakerState } from '@milaboratories/graph-maker';
import type { InferOutputsType, PColumnIdAndSpec } from '@platforma-sdk/model';
import {
  BlockModelV3,
  createPFrameForGraphs,
  DataModelBuilder,
  isPColumnSpec,
} from '@platforma-sdk/model';
import type {
  BlockArgs,
  BlockData,
  LegacyBlockArgs,
  LegacyBlockUiState,
  Metric,
} from './types';

export * from './types';

const defaultGraphState = (): GraphMakerState => ({
  title: 'Repertoire Distance',
  template: 'heatmap',
  currentTab: 'settings',
  layersSettings: {
    heatmap: {
      normalizationDirection: null,
    },
    heatmapClustered: {
      normalizationDirection: null,
    },
  },
});

const createDefaultMetrics = (): Metric[] => [
  {
    id: 'f1-cdr3ntvj',
    type: 'F1',
    intersection: 'CDR3ntVJ',
    downsampling: { type: 'hypergeometric', valueChooser: 'auto' },
    isExpanded: false,
  },
  {
    id: 'f2-cdr3ntvj',
    type: 'F2',
    intersection: 'CDR3ntVJ',
    downsampling: { type: 'hypergeometric', valueChooser: 'auto' },
    isExpanded: false,
  },
  {
    id: 'jaccard-cdr3ntvj',
    type: 'jaccard',
    intersection: 'CDR3ntVJ',
    downsampling: { type: 'hypergeometric', valueChooser: 'auto' },
    isExpanded: false,
  },
  {
    id: 'd-cdr3ntvj',
    type: 'D',
    intersection: 'CDR3ntVJ',
    downsampling: { type: 'hypergeometric', valueChooser: 'auto' },
    isExpanded: false,
  },
  {
    id: 'shared-cdr3ntvj',
    type: 'sharedClonotypes',
    intersection: 'CDR3ntVJ',
    downsampling: { type: 'hypergeometric', valueChooser: 'auto' },
    isExpanded: false,
  },
  {
    id: 'correlation-cdr3ntvj',
    type: 'correlation',
    intersection: 'CDR3ntVJ',
    downsampling: { type: 'hypergeometric', valueChooser: 'auto' },
    isExpanded: false,
  },
];

const blockDataModel = new DataModelBuilder()
  .from<BlockData>('V20260519')
  .upgradeLegacy<LegacyBlockArgs, LegacyBlockUiState>(({ args, uiState }) => ({
    abundanceRef: args?.abundanceRef,
    // Mirrors the previous V1 UI bootstrap (useMigrationMetrics): if a legacy
    // project landed with no metrics configured, seed the default set.
    metrics: args?.metrics && args.metrics.length > 0 ? args.metrics : createDefaultMetrics(),
    blockTitle: uiState?.blockTitle ?? 'Repertoire Distance',
    graphState: uiState?.graphState ?? defaultGraphState(),
  }))
  .init(() => ({
    abundanceRef: undefined,
    metrics: createDefaultMetrics(),
    blockTitle: 'Repertoire Distance',
    graphState: defaultGraphState(),
  }));

export const platforma = BlockModelV3.create(blockDataModel)

  .args<BlockArgs>((data) => {
    if (data.abundanceRef === undefined) throw new Error('Abundance dataset is required');
    if (data.metrics.length === 0) throw new Error('At least one metric is required');
    for (const metric of data.metrics) {
      if (metric.type === undefined) throw new Error('Metric type is required');
      if (metric.intersection === undefined) throw new Error('Metric intersection is required');
    }
    return {
      abundanceRef: data.abundanceRef,
      metrics: data.metrics,
    };
  })

  .output('abundanceOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => {
      if (!isPColumnSpec(spec)) return false;

      const hasCorrectAnnotations
        = spec.annotations?.['pl7.app/isAbundance'] === 'true'
          && spec.annotations?.['pl7.app/abundance/normalized'] === 'false'
          && spec.annotations?.['pl7.app/abundance/isPrimary'] === 'true';

      const hasCorrectAxes = spec.axesSpec?.length >= 2
        && spec.axesSpec[0]?.name === 'pl7.app/sampleId';

      const hasClusteringAlgorithm = spec.axesSpec?.[1]?.domain?.['pl7.app/vdj/clustering/algorithm'] !== undefined;

      return hasCorrectAnnotations && hasCorrectAxes && !hasClusteringAlgorithm;
    }, { label: { includeNativeLabel: false } }),
  )

  .outputWithStatus('pf', (ctx) => {
    const pCols = ctx.outputs?.resolve('pf')?.getPColumns();
    if (pCols === undefined) return undefined;
    return createPFrameForGraphs(ctx, pCols);
  })

  .output('heatmapPCols', (ctx) => {
    const pCols = ctx.outputs?.resolve('pf')?.getPColumns();
    if (pCols === undefined) return undefined;
    return pCols.map(
      (c) =>
        ({
          columnId: c.id,
          spec: c.spec,
        } satisfies PColumnIdAndSpec),
    );
  })

  .output('overlapMetricTable', (ctx) => {
    const pCols = ctx.outputs?.resolve('pf')?.getPColumns();
    if (pCols === undefined) return undefined;
    const overlapColumn = pCols.find((p) => p.spec.name === 'pl7.app/vdj/overlap');
    if (overlapColumn === undefined) return undefined;
    return ctx.createPTable({ columns: [overlapColumn] });
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title((ctx) => ctx.data.blockTitle)

  .sections((_) => [
    { type: 'link' as const, href: '/' as const, label: 'Distance Graph' },
  ])

  .done();

export type Platforma = typeof platforma;
export type BlockOutputs = InferOutputsType<typeof platforma>;
