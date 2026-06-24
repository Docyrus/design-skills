# Tenant Preferences and Shared Users Providers

`useDocyrusDataGrid` consumes two tenant-scoped inputs that should be sourced from app-level providers, not refetched per page:

- **Tenant preferences** → drives date / datetime / number formatting so date and money cells respect regional settings.
- **Shared users list** → seeds `field-userSelect` / `field-userMultiSelect` cell options so avatar + name render instantly without per-row fetches.

Both should be set up **once** at app boot and re-used everywhere.

## Tenant preferences — preferred: `<DocyrusTenantProvider>`

The package ships a built-in provider that fetches `/v1/tenant/preferences`, normalizes the envelope, and installs `<DateFormatProvider>` + `<NumberFormatProvider>` underneath. Mount it once near the app root:

```tsx
import { DocyrusTenantProvider } from '@docyrus/ui/library/hooks/use-docyrus-tenant';
import { useDocyrusAuth } from '@docyrus/signin';

function TenantBoundary({ children }: { children: React.ReactNode }) {
  const { client, status, user } = useDocyrusAuth();

  return (
    <DocyrusTenantProvider
      client={client}
      enabled={status === 'authenticated'}
      userTimezone={(user as { timeZone?: { id?: string } } | null)?.timeZone?.id}>
      {children}
    </DocyrusTenantProvider>
  );
}
```

With this mounted, **`useDocyrusDataGrid` auto-reads the formatters from context** (`useDateFormat()` / `useNumberFormat()`) and wires `DateCell` / `DateTimeCell` / `NumberCell` family automatically — you do **not** pass `formatDate` / `formatDateTime` / `formatNumber` props per page. Explicit props still win when you need to override the provider for one grid.

`useDocyrusTenant()` is a read-only hook returning `{ preferences, dateUtils, numberUtils, isLoading }` for ad-hoc access (chart axes, custom headers, side panels). `normalizeTenantPreferences(envelope)` is exported standalone for apps building their own provider stack.

## Tenant preferences — manual provider (legacy / custom)

If you can't adopt `<DocyrusTenantProvider>` (e.g. you bridge tenant data into a pre-existing context), build the formatters yourself and pass them as explicit props. Source the utilities from `@docyrus/app-utils`:

```ts
import {
  getTenantPreferences,
  createDateUtils,
  createNumberUtils,
  type DateUtils,
  type NumberUtils,
  type TenantPreferences
} from '@docyrus/app-utils';
```

### Provider shape

```tsx
'use client';

import {
  createContext, useContext, useMemo, type ReactNode
} from 'react';

import { useDocyrusAuth } from '@docyrus/signin';
import { useQuery } from '@tanstack/react-query';

interface TenantContextValue {
  preferences: TenantPreferences | null;
  dateUtils: DateUtils | null;
  numberUtils: NumberUtils | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  preferences: null,
  dateUtils: null,
  numberUtils: null,
  isLoading: false
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const { client, status, user } = useDocyrusAuth();
  const userTimezone = (user as { timeZone?: { id?: string } } | null)?.timeZone?.id;

  const query = useQuery<TenantPreferences>({
    queryKey: ['tenant', 'preferences'],
    queryFn: () => getTenantPreferences(client!),
    enabled: status === 'authenticated' && Boolean(client),
    staleTime: 30 * 60_000
  });

  const value = useMemo<TenantContextValue>(() => {
    const preferences = query.data ?? null;

    if (!preferences) {
      return {
        preferences: null, dateUtils: null, numberUtils: null, isLoading: query.isLoading
      };
    }

    return {
      preferences,
      dateUtils: createDateUtils({ preferences, userTimezone }),
      numberUtils: createNumberUtils({ preferences }),
      isLoading: query.isLoading
    };
  }, [query.data, query.isLoading, userTimezone]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  return useContext(TenantContext);
}
```

### Wrapping for the data-grid hook

The grid hook expects three callable formatters. Wrap the utils once and expose them via a small hook:

```tsx
export function useGridFormatters() {
  const { dateUtils, numberUtils } = useTenant();

  return useMemo(() => {
    const formatDate = (value: unknown): string => {
      if (value == null) return '';
      if (!dateUtils) return String(value);
      try { return dateUtils.formatDate(value as string | Date) ?? ''; } catch { return String(value); }
    };

    const formatDateTime = (value: unknown): string => {
      if (value == null) return '';
      if (!dateUtils) return String(value);
      try { return dateUtils.formatDateTime(value as string | Date) ?? ''; } catch { return String(value); }
    };

    const formatNumber = (
      value: unknown,
      opts?: { variant?: 'number' | 'currency' | 'percent'; currency?: string }
    ): string => {
      if (value == null || value === '') return '';

      const numeric = typeof value === 'number' ? value : Number(value);

      if (Number.isNaN(numeric)) return String(value);
      if (!numberUtils) return String(value);

      const variant = opts?.variant ?? 'number';
      const base = numberUtils.formatNumber(variant === 'percent' ? numeric * 100 : numeric) ?? String(numeric);

      if (variant === 'currency' && opts?.currency) return `${base} ${opts.currency}`;
      if (variant === 'percent') return `${base}%`;

      return base;
    };

    return { formatDate, formatDateTime, formatNumber };
  }, [dateUtils, numberUtils]);
}
```

Note the `formatNumber` wrapper handles the variant semantics:

- `'percent'` multiplies by 100 and appends `%`.
- `'currency'` appends the currency code provided in the cell meta.
- Plain `'number'` goes straight through `numberUtils.formatNumber`.

If the consuming app uses different conventions (e.g. always show a currency symbol), customize the wrapper accordingly.

## Shared users provider

