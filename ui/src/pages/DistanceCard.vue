<script setup lang="ts">
import type { Metric } from "@platforma-open/milaboratories.repertoire-distance-2.model";
import type { ListOption } from "@platforma-sdk/ui-vue";
import { PlBtnGroup, PlDropdown, PlNumberField } from "@platforma-sdk/ui-vue";
import { computed } from "vue";
import { useApp } from "../app";

const app = useApp();

const metricTypeOptions = computed<ListOption<string | undefined>[]>(() => {
  const sharedLabel =
    app.model.outputs.modality === "peptide" ? "Shared peptides" : "Shared clonotypes";
  return [
    { label: "F1 overlap", value: "F1" },
    { label: "F2 overlap", value: "F2" },
    { label: "D distance", value: "D" },
    { label: sharedLabel, value: "sharedClonotypes" },
    { label: "Correlation", value: "correlation" },
    { label: "Jaccard index", value: "jaccard" },
  ];
});

const intersectionOptions = computed<ListOption<string | undefined>[]>(() => {
  // Peptide inputs have no V/J genes — only the two sequence-only intersections apply.
  if (app.model.outputs.modality === "peptide") {
    return [
      { label: "Peptide nucleotide", value: "CDR3nt" },
      { label: "Peptide amino acid", value: "CDR3aa" },
    ];
  }
  return [
    { label: "CDR3 nucleotide + V/J genes", value: "CDR3ntVJ" },
    { label: "CDR3 amino acid + V/J genes", value: "CDR3aaVJ" },
    { label: "CDR3 nucleotide only", value: "CDR3nt" },
    { label: "CDR3 amino acid only", value: "CDR3aa" },
  ];
});

const downsamplingOptions: ListOption<string | undefined>[] = [
  { label: "None", value: "none" },
  { label: "Top N", value: "top" },
  { label: "Cumulative Top", value: "cumtop" },
  { label: "Random Sampling", value: "hypergeometric" },
];

const props = defineModel<Metric>({
  required: true,
  default: {
    type: undefined,
    intersection: "CDR3ntVJ",
    downsampling: {
      type: "hypergeometric",
      valueChooser: "auto",
    },
  },
});
</script>

<template>
  <PlDropdown v-model="props.type" :options="metricTypeOptions" label="Type" required />

  <PlDropdown
    v-model="props.intersection"
    :options="intersectionOptions"
    label="Intersection"
    required
  />

  <PlDropdown
    v-model="props.downsampling.type"
    :options="downsamplingOptions"
    label="Downsampling"
    required
  />

  <PlNumberField
    v-if="props.downsampling.type === 'cumtop'"
    v-model="props.downsampling.n"
    label="Select % of the abundance distribution to include"
    :minValue="0"
    :maxValue="100"
    :step="1"
    required
  />

  <PlNumberField
    v-if="props.downsampling.type === 'top'"
    v-model="props.downsampling.n"
    label="Select Top N"
    :minValue="0"
    required
  />

  <PlBtnGroup
    v-if="props.downsampling.type === 'hypergeometric'"
    v-model="props.downsampling.valueChooser"
    :options="[
      { value: 'fixed', label: 'Fixed' },
      { value: 'min', label: 'Min' },
      { value: 'auto', label: 'Auto' },
    ]"
  />

  <PlNumberField
    v-if="props.downsampling.valueChooser === 'fixed'"
    v-model="props.downsampling.n"
    label="Select N"
    :minValue="0"
    required
  />
</template>
