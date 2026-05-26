---
"@platforma-open/milaboratories.repertoire-distance-2.model": minor
"@platforma-open/milaboratories.repertoire-distance-2.ui": minor
"@platforma-open/milaboratories.repertoire-distance-2": minor
---

Migrate block to BlockModelV3. Unified `BlockData` (UI-shaped persistence); `.args` lambda derives the workflow-visible shape and validates by throw. Persisted V1 state preserved via `DataModelBuilder.upgradeLegacy`. UI bindings move to `app.model.data`; `defineApp` → `defineAppV3`.

Pin SDK to 1.77.4 / workflow-tengo 5.25.0 (previously caret-ranged from 1.65.10). Drop the V1-only `useMigrationMetrics` bootstrap — legacy projects with empty metrics now get the default seed at `upgradeLegacy` time. Drop dead `model/src/convertes.ts` (referenced a non-existent `MetricUI` type and was unused).
