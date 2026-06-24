# Tab Panels

Each tab's `content` is one of: a KPI/overview composition, a `@docyrus/ui` panel, a related-records table, or a `RecordTabPlaceholder`. Build the `tabs` array with `useMemo` and append conditional tabs only when their data exists.

## Contents

- [Tab assembly](#tab-assembly)
- [Overview tab](#overview-tab)
- [Activity → `RecordActivityPanel`](#activity--recordactivitypanel)
- [Comments → `CommentsPanel`](#comments--commentspanel)
- [Files → `FileAttachmentPanel`](#files--fileattachmentpanel)
- [Related records (tables)](#related-records-tables)
- [Conditional tabs](#conditional-tabs)
- [Placeholders](#placeholders)

## Tab assembly

```tsx
const tabs = useMemo<Array<RecordDetailTab>>(() => [
  { value: 'overview', label: 'Overview', content: <OverviewContent /> },
  { value: 'activity', label: 'Activity', icon: <ActivityIcon className="size-4" />, content: <RecordActivityPanel activities={activitiesData} isLoading={activitiesLoading} /> },
  { value: 'team', label: 'Team', icon: <Users className="size-4" />, count: contactsData.length, bare: true, content: <RelatedContactsTable …/> },
  // …deals, comments, tasks, files…
  ...(subsidiariesData.length > 0 ? [{ value: 'subsidiaries', /* … */ }] : []),
  ...(isPartner ? [{ value: 'customers', /* … */ }] : [])
], [/* every data + handler dep */]);
```

- `count` shows a badge next to the label — drive it from the unwrapped list length.
- `bare: true` for table/grid bodies that own their scroll; omit it for padded panels.
- List every data array, loading flag, and handler in the `useMemo` deps.

## Overview tab

KPI highlights + a trimmed recent-activity feed:

```tsx
<div className="space-y-5">
  <section className="space-y-2">
    <h3 className="text-[13px] font-medium text-muted-foreground">Highlights</h3>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <RecordKpiCard label="Status" icon={<CircleDot className="size-4" />} value={orgStatus?.name ?? '—'} />
      <RecordKpiCard label="Team" icon={<Users className="size-4" />} value={contactsData.length} hint="people" />
      <RecordKpiCard label="Tasks" icon={<CheckSquare className="size-4" />} value={tasksData.length} hint="linked tasks" />
    </div>
  </section>
  <section className="space-y-2">
    <h3 className="text-[13px] font-medium text-muted-foreground">Recent activity</h3>
    <div className="rounded-xl border bg-background/40 p-3">
      <RecordActivityPanel activities={activitiesData.slice(0, 2)} isLoading={activitiesLoading} />
    </div>
  </section>
</div>
```

## Activity → `RecordActivityPanel`

Import from `@/components/docyrus/record-activity-panel`.

```ts
interface RecordActivityPanelProps {
  activities: Array<RecordActivity>;
  isLoading?: boolean;
  className?: string;
}
```

`RecordActivity` carries `{ id, description, shortDescription, icon, color, operation, created_on, created_by_user: { firstname, lastname, name, … } | null, title, … }`. Feed it the unwrapped `/items/:id/activities` response. The panel renders its own loading + empty states.

## Comments → `CommentsPanel`

Import from `@/components/docyrus/comments-panel`.

```ts
interface CommentsPanelProps {
  comments: Array<DocyrusComment>;
  currentUser?: CommentUser;                 // { id, firstname?, lastname? }
  users?: Array<CommentUser>;                // for @mentions
  title?: string;                            // default 'Comments'
  editable?: boolean;                        // default true
  isLoading?: boolean;
  maxHeight?: number | string;               // default '24rem'
  onCreateComment?: (p: { message: string; parentId?: string; attachments?: Array<File> }) => void | Promise<void>;
  onUpdateComment?: (commentId: string, message: string) => void | Promise<void>;
  onDeleteComment?: (commentId: string) => void | Promise<void>;
  isCreatePending?: boolean;
  isDeletePending?: boolean;
}
```

`DocyrusComment` = `{ id, message, attachments, created_on, created_by, parent_id, … }` (threading via `parent_id`). Wire the three handlers to `POST` / `PATCH` / `DELETE` on `/items/:id/comments` and invalidate the comments query. Map your user/current-user records to `{ id, firstname, lastname }`.

## Files → `FileAttachmentPanel`

Import from `@/components/docyrus/file-attachment-panel`.

```ts
// key props (more exist: accept, maxFiles, oneDriveConfig, googleDriveConfig, onFileOpen…)
interface FileAttachmentPanelProps {
  files: Array<DocyrusFile>;
  title?: string;                            // default 'Attachments'
  editable?: boolean;                        // default true
  isLoading?: boolean;
  maxHeight?: number;                        // default 560
  maxFileSize?: number;                      // default 50 MB
  onUploadFile?: (file: File) => Promise<DocyrusFile>;
  onDeleteFile?: (fileId: string) => void | Promise<void>;
  onInsertExternalFiles?: (files: Array<ExternalFilePayload>) => void | Promise<void>;
  isDeletePending?: boolean;
}
```

`onUploadFile` should `POST` multipart to `/items/:id/files/upload` and return the created `DocyrusFile`; `onDeleteFile` `DELETE`s `/items/:id/files/:fileId`. Invalidate the files query in both. The panel manages upload progress, list/grid view toggle, and the delete-confirm dialog internally.

## Related records (tables)

Two options:

1. **Lightweight custom table** (what the reference CRM page uses) — a simple search `Input` + mapped rows of `Button`s, taking `{ items, isLoading, emptyLabel, onOpen…, onAdd… }`. Best for compact, action-oriented lists (contacts with email/call/sms buttons, deals, subsidiaries). Build per related type; keep row actions (`onOpenContact`, `onEmail`, `onCall`) as props so the page owns navigation.
2. **Full `DataGrid` / `useDocyrusDataGrid`** — when the tab needs sorting, filtering, saved views, or many columns. Render inside a `bare: true` tab. Load the `docyrus-data-grid-page-design` skill.

Either way, the data comes from the related-list query (see `data-layer.md`); the table is presentational.

## Conditional tabs

Append optional tabs with a spread guard so they appear only when relevant:

```tsx
...(subsidiariesData.length > 0 ? [{
  value: 'subsidiaries', label: 'Subsidiaries', icon: <Building2 className="size-4" />,
  count: subsidiariesData.length, bare: true,
  content: <RelatedOrganizationsTable organizations={subsidiariesData} … />
}] : []),
...(isPartner ? [{ value: 'customers', /* referred customers */ }] : [])
```

## Placeholders

Tabs for not-yet-available features render `RecordTabPlaceholder`, optionally with an action (e.g. "Compose email" when no inbox sync exists yet):

```tsx
<RecordTabPlaceholder
  icon={<Mail className="size-5" />}
  title="Email sync is not available yet"
  description="Once mailbox sync is connected, conversations will appear here."
  action={orgEmail ? <Button size="sm" variant="outline" onClick={() => setEmailTarget({ to: orgEmail, name: orgName })}><Mail className="size-4" />Compose email</Button> : undefined} />
```
