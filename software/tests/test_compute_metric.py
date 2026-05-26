"""Characterization tests for compute_metric.

Locks in: exact values returned for every (metric × pair-type) combination.
Self-pairs use short-circuit returns; cross-pairs walk the shared intersection.
"""

import numpy as np
import pytest

from main import compute_metric

# Two samples with some overlap
# S1 clones: {a: 0.5, b: 0.3, c: 0.2}
# S2 clones: {a: 0.4, c: 0.6}
# shared: {a, c}
CLONES_S1 = {"a": 0.5, "b": 0.3, "c": 0.2}
CLONES_S2 = {"a": 0.4, "c": 0.6}
SET_S1 = set(CLONES_S1)
SET_S2 = set(CLONES_S2)


class TestSelfPair:
    # Self-pair short-circuit: similarity metrics return 1.0 regardless of the cloneset
    @pytest.mark.parametrize("metric", ["F1", "F2", "jaccard", "correlation", "D"])
    def test_similarity_metrics_return_one(self, metric):
        assert compute_metric("S1", "S1", CLONES_S1, CLONES_S1, SET_S1, SET_S1, metric) == 1.0

    # Self-pair sharedClonotypes returns cloneset size (not 1.0)
    def test_shared_clonotypes_returns_set_size(self):
        assert compute_metric("S1", "S1", CLONES_S1, CLONES_S1, SET_S1, SET_S1, "sharedClonotypes") == 3

    def test_unknown_metric_raises(self):
        with pytest.raises(ValueError, match="Unsupported metric"):
            compute_metric("S1", "S1", CLONES_S1, CLONES_S1, SET_S1, SET_S1, "wat")


class TestCrossPair:
    # Disjoint sets short-circuit to 0.0 regardless of metric
    @pytest.mark.parametrize("metric", ["F1", "F2", "jaccard", "D", "sharedClonotypes", "correlation"])
    def test_disjoint_returns_zero(self, metric):
        assert compute_metric("S1", "S2", {"a": 1.0}, {"b": 1.0}, {"a"}, {"b"}, metric) == 0.0

    # Each metric's exact formula against the shared keys {a, c} from CLONES_S1/S2
    # F1 = sqrt(Σf1 * Σf2); F2 = Σ sqrt(f1*f2); jaccard = |∩|/|∪|; D = |∩|/(|s1|*|s2|)
    @pytest.mark.parametrize(
        "metric, expected",
        [
            ("F1", np.sqrt(0.7 * 1.0)),
            ("F2", np.sqrt(0.5 * 0.4) + np.sqrt(0.2 * 0.6)),
            ("jaccard", 2 / 3),
            ("D", 1 / 3),
            ("sharedClonotypes", 2),
            ("correlation", -1.0),  # f1=[0.5,0.2], f2=[0.4,0.6] → perfect anti-correlation
        ],
    )
    def test_formula(self, metric, expected):
        val = compute_metric("S1", "S2", CLONES_S1, CLONES_S2, SET_S1, SET_S2, metric)
        assert val == pytest.approx(expected)

    # Correlation with a single shared key can't fit a line — short-circuits to 1 if equal, 0 otherwise
    @pytest.mark.parametrize(
        "s1_val, s2_val, expected",
        [
            (0.5, 0.5, 1.0),
            (0.5, 0.7, 0.0),
        ],
    )
    def test_correlation_single_shared_key(self, s1_val, s2_val, expected):
        val = compute_metric(
            "S1",
            "S2",
            {"a": s1_val},
            {"a": s2_val},
            {"a"},
            {"a"},
            "correlation",
        )
        assert val == expected

    # Cross-pair path also raises on unknown metric names (separate branch from self-pair path)
    def test_cross_pair_unknown_metric_raises(self):
        with pytest.raises(ValueError, match="Unsupported metric"):
            compute_metric("S1", "S2", CLONES_S1, CLONES_S2, SET_S1, SET_S2, "wat")
