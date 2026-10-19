---
"@platforma-open/milaboratories.repertoire-distance-2": minor
"@platforma-open/milaboratories.repertoire-distance-2.kind": minor
"@platforma-open/milaboratories.repertoire-distance-2.model": minor
"@platforma-open/milaboratories.repertoire-distance-2.ui": minor
"@platforma-open/milaboratories.repertoire-distance-2.workflow": minor
---

Update the SDK and accept a subset filter (e.g. a Repertoire Labeling label or Lead Selection picks) with the input abundance. The abundance list is built with buildDatasetOptions (requireEnrichments: false). The subset restricts the clonotypes before the distances are computed, so overlaps, downsampling and sample totals describe the subset only. Outputs of a subset run carry pl7.app/inputSubset in their domain and a trace rooted in the subset, so their labels name it; the default subtitle names the subset too. Unfiltered runs are unchanged.
