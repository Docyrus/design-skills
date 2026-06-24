---
name: docyrus-ui-react-components
description: Catalog of every @docyrus/ui React (web) component and hook — descriptions, import paths, and per-component llms.txt documentation links. Use when picking a Docyrus UI component for a feature, discovering what @docyrus/ui ships, installing a component via the CLI, or before wiring any DataGrid / form / calendar / kanban / editor / panel / picker component so you can fetch its exact API from the docs. Triggers on "which Docyrus component", "is there a @docyrus/ui component for…", "add a Docyrus UI component", "list Docyrus components", or any @docyrus/ui component/hook lookup.
---

# Docyrus UI — React Components

`@docyrus/ui` is the Docyrus web component library (React 19 + Tailwind v4, distributed via a self-hosted shadcn registry). This skill is the **master index**: every web component and hook, with a one-line description, its import path, and a link to its `llms.txt` documentation page.

## How to use this skill

1. **Find the component** in the categorized tables below (or the [hooks catalog](references/hooks-catalog.md)).
2. **Fetch its `llms.txt` page** (the link in each row) with `WebFetch` (or `curl`) **before writing code**. The catalog descriptions are intentionally short; the `llms.txt` page is the source of truth for props, types, variants, sizes, usage snippets, and dependencies. Never guess a component's API — read the page.
3. **Install** it into a consuming project with the Docyrus CLI:
   - Component: `docyrus add @docyrus/ui-<slug>` (e.g. `docyrus add @docyrus/ui-data-grid`)
   - Hook: `docyrus add @docyrus/hooks-<slug>` (e.g. `docyrus add @docyrus/hooks-use-docyrus-data-grid`)
4. **Import** from the package export:
   - Component: `import { DataGrid } from '@docyrus/ui/components/data-grid';`
   - Hook: `import { useDocyrusDataGrid } from '@docyrus/ui/library/hooks/use-docyrus-data-grid';`
   - Primitive: `import { Button } from '@docyrus/ui/primitives/ui/button';`

> Docs base URL is `https://ui.docy.app`. The per-page LLM doc lives at `…/docs/web/<section>/<slug>/llms.txt`; the human page drops the `/llms.txt` suffix.

## Master documentation indexes

Fetch these when you need the full library at once instead of a single component:

- **All web components & hooks (index):** https://ui.docy.app/llms-web.txt
- **All web components & hooks (full text, concatenated):** https://ui.docy.app/llms-full-web.txt
- **Everything (web + native, index):** https://ui.docy.app/llms.txt
- **Everything (web + native, full text):** https://ui.docy.app/llms-full.txt

## Connection model

- **Standalone components** work with local props/state — no backend needed.
- **Docyrus-connected components** (the "Docyrus" section + most `useDocyrus*` hooks) need an authenticated `@docyrus/api-client`. The pattern is: pick the presentational component, then wire it with its `useDocyrus*` hook, which fetches data and returns ready-to-spread props.
- For tenant-aware date/number formatting across grids, calendars, filters, and value renderers, mount `<DocyrusTenantProvider client={...} enabled={authReady} userTimezone={tz}>` once near the app root (see `useDocyrusTenant`).

## When to also load another skill

- Full **data-grid / record-list pages** (saved views, toolbar, filtering, paging) → `docyrus-data-grid-page-design`.
- **Record forms / detail / inline-edit** UIs → `docyrus-record-detail-form-design`.
- **CRM-style two-pane detail pages** → `docyrus-crm-like-detail-page-design`.
- **Query payloads / API calls** (filters, aggregations, child queries) → `docyrus-api-dev`.

---

# Component catalog (web)

Each row links to the component's `llms.txt` — read it before implementing.

### Data grids, tables, galleries & pivots