`useDocyrusDataGrid` accepts `users: ReadonlyArray<CellUserOption>` (`{ value, label, avatarUrl?, initials? }`). Populate it from `/v1/users`:

```tsx
'use client';

import {
  createContext, useContext, useMemo, type ReactNode
} from 'react';

import { useDocyrusAuth } from '@docyrus/signin';
import { useQuery } from '@tanstack/react-query';

import { type CellUserOption } from '@docyrus/ui/components/data-grid';

interface UserRecord {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  photo?: string | null;
  [key: string]: unknown;
}

const UsersContext = createContext<{ users: ReadonlyArray<CellUserOption>; records: ReadonlyArray<UserRecord>; isLoading: boolean }>({
  users: [], records: [], isLoading: false
});

function pickString(record: Record<string, unknown>, ...keys: Array<string>): string | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.length > 0) return value;
  }

  return null;
}

function toUserOption(record: UserRecord): CellUserOption | null {
  if (!record.id) return null;

  const firstName = pickString(record, 'firstname', 'firstName', 'first_name');
  const lastName = pickString(record, 'lastname', 'lastName', 'last_name');
  const fullName = firstName ? lastName ? `${firstName} ${lastName}` : firstName : lastName;
  const email = pickString(record, 'email');
  const label = fullName ?? email ?? record.id;
  const avatarUrl = pickString(record, 'photo', 'avatar_url', 'avatarUrl', 'profile_image_url', 'profileImageUrl') ?? undefined;

  return { value: record.id, label, ...(avatarUrl ? { avatarUrl } : {}) };
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const { client, status } = useDocyrusAuth();

  const query = useQuery<Array<UserRecord>>({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const response = await client!.get<Array<UserRecord> | { data?: Array<UserRecord> }>(
        '/v1/users',
        { limit: 1000 }
      );

      return Array.isArray(response) ? response : (response.data ?? []);
    },
    enabled: status === 'authenticated' && Boolean(client),
    staleTime: 5 * 60_000
  });

  const value = useMemo(() => {
    const records = query.data ?? [];
    const users = records
      .map(toUserOption)
      .filter((option): option is CellUserOption => option !== null);

    return { users, records, isLoading: query.isLoading };
  }, [query.data, query.isLoading]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  return useContext(UsersContext);
}
```

### User record field name fallbacks

The Docyrus `/v1/users` API returns `firstname` / `lastname` (lowercase, no separator) plus `email` and `photo`. The provider also accepts the common camelCase / snake_case aliases as fallbacks so the same code works against tenants that have customized the user schema.

## Wiring providers into the app shell

Place the providers inside the auth + query providers and outside the routes. Prefer the built-in `<DocyrusTenantProvider>`:

```tsx
<AuthProvider>
  <QueryProvider>
    <DevtoolsProvider>
      <DocyrusTenantProvider client={client} enabled={authReady} userTimezone={tz}>
        <UsersProvider>
          <Routes>{/* ... */}</Routes>
        </UsersProvider>
      </DocyrusTenantProvider>
    </DevtoolsProvider>
  </QueryProvider>
</AuthProvider>
```

(Swap `<DocyrusTenantProvider>` for the manual `<TenantProvider>` above only if you can't adopt the built-in one.)

Order matters:

- `AuthProvider` must wrap both because the providers need an authenticated `client` to fetch.
- `QueryProvider` must wrap both because they use `useQuery`.
- The tenant provider and `UsersProvider` are siblings; either order is fine.

## Wiring providers into a grid page

With `<DocyrusTenantProvider>` mounted, the page only needs to pass `users` — the formatters resolve from context:

```tsx
const { users } = useUsers();

const { table, gridProps, toolbar } = useDocyrusDataGrid<Row>({
  client,
  appSlug,
  dataSourceSlug,
  users,
  // ... other options — no formatter props needed
});
```

The grid hook routes:

- Date / number formatters from `useDateFormat()` / `useNumberFormat()` context into TanStack `tableMeta` automatically. `DateCell`, `DateTimeCell`, `NumberCell` (and its currency / percent variants) read these via `tableMeta?.formatDate` etc. Explicit `formatDate` / `formatDateTime` / `formatNumber` props still win when supplied (override-per-grid or no-provider apps).
- `users` into the cell-options builder for `field-userSelect` and `field-userMultiSelect` columns. The cells render avatar + label from this list immediately. Rows pointing at users not in the list still render correctly via the expanded-payload fallback.

## Why centralize these

- Single network round-trip per session for tenant prefs and the user roster.
- Consistent formatting and avatar display across every grid, form, and dialog in the app.
- Pages don't need to know about formatters or user fetching — they just consume context.
- Tenant settings change rarely (long staleTime); user roster also changes slowly (5 min staleTime is a safe default).

## Debug checklist

- **Dates / numbers showing as raw values?** The tenant query likely failed or hasn't resolved, or no tenant provider is mounted. Check `useDocyrusTenant().isLoading` (or `useTenant().isLoading` for the manual provider) and the network tab for `/v1/tenant/preferences`. Without any provider the cells fall back to their own locale defaults, not tenant settings.
- **User cells show "Unassigned" instead of names?** Either `users` wasn't passed in, or the row's user payload didn't expand. Verify `useDocyrusDataGrid` sees both the global `users` list (via context) and that the user column slug appears in `expand` (auto-added; check `resolvedListParams.expand`).
- **Currency shows "1.234,50 USD" but you wanted "$1,234.50"?** Customize the `formatNumber` wrapper for that variant. The default is locale-formatted number + currency code suffix.
- **Avatars missing?** The provider reads `photo` first, then `avatar_url` / `avatarUrl` / `profile_image_url` / `profileImageUrl`. Confirm the API returns one of those fields.
