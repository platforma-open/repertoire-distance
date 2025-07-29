import type { UiState, Metric } from './types';

export const createDefaultUiState = (): UiState => {
  return {
    blockTitle: 'Repertoire Distance',
    graphState: {
      title: 'Repertoire Distance',
      template: 'heatmap',
      currentTab: 'settings',
      layersSettings: {
        heatmapClustered: {
          normalizationDirection: null,
        },
      },
    },
  };
};

export const createDefaultMetricUis = (): Metric[] => {
  return [
    {
      id: 'f1-cdr3ntvj',
      type: 'F1',
      intersection: 'CDR3ntVJ',
      downsampling: {
        type: 'hypergeometric',
        valueChooser: 'auto',
      },
      isExpanded: false,
    },
    {
      id: 'f2-cdr3ntvj',
      type: 'F2',
      intersection: 'CDR3ntVJ',
      downsampling: {
        type: 'hypergeometric',
        valueChooser: 'auto',
      },
      isExpanded: false,
    },
    {
      id: 'jaccard-cdr3ntvj',
      type: 'jaccard',
      intersection: 'CDR3ntVJ',
      downsampling: {
        type: 'hypergeometric',
        valueChooser: 'auto',
      },
      isExpanded: false,
    },
    {
      id: 'd-cdr3ntvj',
      type: 'D',
      intersection: 'CDR3ntVJ',
      downsampling: {
        type: 'hypergeometric',
        valueChooser: 'auto',
      },
      isExpanded: false,
    },
    {
      id: 'shared-cdr3ntvj',
      type: 'sharedClonotypes',
      intersection: 'CDR3ntVJ',
      downsampling: {
        type: 'hypergeometric',
        valueChooser: 'auto',
      },
      isExpanded: false,
    },
    {
      id: 'correlation-cdr3ntvj',
      type: 'correlation',
      intersection: 'CDR3ntVJ',
      downsampling: {
        type: 'hypergeometric',
        valueChooser: 'auto',
      },
      isExpanded: false,
    },
  ];
}; 