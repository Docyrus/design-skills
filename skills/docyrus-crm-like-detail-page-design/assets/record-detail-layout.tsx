/*
 * Starter CRM record-detail page shell — copy into your app (e.g.
 * `src/components/crm/record-detail-layout.tsx`) and adapt.
 *
 * `@docyrus/ui` does NOT ship this shell; it ships the inline-edit detail
 * system (EditableRecordDetail) and the tab panels. This file is the
 * composition layer: a two-pane layout (resizable attribute pane + tabbed
 * work area with an overflow "+N more" tab bar) that you fill with Docyrus
 * panels.
 *
 * Dependencies: shadcn primitives installed in your app (@/components/ui/*),
 * the EditableRecordDetail component installed via `docyrus add editable-record-detail`
 * (@/components/docyrus/editable-record-detail), cn from @/lib/utils, lucide-react.
 *
 * Removed from the production version (add back if needed): webphone dialer
 * column, i18n. Labels are plain props here.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react';

import {
  AlignLeft, ArrowLeft, AtSign, Building2, CalendarClock, ChevronDown,
  CircleDot, Globe, Hash, Image as ImageIcon, Link2, MoreHorizontal,
  Pencil, Phone, Rows3, Tag, Type
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import {
  type FieldChange,
  type RecordDetailField,
  EditableRecordDetail,
  EditableRecordDetailField
} from '@/components/docyrus/editable-record-detail';

const INITIAL_VISIBLE_FIELDS = 4;
const PANEL_DEFAULT_WIDTH = 340;
const PANEL_MIN_WIDTH = 280;
const PANEL_MAX_WIDTH = 560;

const FIELD_TYPE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  'field-text': Type, 'field-email': AtSign, 'field-phone': Phone,
  'field-url': Globe, 'field-textarea': AlignLeft, 'field-select': Tag,
  'field-status': CircleDot, 'field-relation': Link2, 'field-image': ImageIcon,
  'field-number': Hash, 'field-currency': Hash, 'field-money': Hash,
  'field-date': CalendarClock, 'field-datetime': CalendarClock
};

function getFieldIcon(type?: string): ComponentType<{ className?: string }> {
  return (type && FIELD_TYPE_ICONS[type]) || Building2;
}

/**
 * Bumps a version counter whenever the `record` reference changes (e.g. after a
 * save → refetch). Keying the editors by this version remounts them with a fresh
 * value snapshot, keeping inline + modal editing surfaces in sync. The reference
 * only changes on refetch, not while the user types, so an active edit survives.
 */
function useRecordVersion(record: unknown): number {
  const stateRef = useRef<{ last: unknown; version: number }>({ last: record, version: 0 });

  if (stateRef.current.last !== record) {
    stateRef.current.last = record;
    stateRef.current.version += 1;
  }

  return stateRef.current.version;
}

/** True when the viewport is wide enough for the side-by-side resizable layout. */
function useIsWideViewport(): boolean {
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (event: MediaQueryListEvent) => setWide(event.matches);

    mq.addEventListener('change', onChange);

    return () => mq.removeEventListener('change', onChange);
  }, []);

  return wide;
}

// ─── Tab definition ───────────────────────────────────────────────────────────
export interface RecordDetailTab {
  value: string;
  label: ReactNode;
  count?: number | null;
  icon?: ReactNode;
  content: ReactNode;
  /** Removes default padding/scroll wrapper (e.g. for tables that manage it) */
  bare?: boolean;
}

// ─── KPI card (Overview highlights) ─────────────────────────────────────────────
export interface RecordKpiCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}

