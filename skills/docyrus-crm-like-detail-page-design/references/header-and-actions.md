# Header & Quick Actions

The attribute pane header carries the avatar/logo, title, subtitle, back button, and an "edit all" pencil (built into the shell). You supply the `avatar`, the `attributeActions` row, and the dialogs the actions open.

## Contents

- [Avatar / logo with click-to-upload](#avatar--logo-with-click-to-upload)
- [Quick-action row](#quick-action-row)
- [Tab-bar trailing action](#tab-bar-trailing-action)
- [Email composer dialog](#email-composer-dialog)
- [Related-record create dialog](#related-record-create-dialog)

## Avatar / logo with click-to-upload

`AvatarThumbnail` (`@/components/docyrus/avatar-thumbnail`) renders the image or a fallback icon. Wrap it in a button over a hidden file input for click-to-replace:

```tsx
const logoInputRef = useRef<HTMLInputElement>(null);

const avatar = (
  <>
    <button
      type="button"
      className="group/avatar relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg ring-1 ring-border hover:ring-ring/40"
      onClick={() => logoInputRef.current?.click()}>
      <AvatarThumbnail size={9} image={orgLogo} icon={orgLogo ? undefined : 'fas building'} shape="rounded" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/avatar:opacity-100">
        <CameraIcon className="size-3.5 text-white" />
      </div>
    </button>
    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
  </>
);
```

`image` is a stored-file value `{ signed_url?, file_name? }`. Upload then persist as JSON (two steps — multipart upload, then PATCH the field with the returned stored value):

```tsx
const handleLogoChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if (!file) return;
  e.target.value = '';

  const form = new FormData();

  form.append('file', file, file.name);
  const uploaded = await client!.post(`/v1/apps/base/data-sources/organization/files/upload`, form as never);
  const stored = unwrapStored(uploaded);   // peel { data } envelopes until a { file_name|signed_url } object

  await client!.patch(`/v1/apps/base/data-sources/organization/items/${id}`, { company_logo: stored });
  await queryClient.invalidateQueries({ queryKey: ['organization', id] });
}, [client, id, queryClient]);
```

## Quick-action row

`attributeActions` sits between the header and the fields. Convention: a text "Note" button on the left, comms icon buttons pushed right with `ms-auto`. Disable an action when its data is missing (no email → disabled email button):

```tsx
const attributeActions = (
  <>
    <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={() => setActiveTab('notes')}>
      <StickyNote className="size-3.5" /> Note
    </Button>
    <div className="ms-auto flex items-center gap-1">
      <Button variant="outline" size="icon" className="size-7" disabled={!orgEmail}
        onClick={() => setEmailTarget({ to: orgEmail, name: orgName })} aria-label="Email">
        <Mail className="size-3.5" />
      </Button>
      {orgPhone ? (
        <Button asChild variant="outline" size="icon" className="size-7" aria-label="SMS">
          <a href={`sms:${orgPhone}`}><MessageSquare className="size-3.5" /></a>
        </Button>
      ) : (
        <Button variant="outline" size="icon" className="size-7" aria-label="SMS" disabled>
          <MessageSquare className="size-3.5" />
        </Button>
      )}
    </div>
  </>
);
```

`tel:` / `sms:` links via `<Button asChild><a href>` are the zero-dependency call/SMS path. A real softphone (webphone) integration replaces the call button with a dialer trigger — see below.

## Tab-bar trailing action

`tabBarTrailing` pins a control to the right of the tab strip (always visible). Use it for a page-level call launcher or share button:

```tsx
<RecordDetailLayout
  /* … */
  tabBarTrailing={canCall ? <CallButton onClick={() => startDial(callCandidates)} /> : undefined}
/>
```

(The production CRM page swaps this for a webphone dialer that opens an animated side column; the starter shell keeps it a simple trailing slot.)

## Email composer dialog

`@docyrus/ui` ships `EmailComposer` (`@/components/docyrus/email-composer`) and `useDocyrusEmailComposer`. CRM pages usually wrap it in a small dialog opened from the email actions. Track a target and render conditionally:

```tsx
const [emailTarget, setEmailTarget] = useState<{ to?: string; name?: string } | null>(null);

<RecordEmailComposerDialog
  open={!!emailTarget}
  onOpenChange={open => !open && setEmailTarget(null)}
  to={emailTarget?.to}
  recipientName={emailTarget?.name}
  defaultSubject={emailTarget?.name} />
```

`RecordEmailComposerDialog` is a thin app-local wrapper around `EmailComposer`; build one that mounts `<EmailComposer>` (or `useDocyrusEmailComposer` for full Docyrus messaging-API wiring: accounts dropdown + send mutation) inside a `Dialog`.

## Related-record create dialog

"Add contact" / "Add deal" from a related-list tab opens a create dialog seeded with the parent relation, and invalidates the related query on success:

```tsx
<ContactCreateDialog
  open={contactCreateOpen}
  onOpenChange={setContactCreateOpen}
  initialValues={{ organization: organizationId }}
  onSuccess={() => queryClient.invalidateQueries({ queryKey: ['organization-contacts', organizationId] })} />
```

Use `@docyrus/ui`'s `create-record-dialog` (`@/components/docyrus/create-record-dialog`) as the base — seed `initialValues` with the back-reference field so the new child is linked to this record.
