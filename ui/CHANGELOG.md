# @platforma-open/milaboratories.repertoire-distance.ui

## 2.4.1

### Patch Changes

- ef2289d: Update the SDK and accept a subset filter (e.g. a Repertoire Labeling label or Lead Selection picks) with the input abundance. The abundance list is built with buildDatasetOptions (requireEnrichments: false). The subset restricts the clonotypes before the distances are computed, so overlaps, downsampling and sample totals describe the subset only. Outputs of a subset run carry pl7.app/inputSubset in their domain and a trace rooted in the subset, so their labels name it; the default subtitle names the subset too. Unfiltered runs are unchanged.
- Updated dependencies [ef2289d]
  - @platforma-open/milaboratories.repertoire-distance-2.model@2.4.1
  - @platforma-open/milaboratories.repertoire-distance-2.kind@1.0.1

## 1.6.0

### Minor Changes

- 1c8bda8: Migrate onto the latest block-tools structurer layout, add the mandatory block
  kind, and bump the SDK to latest (model 1.83.0, ui-vue 1.83.3, workflow-tengo
  6.8.3, tengo-builder 4.0.23, block-tools 2.14.3).

  The kind's init-params contract is the abundance column, the metric rows (with
  the input modality they were written for) and the block subtitle, so a project
  template can seed a configured Distance Analysis block. Applying one also
  restores the subtitle now: the settings page snapshots the dataset label from
  the options when the block arrives with an input already chosen.

  The metric vocabulary (`DistanceType`, `IntersectionType`, `Metric`) moved into
  the kind package, which the model and UI import from. The persisted shape is
  unchanged and the model was already on BlockModelV3.

  The side of the pair each sample axis stands for moved from its `domain` to its
  `contextDomain`, so both axes stay equal to the plain `pl7.app/sampleId` other
  blocks emit and sample metadata can reach the heatmap. The model folds the
  marker back into `domain` when it builds the PFrame, where axes are joined by
  exact domain and the two sides must stay apart.

### Patch Changes

- Updated dependencies [1c8bda8]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.7.0

## 1.5.1

### Patch Changes

- 6e649e3: Solve bug related to clonotypes with missing CDR3 sequences
- Updated dependencies [6e649e3]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.6.1

## 1.5.0

### Minor Changes

- 5c126d6: Adapt to peptide inputs

### Patch Changes

- Updated dependencies [5c126d6]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.6.0

## 1.4.0

### Minor Changes

- 4b18d0b: Migrate block to BlockModelV3. Unified `BlockData` (UI-shaped persistence); `.args` lambda derives the workflow-visible shape and validates by throw. Persisted V1 state preserved via `DataModelBuilder.upgradeLegacy`. UI bindings move to `app.model.data`; `defineApp` → `defineAppV3`.

  Pin SDK to 1.77.4 / workflow-tengo 5.25.0 (previously caret-ranged from 1.65.10). Drop the V1-only `useMigrationMetrics` bootstrap — legacy projects with empty metrics now get the default seed at `upgradeLegacy` time. Drop dead `model/src/convertes.ts` (referenced a non-existent `MetricUI` type and was unused).

### Patch Changes

- Updated dependencies [4b18d0b]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.5.0

## 1.3.8

### Patch Changes

- bfcebb7: Fix KeyError when downsampling is set to None by computing fractionOfReads in all downsampling branches. Adopt newer SDK versions: bump vue peer to ^3.5.24, switch pf output to outputWithStatus for graph-maker 1.3.0 compatibility, drop removed /styles subpath imports, and raise vite build target to es2022 for ui-vue top-level await.
- Updated dependencies [bfcebb7]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.4.1

## 1.3.7

### Patch Changes

- Updated dependencies [cc0c12f]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.4.0

## 1.3.6

### Patch Changes

- a664fc5: SDK update
- Updated dependencies [a664fc5]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.5

## 1.3.5

### Patch Changes

- 933e495: update graph-maker version

## 1.3.4

### Patch Changes

- 94b4deb: technical release
- 988e7a6: technical release
- d9d3773: technical release
- fcac88a: technical release
- Updated dependencies [94b4deb]
- Updated dependencies [988e7a6]
- Updated dependencies [d9d3773]
- Updated dependencies [fcac88a]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.4

## 1.3.3

### Patch Changes

- ac55307: technical release
- Updated dependencies [ac55307]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.3

## 1.3.2

### Patch Changes

- 63c9e46: Full SDK and python update
- Updated dependencies [63c9e46]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.2

## 1.3.1

### Patch Changes

- 42f926f: Updated SDK
- Updated dependencies [42f926f]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.1

## 1.3.0

### Minor Changes

- a5f579f: Downsampling added, UI switched to PlElementList, table on MainPage removed, added support for google batch, added support of single cell data

### Patch Changes

- Updated dependencies [a5f579f]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.0

## 1.2.0

### Minor Changes

- fbb6c2e: Update to new sdk

### Patch Changes

- Updated dependencies [fbb6c2e]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.2.0

## 1.1.1

### Patch Changes

- 14bde32: Migration to new sdk, updating dependencies
- Updated dependencies [14bde32]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.1.1

## 1.1.0

### Minor Changes

- 0e02fc6: block renaming

### Patch Changes

- Updated dependencies [0e02fc6]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.1.0

## 2.0.0

### Major Changes

- bbccd71: MVB

### Patch Changes

- Updated dependencies [bbccd71]
  - @platforma-open/milaboratories.repertoire-distance.model@2.0.0
