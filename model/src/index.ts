import type { InferOutputsType, PColumnIdAndSpec } from '@platforma-sdk/model';
import { BlockModel, createPFrameForGraphs, isPColumnSpec } from '@platforma-sdk/model';
import type { BlockArgs, UiState } from './types';
import { createDefaultUiState, createDefaultMetricUis } from './uiState';

export * from './types';
export * from './uiState';

export const model = BlockModel.create()
  .withArgs<BlockArgs>({
    metrics: createDefaultMetricUis(),
  })

  .withUiState<UiState>(createDefaultUiState())

  .argsValid((ctx) =>
    ctx.args.abundanceRef !== undefined,
  )

  .output('abundanceOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => {
      if (!isPColumnSpec(spec)) return false;

      // Check basic abundance criteria
      const hasCorrectAnnotations
        = spec.annotations?.['pl7.app/isAbundance'] === 'true'
          && spec.annotations?.['pl7.app/abundance/normalized'] === 'false'
          && spec.annotations?.['pl7.app/abundance/isPrimary'] === 'true';

      // Check axes structure
      const hasCorrectAxes = spec.axesSpec?.length >= 2
        && spec.axesSpec[0]?.name === 'pl7.app/sampleId';

      // Filter out data with clustering algorithm in axes[1].domain
      const hasClusteringAlgorithm = spec.axesSpec?.[1]?.domain?.['pl7.app/vdj/clustering/algorithm'] !== undefined;

      return hasCorrectAnnotations && hasCorrectAxes && !hasClusteringAlgorithm;
    }, { includeNativeLabel: false }),
  )

  .output('pf', (ctx) => {
    const pCols = ctx.outputs?.resolve('pf')?.getPColumns();

    if (pCols === undefined) {
      return undefined;
    }
    return createPFrameForGraphs(ctx, pCols);
  })

  .output('heatmapPCols', (ctx) => {
    const pCols = ctx.outputs?.resolve('pf')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

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
    if (pCols === undefined) {
      return undefined;
    }
    const overlapColumn = pCols.find((p) => p.spec.name === 'pl7.app/vdj/overlap');
    if (overlapColumn === undefined) {
      return undefined;
    }
    return ctx.createPTable({ columns: [overlapColumn] });
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title((ctx) => ctx.uiState?.blockTitle ?? 'Repertoire Distance')

  .sections((_) => [
    { type: 'link', href: '/', label: 'Distance Graph' },
    // { type: 'link', href: '/distanceGraph', label: 'Distance Graph' },
  ])

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
