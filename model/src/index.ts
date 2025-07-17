import type { GraphMakerState } from '@milaboratories/graph-maker';
import type { InferOutputsType, PColumnIdAndSpec, PColumnSpec, PlDataTableStateV2, PlRef } from '@platforma-sdk/model';
import { BlockModel, createPFrameForGraphs, createPlDataTableStateV2, createPlDataTableV2, isPColumnSpec } from '@platforma-sdk/model';

export * from './convertes';

export type DistanceType = 'F1' | 'F2' | 'D' |
  'sharedClonotypes' | 'correlation' | 'jaccard';

export type IntersectionType = 'CDR3ntVJ' | 'CDR3aaVJ' | 'CDR3nt' | 'CDR3aa';

export type Metric = {
  type: DistanceType | undefined;
  intersection: IntersectionType | undefined;
};

export type MetricUI = Metric & {
  id: string;
  isExpanded: boolean;
};

export type BlockArgs = {
  abundanceRef?: PlRef;
  metrics: Metric[];
};

export type UiState = {
  blockTitle: string;
  tableState: PlDataTableStateV2;
  graphState: GraphMakerState;
  metrics: MetricUI[];
};

function isNumericType(c: PColumnSpec): boolean {
  return c.valueType === 'Double' || c.valueType === 'Int' || c.valueType === 'Float' || c.valueType === 'Long';
}

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    metrics: [],
  })

  .withUiState<UiState>({
    blockTitle: 'Repertoire Distance 2',
    graphState: {
      title: 'Repertoire Distance 2',
      template: 'heatmap',
      currentTab: null,
    },

    tableState: createPlDataTableStateV2(),

    metrics: [
      {
        id: 'F1',
        type: 'F1',
        intersection: 'CDR3ntVJ',
        isExpanded: true,
      },
      {
        id: 'F2',
        type: 'F2',
        intersection: 'CDR3ntVJ',
        isExpanded: false,
      },
      {
        id: 'D',
        type: 'D',
        intersection: 'CDR3ntVJ',
        isExpanded: false,
      },
      {
        id: 'sharedClonotypes',
        type: 'sharedClonotypes',
        intersection: 'CDR3ntVJ',
        isExpanded: false,
      },
      {
        id: 'correlation',
        type: 'correlation',
        intersection: 'CDR3ntVJ',
        isExpanded: false,
      },
      {
        id: 'jaccard',
        type: 'jaccard',
        intersection: 'CDR3ntVJ',
        isExpanded: false,
      },
    ],
  })

  .argsValid((ctx) => ctx.args.abundanceRef !== undefined)

  .output('abundanceOptions', (ctx) =>
    ctx.resultPool.getOptions((c) =>
      isPColumnSpec(c) && isNumericType(c)
      && c.annotations?.['pl7.app/isAbundance'] === 'true'
      && c.annotations?.['pl7.app/abundance/normalized'] === 'false'
      && c.annotations?.['pl7.app/abundance/isPrimary'] === 'true',
    ))

  .output('pt', (ctx) => {
    const pCols = ctx.outputs?.resolve('pfUnique')?.getPColumns();
    if (pCols === undefined) {
      return undefined;
    }

    return createPlDataTableV2(ctx, pCols, ctx.uiState.tableState);
  })

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

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title((ctx) => ctx.uiState?.blockTitle ?? 'Repertoire Distance')

  .sections((_) => [
    { type: 'link', href: '/', label: 'Main' },
    { type: 'link', href: '/distanceGraph', label: 'Distance Graph' },
  ])

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
