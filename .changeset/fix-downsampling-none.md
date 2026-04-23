---
"@platforma-open/milaboratories.repertoire-distance-2.software": patch
"@platforma-open/milaboratories.repertoire-distance-2.model": patch
"@platforma-open/milaboratories.repertoire-distance-2.ui": patch
---

Fix KeyError when downsampling is set to None by computing fractionOfReads in all downsampling branches. Adopt newer SDK versions: bump vue peer to ^3.5.24, switch pf output to outputWithStatus for graph-maker 1.3.0 compatibility, drop removed /styles subpath imports, and raise vite build target to es2022 for ui-vue top-level await.
