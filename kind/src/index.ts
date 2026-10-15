import { assertParamsObject, defineBlockKind } from "@platforma-sdk/block-kind";
import type { PlRef } from "@platforma-sdk/model";
import { isPlRef } from "@platforma-sdk/model";
import { name, version } from "../package.json" with { type: "json" };
import type { Modality, MetricUI } from "./types";
import {
  DISTANCE_TYPES,
  DOWNSAMPLING_TYPES,
  INTERSECTION_TYPES,
  MODALITIES,
  VALUE_CHOOSERS,
} from "./types";

export type { DistanceType, IntersectionType, Metric, MetricUI, Modality } from "./types";
export {
  DISTANCE_TYPES,
  DOWNSAMPLING_TYPES,
  INTERSECTION_TYPES,
  MODALITIES,
  VALUE_CHOOSERS,
} from "./types";

/**
 * This block's init-params contract — the abundance column to compare and the
 * metric rows to compare it with, plus the subtitle the user types.
 *
 * `lastAppliedModality` names the input modality `metrics` was written for.
 * The UI reseeds the metric list whenever the input's modality differs from
 * it, so params that carry metrics must carry this too or the list is replaced
 * by the defaults for whichever input the block lands on.
 *
 * Left out: `datasetLabel`, which the UI snapshots from the dataset picker,
 * and `graphState`, the heatmap's view state.
 *
 * Every field is optional because the projection hands live state back
 * untouched, and a block whose input is not picked yet holds `undefined`
 * there. Requiring one would make the block export a file its own kind refuses
 * to apply, so export and apply would stop being inverses.
 */
export type BlockParams = {
  abundanceRef?: PlRef;
  /** A subset column (`pl7.app/isSubset`) the abundance is restricted to before the analysis. */
  filterRef?: PlRef;
  metrics?: MetricUI[];
  lastAppliedModality?: Modality;
  customBlockLabel?: string;
};

/** The same contract at runtime, for params arriving from a template file rather than typed code. */
function parseInitializationParams(value: unknown): BlockParams {
  assertParamsObject(value);

  const { abundanceRef, filterRef, metrics, lastAppliedModality, customBlockLabel } = value;

  if (abundanceRef !== undefined && !isPlRef(abundanceRef)) {
    throw new Error(
      "'abundanceRef' must be a reference to an upstream column, written as { block, name }.",
    );
  }
  if (filterRef !== undefined && !isPlRef(filterRef)) {
    throw new Error(
      "'filterRef' must be a reference to an upstream subset column, written as { block, name }.",
    );
  }
  if (customBlockLabel !== undefined && typeof customBlockLabel !== "string") {
    throw new Error("'customBlockLabel' must be a string.");
  }
  if (lastAppliedModality !== undefined && !MODALITIES.includes(lastAppliedModality as string)) {
    throw new Error(`'lastAppliedModality' must be one of: ${MODALITIES.join(", ")}.`);
  }
  if (metrics !== undefined) assertMetrics(metrics);

  return {
    abundanceRef,
    filterRef,
    metrics,
    lastAppliedModality: lastAppliedModality as Modality | undefined,
    customBlockLabel,
  };
}

/**
 * A metric row, checked only as far as the editor's own states go: a row exists
 * from the moment it is added, with its `type` and `intersection` still
 * unchosen and its downsampling half-filled. Rejecting those would refuse a
 * file the block itself can export.
 */
function assertMetrics(value: unknown): asserts value is MetricUI[] {
  if (!Array.isArray(value)) throw new Error("'metrics' must be an array.");

  value.forEach((row: unknown, i: number) => {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error(`Metric ${i} must be an object.`);
    }
    const { id, type, intersection, isExpanded, downsampling } = row as Record<string, unknown>;

    if (typeof id !== "string") throw new Error(`Metric ${i} must have a string 'id'.`);
    if (type !== undefined && !DISTANCE_TYPES.includes(type as never)) {
      throw new Error(`Metric ${i} has an unknown 'type'.`);
    }
    if (intersection !== undefined && !INTERSECTION_TYPES.includes(intersection as never)) {
      throw new Error(`Metric ${i} has an unknown 'intersection'.`);
    }
    if (isExpanded !== undefined && typeof isExpanded !== "boolean") {
      throw new Error(`Metric ${i} 'isExpanded' must be a boolean.`);
    }
    if (typeof downsampling !== "object" || downsampling === null || Array.isArray(downsampling)) {
      throw new Error(`Metric ${i} must have a 'downsampling' object.`);
    }
    const d = downsampling as Record<string, unknown>;
    if (d.type !== undefined && !DOWNSAMPLING_TYPES.includes(d.type as string)) {
      throw new Error(`Metric ${i} has an unknown 'downsampling.type'.`);
    }
    if (d.valueChooser !== undefined && !VALUE_CHOOSERS.includes(d.valueChooser as string)) {
      throw new Error(`Metric ${i} has an unknown 'downsampling.valueChooser'.`);
    }
    if (d.n !== undefined && typeof d.n !== "number") {
      throw new Error(`Metric ${i} 'downsampling.n' must be a number.`);
    }
  });
}

// Identity (`name`/`version`) comes from this package's own `package.json`, so
// the on-wire `{name}@{version}` reference can never drift from what npm
// publishes; the bundler inlines the JSON import.
export const kind = defineBlockKind<BlockParams>({ name, version, parseInitializationParams });
