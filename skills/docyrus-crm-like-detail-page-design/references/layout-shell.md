# Layout Shell Anatomy

The page shell is `assets/record-detail-layout.tsx` (copy it into the app). It is **not** part of `@docyrus/ui`. This doc explains its parts so you can adapt it confidently.

## Contents

- [Top-level structure](#top-level-structure)
- [`RecordDetailLayout` props](#recorddetaillayout-props)
- [Attribute pane](#attribute-pane)
- [Overflow tab bar](#overflow-tab-bar)
- [Resizable divider](#resizable-divider)
- [Record-version remount](#record-version-remount)
- [KPI card & placeholder](#kpi-card--placeholder)
- [What to customize](#what-to-customize)

## Top-level structure

```
RecordDetailLayout                       (rounded card, flex-row on lg)
├── left  data-slot="record-attr-pane"   (resizable width on lg)
│   └── RecordAttributePanel
│       ├── header: back · avatar · title/subtitle · edit-all (pencil)
│       ├── attributeActions row (note · email · sms · call)
│       ├── notice (optional banner)
│       └── scroll body: EditableRecordDetail(inline rows) + "show N more"
├── divider (role="separator", draggable)
└── right (flex-1)
    └── Tabs
        ├── OverflowTabBar (+N more dropdown, optional trailing slot)
        └── TabsContent per tab (bare → no padding/scroll wrapper)
```

The page is meant to fill its container: render it inside a parent with a bounded height (e.g. `h-full`) so the internal `min-h-0 flex-1` scroll regions work.

## `RecordDetailLayout` props

| Prop | Purpose |
|------|---------|
| `isLoading` | Renders the skeleton. |
| `avatar` | Leading element (logo button — see `header-and-actions.md`). |
| `title`, `subtitle` | Header text. |
| `onBack` | Renders a back button when provided. |
| `detailFields: RecordDetailField[]` | Field metadata for the attribute panel (see `data-layer.md`). |
| `fieldSlugs: string[]` | Ordered slugs to render in the attribute panel (first 4 shown, rest behind "show more"). |
| `record: Record<string, unknown>` | **Flattened** record values keyed by slug. |
| `onInlineSave(changes, values)` | Persist inline + modal edits. |
| `editTitle` | Title for the "edit all" modal. |
| `attributeActions` | Quick-action buttons above the attributes. |
| `attributeNotice` | Soft banner below the actions (e.g. read-only). |
| `beforeAttributes` | Custom content above the Attributes section. |
| `fieldRenderers: Record<slug, RecordFieldRenderer>` | Per-slug custom editor overriding the default inline editor. |
| `readOnly` | Display-only attribute panel (no inline edit, no modal). |
| `tabBarTrailing` | Right-aligned control pinned in the tab bar (e.g. a call button). |
| `tabs: RecordDetailTab[]` | Right-pane tab definitions. |
| `defaultTab` / `activeTab` + `onTabChange` | Uncontrolled or controlled tab selection. |

`RecordDetailTab = { value, label, content, icon?, count?, bare? }`. Set `bare: true` when the tab body manages its own scroll (a table/grid) so the shell skips its `overflow-auto p-4` wrapper.

## Attribute pane

The list and the "edit all" modal each wrap their rows in a single `EditableRecordDetail` (`fields`, `record`, `trackChanges`, `onSave`). Inline rows render `<EditableRecordDetailField slug={…} showLabel={false} editHint="progressive" size="sm" />` next to a type icon + field name; the modal renders the same fields with labels. `fieldRenderers[slug]` swaps in a custom editor (gets `{ record, save }` where `save(partialValues)` routes through `onInlineSave`). Only the first `INITIAL_VISIBLE_FIELDS` (4) slugs show until "show N more" expands. For the field system itself, load `docyrus-record-detail-form-design`.

## Overflow tab bar

Tabs do not scroll — overflow collapses into a "+N more" dropdown. A hidden, `aria-hidden` measurement row mirrors the real `TabsTrigger` padding to measure each tab's natural width; a `ResizeObserver` recomputes how many fit on resize. The active tab is always surfaced (pinned as the last visible tab if it would otherwise overflow). Keep the measurement row's classes in sync with the real triggers, or the fit math drifts.

## Resizable divider

A 1px `role="separator"` with a wider invisible hit area. `onMouseDown` reads the current pane width from `[data-slot="record-attr-pane"]` and tracks `mousemove`, clamping to `[PANEL_MIN_WIDTH, PANEL_MAX_WIDTH]`. Width applies only on wide viewports (`useIsWideViewport`, `min-width: 1024px`); below that the panes stack vertically.

## Record-version remount

`useRecordVersion(record)` bumps a counter whenever the `record` **reference** changes. The inline `EditableRecordDetail` is keyed by it (`key={recordVersion}`), so a save → query invalidate → refetch produces a new reference → fresh editor snapshot. Because the reference only changes on refetch (not on keystrokes), an in-progress edit is never interrupted. Do not key on `record.id` (never changes) or on every render (would discard edits).

## KPI card & placeholder

- `RecordKpiCard({ label, value, hint?, icon? })` — compact metric card for the Overview "Highlights" grid (`grid sm:grid-cols-3 gap-3`).
- `RecordTabPlaceholder({ icon?, title, description?, action? })` — centered empty/coming-soon state for tabs without data yet.

## What to customize

- **Field type → icon** map (`FIELD_TYPE_ICONS`) and `INITIAL_VISIBLE_FIELDS`.
- **Pane width bounds** (`PANEL_*_WIDTH`) and the wide-viewport breakpoint.
- **`tabBarTrailing`** for a pinned action (call, share).
- Add a **dialer/side column** back if needed (the production version animates a right column in; omitted here to keep the shell dependency-free).
