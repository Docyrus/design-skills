# Advanced Docyrus DataGrid Features

These are first-class `useDocyrusDataGrid` options/return values beyond the core toolbar + query wiring covered in `hook-pages.md`. All are opt-in and backward compatible.

## Pivot filter strips

Stack one or more count-tagged pill strips above the grid toolbar for one-dimension quick filtering (status, priority, owner, date bucket, …). The hook owns all the state — no consumer glue.

```tsx
const { table, gridProps, toolbar, pivotFilterRule } = useDocyrusDataGrid<Row>({
  client, appSlug, dataSourceSlug,
  pivotFilters: [
    { fieldSlug: 'status' },
    { fieldSlug: 'priority' },
    { fieldSlug: 'owner' }
  ]
});
```

- Each entry configures a `<PivotFilter>` via `useDocyrusPivotFilter` internally and renders inside the returned `toolbar` automatically (strips stack at the top).
- Selections are **AND-merged** into the items query filter; pill counts cross-react bidirectionally and also react to toolbar / side / saved-view filtering.
- `pivotFilterRule` (return) is the current AND-combined `Array<PivotFilterRule> | null`, already merged into the query — expose it for a "N filters active" badge or persistence.
- `pivotFiltersStrip` (return) is the same interactive element, exposed so composer hooks (e.g. `useDocyrusDataGallery`) can mount it in their own toolbar.
- Supported axis field types: `field-select` / `field-status` / `field-radioGroup` / `field-relation` (list), `field-userSelect` (user), `field-date` / `field-dateTime` (date buckets). Multi-value fields (`field-multiSelect`, `field-tagSelect`, `field-userMultiSelect`) are **not** valid pivot axes (backend rejects them).

For non-grid surfaces (calendar, map, custom layout) use the standalone `<DocyrusPivotFilterGroup>` instead.

## Side-panel filter rail

A persistent left-rail filter panel that complements (does not replace) the toolbar filter menu. Both can be used together.

```tsx
const { table, gridProps, toolbar, sideFilters, sideFiltersExpanded, setSideFiltersExpanded } =
  useDocyrusDataGrid<Row>({
    client, appSlug, dataSourceSlug,
    enableSideFilters: true,
    sideFiltersConfig: {
      columnsConfig,            // ColumnConfig<Row>[] — mirrors useDataTableFilters
      strategy: 'server',       // 'server' (default, emits RuleGroupType) | 'client'
      sections,                 // optional named section groups
      searchable: true,
      title: 'Filters'
    },
    sideFiltersDefaultExpanded: true
  });

return (
  <div className="flex h-full flex-col overflow-hidden">
    <div className="shrink-0">{toolbar}</div>
    <div className="flex min-h-0 flex-1">
      {sideFilters}
      <div className="min-h-0 flex-1">
        <DataGrid table={table} {...gridProps} height="auto" />
      </div>
    </div>
  </div>
);
```

- The panel's emitted `RuleGroupType` is ANDed into the items request alongside the saved view filter and toolbar filter rules. Inspect it via the `sideFiltersQuery` return.
- Collapsing renders a thin vertical rail with a 90°-rotated label that re-expands on click. Control it via `sideFiltersExpanded` / `setSideFiltersExpanded`, or fully control with `sideFiltersExpanded` + `onSideFiltersExpandedChange` props.
- `sideFiltersWidth` (default `280`) sets the expanded width.

## Relation-cell navigation and icons

- `getRelationHref?: (args: RelationNavigationArgs<TData>) => string | undefined` — return an href to render an "open related record" affordance as a real `<a>` (preserves middle-click / ctrl-click / open-in-new-tab). `args` carries `{ relatedId, label, fieldSlug, columnId, rowOriginal, dataSourceId? }` — `relatedId` is the raw foreign-key id (never the display label).
- `onOpenRelation?: (args) => void` — imperative variant for programmatic routing (`router.push`). When only this is set, the affordance is a `<button>`. When both are set, `getRelationHref` wins.
- `relationIconFields?: Record<string, string>` — map a relation field slug (on **this** data source) to a field slug on the **related** data source that holds the display icon (`field-icon` string like `'huge ai-brain-03'`, or a `field-image` value). The cell prefixes the name with the icon and the projection grows to `<relationSlug>(id, name, autonumber_id, <iconFieldSlug>)`.

```tsx
useDocyrusDataGrid<Row>({
  client, appSlug, dataSourceSlug,
  getRelationHref: ({ relatedId, fieldSlug }) => `/records/${fieldSlug}/${relatedId}`,
  relationIconFields: { organization: 'company_icon', country: 'flag_image' }
});
```

