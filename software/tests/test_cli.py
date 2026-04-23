"""End-to-end CLI tests exercising main() via subprocess.

Uses tmp_path fixtures to write synthetic inputs and verify the output TSV.
This is the most valuable characterization test: it covers all the column
renaming / data-detection logic in main() that the unit tests don't touch.
"""

import json
import subprocess
import sys
from pathlib import Path

import pandas as pd
import pytest

SOFTWARE_ROOT = Path(__file__).parent.parent
MAIN_PY = SOFTWARE_ROOT / "src" / "main.py"


# ---------- shared helpers ----------
def _run_cli(tmp_path: Path, input_df: pd.DataFrame, metric_configs: list) -> tuple[subprocess.CompletedProcess, Path]:
    """Write inputs, run main.py, return (process_result, output_path)."""
    input_path = tmp_path / "input.tsv"
    input_df.to_csv(input_path, sep="\t", index=False)

    config_path = tmp_path / "config.json"
    config_path.write_text(json.dumps(metric_configs))

    output_path = tmp_path / "out.tsv"
    result = subprocess.run(
        [sys.executable, str(MAIN_PY), "-i", str(input_path), "-j", str(config_path), "-o1", str(output_path)],
        capture_output=True,
        text=True,
        cwd=str(SOFTWARE_ROOT),
    )
    return result, output_path


def _bulk_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "sampleId": ["S1", "S1", "S2", "S2"],
            "count": [100, 50, 80, 40],
            "CDR3aa": ["AA1", "AA2", "AA1", "AA3"],
            "CDR3nt": ["AAAA", "GGGG", "AAAA", "CCCC"],
            "VGene": ["V1", "V2", "V1", "V2"],
            "JGene": ["J1", "J1", "J1", "J2"],
        }
    )


def _single_cell_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "sampleId": ["S1", "S1", "S2", "S2"],
            "count": [100, 50, 80, 40],
            "CDR3aaA": ["AA1", "AA2", "AA1", "AA3"],
            "CDR3ntA": ["AAAA", "GGGG", "AAAA", "CCCC"],
            "VGeneA": ["V1a", "V2a", "V1a", "V3a"],
            "JGeneA": ["J1a", "J1a", "J1a", "J2a"],
            "CDR3aaB": ["BB1", "BB2", "BB1", "BB3"],
            "CDR3ntB": ["TTTT", "CCCC", "TTTT", "GGGG"],
            "VGeneB": ["V1b", "V2b", "V1b", "V3b"],
            "JGeneB": ["J1b", "J1b", "J1b", "J2b"],
        }
    )


# ---------- happy-path matrix ----------
# id, df_builder, metric_type, intersection, downsampling, (s1, s2), expected_value
HAPPY_PATH_CASES = [
    ("bulk_self_pair_jaccard_is_one", _bulk_df, "jaccard", "CDR3ntVJ", "none", ("S1", "S1"), 1.0),
    ("single_cell_shared_clonotype", _single_cell_df, "sharedClonotypes", "CDR3ntVJ", "none", ("S1", "S2"), 1.0),
    ("none_downsampling_regression", _bulk_df, "jaccard", "CDR3ntVJ", "none", ("S1", "S1"), 1.0),
]


@pytest.mark.parametrize(
    "case_id, df_builder, metric_type, intersection, ds_type, pair, expected",
    HAPPY_PATH_CASES,
    ids=[c[0] for c in HAPPY_PATH_CASES],
)
def test_cli_happy_path(tmp_path, case_id, df_builder, metric_type, intersection, ds_type, pair, expected):
    """Bulk and single-cell flows each produce a long-format TSV; one known value per case anchors correctness."""
    metric_configs = [
        {
            "type": metric_type,
            "intersection": intersection,
            "downsampling": {"type": ds_type},
        }
    ]
    result, output_path = _run_cli(tmp_path, df_builder(), metric_configs)

    assert result.returncode == 0, result.stderr
    assert output_path.exists()

    df_out = pd.read_csv(output_path, sep="\t")
    assert set(df_out.columns) == {"sample1", "sample2", "metric", "value"}

    row = df_out[(df_out["sample1"] == pair[0]) & (df_out["sample2"] == pair[1])]
    assert float(row["value"].iloc[0]) == pytest.approx(expected)


# ---------- error / edge-case paths ----------
class TestEmptyInput:
    # Empty input file: should produce an empty output with header-only columns
    def test_empty_tsv_produces_header_only_output(self, tmp_path):
        input_path = tmp_path / "empty.tsv"
        input_path.write_text("")  # completely empty file

        config_path = tmp_path / "config.json"
        config_path.write_text(
            json.dumps([{"type": "jaccard", "intersection": "CDR3ntVJ", "downsampling": {"type": "none"}}])
        )

        output_path = tmp_path / "out.tsv"
        result = subprocess.run(
            [sys.executable, str(MAIN_PY), "-i", str(input_path), "-j", str(config_path), "-o1", str(output_path)],
            capture_output=True,
            text=True,
            cwd=str(SOFTWARE_ROOT),
        )
        assert result.returncode == 0, result.stderr
        content = output_path.read_text()
        assert all(col in content for col in ["sample1", "sample2", "metric", "value"])


class TestMissingColumns:
    # If the TSV is missing required columns (neither bulk nor SC shape), main() raises ValueError
    def test_missing_required_column_raises(self, tmp_path):
        input_df = pd.DataFrame({"sampleId": ["S1"], "count": [100]})  # no CDR3/VGene/JGene at all
        result, _ = _run_cli(tmp_path, input_df, metric_configs=[])
        assert result.returncode != 0
        assert "Missing required columns" in (result.stderr + result.stdout)
