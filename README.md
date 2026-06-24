# Docyrus Design Skills

Agent skills for designing and building **Docyrus web app UIs** with [`@docyrus/ui`](https://github.com/Docyrus). These are [Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills) — directories of `SKILL.md` instructions plus supporting `references/` docs — that teach AI coding agents (Claude Code, Cursor, Copilot, etc.) how to build production-grade Docyrus React interfaces.

## Install

Using [`npx skills`](https://github.com/vercel-labs/skills):

```bash
# Install all skills from this repo
npx skills add docyrus/design-skills

# List what's available first
npx skills add docyrus/design-skills --list

# Install a single skill
npx skills add docyrus/design-skills --skill docyrus-data-grid-page-design
```

## Skills

| Skill | What it does |
|-------|--------------|
| **docyrus-data-grid-page-design** | Build Docyrus React data-grid and record-list pages with `DataGrid`, `DataGridViewSelect`, `useDataGrid`, `useDocyrusDataViewSelect`, `useDocyrusDataGrid` — saved-view tabs, row actions, filtering, sorting, grouping, search, display modes, paging, and reload behavior. |
| **docyrus-record-detail-form-design** | Build Docyrus React record forms, detail sheets, inspector panels, and inline-edit record UIs with `useDocyrusFormView`, `DynamicFormField`, `DynamicValue`, `EditableRecordDetail`, `EditableValue`, and value renderers. |
| **docyrus-crm-like-detail-page-design** | Build CRM-style record detail pages — a two-pane layout (resizable inline-editable attribute panel + tabbed work area for activity, comments, files, tasks, related records) composing `EditableRecordDetail`, `RecordActivityPanel`, `FileAttachmentPanel`, `CommentsPanel`, `AvatarThumbnail`, and `DataGrid`. Ships a copyable layout-shell starter. |
| **docyrus-ui-react-components** | Master index of every `@docyrus/ui` web component and hook — categorized tables with one-line descriptions, import paths, and per-component `llms.txt` documentation links. Use to discover/pick a Docyrus UI component before wiring it. |
| **docyrus-dashboard-design** | Build Docyrus dashboards, analytics pages, and KPI/metric views with a fixed component stack — Bklit UI for all charts, `AwesomeCard` for all dashboard panels, and `AwesomeStats` for all stat/KPI cards. Overrides generic chart/card guidance. |

## Layout

```
skills/
└── <skill-name>/
    ├── SKILL.md          # frontmatter (name, description) + instructions
    └── references/       # supporting reference docs loaded on demand
```

## License

MIT © Docyrus
