import numpy as np
import pandas as pd
import argparse
import json
from collections import defaultdict
from itertools import combinations_with_replacement, product
from scipy.stats import linregress
from numpy.random import default_rng

# ---------- Data Filtering ----------
def filter_vdj_regions(df, is_single_cell_data):
    """
    Filter out rows where VDJ regions are empty/null or contain 'region_not_covered'
    """
    if is_single_cell_data:
        # For single-cell data, check both A and B chain VDJ regions
        vdj_columns = ['VGene_A', 'JGene_A', 'VGene_B', 'JGene_B']
    else:
        # For bulk data, check single-chain VDJ regions
        vdj_columns = ['VGene', 'JGene']
    
    # Create mask for valid VDJ regions
    valid_mask = pd.Series(True, index=df.index)
    
    for col in vdj_columns:
        if col in df.columns:
            # Filter out empty/null values and 'region_not_covered'
            col_mask = (
                df[col].notna() & 
                (df[col] != '') & 
                (df[col] != 'region_not_covered')
            )
            valid_mask = valid_mask & col_mask
    
    filtered_df = df[valid_mask].copy()
    
    # Log filtering statistics
    removed_count = len(df) - len(filtered_df)
    if removed_count > 0:
        print(f"Filtered out {removed_count} rows with invalid VDJ regions (empty/null or 'region_not_covered')")
    
    return filtered_df

# ---------- Downsampling ----------
def downsample_df(df, downsampling_config):
    if downsampling_config['type'] == 'none':
        return df

    total_reads = df.groupby('sampleId')['numberOfreads'].sum()
    
    if downsampling_config['type'] == 'top':
        n = downsampling_config.get('n', 1000)
        df = df.sort_values('numberOfreads', ascending=False).groupby('sampleId').head(n)
    elif downsampling_config['type'] == 'cumtop':
        n = downsampling_config.get('n', 50)
        df = df.sort_values('numberOfreads', ascending=False)
        df['cumsum'] = df.groupby('sampleId')['numberOfreads'].cumsum()
        df['total'] = df.groupby('sampleId')['numberOfreads'].transform('sum')
        df = df[df['cumsum'] <= df['total'] * (n / 100)]
        df = df.drop(['cumsum', 'total'], axis=1)
    elif downsampling_config['type'] == 'hypergeometric':
        value_chooser = downsampling_config.get('valueChooser', 'auto')
        if value_chooser == 'auto':
            q20 = np.quantile(total_reads, 0.2)
            threshold = 0.5 * q20
            samples_above = total_reads[total_reads > threshold].index
            min_reads = total_reads.loc[samples_above].min() if len(samples_above) > 0 else 0
        elif value_chooser == 'fixed':
            min_reads = downsampling_config.get('n', 1000)
        elif value_chooser == 'min':
            min_reads = total_reads.min()
        elif value_chooser == 'max':
            min_reads = total_reads.max()
        else:
            raise ValueError(f"Unsupported value chooser: {value_chooser}")

        rng = default_rng(12345)
        downsampled = []
        for sid in df['sampleId'].unique():
            sample_df = df[df['sampleId'] == sid]
            counts = sample_df['numberOfreads'].values
            sampled_counts = rng.multivariate_hypergeometric(counts, min_reads) if counts.sum() > min_reads else counts
            sample_df = sample_df.copy()
            sample_df['numberOfreads'] = sampled_counts
            downsampled.append(sample_df)

        df = pd.concat(downsampled, ignore_index=True)
    else:
        raise ValueError(f"Unsupported downsampling type: {downsampling_config['type']}")

    df['fractionOfReads'] = df.groupby('sampleId')['numberOfreads'].transform(lambda x: x / x.sum())
    return df

# ---------- Clone Key Builder ----------
def make_clone_key(row, intersection_type, is_single_cell_data):
    if is_single_cell_data:
        # Single-cell data: always use both chains for these intersection types
        if intersection_type == 'CDR3ntVJ':
            return f"{row['CDR3nt_A']}|{row['CDR3nt_B']}|{row['VGene_A']}|{row['VGene_B']}|{row['JGene_A']}|{row['JGene_B']}"
        elif intersection_type == 'CDR3aaVJ':
            return f"{row['CDR3aa_A']}|{row['CDR3aa_B']}|{row['VGene_A']}|{row['VGene_B']}|{row['JGene_A']}|{row['JGene_B']}"
        elif intersection_type == 'CDR3nt':
            return f"{row['CDR3nt_A']}|{row['CDR3nt_B']}"
        elif intersection_type == 'CDR3aa':
            return f"{row['CDR3aa_A']}|{row['CDR3aa_B']}"
        else:
            raise ValueError(f"Unsupported intersection_type for single-cell data: {intersection_type}")
    else:
        # Bulk data: use single-chain columns
        if intersection_type == 'CDR3ntVJ':
            return f"{row['CDR3nt']}|{row['VGene']}|{row['JGene']}"
        elif intersection_type == 'CDR3aaVJ':
            return f"{row['CDR3aa']}|{row['VGene']}|{row['JGene']}"
        elif intersection_type == 'CDR3nt':
            return row['CDR3nt']
        elif intersection_type == 'CDR3aa':
            return row['CDR3aa']
        else:
            raise ValueError(f"Unsupported intersection_type for bulk data: {intersection_type}")

