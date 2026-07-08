import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideFolder,
  lucidePlus,
  lucideSearch,
  lucideShare2,
  lucideStar,
  lucideUpload,
  lucideX,
} from '@ng-icons/lucide';

import { DataService } from '../../core/data/data.service';
import { FileItem, Folder, User, ViewMode } from '../../core/models/models';
import { formatBytes, friendlyType, relativeTime } from '../../core/util/format';
import { Breadcrumbs } from '../../shared/ui/breadcrumbs/breadcrumbs';
import { DetailsPane } from '../../shared/ui/details-pane/details-pane';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { ShareDialog } from '../../shared/ui/share-dialog/share-dialog';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { UserAvatar } from '../../shared/ui/user-avatar/user-avatar';
import { ViewSwitcher } from '../../shared/ui/view-switcher/view-switcher';
import { FileMenu } from './file-menu';
import { SortField, SortMenu, SortState } from './sort-menu';

/** localStorage key persisting the chosen view mode. */
const VIEW_KEY = 'kubo-view';
/** Tooltip shown on every action disabled in this read-only mockup. */
const MOCK_TOOLTIP = 'Disponible en la versión completa';

/**
 * Files — the file explorer at `/archivos` and `/archivos/:folderId`.
 *
 * Renders the current user's folders then files, honoring an in-page search,
 * a sort menu and a persisted view mode (grid-large / grid-small / list).
 * Selecting a file opens the shared details pane; the kebab "Compartir" opens
 * the shared share dialog. Read-only: upload / new-folder / write actions are
 * disabled mocks. SSR/zoneless-safe: every browser API is guarded.
 */
@Component({
  selector: 'kubo-files',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgIcon,
    Breadcrumbs,
    ViewSwitcher,
    FileIcon,
    UserAvatar,
    EmptyState,
    Skeleton,
    DetailsPane,
    ShareDialog,
    SortMenu,
    FileMenu,
  ],
  providers: [
    provideIcons({
      lucideUpload,
      lucidePlus,
      lucideSearch,
      lucideX,
      lucideStar,
      lucideShare2,
      lucideFolder,
      lucideChevronDown,
    }),
  ],
  templateUrl: './files.html',
})
export class Files {
  protected readonly ds = inject(DataService);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Formatters surfaced to the template (never render raw data). */
  protected readonly formatBytes = formatBytes;
  protected readonly friendlyType = friendlyType;
  protected readonly relativeTime = relativeTime;
  protected readonly mockTooltip = MOCK_TOOLTIP;

  // --- Route → current folder -------------------------------------------
  private readonly paramMap = toSignal(this.route.paramMap);
  /** Current folder id; `null` at the drive root ("Mi unidad"). */
  protected readonly folderId = computed(
    () => this.paramMap()?.get('folderId') ?? null,
  );
  /** Ancestor chain for the breadcrumbs. */
  protected readonly crumbs = computed(() => this.ds.breadcrumb(this.folderId()));
  /** Heading for the current folder. */
  protected readonly title = computed(() => {
    const id = this.folderId();
    return id ? (this.ds.folderById(id)?.name ?? 'Mi unidad') : 'Mi unidad';
  });

  // --- View mode (persisted) --------------------------------------------
  protected readonly viewMode = signal<ViewMode>('grid-large');
  /** Gate so persistence never overwrites the saved value before it's read. */
  private readonly viewRestored = signal(false);

  // --- Search + sort -----------------------------------------------------
  protected readonly search = signal('');
  private readonly searchTerm = computed(() => this.norm(this.search().trim()));
  protected readonly sort = signal<SortState>({ field: 'name', dir: 'asc' });

  // --- Simulated load ----------------------------------------------------
  protected readonly loading = signal(false);
  /** Placeholder cells for the grid skeleton while a folder "loads". */
  protected readonly skeletonSlots = Array.from({ length: 12 }, (_, i) => i);

  // --- Selection + shared widgets ---------------------------------------
  protected readonly selected = signal<FileItem | null>(null);
  protected readonly detailsOpen = signal(false);
  protected readonly shareOpen = signal(false);

  /** Local, visual-only star overrides (this mockup never writes to storage). */
  private readonly starOverrides = signal<Record<string, boolean>>({});

  // --- Derived listings --------------------------------------------------
  private readonly rawFolders = computed(() =>
    this.ds.childFolders(this.folderId()),
  );
  private readonly rawFiles = computed(() =>
    this.ds.filesInFolder(this.folderId()),
  );

  protected readonly visibleFolders = computed<Folder[]>(() => {
    const term = this.searchTerm();
    let list = this.rawFolders();
    if (term) list = list.filter((f) => this.norm(f.name).includes(term));
    return this.sortFolders(list, this.sort());
  });

  protected readonly visibleFiles = computed<FileItem[]>(() => {
    const term = this.searchTerm();
    let list = this.rawFiles();
    if (term) list = list.filter((f) => this.norm(f.originalName).includes(term));
    return this.sortFiles(list, this.sort());
  });

