<script setup lang="ts">
import { PlAgDataTableV2, PlBlockPage, PlBtnGhost, PlEditableTitle, PlMaskIcon24, usePlDataTableSettingsV2 } from '@platforma-sdk/ui-vue';
import { ref } from 'vue';
import { useApp } from '../app';
import SettingsModal from './Settings.vue';

const app = useApp();

const tableSettings = usePlDataTableSettingsV2({
  model: () => app.model.outputs.pt,
});

const settingsAreShown = ref(app.model.args.abundanceRef !== undefined);
const showSettings = () => {
  settingsAreShown.value = true;
};

</script>

<template>
  <PlBlockPage>
    <template #title>
      <PlEditableTitle v-model="app.model.ui.blockTitle" max-width="600px" :max-length="40" />
    </template>
    <template #append>
      <PlBtnGhost @click.stop="showSettings">
        Settings
        <template #append>
          <PlMaskIcon24 name="settings" />
        </template>
      </PlBtnGhost>
    </template>
    <PlAgDataTableV2
      v-model="app.model.ui.tableState"
      :settings="tableSettings"
      show-export-button
      not-ready-text="Data is not computed"
    />
  </PlBlockPage>

  <SettingsModal v-model="settingsAreShown" />
</template>
