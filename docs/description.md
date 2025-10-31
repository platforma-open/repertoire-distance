# Overview

Repertoire Distance computes pairwise similarity between immune receptor repertoires (bulk or single‑cell dual‑chain) using configurable overlap metrics and clonotype intersection definitions.

**Metrics (similarity)**
All metrics return higher values for more similar repertoires. Self‑pairs return 1.0. The following metric types are supported:
- F1: sqrt(sum(f1) * sum(f2)) over shared clonotypes.
- F2: sum(sqrt(f1 * f2)) over shared clonotypes.
- jaccard: |A ∩ B| / |A ∪ B| on the set of clonotypes.
- D: |A ∩ B| / |A| · |B| on the set of clonotypes.
- correlation: Pearson correlation of clone fractions on the shared clonotypes.
- sharedClonotypes: count of shared clonotypes.

**Intersection definitions (what is a “clonotype”)**
Choose how clonotypes are aligned between samples:
- CDR3nt
- CDR3aa
- CDR3ntVJ (CDR3 + V + J)
- CDR3aaVJ (CDR3 + V + J)

**Downsampling options**
Applied per‑metric before similarity is computed:
- none
- top: keep top N clonotypes by reads per sample
- cumtop: keep top N percent of cumulative reads per sample
- hypergeometric: equalize read depth across samples using multivariate hypergeometric sampling