## Conditional row / cell color rules

Forwarded straight to `useDataGrid`:

- `rowColorRules` — predicates run against row data; matching rows are tinted.
- `cellColorRules` — target specific column ids and tint individual cells when the predicate matches.

## Inline add-row and row labels

- `onRowAdd` — when supplied, the grid renders the add-row footer cell and the Tab-out-of-last-cell shortcut. The handler may return a `CellPosition` to focus the new cell. Pairs with `trackChanges` (default `true`) so new/edited rows batch into a single `PATCH /items/bulk` on Save.
- `getRowLabel` — accessible per-row label surfaced via `aria-label` and used by the change-tracking save banner.

## `excludeFieldSlugs` escape hatch

Drop field slugs from the data-source metadata **before** anything consumes it (columns, items query, saved-view restore, filter/sort menus, exports):

```tsx
useDocyrusDataGrid<Row>({
  client, appSlug, dataSourceSlug,
  // Backend metadata still advertises these but the DB no longer has the
  // columns, so the items endpoint 500s with `column "X" does not exist`.
  excludeFieldSlugs: ['single_selection', 'text']
});
```

Prefer fixing the backend metadata; this is a temporary unblock. The Set is memoized by content, so passing an inline literal each render is safe.

## Companion record form (`formViewProps`)

The hook resolves the saved form bound to the active view and returns a ready-to-spread payload for a companion `useDocyrusFormView`:

```tsx
const { formViewProps, activeViewForm } = useDocyrusDataGrid<Row>({
  client, appSlug, dataSourceSlug,
  defaultFormLayout      // optional fallback layout when the view has no bound form
});

// In the record dialog:
const formView = useDocyrusFormView({ client, appSlug, dataSourceSlug, ...formViewProps });
```

- `formViewProps.formLayout` is the bound form's layout, the `defaultFormLayout` fallback, or `null` (auto-build a single-column form from the data-source fields).
- `formViewProps.dataSource` forwards the grid's already-resolved schema so the form reuses it instead of issuing its own `getBySlug` per dialog open.
- Also exposed: `activeViewFormId`, `activeViewForm`.

For building the record form itself, load the `docyrus-record-detail-form-design` skill.

## Reactive selection

`selectedRows: Array<TData>` and `selectedRowCount: number` are reactive — reading them in the page render re-renders on selection change. Use them to drive a contextual header button without `useEffect`/ref glue:

```tsx
const { selectedRows, selectedRowCount } = useDocyrusDataGrid<Row>({ /* ... */ });

{selectedRowCount > 0 && (
  <Button onClick={() => emailSelected(selectedRows)}>
    Email {selectedRowCount} selected
  </Button>
)}
```

For actions inside the floating selection bar instead, use the `extraBulkActions` option (see `hook-pages.md`).

## Full page pattern: import + record dialogs

A complete CRUD page typically composes the grid hook with a record form dialog, a delete-confirm dialog, and the import wizard:

```tsx
const { table, gridProps, toolbar, reload, dataSource } = useDocyrusDataGrid<Row>({
  client, appSlug, dataSourceSlug, collection, actionsColumn, users
});

// Import wizard — feed it the schema the grid already resolved.
const { openWizard, wizard } = useDocyrusDataImportWizard({
  client, appSlug, dataSourceSlug,
  fields: dataSource?.fields,
  onImported: reload
});

return (
  <>
    <div className="shrink-0">{toolbar}</div>
    <div className="min-h-0 flex-1">
      <DataGrid table={table} {...gridProps} height="auto" />
    </div>

    {/* RecordFormDialog (view/edit/create), RecordDeleteConfirmDialog, {wizard} … */}
  </>
);
```

- Build `actionsColumn` with `getDataGridActionsColumn({ cell })` and wire your own Expand / Edit / Duplicate / Delete affordances; the hook pins it left as the second reserved column.
- `useDocyrusDataImportWizard({ client, appSlug, dataSourceSlug, fields?, onImported })` returns `{ openWizard, wizard }`. Pass `dataSource?.fields` so it reuses the grid's schema; call `reload` from `onImported` to refresh rows after import. It returns `wizard: null` when `enabled` is `false` (feature-flag friendly).
- Pass `onSubmitSuccess={reload}` from the record form dialog so the grid refreshes after create/edit.

See `apps/playground/src/pages/organizations-page.tsx` for the canonical reference implementation of this pattern.
