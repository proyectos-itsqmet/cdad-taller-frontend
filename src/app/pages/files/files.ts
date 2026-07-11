import { isPlatformBrowser } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideFolder,
  lucidePencil,
  lucidePlus,
  lucideSearch,
  lucideTrash2,
  lucideUpload,
  lucideX,
} from '@ng-icons/lucide';

import { FileApiService } from '../../core/api/file-api.service';
import { FolderApiService } from '../../core/api/folder-api.service';
import { UploadService } from '../../core/api/upload.service';
import {
  ListContentsResponse,
  mapFileResponseToFileItem,
  mapFolderResponseToFolder,
} from '../../core/api/dto';
import { FileItem, Folder, ViewMode } from '../../core/models/models';
import { formatBytes, friendlyType, relativeTime } from '../../core/util/format';
import { environment } from '../../../environments/environment';
import { Breadcrumbs } from '../../shared/ui/breadcrumbs/breadcrumbs';
import { DetailsPane } from '../../shared/ui/details-pane/details-pane';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { FileIcon } from '../../shared/ui/file-icon/file-icon';
import { ShareDialog } from '../../shared/ui/share-dialog/share-dialog';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { ViewSwitcher } from '../../shared/ui/view-switcher/view-switcher';
import { FileMenu } from './file-menu';
import { SortField, SortMenu, SortState } from './sort-menu';

/** localStorage key persisting the chosen view mode. */
const VIEW_KEY = 'kubo-view';