# ---------- Metric Calculation ----------
def compute_metric(s1, s2, clones1, clones2, set1, set2, metric):
    if s1 == s2:
        # Self-pair → perfect match
        if metric in ['F1', 'F2', 'jaccard', 'correlation', 'D']:
            return 1.0
        elif metric == 'sharedClonotypes':
            return len(set1)
        else:
            raise ValueError(f"Unsupported metric: {metric}")

    shared = set1 & set2
    if len(shared) == 0:
        return 0.0

    f1 = np.array([clones1[k] for k in shared])
    f2 = np.array([clones2[k] for k in shared])

    if metric == 'F1':
        return np.sqrt(f1.sum() * f2.sum())
    elif metric == 'F2':
        return np.sqrt(f1 * f2).sum()
    elif metric == 'jaccard':
        return len(shared) / len(set1 | set2)
    elif metric == 'D':
        # This D metric is defined as |intersection| / (|set1| * |set2|)
        return len(shared) / (len(set1) * len(set2))
    elif metric == 'correlation':
        if len(shared) <= 1 or np.all(f1 == f1[0]) or np.all(f2 == f2[0]):
            return 1.0 if np.all(f1 == f2) else 0.0
        return linregress(f1, f2).rvalue
    elif metric == 'sharedClonotypes':
        return len(shared)
    else:
        raise ValueError(f"Unsupported metric: {metric}")

# ---------- Main Processing ----------
def compute_metrics_wide(df_original, metric_configs, is_single_cell_data):
    sample_ids = sorted(df_original['sampleId'].unique())

    # All sample × sample pairs
    all_output_pairs = list(product(sample_ids, repeat=2))
    unique_pairs = list(combinations_with_replacement(sample_ids, 2))

    # Group metrics by intersection type and downsampling config
    metrics_by_config = defaultdict(list)
    for i, config in enumerate(metric_configs):
        # Create a key that includes both intersection and downsampling config
        config_key = (config['intersection'], json.dumps(config['downsampling'], sort_keys=True))
        metrics_by_config[config_key].append((config['type'], i))

    # Cache for downsampled datasets
    downsampled_cache = {}

    results = {}

    for (intersection, downsampling_json), metric_list in metrics_by_config.items():
        # Parse the downsampling config
        downsampling_config = json.loads(downsampling_json)
        
        # Check if we already have this downsampling config cached
        if downsampling_json not in downsampled_cache:
            # Apply downsampling for this specific configuration and cache it
            df_down = downsample_df(df_original, downsampling_config)
            downsampled_cache[downsampling_json] = df_down
        else:
            # Use cached downsampled dataset
            df_down = downsampled_cache[downsampling_json]
        
        # Step 1: build cloneKey once
        df = df_down.copy()
        df['cloneKey'] = df.apply(lambda row: make_clone_key(row, intersection, is_single_cell_data), axis=1)
        df = df[['sampleId', 'cloneKey', 'fractionOfReads']].rename(columns={'fractionOfReads': 'cloneFraction'})

        sample_clone_dict = {
            sid: g.set_index('cloneKey')['cloneFraction'].to_dict()
            for sid, g in df.groupby('sampleId')
        }
        sample_cloneset_dict = {sid: set(clones.keys()) for sid, clones in sample_clone_dict.items()}

        for sid in sample_ids:
            # Ensure all sample_ids are present in dictionaries, even if they have no clones
            sample_clone_dict.setdefault(sid, {})
            sample_cloneset_dict.setdefault(sid, set())

        # Step 2: compute each metric only once per unique unordered pair
        metric_values = {metric: {} for metric, _ in metric_list}

        for s1, s2 in unique_pairs:
            c1, c2 = sample_clone_dict[s1], sample_clone_dict[s2]
            set1, set2 = sample_cloneset_dict[s1], sample_cloneset_dict[s2]

            for metric, _ in metric_list:
                val = compute_metric(s1, s2, c1, c2, set1, set2, metric)
                metric_values[metric][(s1, s2)] = val
                if s1 != s2:
                    metric_values[metric][(s2, s1)] = val

        # Step 3: populate results
        for s1, s2 in all_output_pairs:
            key = (s1, s2)
            if key not in results:
                results[key] = {'sample1': s1, 'sample2': s2}
            for metric, _ in metric_list:
                metric_col = f"{metric} {intersection}"
                results[key][metric_col] = metric_values[metric].get((s1, s2), 0.0)

    return pd.DataFrame(results.values())