  /** Whether the current folder holds anything at all (ignoring search). */
  protected readonly hasAnyItems = computed(
    () => this.rawFolders().length + this.rawFiles().length > 0,
  );
  /** Whether the active search hid everything. */
  protected readonly noMatches = computed(
    () =>
      !!this.searchTerm() &&
      this.visibleFolders().length + this.visibleFiles().length === 0,
  );
  protected readonly totalCount = computed(
    () => this.rawFolders().length + this.rawFiles().length,
  );

  constructor() {
    // Restore the persisted view mode (browser only), then open the gate.
    afterNextRender(() => {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === 'grid-large' || saved === 'grid-small' || saved === 'list') {
        this.viewMode.set(saved);
      }
      this.viewRestored.set(true);
    });

    // Persist view mode on change — only after the saved value was read back,
    // so the default never clobbers a previously stored preference.
    effect(() => {
      const mode = this.viewMode();
      if (this.isBrowser && this.viewRestored()) {
        localStorage.setItem(VIEW_KEY, mode);
      }
    });

    // Brief simulated load whenever the folder changes (browser only, so the
    // prerendered HTML shows real content and hydration sees no skeleton).
    effect((onCleanup) => {
      this.folderId(); // track navigation
      if (!this.isBrowser) return;
      this.loading.set(true);
      const t = setTimeout(() => this.loading.set(false), 320);
      onCleanup(() => clearTimeout(t));
    });
  }

  // --- Search helpers ----------------------------------------------------
  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
  protected clearSearch(): void {
    this.search.set('');
  }
  /** Diacritic-insensitive, lower-cased normalization for name matching. */
  private norm(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  // --- Sort helpers ------------------------------------------------------
  /** Table-header click: toggle direction if already active, else set field. */
  protected sortBy(field: SortField): void {
    const current = this.sort();
    if (current.field === field) {
      this.sort.set({ field, dir: current.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      const dir = field === 'name' || field === 'type' ? 'asc' : 'desc';
      this.sort.set({ field, dir });
    }
  }
  /** aria-sort value for a sortable column header. */
  protected ariaSort(field: SortField): 'ascending' | 'descending' | 'none' {
    const s = this.sort();
    if (s.field !== field) return 'none';
    return s.dir === 'asc' ? 'ascending' : 'descending';
  }

  private sortFolders(list: Folder[], s: SortState): Folder[] {
    const mul = s.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      let cmp: number;
      switch (s.field) {
        case 'modified':
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          cmp = this.folderCount(a.id) - this.folderCount(b.id);
          break;
        default:
          cmp = a.name.localeCompare(b.name, 'es');
      }
      if (cmp === 0) cmp = a.name.localeCompare(b.name, 'es');
      return cmp * mul;
    });
  }

  private sortFiles(list: FileItem[], s: SortState): FileItem[] {
    const mul = s.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      let cmp: number;
      switch (s.field) {
        case 'modified':
          cmp =
            new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
          break;
        case 'size':
          cmp = a.size - b.size;
          break;
        case 'type':
          cmp = friendlyType(a.mimeType).localeCompare(
            friendlyType(b.mimeType),
            'es',
          );
          break;
        default:
          cmp = a.originalName.localeCompare(b.originalName, 'es');
      }
      if (cmp === 0) cmp = a.originalName.localeCompare(b.originalName, 'es');
      return cmp * mul;
    });
  }

  // --- Per-item helpers --------------------------------------------------
  /** Direct child count (subfolders + files) of a folder. */
  protected folderCount(id: string): number {
    return this.ds.childFolders(id).length + this.ds.filesInFolder(id).length;
  }
  /** Humanized item count for a folder tile/cell. */
  protected folderCountLabel(id: string): string {
    const n = this.folderCount(id);
    if (n === 0) return 'Vacía';
    return n === 1 ? '1 elemento' : `${n} elementos`;
  }

  protected owner(file: FileItem): User | undefined {
    return this.ds.userById(file.userId);
  }
  protected isMine(file: FileItem): boolean {
    return file.userId === this.ds.currentUser().id;
  }

  protected shareCount(file: FileItem): number {
    return this.ds.sharesForFile(file.id).length;
  }
  protected isShared(file: FileItem): boolean {
    return this.shareCount(file) > 0;
  }
  protected shareLabel(file: FileItem): string {
    const n = this.shareCount(file);
    return n === 1 ? 'Compartido con 1 persona' : `Compartido con ${n} personas`;
  }

  protected isStarred(file: FileItem): boolean {
    const override = this.starOverrides()[file.id];
    return override ?? !!file.starred;
  }
  protected toggleStar(file: FileItem, event: Event): void {
    event.stopPropagation();
    const next = !this.isStarred(file);
    this.starOverrides.update((m) => ({ ...m, [file.id]: next }));
  }

  /** Absolute, human date used in `title=` tooltips. */
  protected absoluteDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  // --- Selection actions -------------------------------------------------
  protected openDetails(file: FileItem): void {
    this.selected.set(file);
    this.detailsOpen.set(true);
  }
  protected openShare(file: FileItem): void {
    this.selected.set(file);
    this.shareOpen.set(true);
  }
}