| Component | Import | Description |
|-----------|--------|-------------|
| [Data Grid](https://ui.docy.app/docs/web/components/data-grid/llms.txt) | `@docyrus/ui/components/data-grid` | A virtualized, editable spreadsheet-like data grid with sorting, filtering, grouping, cell selection, and keyboard navigation. |
| [Data Grid View Select](https://ui.docy.app/docs/web/components/data-grid-view-select/llms.txt) | `@docyrus/ui/components/data-grid-view-select` | A view selector with integrated view editor for DataGrid. Supports dropdown, horizontal-tabs, and vertical-tabs variants with full CRUD operations on saved views. |
| [Data Table](https://ui.docy.app/docs/web/components/data-table/llms.txt) | `@docyrus/ui/components/data-table` | A lightweight, read-only TanStack table for Docyrus data sources with value renderers, row selection, grouping, and optional pagination. |
| [Data Gallery](https://ui.docy.app/docs/web/components/data-gallery/llms.txt) | `@docyrus/ui/components/data-gallery` | A standalone, virtualized card gallery view for record lists. Toolbar-driven card design (variant, cover style, density, field bindings) plus full TanStack Table integration for sorting, filtering, grouping, and saved views. |
| [Data Table Filter](https://ui.docy.app/docs/web/components/data-table-filter/llms.txt) | `@docyrus/ui/components/data-table-filter` | A composable filter bar for data tables with text, number, date, option, and multi-option column types. |
| [Data Table Side Filters](https://ui.docy.app/docs/web/components/data-table-side-filters/llms.txt) | `@docyrus/ui/components/data-table-side-filters` | An always-visible side filter panel for e-commerce-style listings — covers every Docyrus field type and emits the same RuleGroupType JSON as the Query Builder. |
| [Tree Table](https://ui.docy.app/docs/web/components/tree-table/llms.txt) | `@docyrus/ui/components/tree-table` | Tree Table component with multiple variants and sizes. |
| [Tree View](https://ui.docy.app/docs/web/components/tree-view/llms.txt) | `@docyrus/ui/components/tree-view` | Tree View component with multiple variants and sizes. |
| [Pivot Grid](https://ui.docy.app/docs/web/components/pivot-grid/llms.txt) | `@docyrus/ui/components/pivot-grid` | A standalone pivot grid with 3-level row and column hierarchies, subtotals, grand totals, drilldown, pinning, resizing, and export. |
| [Pivot Calendar](https://ui.docy.app/docs/web/components/pivot-calendar/llms.txt) | `@docyrus/ui/components/pivot-calendar` | Calendar component that pivots time-based statistics across four layouts — full month, days of a week, days of a month, or months of a year — with grouping, tooltips, and local or remote aggregation. |
| [PivotFilter](https://ui.docy.app/docs/web/components/pivot-filter/llms.txt) | `@docyrus/ui/components/pivot-filter` | Horizontal or vertical strip of count-tagged pills used to quickly slice a list by one dimension — status, user, date bucket, or any other categorical value. |

### Records, forms, schemas & values

| Component | Import | Description |
|-----------|--------|-------------|
| [Form Fields](https://ui.docy.app/docs/web/components/form-fields/llms.txt) | `@docyrus/ui/components/form-fields` | Dynamic form field system powered by TanStack Form. 49 field types with automatic dispatch via DynamicFormField. |
| [Value Renderers](https://ui.docy.app/docs/web/components/value-renderers/llms.txt) | `@docyrus/ui/components/value-renderers` | Read-only value display system for table cells, detail views, and kanban cards. 44 renderer types with automatic dispatch via DynamicValue. |
| [Form Builder](https://ui.docy.app/docs/web/components/form-builder/llms.txt) | `@docyrus/ui/components/form-builder` | A drag-and-drop form designer with a field palette, canvas, properties panel, live preview and code export for TanStack Form, React Hook Form, Zod and raw useState. |
| [Json Schema Form](https://ui.docy.app/docs/web/components/json-schema-form/llms.txt) | `@docyrus/ui/components/json-schema-form` | Json Schema Form component with multiple variants and sizes. |
| [Json Schema Designer](https://ui.docy.app/docs/web/components/json-schema-designer/llms.txt) | `@docyrus/ui/components/json-schema-designer` | A row-based JSON Schema designer ported from extend-hq's schema-builder. Edit property name, type, description and enum values inline; add children directly from each container; preview the live JSON Schema in the side tab. |
| [Editable Record Detail](https://ui.docy.app/docs/web/components/editable-record-detail/llms.txt) | `@docyrus/ui/components/editable-record-detail` | Inline record editing with change tracking, validation, hidden fields, and a floating action bar. |
| [Editable Value](https://ui.docy.app/docs/web/components/editable-value/llms.txt) | `@docyrus/ui/components/editable-value` | Inline editable field with display/edit mode switching, popover auto-open, and change tracking. |
| [Schema Repeater](https://ui.docy.app/docs/web/components/schema-repeater/llms.txt) | `@docyrus/ui/components/schema-repeater` | Schema Repeater component with multiple variants and sizes. |
| [Query Builder](https://ui.docy.app/docs/web/components/query-builder/llms.txt) | `@docyrus/ui/components/query-builder` | Query Builder component. |

### Scheduling, time & boards

| Component | Import | Description |
|-----------|--------|-------------|
| [Calendar](https://ui.docy.app/docs/web/components/calendar/llms.txt) | `@docyrus/ui/components/calendar` | Calendar component. |
| [Kanban](https://ui.docy.app/docs/web/components/kanban/llms.txt) | `@docyrus/ui/components/kanban` | A drag-and-drop kanban board with sortable columns and items, column reordering, overlay previews, and final drop zones for archiving or completing tasks. |
| [Gantt](https://ui.docy.app/docs/web/components/gantt/llms.txt) | `@docyrus/ui/components/gantt` | A Gantt chart component with drag-and-drop task scheduling, timeline zoom, custom markers, and sidebar navigation. |
| [Timeline](https://ui.docy.app/docs/web/components/timeline/llms.txt) | `@docyrus/ui/components/timeline` | Vertical timeline with status indicators, alternate layout, animated entrance, and custom content slots. |
| [Resource Scheduler Panel](https://ui.docy.app/docs/web/components/resource-scheduler-panel/llms.txt) | `@docyrus/ui/components/resource-scheduler-panel` | Resource Scheduler Panel component. |
| [Time Slot Scheduler](https://ui.docy.app/docs/web/components/time-slot-scheduler/llms.txt) | `@docyrus/ui/components/time-slot-scheduler` | Time Slot Scheduler component. |
| [Date Time Picker](https://ui.docy.app/docs/web/components/date-time-picker/llms.txt) | `@docyrus/ui/components/date-time-picker` | Date Time Picker component with multiple variants and sizes. |
| [Date Time Range Picker](https://ui.docy.app/docs/web/components/date-time-range-picker/llms.txt) | `@docyrus/ui/components/date-time-range-picker` | Date Time Range Picker component with multiple variants and sizes. |
| [Day Picker](https://ui.docy.app/docs/web/components/day-picker/llms.txt) | `@docyrus/ui/components/day-picker` | Day Picker component with multiple variants and sizes. |
| [Duration Select](https://ui.docy.app/docs/web/components/duration-select/llms.txt) | `@docyrus/ui/components/duration-select` | Duration Select component with multiple variants and sizes. |

### Inputs, pickers & buttons

| Component | Import | Description |
|-----------|--------|-------------|
| [Avatar Select](https://ui.docy.app/docs/web/components/avatar-select/llms.txt) | `@docyrus/ui/components/avatar-select` | Avatar Select component with multiple variants and sizes. |
| [Avatar Thumbnail](https://ui.docy.app/docs/web/components/avatar-thumbnail/llms.txt) | `@docyrus/ui/components/avatar-thumbnail` | Avatar Thumbnail component with multiple variants and sizes. |
| [Radio Group](https://ui.docy.app/docs/web/components/radio-group/llms.txt) | `@docyrus/ui/components/radio-group` | Radio Group component with multiple variants and sizes. |
| [Mega Select](https://ui.docy.app/docs/web/components/mega-select/llms.txt) | `@docyrus/ui/components/mega-select` | Mega Select component. |
| [Tree Select](https://ui.docy.app/docs/web/components/tree-select/llms.txt) | `@docyrus/ui/components/tree-select` | A select dropdown backed by a tree. Single mode renders like Select; multi mode renders like Tag Select. Hierarchical search, expand-all and parent-cascade checking come from the embedded Tree View. |
| [Search Input](https://ui.docy.app/docs/web/components/search-input/llms.txt) | `@docyrus/ui/components/search-input` | Search Input component with multiple variants and sizes. |
| [Docyrus Data Source Picker](https://ui.docy.app/docs/web/components/docyrus-data-source-picker/llms.txt) | `@docyrus/ui/components/docyrus-data-source-picker` | Docyrus Data Source Picker component with multiple variants and sizes. |
| [Place Autocomplete](https://ui.docy.app/docs/web/components/place-autocomplete/llms.txt) | `@docyrus/ui/components/place-autocomplete` | Place Autocomplete component with multiple variants and sizes. |
| [Docyrus Icon](https://ui.docy.app/docs/web/components/docyrus-icon/llms.txt) | `@docyrus/ui/components/docyrus-icon` | Docyrus Icon component with multiple variants and sizes. |
| [Morph Popover](https://ui.docy.app/docs/web/components/morph-popover/llms.txt) | `@docyrus/ui/components/morph-popover` | Morph Popover component with multiple variants and sizes. |
| [Confirmation Button](https://ui.docy.app/docs/web/components/confirmation-button/llms.txt) | `@docyrus/ui/components/confirmation-button` | Confirmation Button component with multiple variants and sizes. |
| [Contact Channels Field](https://ui.docy.app/docs/web/components/contact-channels-field/llms.txt) | `@docyrus/ui/components/contact-channels-field` | A backend-agnostic, fully controlled editor for a record's contact channels, their consent cache and validation status. |
| [Stepper](https://ui.docy.app/docs/web/components/stepper/llms.txt) | `@docyrus/ui/components/stepper` | A multi-step progress indicator with 6 visual variants, horizontal/vertical orientation, animated transitions, and customizable step icons. |

### Panels, activity, cards & notifications

| Component | Import | Description |
|-----------|--------|-------------|
| [Comments Panel](https://ui.docy.app/docs/web/components/comments-panel/llms.txt) | `@docyrus/ui/components/comments-panel` | Comments Panel component. |
| [Contact Activity Panel](https://ui.docy.app/docs/web/components/contact-activity-panel/llms.txt) | `@docyrus/ui/components/contact-activity-panel` | Contact Activity Panel component. |
| [Record Activity Panel](https://ui.docy.app/docs/web/components/record-activity-panel/llms.txt) | `@docyrus/ui/components/record-activity-panel` | Record Activity Panel component. |
| [File Attachment Panel](https://ui.docy.app/docs/web/components/file-attachment-panel/llms.txt) | `@docyrus/ui/components/file-attachment-panel` | File Attachment Panel component. |
| [Notifications Panel](https://ui.docy.app/docs/web/components/notifications-panel/llms.txt) | `@docyrus/ui/components/notifications-panel` | Notifications Panel component with multiple variants and sizes. |
| [Notification Stack](https://ui.docy.app/docs/web/components/notification-stack/llms.txt) | `@docyrus/ui/components/notification-stack` | A stacked notification card system with swipe-to-dismiss gestures, auto-pagination, action buttons, and animated transitions. |
| [Log Activity Form](https://ui.docy.app/docs/web/components/log-activity-form/llms.txt) | `@docyrus/ui/components/log-activity-form` | Log Activity Form component. |
| [Pricing Engine Panel](https://ui.docy.app/docs/web/components/pricing-engine-panel/llms.txt) | `@docyrus/ui/components/pricing-engine-panel` | Pricing Engine Panel component. |
| [Record Sharing](https://ui.docy.app/docs/web/components/record-sharing/llms.txt) | `@docyrus/ui/components/record-sharing` | Record Sharing component. |
| [Awesome Card](https://ui.docy.app/docs/web/components/awesome-card/llms.txt) | `@docyrus/ui/components/awesome-card` | A card with a hatched-stripe header and an inset content area, perfect for displaying stats and metrics. |
| [Awesome Stats](https://ui.docy.app/docs/web/components/awesome-stats/llms.txt) | `@docyrus/ui/components/awesome-stats` | Data-driven metric cards with grid, flex, and animated tabs layouts. |

### Messaging, chat & AI

| Component | Import | Description |
|-----------|--------|-------------|
| [Email Composer](https://ui.docy.app/docs/web/components/email-composer/llms.txt) | `@docyrus/ui/components/email-composer` | Rich text email composer with sender-account picker, formatting toolbar, recipients, attachments, and i18n support. |
| [Instant Message Composer](https://ui.docy.app/docs/web/components/instant-message-composer/llms.txt) | `@docyrus/ui/components/instant-message-composer` | Composer for SMS and WhatsApp with channel switching, recipient chips, attachments, and SMS character counting. |
| [Team Chat Channel](https://ui.docy.app/docs/web/components/team-chat-channel/llms.txt) | `@docyrus/ui/components/team-chat-channel` | Team Chat Channel component. |
| [Editor Agent](https://ui.docy.app/docs/web/components/editor-agent/llms.txt) | `@docyrus/ui/components/editor-agent` | Editor Agent component (embeddable AI assistant drawer for the code/template editors). |

### Editors, code workbenches & media

| Component | Import | Description |
|-----------|--------|-------------|
| [HTML Template Editor](https://ui.docy.app/docs/web/components/html-template-editor/llms.txt) | `@docyrus/ui/components/html-template-editor` | WYSIWYG document editor for authoring Handlebars-aware HTML templates (quotes, invoices, reports). Word-style A4 page surface, tabs (Visual / Code / Data / Preview / PDF), variable & helper chips, slash-style triggers, and a data-driven Table dialog where users discover JSON paths, configure columns, and write free-form sum / aggregate expressions per row. |
| [Handlebars Editor](https://ui.docy.app/docs/web/components/handlebars-editor/llms.txt) | `@docyrus/ui/components/handlebars-editor` | A three-pane workbench for writing and rendering Handlebars templates — a JSON input pane, a template editor with IntelliSense, and a live output pane with HTML preview. |
| [Jsonata Editor](https://ui.docy.app/docs/web/components/jsonata-editor/llms.txt) | `@docyrus/ui/components/jsonata-editor` | A three-pane workbench for writing and evaluating JSONata expressions — a JSON input pane, an expression editor with IntelliSense, and a live result pane. |
| [Simple Markdown Editor](https://ui.docy.app/docs/web/components/simple-markdown-editor/llms.txt) | `@docyrus/ui/components/simple-markdown-editor` | Simple Markdown Editor component with multiple variants and sizes. |
| [Image Editor](https://ui.docy.app/docs/web/components/image-editor/llms.txt) | `@docyrus/ui/components/image-editor` | An image editor with crop, brightness, saturation, contrast, and hue adjustments, supporting rectangle and circle stencils with zoom controls. |
| [Map](https://ui.docy.app/docs/web/components/map/llms.txt) | `@docyrus/ui/components/map` | Interactive map component built on Leaflet with SSR-safe lazy loading, theme-aware tiles, marker clustering, drawing tools, custom controls, and geolocation. |

### Adaptive Cards (Microsoft)

| Component | Import | Description |
|-----------|--------|-------------|
| [Adaptive Card](https://ui.docy.app/docs/web/components/adaptive-card/llms.txt) | `@docyrus/ui/components/adaptive-card` | Renderer for Microsoft's Adaptive Cards 1.5 schema. Surfaces LLM-generated and Microsoft Teams payloads as native Docyrus UI with stateful inputs, validation, nested ShowCards, and action dispatch. |
| [Adaptive Card Designer](https://ui.docy.app/docs/web/components/adaptive-card-designer/llms.txt) | `@docyrus/ui/components/adaptive-card-designer` | Visual drag-and-drop designer for Microsoft Adaptive Cards 1.5 / 1.6 payloads. Three-pane editor (toolbox · canvas · structure / properties) with paired JSON editors, live preview, undo / redo, and theme / width controls — backed by the in-repo Adaptive Card renderer. |

### Dialogs & data wizards

| Component | Import | Description |
|-----------|--------|-------------|
| [Create Record Dialog](https://ui.docy.app/docs/web/components/create-record-dialog/llms.txt) | `@docyrus/ui/components/create-record-dialog` | Create Record Dialog component with multiple variants and sizes. |
| [Record Delete Confirm Dialog](https://ui.docy.app/docs/web/components/record-delete-confirm-dialog/llms.txt) | `@docyrus/ui/components/record-delete-confirm-dialog` | Record Delete Confirm Dialog component. |
| [Delete Confirm Dialog](https://ui.docy.app/docs/web/components/delete-confirm-dialog/llms.txt) | `@docyrus/ui/components/delete-confirm-dialog` | Delete Confirm Dialog component with multiple variants and sizes. |
| [Data Import Wizard](https://ui.docy.app/docs/web/components/data-import-wizard/llms.txt) | `@docyrus/ui/components/data-import-wizard` | Multi-step modal wizard that turns an Excel/CSV upload into Docyrus data source records — drag-drop, auto-mapped column→field assignment, per-type config, value-renderer preview, and a result summary. |
| [Dummy Data Generator](https://ui.docy.app/docs/web/components/dummy-data-generator/llms.txt) | `@docyrus/ui/components/dummy-data-generator` | Multi-step modal wizard that generates Docyrus-compatible sample records — per-field strategies (text/number/date/enum/relation), value-renderer preview, and an opt-in batch save to the data source. |
| [Awesome Dialog](https://ui.docy.app/docs/web/components/awesome-dialog/llms.txt) | `@docyrus/ui/components/awesome-dialog` | Awesome Dialog component. |

---

# Docyrus-connected components

These require an authenticated `@docyrus/api-client` (passed as a `client` prop or wired through the matching `useDocyrus*` hook). Their docs live under `web/docyrus/`.

| Component | Import | Description |
|-----------|--------|-------------|
| [Bulk Update Dialog](https://ui.docy.app/docs/web/docyrus/bulk-update-dialog/llms.txt) | `@docyrus/ui/components/bulk-update-dialog` | Bulk Update Dialog component (apply a field change across many selected records). |
| [Contact Channels Panel](https://ui.docy.app/docs/web/docyrus/contact-channels-panel/llms.txt) | `@docyrus/ui/components/contact-channels-panel` | A Docyrus-backed panel for managing a record's contact channels, the append-only consent ledger and the validation engine. |
| [Docyrus Agent](https://ui.docy.app/docs/web/docyrus/docyrus-agent/llms.txt) | `@docyrus/ui/components/docyrus-agent` | AI-powered conversational agent component with chat, action panel, and trigger modes. |
| [Docyrus Data Export Menu](https://ui.docy.app/docs/web/docyrus/docyrus-data-export-menu/llms.txt) | `@docyrus/ui/components/docyrus-data-export-menu` | Docyrus Data Export Menu component with multiple variants and sizes. |
| [Docyrus Query Builder](https://ui.docy.app/docs/web/docyrus/docyrus-query-builder/llms.txt) | `@docyrus/ui/components/docyrus-query-builder` | Visual query builder for Docyrus data sources — filters, columns, sorting, calculations, formulas, pivots, and child queries. |
| [DSQL Editor](https://ui.docy.app/docs/web/docyrus/dsql-editor/llms.txt) | `@docyrus/ui/components/dsql-editor` | A two-pane workbench for writing and running DSQL (security-scoped SQL) over Docyrus data sources, with a result grid and an embedded AI agent. |
| [Record PDF Export](https://ui.docy.app/docs/web/docyrus/record-pdf-export/llms.txt) | `@docyrus/ui/components/record-pdf-export` | A three-step wizard (Select a Template → Preview → PDF) that renders a Docyrus data source record to PDF using its saved HTML templates, with an optional editable-template mode. |

---

# Hooks

`@docyrus/ui` ships generic context hooks (formatting, i18n, click-outside, export) and a large family of `useDocyrus*` data hooks that wire a component to a Docyrus data source in one call. The full catalog — descriptions, imports, and `llms.txt` links — is in **[references/hooks-catalog.md](references/hooks-catalog.md)**.

Quick map of the highest-value data hooks:

- `useDocyrusDataGrid` / `useDocyrusDataTable` / `useDocyrusDataGallery` → list pages.
- `useDocyrusFormView` → create/edit/view record forms.
- `useDocyrusKanban`, `useDocyrusCalendar`, `useDocyrusMapView`, `useDocyrusPivotGrid`, `useDocyrusPivotCalendar`, `useDocyrusPivotFilter` → the matching visualization components.
- `useDocyrusTenant` → mount once to enable tenant-aware date/number formatting everywhere.
- `useDocyrusFieldComponent` → resolve the right input/renderer/cell for any field type.

---

## Notes

- This catalog is **web (`@docyrus/ui`) only**. React Native components ship from `@docyrus/ui-native` (`@docyrus/rn-<name>`) and are documented under `https://ui.docy.app/docs/native/…` (see `https://ui.docy.app/llms-native.txt`).
- Descriptions are mirrored from each page's docs frontmatter. A terse "X component with multiple variants and sizes." line means the page itself carries the detailed API — always fetch the `llms.txt` page before implementing.
- Components are distributed via a self-hosted shadcn registry; in a Docyrus app you typically already have `@docyrus/ui` as a dependency, so `import` directly. Use `docyrus add …` when copying source into a standalone shadcn-style project.
