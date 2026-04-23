import argparse
import json
from collections import defaultdict
from itertools import combinations_with_replacement, product

import numpy as np
import pandas as pd
from numpy.random import default_rng
from scipy.stats import linregress

INVALID_VDJ_VALUES = {"", "region_not_covered"}


# ---------- Data Filtering ----------
def filter_vdj_regions(df, is_single_cell_data):
    """Drop rows where any relevant VDJ column is null, empty, or 'region_not_covered'."""
    vdj_columns = ["VGene_A", "JGene_A", "VGene_B", "JGene_B"] if is_single_cell_data else ["VGene", "JGene"]

    valid_mask = pd.Series(True, index=df.index)
    for col in vdj_columns:
        if col in df.columns:
            valid_mask &= df[col].notna() & ~df[col].isin(INVALID_VDJ_VALUES)

    return df[valid_mask].copy()


# ---------- Downsampling ----------
def _hypergeometric_target(total_reads, downsampling_config):
    """Resolve the per-sample read target for hypergeometric downsampling."""
    value_chooser = downsampling_config.get("valueChooser", "auto")
    if value_chooser == "auto":
        threshold = 0.5 * np.quantile(total_reads, 0.2)
        samples_above = total_reads[total_reads > threshold]
        return int(samples_above.min()) if not samples_above.empty else 0
    if value_chooser == "fixed":
        return downsampling_config.get("n", 1000)
    if value_chooser == "min":
        return int(total_reads.min())
    if value_chooser == "max":
        return int(total_reads.max())
    raise ValueError(f"Unsupported value chooser: {value_chooser}")


def downsample_df(df, downsampling_config):
    """Return a new DataFrame with downsampling applied and fractionOfReads recomputed per sample."""
    ds_type = downsampling_config["type"]

    if ds_type == "none":
        df = df.copy()
    elif ds_type == "top":
        n = downsampling_config.get("n", 1000)
        df = df.sort_values("numberOfreads", ascending=False).groupby("sampleId").head(n)
    elif ds_type == "cumtop":
        n = downsampling_config.get("n", 50)
        df = df.sort_values("numberOfreads", ascending=False).copy()
        total_reads = df.groupby("sampleId")["numberOfreads"].sum()
        cumsum = df.groupby("sampleId")["numberOfreads"].cumsum()
        total = df["sampleId"].map(total_reads)
        df = df[cumsum <= total * (n / 100)]
    elif ds_type == "hypergeometric":
        total_reads = df.groupby("sampleId")["numberOfreads"].sum()
        min_reads = _hypergeometric_target(total_reads, downsampling_config)

        rng = default_rng(12345)
        downsampled = []
        for sid, sample_df in sorted(df.groupby("sampleId")):
            counts = sample_df["numberOfreads"].to_numpy()
            if counts.sum() > min_reads:
                counts = rng.multivariate_hypergeometric(counts, min_reads)
            sample_df = sample_df.assign(numberOfreads=counts)
            downsampled.append(sample_df)

        df = pd.concat(downsampled, ignore_index=True)
    else:
        raise ValueError(f"Unsupported downsampling type: {ds_type}")

    df["fractionOfReads"] = df["numberOfreads"] / df.groupby("sampleId")["numberOfreads"].transform("sum")
    return df


# ---------- Clone Key Builder ----------
# (is_single_cell, intersection_type) -> ordered list of columns to join with '|'
_CLONE_KEY_COLUMNS = {
    (True, "CDR3ntVJ"): ["CDR3nt_A", "CDR3nt_B", "VGene_A", "VGene_B", "JGene_A", "JGene_B"],
    (True, "CDR3aaVJ"): ["CDR3aa_A", "CDR3aa_B", "VGene_A", "VGene_B", "JGene_A", "JGene_B"],
    (True, "CDR3nt"): ["CDR3nt_A", "CDR3nt_B"],
    (True, "CDR3aa"): ["CDR3aa_A", "CDR3aa_B"],
    (False, "CDR3ntVJ"): ["CDR3nt", "VGene", "JGene"],
    (False, "CDR3aaVJ"): ["CDR3aa", "VGene", "JGene"],
    (False, "CDR3nt"): ["CDR3nt"],
    (False, "CDR3aa"): ["CDR3aa"],
}


