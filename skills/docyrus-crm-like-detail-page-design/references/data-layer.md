# Data Layer

How to fetch the record, its related lists, and build the attribute fields. Use generated collection hooks (`@docyrus/tanstack-db-generator`) where available; otherwise call the raw client.

## Contents

- [Main record](#main-record)
- [Related lists](#related-lists)
- [Activity / files / comments](#activity--files--comments)
- [`unwrapListResponse`](#unwraplistresponse)
- [Inline save + invalidation](#inline-save--invalidation)
- [Building `RecordDetailField[]`](#building-recorddetailfield)
- [Flattening the record](#flattening-the-record)

## Main record

One `useQuery` per record id. Always pass `columns` (include the relation/enum/user columns you display, with sub-selects for relations):

```tsx
const collection = useBaseOrganizationCollection();

const { data: record, isLoading: recordLoading } = useQuery({
  queryKey: ['organization', organizationId],
  queryFn: () => collection.get(organizationId, { columns: ORG_FIELD_SET.columns }),
  enabled: !!organizationId
});
```

`columns` for a detail record typically lists scalar fields plus relation sub-selects, e.g. `'country(id,name)'`, `'parent_organization'`, `'status'`.

## Related lists

Each related list is its own query, filtered on the **back-reference relation field** that points at this record. Use `fullCount: true`, `expand` for the list's own reference columns, an `orderBy`, and `placeholderData: keepPreviousData` so counts/rows don't flash on refetch:

```tsx
const { data: contactsResponse, isLoading: contactsLoading } = useQuery({
  queryKey: ['organization-contacts', organizationId],
  queryFn: () => contactCollection.list({
    columns: ['id', 'name', 'email', 'job_title', 'mobile', 'organization', 'created_on'],
    filters: {
      combinator: 'and',
      rules: [{ field: 'organization', operator: 'eq', value: organizationId }]
    },
    expand: ['organization'],
    orderBy: { field: 'created_on', direction: 'desc' },
    fullCount: true
  }),
  enabled: !!organizationId,
  placeholderData: keepPreviousData
});
```

Patterns this unlocks:

- **Self-referential children** (subsidiaries): filter the *same* collection on a parent relation field (`{ field: 'parent_organization', operator: 'eq', value: organizationId }`).
- **Conditional lists** (a partner's referred customers): gate with `enabled: !!organizationId && isPartner` so the request only fires when relevant.

Drive each tab's `count` from the unwrapped array length.

## Activity / files / comments

These use record sub-resource endpoints, not the items list. Fetch with the raw client:

```tsx
// Activity feed
queryFn: () => client!.get(`/v1/apps/base/data-sources/organization/items/${id}/activities`)
// Files
queryFn: () => client!.get(`/v1/apps/base/data-sources/organization/items/${id}/files`)
// Comments
queryFn: () => client!.get(`/v1/apps/base/data-sources/organization/items/${id}/comments`)
```

See `tab-panels.md` for the exact payload shapes each panel expects.

## `unwrapListResponse`

Docyrus list endpoints may return an array, `{ data: [...] }`, or a nested envelope. Normalize defensively before rendering:

```tsx
function unwrapListResponse<T>(value: unknown): Array<T> {
  let current = value;

  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(current)) return current as Array<T>;
    if (current && typeof current === 'object' && 'data' in current) {
      current = (current as { data?: unknown }).data;
      continue;
    }
    break;
  }

  return [];
}
```

Wrap each response in `useMemo(() => unwrapListResponse<Entity>(resp), [resp])`.

## Inline save + invalidation

`onInlineSave` receives the changed fields and the full new values. Build a partial payload from the changes, persist, then invalidate the record query (and any list that shows the record) so the detail refetches and the attribute editors remount with fresh values:

```tsx
const handleInlineSave = useCallback(
  async (changes: Array<{ fieldSlug: string }>, values: Record<string, unknown>) => {
    const payload: Record<string, unknown> = {};

    for (const c of changes) payload[c.fieldSlug] = values[c.fieldSlug];
    await collection.update(organizationId, payload);
    await queryClient.invalidateQueries({ queryKey: ['organization', organizationId] });
    await queryClient.invalidateQueries({ queryKey: ['organizations'] });
  },
  [collection, organizationId, queryClient]
);
```

File/logo uploads follow the same shape — upload to storage, then PATCH the field with the stored value, then invalidate. See `header-and-actions.md` for the logo flow.

## Building `RecordDetailField[]`

`EditableRecordDetail` consumes `RecordDetailField` entries:

```ts
interface RecordDetailField {
  field: IField;                 // the data-source field metadata (slug, name, type, …)
  enumOptions?: Array<EnumOption>;
  readOnly?: boolean;
  required?: boolean | ((values) => boolean);
  hidden?: boolean | ((values) => boolean);
  appSlug?: string;
  dataSourceSlug?: string;
}
```

Build one entry per displayed slug, hydrating options by field type — enum options for select/status, relation options for relation fields, user options for user fields:

```tsx
const detailFields = useMemo<Array<RecordDetailField>>(
  () => fieldSet.fields.map(field => ({
    field,
    enumOptions: relationOptions[field.slug] ?? enumsByField[field.slug],
    appSlug: 'base',
    dataSourceSlug: 'organization'
  })),
  [enumsByField, relationOptions]
);
```

The enum/relation/user option resolution (`useEnums`, `useRelationFieldOptions`, and merging the record's own current value so a selected-but-not-in-page option still renders) is app-level glue. For how the field components consume these options and the field-type → editor mapping, load `docyrus-record-detail-form-design`.

## Flattening the record

The inline editors expect scalar ids, but relation/enum/user values arrive as `{ id, name }`. Flatten before passing `record` to the shell, keeping a `*_name` companion when a custom renderer needs the label:

```tsx
const flatRecord = useMemo(() => {
  if (!record) return {};
  const r = record as Record<string, unknown>;
  const idOf = (v: unknown) => (typeof v === 'object' && v ? (v as { id?: string }).id : v);

  return {
    ...r,
    status: idOf(r.status),
    industry: idOf(r.industry),
    country: idOf(r.country),
    country_name: typeof r.country === 'object' ? (r.country as { name?: string })?.name ?? '' : '',
    parent_organization: idOf(r.parent_organization)
  };
}, [record]);
```
