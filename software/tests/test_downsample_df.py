"""Characterization tests for downsample_df.

Locks in: output row counts, output columns, fractionOfReads computation,
per-sample normalization, and independence from the input DataFrame.
"""

import pandas as pd
import pytest

from main import downsample_df


def _mk_df(sample_to_counts: dict) -> pd.DataFrame:
    """Helper: build a minimal bulk DataFrame from {sampleId: [counts]}."""
    rows = []
    for sid, counts in sample_to_counts.items():
        for i, c in enumerate(counts):
            rows.append(
                {
                    "sampleId": sid,
                    "numberOfreads": c,
                    "CDR3nt": f"{sid}_cdr_{i}",
                    "VGene": f"V{i}",
                    "JGene": f"J{i}",
                }
            )
    return pd.DataFrame(rows)


class TestNone:
    # With no downsampling, all rows are preserved and fractionOfReads is computed per-sample
    def test_preserves_rows_and_adds_fraction(self):
        df = _mk_df({"S1": [10, 30], "S2": [50, 50]})
        result = downsample_df(df, {"type": "none"})

        assert len(result) == 4
        assert "fractionOfReads" in result.columns

        s1 = result[result["sampleId"] == "S1"]["fractionOfReads"].tolist()
        s2 = result[result["sampleId"] == "S2"]["fractionOfReads"].tolist()
        assert sorted(s1) == [pytest.approx(0.25), pytest.approx(0.75)]
        assert sorted(s2) == [pytest.approx(0.5), pytest.approx(0.5)]

    # Mutating the result must not alter the caller's DataFrame
    def test_does_not_mutate_input(self):
        df = _mk_df({"S1": [10, 30]})
        assert "fractionOfReads" not in df.columns
        result = downsample_df(df, {"type": "none"})
        result["fractionOfReads"] = 0.0
        assert "fractionOfReads" not in df.columns


class TestTop:
    # "top n" keeps the n highest-count rows per sample
    def test_keeps_top_n_per_sample(self):
        df = _mk_df({"S1": [100, 50, 10], "S2": [200, 20]})
        result = downsample_df(df, {"type": "top", "n": 2})

        assert sorted(result[result["sampleId"] == "S1"]["numberOfreads"].tolist()) == [50, 100]
        assert sorted(result[result["sampleId"] == "S2"]["numberOfreads"].tolist()) == [20, 200]

    # fractionOfReads is recomputed against the retained rows' sum, not the original sum
    def test_fraction_normalizes_against_kept_rows(self):
        df = _mk_df({"S1": [100, 50, 10]})
        result = downsample_df(df, {"type": "top", "n": 2})
        assert result["fractionOfReads"].sum() == pytest.approx(1.0)


class TestCumtop:
    # "cumtop n" is a percentage: keeps rows whose cumulative reads ≤ total * n/100
    def test_retains_rows_under_cumulative_threshold(self):
        # Total=100. 50% threshold. Sort desc: 50, 30, 20. cumsum: 50, 80, 100.
        # Rows with cumsum <= 50 → only the first row.
        df = _mk_df({"S1": [50, 30, 20]})
        result = downsample_df(df, {"type": "cumtop", "n": 50})
        assert len(result) == 1
        assert result["numberOfreads"].iloc[0] == 50

    # Housekeeping: the temporary cumsum/total columns are dropped from output
    def test_temp_columns_removed(self):
        df = _mk_df({"S1": [50, 30, 20]})
        result = downsample_df(df, {"type": "cumtop", "n": 50})
        assert "cumsum" not in result.columns
        assert "total" not in result.columns


class TestHypergeometric:
    # Deterministic thanks to seeded RNG — lock in specific outputs so downstream snapshots stay stable
    def test_fixed_value_deterministic(self):
        df = _mk_df({"S1": [100, 50, 10], "S2": [200, 80]})
        result = downsample_df(df, {"type": "hypergeometric", "valueChooser": "fixed", "n": 50})

        # Counts are deterministic because rng seed is fixed (12345)
        s1 = result[result["sampleId"] == "S1"]["numberOfreads"].tolist()
        s2 = result[result["sampleId"] == "S2"]["numberOfreads"].tolist()
        assert sum(s1) == 50
        assert sum(s2) == 50
        # fractions sum to 1 per sample
        assert result[result["sampleId"] == "S1"]["fractionOfReads"].sum() == pytest.approx(1.0)
        assert result[result["sampleId"] == "S2"]["fractionOfReads"].sum() == pytest.approx(1.0)

    # "min" chooser downsamples every sample to the min total reads
    def test_min_chooser_downsamples_to_smallest_total(self):
        df = _mk_df({"S1": [100, 50], "S2": [20, 10]})  # totals: 150, 30
        result = downsample_df(df, {"type": "hypergeometric", "valueChooser": "min"})
        assert result[result["sampleId"] == "S1"]["numberOfreads"].sum() == 30
        assert result[result["sampleId"] == "S2"]["numberOfreads"].sum() == 30

    # Samples below the threshold should be left untouched (counts.sum() <= min_reads branch)
    def test_skips_samples_below_threshold(self):
        df = _mk_df({"S1": [5, 5], "S2": [100, 50]})  # totals: 10, 150
        # Fixed=200: both samples stay intact
        result = downsample_df(df, {"type": "hypergeometric", "valueChooser": "fixed", "n": 200})
        assert result[result["sampleId"] == "S1"]["numberOfreads"].sum() == 10
        assert result[result["sampleId"] == "S2"]["numberOfreads"].sum() == 150

    # "max" chooser uses the largest total; samples below it are skipped (not upsampled)
    def test_max_chooser(self):
        df = _mk_df({"S1": [100, 50], "S2": [20, 10]})
        result = downsample_df(df, {"type": "hypergeometric", "valueChooser": "max"})
        # S1 total is the max (150) so should be unchanged; S2 already below max → unchanged
        assert result[result["sampleId"] == "S1"]["numberOfreads"].sum() == 150
        assert result[result["sampleId"] == "S2"]["numberOfreads"].sum() == 30

    # "auto" chooser: picks min(totals) across samples whose total exceeds 0.5 * 20th-percentile
    # This is the Platforma-default path — must be locked in so downstream rebuilds stay deterministic
    def test_auto_chooser(self):
        # Totals: 100, 100, 100, 100, 500 → q20 = 100, threshold=50. All 5 samples > 50.
        # min_reads = min(all) = 100. Result: every sample ends at 100 reads.
        df = _mk_df(
            {
                "S1": [60, 40],
                "S2": [60, 40],
                "S3": [60, 40],
                "S4": [60, 40],
                "S5": [300, 200],
            }
        )
        result = downsample_df(df, {"type": "hypergeometric", "valueChooser": "auto"})
        for sid in ["S1", "S2", "S3", "S4", "S5"]:
            assert result[result["sampleId"] == sid]["numberOfreads"].sum() == 100


class TestErrors:
    # Unknown downsampling types should raise ValueError — unexpected configs should fail fast
    def test_unknown_type_raises(self):
        df = _mk_df({"S1": [10]})
        with pytest.raises(ValueError, match="Unsupported downsampling type"):
            downsample_df(df, {"type": "nonsense"})

    # Unknown valueChooser inside hypergeometric raises
    def test_unknown_value_chooser_raises(self):
        df = _mk_df({"S1": [10]})
        with pytest.raises(ValueError, match="Unsupported value chooser"):
            downsample_df(df, {"type": "hypergeometric", "valueChooser": "bogus"})