/**
 * Files — the file explorer at `/archivos` and `/archivos/:folderId`.
 *
 * Loads the current folder's contents from the real backend via
 * `httpResource` (idle/no-op during SSR — the server has no session cookie
 * to call the API with). Renders folders then files, honoring an in-page
 * search, a sort menu and a persisted view mode (grid-large / grid-small /
 * list). Selecting a file opens the shared details pane; the kebab
 * "Compartir" opens the shared share dialog.
 *
 * Deviation from the mockup: the backend exposes no "get folder by id" or
 * folder-ancestry endpoint, so the page title and breadcrumbs cannot be
 * reconstructed once navigated into a subfolder — they're static
 * ("Mi unidad"). Per-folder item counts (shown as a subtitle/size column in
 * the mockup) are dropped for the same reason: listing a folder's contents
 * only returns its direct children, not their descendant counts.
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
      lucideFolder,
      lucideChevronDown,
      lucidePencil,
      lucideTrash2,
    }),
  ],
  templateUrl: './files.html',
})
export class Files {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly route = inject(ActivatedRoute);
  private readonly fileApi = inject(FileApiService);
  private readonly folderApi = inject(FolderApiService);
  private readonly uploadService = inject(UploadService);

  /** Formatters surfaced to the template (never render raw data). */
  protected readonly formatBytes = formatBytes;
  protected readonly friendlyType = friendlyType;
  protected readonly relativeTime = relativeTime;

  // --- Route → current folder -------------------------------------------
  private readonly paramMap = toSignal(this.route.paramMap);
  /** Current folder id; `undefined` at the drive root ("Mi unidad"). */
  protected readonly folderId = computed(
    () => this.paramMap()?.get('folderId') ?? undefined,
  );
  /** Static: the backend has no folder-ancestry endpoint to rebuild a real trail. */
  protected readonly crumbs: Folder[] = [];
  /** Heading for the current folder (see class-level deviation note). */
  protected readonly title = computed(() =>
    this.folderId() ? 'Carpeta' : 'Mi unidad',
  );

  // --- Data load -----------------------------------------------------------
  protected readonly contents = httpResource<ListContentsResponse>(() => {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    const id = this.folderId();
    const params: Record<string, string> = id ? { folderId: id } : {};
    return { url: `${environment.apiBaseUrl}/api/files`, params };
  });

  private readonly rawFolders = computed<Folder[]>(() =>
    (this.contents.value()?.folders ?? []).map(mapFolderResponseToFolder),
  );
  private readonly rawFiles = computed<FileItem[]>(() =>
    (this.contents.value()?.files ?? []).map(mapFileResponseToFileItem),
  );

  // --- View mode (persisted) --------------------------------------------
  protected readonly viewMode = signal<ViewMode>('grid-large');
  /** Gate so persistence never overwrites the saved value before it's read. */
  private readonly viewRestored = signal(false);

  // --- Search + sort -----------------------------------------------------
  protected readonly search = signal('');
  private readonly searchTerm = computed(() => this.norm(this.search().trim()));
  protected readonly sort = signal<SortState>({ field: 'name', dir: 'asc' });

  protected readonly loading = computed(() => this.contents.isLoading());
  /** Placeholder cells for the grid skeleton while a folder loads. */
  protected readonly skeletonSlots = Array.from({ length: 12 }, (_, i) => i);

  // --- Selection + shared widgets ---------------------------------------
  protected readonly selected = signal<FileItem | null>(null);
  protected readonly detailsOpen = signal(false);
  protected readonly shareOpen = signal(false);

  // --- Upload --------------------------------------------------------------
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // --- Derived listings --------------------------------------------------
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
        default:
          // No backend support for folder size (item count) or type — falls
          // through to the name tie-break below.
          cmp = 0;
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
  /** The details pane deleted its own file; reload and clear the selection. */
  protected onFileDeleted(file: FileItem): void {
    this.contents.reload();
    if (this.selected()?.id === file.id) {
      this.selected.set(null);
    }
  }

  // --- Upload / new folder -------------------------------------------------
  protected triggerUpload(): void {
    if (!this.isBrowser) return;
    this.fileInputRef()?.nativeElement.click();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await this.runMutation(
      () => this.uploadService.upload(file, this.folderId() ?? null),
      'No se pudo subir el archivo.',
    );
  }

  protected async createFolder(): Promise<void> {
    if (!this.isBrowser) return;
    const name = window.prompt('Nombre de la nueva carpeta');
    if (!name?.trim()) return;
    await this.runMutation(
      () => this.folderApi.create(name.trim(), this.folderId() ?? null),
      'No se pudo crear la carpeta.',
    );
  }

  // --- File actions --------------------------------------------------------
  protected async downloadFile(file: FileItem): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const url = await this.fileApi.getDownloadUrl(file.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.alert('No se pudo descargar el archivo.');
    }
  }

  protected async renameFile(file: FileItem): Promise<void> {
    if (!this.isBrowser) return;
    const newName = window.prompt('Nuevo nombre', file.originalName);
    if (!newName?.trim() || newName.trim() === file.originalName) return;
    await this.runMutation(
      () => this.fileApi.rename(file.id, newName.trim()),
      'No se pudo renombrar el archivo.',
    );
  }

  protected async deleteFile(file: FileItem): Promise<void> {
    if (!this.isBrowser) return;
    if (!window.confirm(`¿Eliminar "${file.originalName}"?`)) return;
    const ok = await this.runMutation(
      () => this.fileApi.remove(file.id),
      'No se pudo eliminar el archivo.',
    );
    if (ok && this.selected()?.id === file.id) {
      this.clearSelection();
    }
  }

  // --- Folder actions --------------------------------------------------------
  protected async renameFolder(folder: Folder, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isBrowser) return;
    const newName = window.prompt('Nuevo nombre de la carpeta', folder.name);
    if (!newName?.trim() || newName.trim() === folder.name) return;
    await this.runMutation(
      () => this.folderApi.rename(folder.id, newName.trim()),
      'No se pudo renombrar la carpeta.',
    );
  }

  protected async deleteFolder(folder: Folder, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isBrowser) return;
    if (!window.confirm(`¿Eliminar la carpeta "${folder.name}" y todo su contenido?`)) return;
    const ok = await this.runMutation(
      () => this.folderApi.remove(folder.id),
      'No se pudo eliminar la carpeta.',
    );
    // The deleted folder may have contained the selected file (cascade delete),
    // so drop any stale selection to avoid a dangling details/share pane.
    if (ok) this.clearSelection();
  }

  /**
   * Runs a backend mutation, reloading the listing on success and surfacing a
   * message on failure. Returns whether it succeeded so callers can react.
   */
  private async runMutation(action: () => Promise<unknown>, errorMessage: string): Promise<boolean> {
    try {
      await action();
      this.contents.reload();
      return true;
    } catch {
      if (this.isBrowser) window.alert(errorMessage);
      return false;
    }
  }

  private clearSelection(): void {
    this.selected.set(null);
    this.detailsOpen.set(false);
    this.shareOpen.set(false);
  }
}
