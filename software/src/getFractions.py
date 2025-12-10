import polars as pl
import argparse

# Default pseudocount value based on literature (1e-6 is commonly used for clonotype fractions)
DEFAULT_PSEUDOCOUNT = 1e-6


def main():
    parser = argparse.ArgumentParser(description="Transform clonotype fractions from long format to wide format")
    parser.add_argument('-i', '--input', required=True, help="Input TSV file with columns: sampleId, clonotypeKey, sampleLabel, fraction")
    parser.add_argument('-o', '--output', required=True, help="Output TSV file with clonotypeKey as first column and sampleLabel values as additional columns")

    args = parser.parse_args()

    # Read input TSV file
    df = pl.read_csv(args.input, separator="\t")
    
    # Find the minimum non-zero fraction value in the data
    # This will be used if it's lower than the default pseudocount
    min_nonzero_fraction = df.filter(pl.col('fraction') > 0)['fraction'].min()
    
    # Use the smaller of the default pseudocount or the actual minimum
    if min_nonzero_fraction is not None:
        pseudocount = min(min_nonzero_fraction, DEFAULT_PSEUDOCOUNT)
    else:
        pseudocount = DEFAULT_PSEUDOCOUNT
    
    # Pivot the dataframe: clonotypeKey as index, sampleLabel as columns, fraction as values
    # This will automatically create null for missing combinations
    pivoted_df = df.pivot(
        index='clonotypeKey',
        on='sampleLabel',
        values='fraction',
        aggregate_function='first'  # Use first value if there are duplicates
    )
    
    # Replace null values (missing combinations) with the pseudocount
    pivoted_df = pivoted_df.fill_null(pseudocount)
    
    # Write output TSV file
    pivoted_df.write_csv(args.output, separator="\t")

if __name__ == '__main__':
    main()