def build_clone_keys(df, intersection_type, is_single_cell_data):
    """Vectorized clone-key builder — returns a Series of '|'-joined keys aligned with df's index."""
    try:
        cols = _CLONE_KEY_COLUMNS[(is_single_cell_data, intersection_type)]
    except KeyError:
        kind = "single-cell data" if is_single_cell_data else "bulk data"
        raise ValueError(f"Unsupported intersection_type for {kind}: {intersection_type}")
    if len(cols) == 1:
        return df[cols[0]].astype(str)
    parts = [df[c].astype(str) for c in cols]
    return parts[0].str.cat(parts[1:], sep="|")


# ---------- Metric Calculation ----------
def compute_metric(s1, s2, clones1, clones2, set1, set2, metric):
    # Self-pair short-circuit: similarity metrics return 1.0 by convention; shared-count returns cloneset size
    if s1 == s2:
        if metric == "sharedClonotypes":
            return len(set1)
        if metric in ("F1", "F2", "jaccard", "correlation", "D"):
            return 1.0
        raise ValueError(f"Unsupported metric: {metric}")

    shared = set1 & set2
    if not shared:
        return 0.0

    # Sorted for deterministic ordering in correlation math
    keys = sorted(shared)
    f1 = np.array([clones1[k] for k in keys])
    f2 = np.array([clones2[k] for k in keys])

    if metric == "F1":
        return np.sqrt(f1.sum() * f2.sum())
    if metric == "F2":
        return np.sqrt(f1 * f2).sum()
    if metric == "jaccard":
        return len(shared) / len(set1 | set2)
    if metric == "D":  # |intersection| / (|set1| * |set2|)
        return len(shared) / (len(set1) * len(set2))
    if metric == "sharedClonotypes":
        return len(shared)
    if metric == "correlation":
        if len(shared) <= 1 or np.all(f1 == f1[0]) or np.all(f2 == f2[0]):
            return 1.0 if np.all(f1 == f2) else 0.0
        return linregress(f1, f2).rvalue
    raise ValueError(f"Unsupported metric: {metric}")


# ---------- Main Processing ----------
def compute_metrics_wide(df_original, metric_configs, is_single_cell_data):
    sample_ids = sorted(df_original["sampleId"].unique())
    all_output_pairs = list(product(sample_ids, repeat=2))
    unique_pairs = list(combinations_with_replacement(sample_ids, 2))

    # Group metrics by (intersection, downsampling config) so we can share downsampled frames
    metrics_by_config = defaultdict(list)
    for i, config in enumerate(metric_configs):
        config_key = (config["intersection"], json.dumps(config["downsampling"], sort_keys=True))
        metrics_by_config[config_key].append((config["type"], i))

    downsampled_cache = {}
    results = {}

    # Sorted for deterministic processing order
    for (intersection, downsampling_json), metric_list in sorted(metrics_by_config.items()):
        if downsampling_json not in downsampled_cache:
            downsampled_cache[downsampling_json] = downsample_df(df_original, json.loads(downsampling_json))
        df_down = downsampled_cache[downsampling_json]

        # Step 1: build cloneKey once (vectorized — avoids per-row Python apply)
        df = df_down[["sampleId", "fractionOfReads"]].rename(columns={"fractionOfReads": "cloneFraction"}).copy()
        df["cloneKey"] = build_clone_keys(df_down, intersection, is_single_cell_data)

        # Build {sampleId: {cloneKey: cloneFraction}} with one groupby pass; empty samples default to {}
        sample_clone_dict = {sid: {} for sid in sample_ids}
        for sid, group in df.groupby("sampleId"):
            sample_clone_dict[sid] = dict(zip(group["cloneKey"], group["cloneFraction"]))

        # Step 2: compute each metric once per unique unordered pair; fill ordered pairs via symmetry
        sorted_metrics = [m for m, _ in sorted(metric_list, key=lambda x: x[1])]
        metric_values = {m: {} for m in sorted_metrics}

        for s1, s2 in unique_pairs:
            c1, c2 = sample_clone_dict[s1], sample_clone_dict[s2]
            for metric in sorted_metrics:
                val = compute_metric(s1, s2, c1, c2, c1.keys(), c2.keys(), metric)
                metric_values[metric][(s1, s2)] = val
                if s1 != s2:
                    metric_values[metric][(s2, s1)] = val

        # Step 3: populate results
        for s1, s2 in all_output_pairs:
            row = results.setdefault((s1, s2), {"sample1": s1, "sample2": s2})
            for metric in sorted_metrics:
                row[f"{metric} {intersection}"] = metric_values[metric].get((s1, s2), 0.0)

    return pd.DataFrame(results.values())


