# @platforma-open/milaboratories.repertoire-distance

## 2.3.1

### Patch Changes

- 6e649e3: Solve bug related to clonotypes with missing CDR3 sequences
- 5bbfba7: Solve bug related to clonotypes with missing CDR3 sequences
- Updated dependencies [6e649e3]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.6.1
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.5.1
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.4.1

## 2.3.0

### Minor Changes

- 5c126d6: Adapt to peptide inputs

### Patch Changes

- Updated dependencies [5c126d6]
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.4.0
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.6.0
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.5.0

## 2.2.0

### Minor Changes

- 4b18d0b: Migrate block to BlockModelV3. Unified `BlockData` (UI-shaped persistence); `.args` lambda derives the workflow-visible shape and validates by throw. Persisted V1 state preserved via `DataModelBuilder.upgradeLegacy`. UI bindings move to `app.model.data`; `defineApp` → `defineAppV3`.

  Pin SDK to 1.77.4 / workflow-tengo 5.25.0 (previously caret-ranged from 1.65.10). Drop the V1-only `useMigrationMetrics` bootstrap — legacy projects with empty metrics now get the default seed at `upgradeLegacy` time. Drop dead `model/src/convertes.ts` (referenced a non-existent `MetricUI` type and was unused).

### Patch Changes

- Updated dependencies [4b18d0b]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.5.0
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.4.0

## 2.1.10

### Patch Changes

- Updated dependencies [bfcebb7]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.4.1
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.3.8
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.3.1

## 2.1.9

### Patch Changes

- Updated dependencies [cc0c12f]
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.3.0
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.4.0
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.3.7

## 2.1.8

### Patch Changes

- 50547c3: Block metadata updated

## 2.1.7

### Patch Changes

- a664fc5: SDK update
- Updated dependencies [a664fc5]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.5
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.3.6
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.2.6

## 2.1.6

### Patch Changes

- Updated dependencies [933e495]
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.3.5

## 2.1.5

### Patch Changes

- Updated dependencies [ae72dd6]
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.2.5

## 2.1.4

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
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.3.4
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.2.4

## 2.1.3

### Patch Changes

- ac55307: technical release
- Updated dependencies [ac55307]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.3
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.3.3
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.2.3

## 2.1.2

### Patch Changes

- Updated dependencies [63c9e46]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.2
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.3.2
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.2.2

## 2.1.1

### Patch Changes

- 42f926f: Updated SDK
- Updated dependencies [42f926f]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.1
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.3.1
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.2.1

## 2.1.0

### Minor Changes

- 1ce19bd: bump version

## 1.3.0

### Minor Changes

- a5f579f: Downsampling added, UI switched to PlElementList, table on MainPage removed, added support for google batch, added support of single cell data

### Patch Changes

- Updated dependencies [a5f579f]
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.2.0
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.3.0
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.3.0

## 1.2.2

### Patch Changes

- Updated dependencies [fbb6c2e]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.2.0
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.2.0

## 1.2.1

### Patch Changes

- 14bde32: Migration to new sdk, updating dependencies
- Updated dependencies [14bde32]
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.1.1
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.1.1
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.1.1

## 1.2.0

### Minor Changes

- bfdc30b: allow prepare venv on Windows

## 1.1.0

### Minor Changes

- 0e02fc6: block renaming

### Patch Changes

- Updated dependencies [0e02fc6]
  - @platforma-open/milaboratories.repertoire-distance-2.model@1.1.0
  - @platforma-open/milaboratories.repertoire-distance-2.ui@1.1.0
  - @platforma-open/milaboratories.repertoire-distance-2.workflow@1.1.0

## 2.0.0

### Major Changes

- bbccd71: MVB

### Minor Changes

- 8ab2270: gitignore added

### Patch Changes

- Updated dependencies [bbccd71]
  - @platforma-open/milaboratories.repertoire-distance.model@2.0.0
  - @platforma-open/milaboratories.repertoire-distance.ui@2.0.0
  - @platforma-open/milaboratories.repertoire-distance.workflow@2.0.0
