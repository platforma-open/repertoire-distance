"""Characterization tests for filter_vdj_regions.

Locks in: which rows get dropped given empty/null/"region_not_covered" VDJ
values, and the differing column sets used for bulk vs single-cell data.
"""

import numpy as np
import pandas as pd

from main import filter_vdj_regions


class TestBulk:
    # Empty strings in VGene/JGene should drop the row — upstream sometimes emits "" for unmapped reads
    def test_empty_string_vdj_dropped(self):
        df = pd.DataFrame(
            {
                "sampleId": ["S1", "S1", "S1"],
                "numberOfreads": [10, 20, 30],
                "CDR3aa": ["A", "B", "C"],
                "CDR3nt": ["AA", "BB", "CC"],
                "VGene": ["V1", "", "V1"],
                "JGene": ["J1", "J1", ""],
            }
        )
        result = filter_vdj_regions(df, is_single_cell_data=False)
        assert list(result["CDR3aa"]) == ["A"]

    # NaN values (missing upstream) must also be dropped
    def test_nan_vdj_dropped(self):
        df = pd.DataFrame(
            {
                "sampleId": ["S1", "S1"],
                "numberOfreads": [10, 20],
                "CDR3aa": ["A", "B"],
                "CDR3nt": ["AA", "BB"],
                "VGene": ["V1", np.nan],
                "JGene": ["J1", "J1"],
            }
        )
        result = filter_vdj_regions(df, is_single_cell_data=False)
        assert list(result["CDR3aa"]) == ["A"]

    # MiXCR emits "region_not_covered" when sequencing didn't reach the region
    def test_region_not_covered_dropped(self):
        df = pd.DataFrame(
            {
                "sampleId": ["S1", "S1"],
                "numberOfreads": [10, 20],
                "CDR3aa": ["A", "B"],
                "CDR3nt": ["AA", "BB"],
                "VGene": ["V1", "region_not_covered"],
                "JGene": ["J1", "J1"],
            }
        )
        result = filter_vdj_regions(df, is_single_cell_data=False)
        assert list(result["CDR3aa"]) == ["A"]

    # Returned frame is a copy — mutating it must not affect the input
    def test_returns_independent_copy(self):
        df = pd.DataFrame(
            {
                "sampleId": ["S1"],
                "numberOfreads": [10],
                "CDR3aa": ["A"],
                "CDR3nt": ["AA"],
                "VGene": ["V1"],
                "JGene": ["J1"],
            }
        )
        result = filter_vdj_regions(df, is_single_cell_data=False)
        result.loc[0, "numberOfreads"] = 999
        assert df.loc[0, "numberOfreads"] == 10

    # When a required column is absent the filter treats it as "always valid" (no filtering)
    def test_missing_column_is_ignored(self):
        df = pd.DataFrame(
            {
                "sampleId": ["S1", "S1"],
                "numberOfreads": [10, 20],
                "CDR3aa": ["A", "B"],
                "CDR3nt": ["AA", "BB"],
                "VGene": ["V1", ""],
                # JGene intentionally absent
            }
        )
        result = filter_vdj_regions(df, is_single_cell_data=False)
        # Only the empty-VGene row gets dropped; absence of JGene doesn't matter
        assert list(result["CDR3aa"]) == ["A"]


class TestSingleCell:
    # Single-cell mode checks A *and* B chain VGene/JGene — any chain failing drops the row
    def test_either_chain_invalid_drops_row(self):
        df = pd.DataFrame(
            {
                "sampleId": ["S1", "S1", "S1"],
                "numberOfreads": [10, 20, 30],
                "VGene_A": ["V1a", "", "V1a"],
                "JGene_A": ["J1a", "J1a", "J1a"],
                "VGene_B": ["V1b", "V1b", "region_not_covered"],
                "JGene_B": ["J1b", "J1b", "J1b"],
            }
        )
        result = filter_vdj_regions(df, is_single_cell_data=True)
        assert list(result["numberOfreads"]) == [10]