# ---------- Empty Output Creation ----------
def create_empty_outputs(output_full_path, sep):
    """Write an empty long-format TSV when input is empty."""
    pd.DataFrame(columns=["sample1", "sample2", "metric", "value"]).to_csv(output_full_path, index=False, sep=sep)


# ---------- CLI Entry ----------
def main():
    parser = argparse.ArgumentParser(
        description="Compute clonotype distance metrics between samples (bulk or single-cell dual-chain)."
    )
    parser.add_argument("-i", "--input", required=True, help="Input TSV or CSV file")
    parser.add_argument("-j", "--json", required=True, help="JSON config: [{intersection, type, downsampling}]")
    parser.add_argument("-o1", "--output_full", required=True, help="Output TSV (long-format, all sample pairs)")
    parser.add_argument("--sep", default=None, help="Field separator (auto: CSV=',' / TSV='\\t')")

    args = parser.parse_args()
    sep = args.sep or ("\t" if args.input.endswith(".tsv") else ",")

    with open(args.json, "r") as f:
        metric_configs = json.load(f)

    try:
        df = pd.read_csv(args.input, sep=sep)
        if df.empty:
            create_empty_outputs(args.output_full, sep)
            return
    except (pd.errors.EmptyDataError, FileNotFoundError):
        create_empty_outputs(args.output_full, sep)
        return

    df.columns = [col.strip().replace('"', "").replace(" ", "") for col in df.columns]

    # Detect chain columns to choose bulk vs single-cell processing. A+B present → single-cell
    # dual-chain; only one chain → treat as bulk using that chain; neither → assume standard
    # bulk columns already present.
    a_cols = {"CDR3aaA": "CDR3aa_A", "CDR3ntA": "CDR3nt_A", "VGeneA": "VGene_A", "JGeneA": "JGene_A"}
    b_cols = {"CDR3aaB": "CDR3aa_B", "CDR3ntB": "CDR3nt_B", "VGeneB": "VGene_B", "JGeneB": "JGene_B"}
    has_a = set(a_cols).issubset(df.columns)
    has_b = set(b_cols).issubset(df.columns)
    is_single_cell_data = has_a and has_b

    if is_single_cell_data:
        rename_map = {**a_cols, **b_cols}
        required_cols = {"sampleId", "numberOfreads", *a_cols.values(), *b_cols.values()}
    elif has_a or has_b:
        src = a_cols if has_a else b_cols
        rename_map = {k: v[:-2] for k, v in src.items()}  # strip the "_A"/"_B" suffix
        required_cols = {"sampleId", "numberOfreads", "CDR3aa", "CDR3nt", "VGene", "JGene"}
    else:
        rename_map = {}
        required_cols = {"sampleId", "numberOfreads", "CDR3aa", "CDR3nt", "VGene", "JGene"}

    df.rename(columns={**rename_map, "count": "numberOfreads"}, inplace=True)

    if not required_cols.issubset(df.columns):
        raise ValueError(
            f"Missing required columns. Expected for data type detected: {required_cols - set(df.columns)}"
        )

    df = filter_vdj_regions(df, is_single_cell_data)
    wide_result_df = compute_metrics_wide(df, metric_configs, is_single_cell_data)

    full_result_df = pd.melt(wide_result_df, id_vars=["sample1", "sample2"], var_name="metric", value_name="value")
    full_result_df.to_csv(args.output_full, index=False, sep="\t")


if __name__ == "__main__":
    main()
