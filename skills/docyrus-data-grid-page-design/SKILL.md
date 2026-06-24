---
name: docyrus-data-grid-page-design
description: Build Docyrus React data-grid and record-list pages with `DataGrid`, `DataGridViewSelect`, `useDataGrid`, `useDocyrusDataViewSelect`, and `useDocyrusDataGrid`. Use when asked to build or refactor a list page, records table, CRM or ERP grid, saved-view tabs, row actions, manual DataGrid toolbar composition, or Docyrus data-source grid queries with filtering, sorting, grouping, search, display modes, paging, and reload behavior.
---

# Docyrus Data Grid Page Design

Build full Docyrus list pages around the web `DataGrid` stack.

## Choose the build mode

1. **Standard Docyrus page** → use `useDocyrusDataGrid`.
   - Best when rows come from a Docyrus data source or generated collection.
   - Gives you metadata-driven columns, saved views, toolbar wiring, search, filters (with async option search for relation/user fields), grouping, sorting, row-height, display mode, fields visibility menu, paging, and reload.
   - Auto-wires reference field expansion, tenant-aware formatters (read from `<DocyrusTenantProvider>` context automatically), and a shared users list when supplied.
   - Built-in inline change tracking + save banner (`trackChanges`, `onSaveChanges`) plus optional inline add-row (`onRowAdd`).
   - Built-in selection-bar bulk actions (`bulkActions`: `update`, `delete`, `export`) with `BulkUpdateDialog` + `RecordDeleteConfirmDialog`, extendable via `extraBulkActions`.
   - Built-in server-side export menu (`enableServerExportMenu`, `exportColumns`, `exportFileName`, `serverExportLimit`).
   - Built-in pivot filter strips (`pivotFilters`) and an optional side-panel filter rail (`enableSideFilters` + `sideFiltersConfig`).
   - Relation-cell navigation (`getRelationHref` / `onOpenRelation` / `relationIconFields`), conditional row/cell color rules (`rowColorRules` / `cellColorRules`), and a `excludeFieldSlugs` escape hatch for stale backend metadata.
   - A companion `formViewProps` payload to spread straight into `useDocyrusFormView` for the active view's bound record form.
   - Read `references/hook-pages.md` for the core surface and `references/advanced-grid-features.md` for pivot/side filters, relation navigation, color rules, inline add-row, and the escape hatch.

2. **Custom layout or custom row-query lifecycle** → use `useDocyrusDataViewSelect` + `useDataGrid`.
   - Best when you need a custom toolbar arrangement, local/demo data, or a non-standard fetch cycle.
   - Read `references/manual-pages.md`.

3. **No backend saved views** → use `useDataGrid` with local `SavedDataGridView[]` or `DataGridViewMenu`.
   - Also covered in `references/manual-pages.md`.

4. **Complex Docyrus query payloads** → also load the `docyrus-api-dev` skill.
5. **Advanced saved-view persistence or manual view-driven queries** → read `references/advanced-saved-view-query-patterns.md`.
6. **Advanced grid features (pivot filters, side filters, relation navigation, color rules, inline add, companion form)** → read `references/advanced-grid-features.md`.
7. **Tenant-aware formatters and shared users list** → read `references/tenant-and-users-providers.md`.

## Default page workflow

1. Confirm the `appSlug`, `dataSourceSlug`, and whether a generated collection already exists.
2. Pick hook mode or manual mode.
3. App-level: mount `<DocyrusTenantProvider client={...} enabled={authReady} userTimezone={tz}>` once near the root so date/datetime/number cells format with the tenant's regional settings automatically — the grid hook reads `useDateFormat()` / `useNumberFormat()` from that context with no per-page formatter props. Also wire a `UsersProvider` (`/v1/users` cache) and pass `users` into the grid hook for instant avatar + label rendering on user cells.
4. Add reserved columns in this order: select first, actions second. They are pinned left automatically by `useDocyrusDataGrid`.
5. Keep the page in a flex column layout with the grid body wrapped in `min-h-0 flex-1`.
6. Add create/edit/view/delete dialogs around row actions (e.g. `RecordFormDialog` + `RecordDeleteConfirmDialog`), and an import flow via `useDocyrusDataImportWizard` when needed.
7. Verify initial saved view, search, filters, grouping, sorting, paging, and reload behavior.

## Non-negotiables

- Render page-sized grids with the toolbar in a shrink-0 row and the grid inside `min-h-0 flex-1`.
- Prefer `<DataGrid table={table} {...gridProps} height="auto" />` for full-page layouts.
- Pass the TanStack `table` instance to every grid menu and to `DataGridViewSelect`.
- `useDocyrusDataViewSelect` manages view metadata only. It does **not** fetch rows and does **not** accept `table`.
- Manual Docyrus item queries must always send `columns`. Reference fields (`field-userSelect`, `field-userMultiSelect`, `field-relation`, `field-relatedField`, `field-select`, `field-radioGroup`, `field-enum`, `field-systemEnum`, `field-multiSelect`, `field-tagSelect`, `field-status`, `field-approvalStatus`) must also be added to the `expand` array so the API returns `{ id, name, ... }` payloads instead of bare IDs.
- Backend saved-view filters need enum options; `useDocyrusDataViewSelect` already fetches the data source with `expand=enums`.
- Manual pages must apply the initial active view with `applyViewToTable(table, activeView)` after views and columns are ready. User-triggered view switches through `DataGridViewSelect` are applied automatically.
- Prefer `useDocyrusDataGrid` unless you truly need custom row fetching or custom toolbar composition. The hook handles auto-expand, async filter options, formatters, and reserved-column pinning for you.
- When you wire manual view CRUD into `DataGridViewSelect`, pass `isSaving` and `isLoading` so the editor UX stays correct during saves and background fetches.
- For tenant-aware date/datetime/number formatting, mount `<DocyrusTenantProvider>` once near the app root. The grid hook auto-reads the formatters from `useDateFormat()` / `useNumberFormat()` context — **do not** hand-wire `formatDate` / `formatDateTime` / `formatNumber` props per page unless you need to override the provider for one grid. (The legacy manual `getTenantPreferences` + per-page formatter props still work and remain a valid fallback for apps that haven't adopted the provider.)
- For instant avatar + label rendering on user-typed cells, fetch `/v1/users` once at app boot and pass the resulting `CellUserOption[]` into `useDocyrusDataGrid` via the `users` option.
- When the backend metadata advertises a field the underlying DB no longer has (items endpoint 500s with `column "X" does not exist`), drop it via `excludeFieldSlugs` as a temporary escape hatch — prefer fixing the backend metadata.

## References

- `references/hook-pages.md` — one-call Docyrus grid pages with direct API mode, collection mode, extension points, formatters, and shared-users wiring.
- `references/advanced-grid-features.md` — pivot filter strips, side-panel filter rail, relation-cell navigation + relation icons, conditional row/cell color rules, inline add-row, the `excludeFieldSlugs` escape hatch, the companion `formViewProps`, reactive selection, and the import-wizard + record-dialog page pattern.
- `references/manual-pages.md` — local/manual grid composition, local views, backend view-select wiring, and initial-view handling.
- `references/advanced-saved-view-query-patterns.md` — saved-view persistence, system views, hidden views, paging ownership, and translating active views into manual server queries.
- `references/tenant-and-users-providers.md` — app-level providers for tenant preferences (`<DocyrusTenantProvider>`) and the shared users list, plus how they auto-wire into `useDocyrusDataGrid`.