# ---------- CLI Entry ----------
def main():
    parser = argparse.ArgumentParser(description="Downsample and compute wide-format clonotype distances between samples, supporting both bulk and single-cell dual-chain data.")
    parser.add_argument('-i', '--input', required=True, help="Input TSV or CSV file")
    parser.add_argument('-j', '--json', required=True, help="JSON config: [{intersection: ..., type: ..., downsampling: ...}]")
    parser.add_argument('-o1', '--output_full', required=True, help="Output CSV file with all sample pairs (matrix-friendly)")
    parser.add_argument('-o2', '--output_unique', required=True, help="Output CSV file with unique sample pairs only")
    parser.add_argument('--sep', default=None, help="Field separator (default auto-detect: CSV=',' or TSV='\\t')")

    args = parser.parse_args()
    sep = args.sep or ('\t' if args.input.endswith('.tsv') else ',')

    df = pd.read_csv(args.input, sep=sep)

    # Clean and normalize column names
    df.columns = [col.strip().replace('"', '').replace(' ', '') for col in df.columns]
    
    # Attempt to detect if it's single-cell dual-chain data based on column presence
    # Check for both A and B chain columns to ensure complete single-cell data
    single_cell_a_chain_cols = {'CDR3aaA', 'CDR3ntA', 'VGeneA', 'JGeneA'}
    single_cell_b_chain_cols = {'CDR3aaB', 'CDR3ntB', 'VGeneB', 'JGeneB'}
    
    a_chain_present = single_cell_a_chain_cols.issubset(df.columns)
    b_chain_present = single_cell_b_chain_cols.issubset(df.columns)
    
    is_single_cell_data = False
    if a_chain_present and b_chain_present:
        # Complete single-cell dual-chain data detected
        is_single_cell_data = True
        # Rename single-cell columns to standardized internal names (_A, _B suffix)
        df.rename(columns={
            'CDR3aaA': 'CDR3aa_A', 'CDR3ntA': 'CDR3nt_A', 'VGeneA': 'VGene_A', 'JGeneA': 'JGene_A',
            'CDR3aaB': 'CDR3aa_B', 'CDR3ntB': 'CDR3nt_B', 'VGeneB': 'VGene_B', 'JGeneB': 'JGene_B',
            'count': 'numberOfreads'
        }, inplace=True)
        # Ensure all required A and B chain columns are present
        required_cols = {
            'sampleId', 'numberOfreads',
            'CDR3aa_A', 'CDR3nt_A', 'VGene_A', 'JGene_A',
            'CDR3aa_B', 'CDR3nt_B', 'VGene_B', 'JGene_B'
        }
    elif a_chain_present and not b_chain_present:
        # Only A-chain columns present - treat as bulk data using A-chain
        df.rename(columns={
            'CDR3aaA': 'CDR3aa', 'CDR3ntA': 'CDR3nt', 'VGeneA': 'VGene', 'JGeneA': 'JGene',
            'count': 'numberOfreads'
        }, inplace=True)
        required_cols = {'sampleId', 'numberOfreads', 'CDR3aa', 'CDR3nt', 'VGene', 'JGene'}
    elif b_chain_present and not a_chain_present:
        # Only B-chain columns present - treat as bulk data using B-chain
        df.rename(columns={
            'CDR3aaB': 'CDR3aa', 'CDR3ntB': 'CDR3nt', 'VGeneB': 'VGene', 'JGeneB': 'JGene',
            'count': 'numberOfreads'
        }, inplace=True)
        required_cols = {'sampleId', 'numberOfreads', 'CDR3aa', 'CDR3nt', 'VGene', 'JGene'}
    else:
        # Assume bulk data, rename original columns
        df.rename(columns={
            'CDR3aa': 'CDR3aa', # No change, but good to list for clarity
            'CDR3nt': 'CDR3nt', # No change
            'count': 'numberOfreads',
            'VGene': 'VGene', # No change
            'JGene': 'JGene' # No change
        }, inplace=True)
        # Ensure all required bulk columns are present
        required_cols = {'sampleId', 'numberOfreads', 'CDR3aa', 'CDR3nt', 'VGene', 'JGene'}

    if not required_cols.issubset(df.columns):
        raise ValueError(f"Missing required columns. Expected for data type detected: {required_cols - set(df.columns)}")

    # Filter out rows with invalid VDJ regions
    df = filter_vdj_regions(df, is_single_cell_data)

    # Load metric config JSON
    with open(args.json, 'r') as f:
        metric_configs = json.load(f)

    # Apply downsampling for each metric configuration individually
    wide_result_df = compute_metrics_wide(df, metric_configs, is_single_cell_data)

    # Convert wide format to long format for full results
    value_columns = [f"{m['type']} {m['intersection']}" for m in metric_configs]
    full_result_df = pd.melt(
        wide_result_df,
        id_vars=['sample1', 'sample2'],
        value_vars=value_columns,
        var_name='metric',
        value_name='value'
    )

    # Save full version (long format)
    full_result_df.to_csv(args.output_full, index=False, sep='\t')

    # Keep only (sample1 <= sample2) in wide format
    unique_result_df = wide_result_df[
        wide_result_df['sample1'] <= wide_result_df['sample2']
    ].copy()
    unique_result_df.to_csv(args.output_unique, index=False, sep='\t')


if __name__ == '__main__':
    main()