export function RecordKpiCard({
  label, value, hint, icon
}: RecordKpiCardProps) {
  return (
    <div className="rounded-xl border bg-card/60 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
      </div>
      <div className="mt-1.5 truncate text-base font-semibold leading-tight">{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

// ─── Empty / unavailable tab placeholder ───────────────────────────────────────
export interface RecordTabPlaceholderProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function RecordTabPlaceholder({
  icon, title, description, action
}: RecordTabPlaceholderProps) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-[13px] font-medium">{title}</p>
        {description && <p className="mx-auto max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Per-slug custom field editor ───────────────────────────────────────────────
export interface RecordFieldRenderContext {
  record: Record<string, unknown>;
  save: (values: Record<string, unknown>) => Promise<void>;
}
export type RecordFieldRenderer = (ctx: RecordFieldRenderContext) => ReactNode;

// ─── Attribute panel (left card: header + actions + fields) ─────────────────────
interface RecordAttributePanelProps {
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  detailFields: Array<RecordDetailField>;
  fieldSlugs: Array<string>;
  record: Record<string, unknown>;
  recordVersion: number;
  onSave: (changes: Array<FieldChange>, values: Record<string, unknown>) => void | Promise<void>;
  editTitle?: ReactNode;
  actions?: ReactNode;
  notice?: ReactNode;
  beforeAttributes?: ReactNode;
  readOnly?: boolean;
  fieldRenderers?: Record<string, RecordFieldRenderer>;
}

function RecordAttributePanel({
  avatar, title, subtitle, onBack, detailFields, fieldSlugs, record, recordVersion,
  onSave, editTitle, readOnly, actions, notice, beforeAttributes, fieldRenderers
}: RecordAttributePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fieldBySlug = useMemo(() => {
    const map = new Map<string, RecordDetailField>();

    for (const entry of detailFields) map.set(entry.field.slug, entry);

    return map;
  }, [detailFields]);

  // Persist a partial value set from a custom field editor through inline-save.
  const saveFieldValues = useCallback(
    async (values: Record<string, unknown>) => {
      const changes: Array<FieldChange> = Object.keys(values).map(slug => ({
        fieldSlug: slug,
        fieldName: fieldBySlug.get(slug)?.field.name ?? slug,
        originalValue: record[slug],
        newValue: values[slug]
      }));

      await onSave(changes, { ...record, ...values });
    },
    [fieldBySlug, onSave, record]
  );

  const displayedSlugs = expanded ? fieldSlugs : fieldSlugs.slice(0, INITIAL_VISIBLE_FIELDS);
  const hiddenCount = fieldSlugs.length - INITIAL_VISIBLE_FIELDS;

  const handleModalSave = async (changes: Array<FieldChange>, values: Record<string, unknown>) => {
    await onSave(changes, values);
    setEditOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className={cn('flex items-center gap-2.5 px-3 py-2.5', !actions && 'border-b')}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-4" />
          </button>
        )}
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-tight">{title}</div>
          {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            onClick={() => setEditOpen(true)}
            aria-label="Edit all attributes">
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>

      {actions && <div className="flex items-center gap-1 border-b px-2.5 py-2">{actions}</div>}
      {notice && <div className="border-b">{notice}</div>}

      <div className="min-h-0 flex-1 overflow-auto px-1.5 py-2">
        {beforeAttributes}
        <div className="mb-1.5 flex items-center gap-1.5 px-1.5 text-[13px] font-medium text-muted-foreground">
          <Rows3 className="size-3.5" />
          Attributes
        </div>

        {/* Inline editing: each row is a label + an EditableRecordDetailField (or a
            custom renderer). The whole list shares ONE EditableRecordDetail context
            so trackChanges + save work across every field. */}
        <EditableRecordDetail
          key={recordVersion}
          fields={detailFields}
          record={record}
          readOnly={readOnly ?? false}
          trackChanges
          onSave={onSave}>
          <div className="space-y-px">
            {displayedSlugs.map((slug) => {
              const entry = fieldBySlug.get(slug);

              if (!entry) return null;
              const Icon = getFieldIcon(entry.field.type);

              return (
                <div
                  key={slug}
                  className="group flex items-center gap-2 rounded-md py-0.5 pl-1.5 pr-0.5 transition-colors hover:bg-muted/40">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground/60" />
                  <span
                    title={entry.field.name}
                    className="w-24 shrink-0 break-words text-[13px] leading-tight text-muted-foreground">
                    {entry.field.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    {fieldRenderers?.[slug]
                      ? fieldRenderers[slug]({ record, save: saveFieldValues })
                      : <EditableRecordDetailField slug={slug} showLabel={false} editHint="progressive" size="sm" />}
                  </div>
                </div>
              );
            })}
          </div>
        </EditableRecordDetail>

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground">
            <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
            {expanded ? 'Show less' : `Show ${hiddenCount} more`}
          </button>
        )}
      </div>

      {/* "Edit all" modal — the same EditableRecordDetail context, every field with labels. */}
      {!readOnly && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editTitle ?? 'Edit details'}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto pr-1">
              <EditableRecordDetail
                fields={detailFields}
                record={record}
                readOnly={false}
                trackChanges
                actionBarSideOffset={8}
                onSave={handleModalSave}>
                <div className="space-y-0.5">
                  {fieldSlugs
                    .filter(slug => !fieldRenderers?.[slug])
                    .map(slug => <EditableRecordDetailField key={slug} slug={slug} />)}
                </div>
              </EditableRecordDetail>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Overflow tab bar ───────────────────────────────────────────────────────────
const MORE_BUTTON_WIDTH = 96;
const TAB_GAP = 2;

function renderTabInner(tab: RecordDetailTab) {
  return (
    <>
      {tab.icon}
      {tab.label}
      {tab.count != null && (
        <span className="rounded bg-muted-foreground/15 px-1 text-[11px] tabular-nums leading-tight text-muted-foreground">
          {tab.count}
        </span>
      )}
    </>
  );
}

interface OverflowTabBarProps {
  tabs: Array<RecordDetailTab>;
  value: string;
  onValueChange: (value: string) => void;
  trailing?: ReactNode;
}

/**
 * Tab strip that collapses overflowing tabs into a "+N more" dropdown instead of
 * scrolling. A hidden measurement row reports each tab's natural width; a
 * ResizeObserver recomputes how many fit. The active tab is always surfaced — if
 * it would land in the overflow menu it is pinned as the last visible tab.
 */
function OverflowTabBar({
  tabs, value, onValueChange, trailing
}: OverflowTabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tabs.length);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;

    if (!container || !measure) return;
    const available = container.clientWidth;
    const items = Array.from(measure.children) as Array<HTMLElement>;

    if (items.length === 0) return;
    const widths = items.map(el => el.offsetWidth);
    const totalAll = widths.reduce((sum, w) => sum + w, 0) + TAB_GAP * Math.max(0, widths.length - 1);

    if (totalAll <= available) {
      setVisibleCount(tabs.length);

      return;
    }

    let used = 0;
    let count = 0;

    for (let i = 0; i < widths.length; i += 1) {
      const next = used + (i > 0 ? TAB_GAP : 0) + widths[i];

      if (next + TAB_GAP + MORE_BUTTON_WIDTH <= available) {
        used = next;
        count += 1;
      } else {
        break;
      }
    }

    setVisibleCount(Math.max(1, count));
  }, [tabs.length]);

  useLayoutEffect(() => { recompute(); }, [recompute, value, tabs]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;
    const observer = new ResizeObserver(() => recompute());

    observer.observe(container);

    return () => observer.disconnect();
  }, [recompute]);

  const { visibleTabs, overflowTabs } = useMemo(() => {
    if (visibleCount >= tabs.length) {
      return { visibleTabs: tabs, overflowTabs: [] as Array<RecordDetailTab> };
    }

    let visible = tabs.slice(0, visibleCount);
    let overflow = tabs.slice(visibleCount);

    if (visible.length > 0 && overflow.some(tab => tab.value === value)) {
      const active = tabs.find(tab => tab.value === value);

      if (active) {
        const kept = new Set([...visible.slice(0, -1).map(tab => tab.value), active.value]);

        visible = [...tabs.filter(tab => kept.has(tab.value) && tab.value !== value), active];
        overflow = tabs.filter(tab => !kept.has(tab.value));
      }
    }

    return { visibleTabs: visible, overflowTabs: overflow };
  }, [tabs, visibleCount, value]);

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div ref={containerRef} className="relative min-w-0 flex-1">
        {/* Hidden measurer — natural width of every tab chip (mirrors the real
            TabsTrigger padding so the fit math is accurate). */}
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 flex gap-0.5">
          {tabs.map(tab => (
            <span
              key={tab.value}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2.5 text-[13px] [&_svg]:size-4 [&_svg]:shrink-0">
              {renderTabInner(tab)}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          <TabsList className="gap-0.5">
            {visibleTabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 px-2.5 text-[13px]">
                {renderTabInner(tab)}
              </TabsTrigger>
            ))}
          </TabsList>

          {overflowTabs.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More tabs"
                  className="flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground data-[state=open]:bg-muted/60 data-[state=open]:text-foreground">
                  <MoreHorizontal className="size-4" />
                  <span className="whitespace-nowrap">+{overflowTabs.length} more</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {overflowTabs.map(tab => (
                  <DropdownMenuItem
                    key={tab.value}
                    onClick={() => onValueChange(tab.value)}
                    className={cn('gap-2 [&_svg]:size-4 [&_svg]:shrink-0', tab.value === value && 'bg-muted/60 font-medium text-foreground')}>
                    {tab.icon}
                    <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                    {tab.count != null && (
                      <span className="rounded bg-muted-foreground/15 px-1 text-[11px] tabular-nums leading-tight text-muted-foreground">
                        {tab.count}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {trailing}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export interface RecordDetailLayoutProps {
  isLoading?: boolean;
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  detailFields: Array<RecordDetailField>;
  fieldSlugs: Array<string>;
  record: Record<string, unknown>;
  onInlineSave: (changes: Array<FieldChange>, values: Record<string, unknown>) => void | Promise<void>;
  editTitle?: ReactNode;
  attributeActions?: ReactNode;
  attributeNotice?: ReactNode;
  beforeAttributes?: ReactNode;
  fieldRenderers?: Record<string, RecordFieldRenderer>;
  readOnly?: boolean;
  /** Right-aligned control pinned in the tab bar (e.g. a call button). */
  tabBarTrailing?: ReactNode;
  tabs: Array<RecordDetailTab>;
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export function RecordDetailLayout({
  isLoading, avatar, title, subtitle, onBack, detailFields, fieldSlugs, record,
  onInlineSave, editTitle, attributeActions, attributeNotice, beforeAttributes,
  fieldRenderers, readOnly, tabBarTrailing, tabs, defaultTab, activeTab, onTabChange
}: RecordDetailLayoutProps) {
  const recordVersion = useRecordVersion(record);
  const isWide = useIsWideViewport();

  const [internalTab, setInternalTab] = useState(defaultTab ?? tabs[0]?.value ?? '');
  const currentTab = activeTab ?? internalTab;
  const handleTabChange = useCallback(
    (next: string) => {
      if (activeTab == null) setInternalTab(next);
      onTabChange?.(next);
    },
    [activeTab, onTabChange]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_WIDTH);

  const handleResizeStart = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = containerRef.current
      ? (containerRef.current.querySelector('[data-slot="record-attr-pane"]') as HTMLElement | null)?.offsetWidth ?? PANEL_DEFAULT_WIDTH
      : PANEL_DEFAULT_WIDTH;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMove = (moveEvent: MouseEvent) => {
      const next = startWidth + (moveEvent.clientX - startX);

      setPanelWidth(Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, next)));
    };

    const onUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  if (isLoading) return <RecordDetailLayoutSkeleton />;

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm lg:flex-row">
      {/* Left: attribute pane (resizable width on wide screens) */}
      <div
        data-slot="record-attr-pane"
        className="flex min-h-0 flex-col max-lg:border-b lg:h-full lg:shrink-0"
        style={isWide ? { width: panelWidth } : undefined}>
        <RecordAttributePanel
          avatar={avatar}
          title={title}
          subtitle={subtitle}
          onBack={onBack}
          detailFields={detailFields}
          fieldSlugs={fieldSlugs}
          record={record}
          recordVersion={recordVersion}
          onSave={onInlineSave}
          editTitle={editTitle}
          actions={attributeActions}
          notice={attributeNotice}
          beforeAttributes={beforeAttributes}
          fieldRenderers={fieldRenderers}
          readOnly={readOnly} />
      </div>

      {/* Draggable divider */}
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={handleResizeStart}
        className="group relative z-10 hidden w-px shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/50 lg:block">
        <span className="absolute inset-y-0 -left-1.5 -right-1.5" />
      </div>

      {/* Right: tabs pane */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 flex-col">
          <OverflowTabBar
            tabs={tabs}
            value={currentTab}
            onValueChange={handleTabChange}
            trailing={tabBarTrailing} />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {tabs.map(tab => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className={cn('min-h-0 flex-1', tab.bare ? 'flex-col data-[state=active]:flex' : 'overflow-auto p-4')}>
                {tab.content}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function RecordDetailLayoutSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card/80 shadow-sm lg:flex-row">
      <div className="space-y-3 p-3 max-lg:border-b lg:w-[340px] lg:shrink-0 lg:border-e">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-6 w-full" />)}
      </div>
      <div className="flex-1 space-y-4 p-3">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
