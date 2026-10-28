# @platforma-open/milaboratories.repertoire-distance.test

## 2.1.6

### Patch Changes

- ef2289d: Update the SDK and accept a subset filter (e.g. a Repertoire Labeling label or Lead Selection picks) with the input abundance. The abundance list is built with buildDatasetOptions (requireEnrichments: false). The subset restricts the clonotypes before the distances are computed, so overlaps, downsampling and sample totals describe the subset only. Outputs of a subset run carry pl7.app/inputSubset in their domain and a trace rooted in the subset, so their labels name it; the default subtitle names the subset too. Unfiltered runs are unchanged.

## 2.1.5

### Patch Changes

- a664fc5: SDK update

## 2.1.4

### Patch Changes

- 94b4deb: technical release
- 988e7a6: technical release
- d9d3773: technical release
- fcac88a: technical release

## 2.1.3

### Patch Changes

- ac55307: technical release

## 2.1.2

### Patch Changes

- 42f926f: Updated SDK

## 2.1.1

### Patch Changes

- 14bde32: Migration to new sdk, updating dependencies

## 2.1.0

### Minor Changes

- 0e02fc6: block renaming

## 2.0.0

### Major Changes

- bbccd71: MVB
