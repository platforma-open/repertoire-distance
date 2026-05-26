# @platforma-open/milaboratories.repertoire-distance.model

## 1.5.0

### Minor Changes

- 4b18d0b: Migrate block to BlockModelV3. Unified `BlockData` (UI-shaped persistence); `.args` lambda derives the workflow-visible shape and validates by throw. Persisted V1 state preserved via `DataModelBuilder.upgradeLegacy`. UI bindings move to `app.model.data`; `defineApp` → `defineAppV3`.

  Pin SDK to 1.77.4 / workflow-tengo 5.25.0 (previously caret-ranged from 1.65.10). Drop the V1-only `useMigrationMetrics` bootstrap — legacy projects with empty metrics now get the default seed at `upgradeLegacy` time. Drop dead `model/src/convertes.ts` (referenced a non-existent `MetricUI` type and was unused).

## 1.4.1

### Patch Changes

- bfcebb7: Fix KeyError when downsampling is set to None by computing fractionOfReads in all downsampling branches. Adopt newer SDK versions: bump vue peer to ^3.5.24, switch pf output to outputWithStatus for graph-maker 1.3.0 compatibility, drop removed /styles subpath imports, and raise vite build target to es2022 for ui-vue top-level await.

## 1.4.0

### Minor Changes

- cc0c12f: deduplication fix

## 1.3.5

### Patch Changes

- a664fc5: SDK update

## 1.3.4

### Patch Changes

- 94b4deb: technical release
- 988e7a6: technical release
- d9d3773: technical release
- fcac88a: technical release

## 1.3.3

### Patch Changes

- ac55307: technical release

## 1.3.2

### Patch Changes

- 63c9e46: Full SDK and python update

## 1.3.1

### Patch Changes

- 42f926f: Updated SDK

## 1.3.0

### Minor Changes

- a5f579f: Downsampling added, UI switched to PlElementList, table on MainPage removed, added support for google batch, added support of single cell data

## 1.2.0

### Minor Changes

- fbb6c2e: Update to new sdk

## 1.1.1

### Patch Changes

- 14bde32: Migration to new sdk, updating dependencies

## 1.1.0

### Minor Changes

- 0e02fc6: block renaming

## 2.0.0

### Major Changes

- bbccd71: MVB
