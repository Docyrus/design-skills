---
name: docyrus-crm-like-detail-page-design
description: Build CRM-style Docyrus record detail pages — a single record (organization, contact, deal, account, ticket, project) shown as a two-pane layout with a resizable inline-editable attribute panel on the left and a tabbed work area on the right (Overview/KPIs, Activity, Emails, Calls, related-records tables, Comments, Tasks, Files). Composes `@docyrus/ui` components (`EditableRecordDetail`, `RecordActivityPanel`, `FileAttachmentPanel`, `CommentsPanel`, `AvatarThumbnail`, `EmailComposer`, `DataGrid`) inside a page shell. Use when asked to build or refactor a record detail/profile page, a 360° customer view, a CRM company/contact/deal page, an inspector with tabs, or any "open one record" page that needs inline attribute editing plus related-data tabs.
---

# Docyrus CRM-like Detail Page Design

Build a full "open one record" page: a header + inline-editable attribute panel on the left, a tabbed work area (related records, activity, comments, files, tasks) on the right.

## Architecture — what ships vs. what you build

`@docyrus/ui` ships the **pieces**, not the page shell:

- **Ships (compose these):** `EditableRecordDetail` + `EditableRecordDetailField` (inline attribute editing), `RecordActivityPanel`, `FileAttachmentPanel`, `CommentsPanel`, `AvatarThumbnail`, `EmailComposer`, `DataGrid` / `useDataGrid` (related-record tables), `RecordDeleteConfirmDialog`, `create-record-dialog`.
- **You build (page shell):** the two-pane `RecordDetailLayout` (resizable attribute pane + overflow tab bar), `RecordKpiCard`, `RecordTabPlaceholder`, and lightweight related-record tables. A ready-to-copy starter shell is provided — see **Starter shell** below.

Component source: installed into a consuming app at `@/components/docyrus/<name>` via `docyrus add <name>`; the underlying package path is `@docyrus/ui/components/<name>`. Use `@/components/docyrus/*` in app code.

## Starter shell (copy this first)

`assets/record-detail-layout.tsx` is a self-contained two-pane shell exporting `RecordDetailLayout`, `RecordKpiCard`, `RecordTabPlaceholder`, and the `RecordDetailTab` / `RecordFieldRenderer` types. Copy it into the app (e.g. `src/components/crm/record-detail-layout.tsx`) and adapt. It depends only on shadcn primitives (`@/components/ui/*`), `EditableRecordDetail` (`@/components/docyrus/editable-record-detail`), `cn`, and `lucide-react` — no webphone/i18n coupling. It already implements the three fragile parts correctly (overflow-tab measurement, the resizable divider, and the record-version remount key); reuse them rather than re-deriving. Read `references/layout-shell.md` for the anatomy and which knobs to turn.

## Default page workflow

1. Confirm `appSlug`, `dataSourceSlug`, the record id, and which related data sources hang off it (contacts, deals, subsidiaries, …) and via which relation field slug.
2. Copy the starter shell (or reuse the app's existing `RecordDetailLayout`).
3. **Data layer** — one `useQuery` for the main record (`collection.get(id, { columns })`), plus one `useQuery` per related list / activity / files / comments. Each related list filters on the back-reference relation field. Read `references/data-layer.md`.
4. **Attribute fields** — build `RecordDetailField[]` from the data-source field metadata, hydrating enum + relation + user options. Flatten the record (relation/enum objects → ids) before passing to the shell. Read `references/data-layer.md`.
5. **Header & quick actions** — avatar/logo (click-to-upload), title, subtitle, back, and the note/email/sms/call action row. Read `references/header-and-actions.md`.
6. **Tabs** — map each tab to a panel: Overview = KPI cards + recent activity; Activity = `RecordActivityPanel`; Comments = `CommentsPanel`; Files = `FileAttachmentPanel`; related lists = a table (custom or `DataGrid`); Tasks = a tasks panel; not-yet-available = `RecordTabPlaceholder`. Conditionally include tabs (e.g. a "Customers" tab only when the record is a partner). Read `references/tab-panels.md`.
7. Verify: inline save round-trips and refetches, tab counts reflect data, related-list filters return only this record's children, logo upload persists, email/call actions fire.

## Non-negotiables

- **Single record, two panes.** Left = inline-editable attributes (always visible); right = tabs. Do not stack everything in one scrolling column.
- **One `EditableRecordDetail` context wraps the attribute list.** Inline rows AND the "edit all" modal each mount their own `EditableRecordDetail` (with `trackChanges` + `onSave`); individual rows are `EditableRecordDetailField slug=…`. Never wire per-field save handlers by hand — the context batches changes. For the inline-edit field system itself, load the `docyrus-record-detail-form-design` skill.
- **Remount editors on refetch.** Key the editor by a record-version counter that bumps when the `record` reference changes, so a save → invalidate → refetch reflects fresh values without disrupting an in-progress edit. (The starter shell's `useRecordVersion` does this.)
- **Flatten the record before the shell.** Relation/enum/user values arrive as `{ id, name }` objects; the inline editors expect scalar ids. Map them to ids (keep a `*_name` alongside if a custom renderer needs the label).
- **Related lists query the back-reference.** Each related list is its own query filtered `{ field: '<relationSlug>', operator: 'eq', value: recordId }` with `fullCount: true`, `expand` for its own reference columns, and `placeholderData: keepPreviousData`. Drive each tab's `count` from the fetched length.
- **Always send `columns`** on every Docyrus fetch, and add reference columns to `expand`. See the `docyrus-data-grid-page-design` and `docyrus-api-dev` skills for query shape.
- **Tabs are data-driven and conditional.** Build the `tabs` array with `useMemo`; append optional tabs (subsidiaries, partner customers) only when their data exists. Use `bare: true` for tabs whose body manages its own scroll (tables/grids).
- **Empty/coming-soon states use `RecordTabPlaceholder`**, not blank panels.

## References

- `references/layout-shell.md` — anatomy of the two-pane shell: attribute pane, overflow tab bar, resizable divider, record-version remount, KPI cards, placeholders, and what to customize.
- `references/data-layer.md` — per-entity `useQuery` pattern, columns/filters/expand/fullCount, `unwrapListResponse`, inline save + invalidation, logo/file upload, and building `RecordDetailField[]` with enum/relation/user option hydration.
- `references/tab-panels.md` — wiring each tab to its `@docyrus/ui` panel (`RecordActivityPanel`, `FileAttachmentPanel`, `CommentsPanel`) and to related-record tables; full prop signatures and data shapes.
- `references/header-and-actions.md` — avatar/logo click-to-upload, title/subtitle, quick-action row (note/email/sms/call), the email composer dialog, and the related-record create dialog.

## Related skills

- `docyrus-record-detail-form-design` — the inline-edit field system (`EditableRecordDetail`, `EditableValue`, `DynamicFormField`) and field-type mapping. Load it when working on the attribute panel internals or custom field renderers.
- `docyrus-data-grid-page-design` — use `DataGrid` / `useDocyrusDataGrid` when a related-records tab needs full grid features (sort/filter/saved views) instead of a lightweight list.
- `docyrus-api-dev` — query payload shape (`columns`, `filters`, `expand`, `orderBy`, `fullCount`) for the per-entity fetches.
