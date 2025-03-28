import { GraphMakerState } from '@milaboratories/graph-maker';
import {
  BlockModel,
  createPlDataTable,
  createPlDataTableSheet,
  createPFrameForGraphs,
  getUniquePartitionKeys,
  InferOutputsType,
  isPColumnSpec,
  PColumnSpec,
  PlDataTableState,
  PlRef,
  RenderCtx
} from '@platforma-sdk/model';

type WeightFunction = 'auto' | 'read' | 'umi' | 'cell' | 'none';

type DownsamplingForm = {
  type: 'auto' | 'count' | 'top' | 'cumtop' | 'none';
  tag: 'read' | 'umi' | 'cell';
  countNorm: 'auto' | 'min' | 'fixed';
  countNormValue: number;
  topValue: number;
  cumtopValue: number;
};

/**
 * UI state
 */
export type UiState = {
  blockTitle: string;
  tableState?: PlDataTableState;
  graphState: GraphMakerState;
  weight: WeightFunction;
  downsampling: DownsamplingForm;
};

export type BlockArgs = {
  clnsRef?: PlRef;
  title?: string;

  /* downsampling options */
  onlyProductive: boolean;
  dropOutliers: boolean;
  overlapCriteria: string;
  downsampling?: string;
  weight?: WeightFunction;
  isReady?: boolean;
};

type CTX = RenderCtx<BlockArgs, UiState>;

const getOverlapColumn = (ctx: CTX) => {
  const pCols = ctx.outputs?.resolve('pf')?.getPColumns();
  if (pCols === undefined) {
    return undefined;
  }

  const anchor = pCols[0];
  if (!anchor) return undefined;

  const r = getUniquePartitionKeys(anchor.data);
  if (!r) return undefined;

  // for the table purposes, we set "pl7.app/axisNature": "heterogeneous" on gene axis
  if (pCols.length !== 1) {
    throw Error('unexpected number of columns');
  }

  return pCols[0];
};

export const model = BlockModel.create()
  .withArgs<BlockArgs>({
    overlapCriteria: 'CDR3|AA|V|J',
    onlyProductive: true,
    dropOutliers: false,
    isReady: false
  })
  .withUiState<UiState>({
    blockTitle: 'Repertoire Distance',
    weight: 'auto',
    tableState: {
      gridState: {},
      pTableParams: {
        sorting: [],
        filters: []
      }
    },
    downsampling: {
      type: 'auto',
      tag: 'read',
      countNorm: 'auto',
      countNormValue: 1000,
      topValue: 1000,
      cumtopValue: 80
    },
    graphState: {
      title: 'Repertoire Distance',
      template: 'heatmap'
    }
  })

  // Activate "Run" button only after these conditions get fulfilled
  .argsValid((ctx) =>  ctx.args.clnsRef !== undefined &&
                      // isReady is set to false while we compute dataset specific settings
                      ctx.args.isReady === true && 
                      ctx.args.downsampling !== undefined && 
                      ctx.args.weight !== undefined)

  .output('clnsOptions', (ctx) =>
    ctx.resultPool.getOptions((spec) => isPColumnSpec(spec) && spec.name === 'mixcr.com/clns')
  )

  .output('datasetSpec', (ctx) => {
    if (ctx.args.clnsRef) return ctx.resultPool.getSpecByRef(ctx.args.clnsRef) as PColumnSpec;
    else return undefined;
  })

  .output('overlapSpec', (ctx) => {
    return getOverlapColumn(ctx)?.spec;
  })

  .output('pt', (ctx) => {
    const pCol = getOverlapColumn(ctx);
    if (!pCol) return undefined;

    pCol.spec.axesSpec[3].annotations!['pl7.app/axisNature'] = 'heterogeneous';

    const r = getUniquePartitionKeys(pCol.data);
    if (!r) return undefined;

    return {
      table: createPlDataTable(ctx, [pCol], ctx.uiState?.tableState),
      sheets: r.map((values, i) => createPlDataTableSheet(ctx, pCol.spec.axesSpec[i], values))
    };
  })

  .output('pf', (ctx) => {
    const pCols = ctx.outputs?.resolve('pf')?.getPColumns();
    return createPFrameForGraphs(ctx, pCols);
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title((ctx) => (ctx.args.title ? `Repertoire Distance - ${ctx.args.title}` : 'Repertoire Distance'))

  .sections([
    { type: 'link', href: '/', label: 'Tabular Results' },
    { type: 'link', href: '/graph', label: 'Distance Heatmap' }
  ])

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
