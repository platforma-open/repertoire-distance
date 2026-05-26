"""Characterization tests for build_clone_keys.

Locks in: exact key string format for every (data-type × intersection-type)
combination. The format is a stable contract — clone keys are compared as
strings downstream, so any change would silently break intersection logic.
"""

import pandas as pd
import pytest

from main import build_clone_keys

# (is_single_cell, intersection_type, expected_key) — fixture rows provide the source values.
# Bulk single-column intersections (CDR3nt / CDR3aa) return the raw value with no separator.
CLONE_KEY_CASES = [
    (False, "CDR3ntVJ", "AAAA|V1|J1"),
    (False, "CDR3aaVJ", "AA1|V1|J1"),
    (False, "CDR3nt", "AAAA"),
    (False, "CDR3aa", "AA1"),
    (True, "CDR3ntVJ", "AAAA|TTTT|V1a|V1b|J1a|J1b"),
    (True, "CDR3aaVJ", "AA1|BB1|V1a|V1b|J1a|J1b"),
    (True, "CDR3nt", "AAAA|TTTT"),
    (True, "CDR3aa", "AA1|BB1"),
]


@pytest.mark.parametrize("is_single_cell, intersection_type, expected", CLONE_KEY_CASES)
def test_build_clone_keys_format(bulk_row, sc_row, is_single_cell, intersection_type, expected):
    df = pd.DataFrame([sc_row if is_single_cell else bulk_row])
    result = build_clone_keys(df, intersection_type, is_single_cell)
    assert result.iloc[0] == expected


# Error path: unknown intersection type raises with a data-type-specific message
@pytest.mark.parametrize(
    "is_single_cell, expected_message",
    [
        (False, "Unsupported intersection_type for bulk data"),
        (True, "Unsupported intersection_type for single-cell data"),
    ],
)
def test_unknown_intersection_raises(bulk_row, sc_row, is_single_cell, expected_message):
    df = pd.DataFrame([sc_row if is_single_cell else bulk_row])
    with pytest.raises(ValueError, match=expected_message):
        build_clone_keys(df, "wat", is_single_cell)
