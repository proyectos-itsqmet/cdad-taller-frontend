import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
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
  lucideLoader2,
  lucideCheckCircle2,
} from '@ng-icons/lucide';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

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
import { FolderDialog } from '../../shared/ui/folder-dialog/folder-dialog';
import { UploadDialog } from '../../shared/ui/upload-dialog/upload-dialog';
import { FolderService } from '../../core/folders/folder.service';
import { FileService } from '../../core/files/file.service';
import { FileMenu } from './file-menu';
import { FolderMenu } from './folder-menu';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { RenameDialog } from '../../shared/ui/rename-dialog/rename-dialog';
import { SortField, SortMenu, SortState } from './sort-menu';
import { FilesResponse } from '../../model/interfaces';

/** localStorage key persisting the chosen view mode. */
const VIEW_KEY = 'kubo-view';
/** Tooltip shown on every action disabled in this read-only mockup. */
const MOCK_TOOLTIP = 'Disponible en la versión completa';

/**
 * Files — the file explorer at `/archivos` and `/archivos/:folderId`.
 *
 * Uses TanStack Query for automatic caching, background refetching,
 * and cache invalidation on mutations (create/rename/delete).
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
    FolderMenu,
    FolderDialog,
    UploadDialog,
    ConfirmDialog,
    RenameDialog,
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
      lucideLoader2,
      lucideCheckCircle2,
    }),
  ],
  templateUrl: './files.html',
})
export class Files {
  protected readonly ds = inject(DataService);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly queryClient = injectQueryClient();

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

  // --- TanStack Query: files data ----------------------------------------
  private readonly folderService = inject(FolderService);
  private readonly fileService = inject(FileService);

  /** The main query: fetches files + folders for the current folderId. */
  protected readonly filesQuery = injectQuery(() => ({
    queryKey: ['files', this.folderId()] as const,
    queryFn: () => lastValueFrom(this.fileService.getFiles(this.folderId())),
    enabled: this.isBrowser,
  }));

  // --- Derived signals from query ----------------------------------------
  private readonly queryData = computed(() => this.filesQuery.data() as FilesResponse | undefined);

  private readonly rawFolders = computed<Folder[]>(() => {
    const data = this.queryData();
    if (!data) return [];
    return data.folders.map(f => ({
      id: f.id,
      userId: '',
      parentId: f.parentId,
      name: f.name,
      createdAt: (f.createdAt as any).toString(),
      starred: f.starred,
      itemsCount: f.itemsCount,
    }));
  });

  private readonly rawFiles = computed<FileItem[]>(() => {
    const data = this.queryData();
    if (!data) return [];
    return data.files.map(f => ({
      id: f.id,
      folderId: f.folderId as string | null,
      userId: '',
      originalName: f.originalName,
      minioObjectId: '',
      size: f.sizeBytes,
      mimeType: f.mimeType,
      createdAt: (f.createdAt as any).toString(),
      modifiedAt: (f.createdAt as any).toString(),
      starred: f.starred,
    }));
  });

  protected readonly currentFolderInfo = computed<Folder | null>(() => {
    const data = this.queryData();
    if (!data?.currentFolder) return null;
    const cf = data.currentFolder;
    return {
      id: cf.id,
      userId: '',
      parentId: cf.parentId,
      name: cf.name,
      createdAt: (cf.createdAt as any).toString(),
      starred: cf.starred,
    };
  });

  /** Ancestor chain for the breadcrumbs. */
  protected readonly crumbs = computed(() => {
    const id = this.folderId();
    if (!id) return [{ id: null, name: 'Mi unidad' } as any];

    const current = this.currentFolderInfo();
    return [
      { id: null, name: 'Mi unidad' } as any,
      { id, name: current ? current.name : 'Carpeta' } as any,
    ];
  });

  /** Heading for the current folder. */
  protected readonly title = computed(() => {
    const id = this.folderId();
    if (!id) return 'Mi unidad';

    const current = this.currentFolderInfo();
    return current ? current.name : 'Carpeta';
  });

  // --- Loading state (from TanStack Query) --------------------------------
  protected readonly loading = computed(() => this.filesQuery.isPending());
  /** Placeholder cells for the grid skeleton while a folder "loads". */
  protected readonly skeletonSlots = Array.from({ length: 12 }, (_, i) => i);

  // --- View mode (persisted) --------------------------------------------
  protected readonly viewMode = signal<ViewMode>('grid-large');
  /** Gate so persistence never overwrites the saved value before it's read. */
  private readonly viewRestored = signal(false);

  // --- Search + sort -----------------------------------------------------
  protected readonly search = signal('');
  private readonly searchTerm = computed(() => this.norm(this.search().trim()));
  protected readonly sort = signal<SortState>({ field: 'name', dir: 'asc' });

  // --- Selection + shared widgets ---------------------------------------
  protected readonly selected = signal<FileItem | null>(null);
  protected readonly detailsOpen = signal(false);
  protected readonly shareOpen = signal(false);
  protected readonly shareItem = signal<{id: string, name: string, type: 'file' | 'folder'} | null>(null);
  protected readonly isSharing = signal(false);
  protected readonly shareError = signal<string | null>(null);
  protected readonly folderDialogOpen = signal(false);
  protected readonly uploadDialogOpen = signal(false);

  protected readonly successModalOpen = signal(false);
  protected readonly successMessage = signal('');

  readonly uploadStatus = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');

  protected readonly downloadStatus = signal<'idle' | 'downloading' | 'success' | 'error'>('idle');
  protected readonly downloadFileName = signal('');
  protected readonly downloadProgress = signal(0);
  protected readonly uploadFileName = signal('');
  protected readonly uploadProgress = signal(0);

  protected readonly deleteConfirmOpen = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly itemToDelete = signal<{ type: 'file' | 'folder'; item: any } | null>(null);

  protected readonly renameDialogOpen = signal(false);
  protected readonly isRenaming = signal(false);
  protected readonly itemToRename = signal<{ type: 'file' | 'folder'; item: any } | null>(null);

  /** Local, visual-only star overrides (this mockup never writes to storage). */
  private readonly starOverrides = signal<Record<string, boolean>>({});

  // --- Filtered + sorted views -------------------------------------------
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

  // --- Cache invalidation helper -----------------------------------------
  /** Invalidates the files query for a specific folder (or all folders). */
  private invalidateFiles(folderId?: string | null): void {
    if (folderId !== undefined) {
      this.queryClient.invalidateQueries({ queryKey: ['files', folderId] });
    } else {
      this.queryClient.invalidateQueries({ queryKey: ['files'] });
    }
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
          cmp = this.folderCount(a) - this.folderCount(b);
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
  protected folderCount(folder: Folder): number {
    return folder.itemsCount || 0;
  }
  /** Humanized item count for a folder tile/cell. */
  protected folderCountLabel(folder: Folder): string {
    const n = folder.itemsCount || 0;
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
    this.shareError.set(null);
    this.shareItem.set({ id: file.id, name: file.originalName, type: 'file' });
    this.shareOpen.set(true);
  }

  protected promptShareFolder(folder: Folder): void {
    this.shareError.set(null);
    this.shareItem.set({ id: folder.id, name: folder.name, type: 'folder' });
    this.shareOpen.set(true);
  }

  protected confirmShare(targetUserEmail: string): void {
    const item = this.shareItem();
    if (!item) return;

    this.isSharing.set(true);
    this.shareError.set(null);

    const shareObs = item.type === 'file'
      ? this.fileService.shareFile(item.id, targetUserEmail)
      : this.fileService.shareFolder(item.id, targetUserEmail);

    shareObs.subscribe({
      next: (res) => {
        this.isSharing.set(false);
        this.shareOpen.set(false);
        this.shareItem.set(null);
        if (res && res.message) {
          this.successMessage.set(res.message);
        } else {
          this.successMessage.set('Compartido exitosamente');
        }
        this.successModalOpen.set(true);
        // Invalidate both files and shared-by-me to ensure updates propagate
        this.queryClient.invalidateQueries({ queryKey: ['shared-by-me'] });
        this.queryClient.invalidateQueries({ queryKey: ['stats'] });
        this.invalidateFiles(this.folderId());
      },
      error: (err) => {
        this.isSharing.set(false);
        if (err.error && err.error.message) {
          this.shareError.set(err.error.message);
        } else {
          this.shareError.set('Error al compartir el elemento. Verifica el correo e intenta de nuevo.');
        }
      }
    });
  }

  protected openNewFolderDialog(): void {
    this.folderDialogOpen.set(true);
  }

  protected onFolderCreated(event: { name: string; starred: boolean }): void {
    const parentId = this.folderId();

    this.folderService.create(event.name, parentId, event.starred).subscribe({
      next: (folder) => {
        this.invalidateFiles(parentId);
        this.queryClient.invalidateQueries({ queryKey: ['stats'] });
        if (event.starred) {
          this.starOverrides.update(m => ({ ...m, [folder.id]: true }));
        }
      },
      error: () => {
        alert('Error al crear la carpeta');
      },
    });
  }

  protected openUploadDialog(): void {
    this.uploadDialogOpen.set(true);
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.uploadStatus() === 'uploading') {
      event.preventDefault();
      event.returnValue = 'El archivo no se ha subido, si sales la carga se cancelará.';
    }
  }

  protected onFileUploaded(event: { file: File; starred: boolean }): void {
    const parentId = this.folderId();

    this.uploadFileName.set(event.file.name);
    this.uploadStatus.set('uploading');
    this.uploadProgress.set(0);

    const progressInterval = setInterval(() => {
      if (this.uploadProgress() < 90) {
        this.uploadProgress.update(p => Math.min(90, p + Math.floor(Math.random() * 15) + 5));
      }
    }, 250);

    this.fileService.uploadFile(event.file, parentId, event.starred).subscribe({
      next: (res) => {
        if (res.type === 'progress') {
          if (res.percent > this.uploadProgress() || res.percent === 100) {
            this.uploadProgress.set(res.percent);
          }
        } else {
          clearInterval(progressInterval);
          this.uploadProgress.set(100);
          this.uploadStatus.set('success');
          setTimeout(() => {
            if (this.uploadStatus() === 'success') this.uploadStatus.set('idle');
          }, 3000);

          this.invalidateFiles(parentId);
          this.queryClient.invalidateQueries({ queryKey: ['stats'] });

          if (event.starred) {
            this.starOverrides.update(m => ({ ...m, [res.fileId]: true }));
          }
        }
      },
      error: () => {
        clearInterval(progressInterval);
        this.uploadStatus.set('error');
        setTimeout(() => {
          if (this.uploadStatus() === 'error') this.uploadStatus.set('idle');
        }, 3000);
      },
    });
  }

  protected downloadSelected(): void {
    const file = this.selected();
    if (file) {
      this.downloadFile(file);
    }
  }

  protected downloadFile(file: FileItem): void {
    this.downloadFileName.set(file.originalName);
    this.downloadStatus.set('downloading');
    this.downloadProgress.set(0);

    const progressInterval = setInterval(() => {
      if (this.downloadProgress() < 90) {
        this.downloadProgress.update(p => Math.min(90, p + Math.floor(Math.random() * 15) + 5));
      }
    }, 250);

    this.fileService.getDownloadUrl(file.id).subscribe({
      next: (res) => {
        this.fileService.downloadFromUrl(res.downloadUrl).subscribe({
          next: (dlRes) => {
            if (dlRes.type === 'progress') {
              if (dlRes.percent > this.downloadProgress() || dlRes.percent === 100) {
                this.downloadProgress.set(dlRes.percent);
              }
            } else {
              clearInterval(progressInterval);
              this.downloadProgress.set(100);
              const url = window.URL.createObjectURL(dlRes.blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.originalName;
              a.click();
              window.URL.revokeObjectURL(url);

              this.downloadStatus.set('success');
              setTimeout(() => {
                if (this.downloadStatus() === 'success') this.downloadStatus.set('idle');
              }, 3000);
            }
          },
          error: () => {
            clearInterval(progressInterval);
            this.downloadStatus.set('error');
            setTimeout(() => {
              if (this.downloadStatus() === 'error') this.downloadStatus.set('idle');
            }, 3000);
          },
        });
      },
      error: () => {
        clearInterval(progressInterval);
        this.downloadStatus.set('error');
        setTimeout(() => {
          if (this.downloadStatus() === 'error') this.downloadStatus.set('idle');
        }, 3000);
      }
    });
  }


  protected promptDeleteFile(file: FileItem): void {
    this.itemToDelete.set({ type: 'file', item: file });
    this.deleteConfirmOpen.set(true);
  }

  protected promptDeleteFolder(folder: Folder): void {
    this.itemToDelete.set({ type: 'folder', item: folder });
    this.deleteConfirmOpen.set(true);
  }

  protected promptDeleteSelected(): void {
    const file = this.selected();
    if (file) {
      this.promptDeleteFile(file);
    }
  }

  protected confirmDelete(): void {
    const toDelete = this.itemToDelete();
    if (!toDelete) return;

    this.isDeleting.set(true);

    if (toDelete.type === 'file') {
      const file = toDelete.item as FileItem;
      this.fileService.deleteFile(file.id).subscribe({
        next: () => {
          this.invalidateFiles(this.folderId());
          this.queryClient.invalidateQueries({ queryKey: ['stats'] });
          this.isDeleting.set(false);
          this.deleteConfirmOpen.set(false);
          if (this.selected()?.id === file.id) {
            this.detailsOpen.set(false);
          }
        },
        error: () => {
          this.isDeleting.set(false);
          this.deleteConfirmOpen.set(false);
          alert('Error al eliminar el archivo');
        },
      });
    } else {
      const folder = toDelete.item as Folder;
      this.folderService.delete(folder.id).subscribe({
        next: () => {
          this.invalidateFiles(this.folderId());
          this.queryClient.invalidateQueries({ queryKey: ['stats'] });
          this.isDeleting.set(false);
          this.deleteConfirmOpen.set(false);
        },
        error: () => {
          this.isDeleting.set(false);
          this.deleteConfirmOpen.set(false);
          alert('Error al eliminar la carpeta');
        },
      });
    }
  }

  protected get deleteConfirmTitle(): string {
    const toDelete = this.itemToDelete();
    if (!toDelete) return '';
    return toDelete.type === 'file' ? 'Eliminar archivo' : 'Eliminar carpeta';
  }

  protected get deleteConfirmMessage(): string {
    const toDelete = this.itemToDelete();
    if (!toDelete) return '';
    const name = toDelete.type === 'file' ? (toDelete.item as FileItem).originalName : (toDelete.item as Folder).name;
    return `¿Estás seguro de que deseas eliminar "${name}"? Esta acción no se puede deshacer y el elemento se perderá permanentemente.`;
  }

  protected promptRenameFile(file: FileItem): void {
    this.itemToRename.set({ type: 'file', item: file });
    this.renameDialogOpen.set(true);
  }

  protected promptRenameFolder(folder: Folder): void {
    this.itemToRename.set({ type: 'folder', item: folder });
    this.renameDialogOpen.set(true);
  }

  protected confirmRename(newName: string): void {
    const toRename = this.itemToRename();
    if (!toRename) return;

    this.isRenaming.set(true);

    if (toRename.type === 'file') {
      const file = toRename.item as FileItem;
      this.fileService.renameFile(file.id, newName).subscribe({
        next: () => {
          this.invalidateFiles(this.folderId());
          this.isRenaming.set(false);
          this.renameDialogOpen.set(false);
        },
        error: () => {
          this.isRenaming.set(false);
          alert('Error al renombrar el archivo');
        },
      });
    } else {
      const folder = toRename.item as Folder;
      this.folderService.rename(folder.id, newName).subscribe({
        next: () => {
          this.invalidateFiles(this.folderId());
          this.isRenaming.set(false);
          this.renameDialogOpen.set(false);
        },
        error: () => {
          this.isRenaming.set(false);
          alert('Error al renombrar la carpeta');
        },
      });
    }
  }

  protected get renameConfirmInitialName(): string {
    const toRename = this.itemToRename();
    if (!toRename) return '';
    return toRename.type === 'file' ? (toRename.item as FileItem).originalName : (toRename.item as Folder).name;
  }
}
