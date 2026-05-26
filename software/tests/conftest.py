"""Shared fixtures for characterization tests.

These fixtures build small, deterministic DataFrames that match the shapes
produced upstream by the repertoire-distance workflow (bulk and single-cell
dual-chain). They are intentionally minimal so that the assertions in each
test stay readable.
"""

import pandas as pd
import pytest


@pytest.fixture
def bulk_df() -> pd.DataFrame:
    """Three samples × a handful of clones with distinct overlap patterns.

    - S1/S2 share clone (CDR3nt="AAAA", VGene="V1", JGene="J1")
    - S1/S3 share nothing
    - S2/S3 share clone (CDR3nt="CCCC", VGene="V2", JGene="J2")
    """
    return pd.DataFrame(
        {
            "sampleId": ["S1", "S1", "S2", "S2", "S3", "S3"],
            "numberOfreads": [100, 50, 80, 40, 60, 20],
            "CDR3aa": ["AA1", "AA2", "AA1", "AA3", "AA4", "AA3"],
            "CDR3nt": ["AAAA", "GGGG", "AAAA", "CCCC", "TTTT", "CCCC"],
            "VGene": ["V1", "V2", "V1", "V2", "V3", "V2"],
            "JGene": ["J1", "J1", "J1", "J2", "J2", "J2"],
        }
    )


@pytest.fixture
def single_cell_df() -> pd.DataFrame:
    """Single-cell dual-chain: two samples, two clones each, one pair overlapping on A+B chains."""
    return pd.DataFrame(
        {
            "sampleId": ["S1", "S1", "S2", "S2"],
            "numberOfreads": [100, 50, 80, 40],
            "CDR3aa_A": ["AA1", "AA2", "AA1", "AA3"],
            "CDR3nt_A": ["AAAA", "GGGG", "AAAA", "CCCC"],
            "VGene_A": ["V1a", "V2a", "V1a", "V3a"],
            "JGene_A": ["J1a", "J1a", "J1a", "J2a"],
            "CDR3aa_B": ["BB1", "BB2", "BB1", "BB3"],
            "CDR3nt_B": ["TTTT", "CCCC", "TTTT", "GGGG"],
            "VGene_B": ["V1b", "V2b", "V1b", "V3b"],
            "JGene_B": ["J1b", "J1b", "J1b", "J2b"],
        }
    )


@pytest.fixture
def bulk_row() -> pd.Series:
    """A single bulk-data row suitable for make_clone_key tests."""
    return pd.Series(
        {
            "CDR3aa": "AA1",
            "CDR3nt": "AAAA",
            "VGene": "V1",
            "JGene": "J1",
        }
    )


@pytest.fixture
def sc_row() -> pd.Series:
    """A single single-cell row with A and B chain fields."""
    return pd.Series(
        {
            "CDR3aa_A": "AA1",
            "CDR3nt_A": "AAAA",
            "VGene_A": "V1a",
            "JGene_A": "J1a",
            "CDR3aa_B": "BB1",
            "CDR3nt_B": "TTTT",
            "VGene_B": "V1b",
            "JGene_B": "J1b",
        }
    )
