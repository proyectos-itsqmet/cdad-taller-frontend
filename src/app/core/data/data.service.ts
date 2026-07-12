import { Injectable, Signal, computed, signal } from '@angular/core';

import {
  ActivityEvent,
  FileItem,
  FileShare,
  Folder,
  User,
} from '../models/models';

import usersJson from './users.json';
import foldersJson from './folders.json';
import filesJson from './files.json';
import sharesJson from './file_shares.json';

/**
 * Static, cast-once snapshots of the mock data. JSON module literals are cast
 * through `unknown` because resolveJsonModule infers overly-wide primitive
 * types (e.g. `string` for the `permissions` union) that don't structurally
 * match the domain models.
 */
const USERS = usersJson as unknown as User[];
const FOLDERS = foldersJson as unknown as Folder[];
const FILES = filesJson as unknown as FileItem[];
const SHARES = sharesJson as unknown as FileShare[];

/** The fixed, always-signed-in user for this read-only mockup. */
const CURRENT_USER_ID = 'u1';

/** Newest-first comparator over an ISO date string selector. */
function byIsoDesc<T>(iso: (item: T) => string) {
  return (a: T, b: T) => new Date(iso(b)).getTime() - new Date(iso(a)).getTime();
}

/**
 * Single source of truth for all KuboDrive data. READ-ONLY: the underlying
 * arrays are loaded once from static JSON and never mutated. Everything is
 * exposed as signals/computed so consumers stay reactive.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly _users = signal<User[]>(USERS);
  private readonly _folders = signal<Folder[]>(FOLDERS);
  private readonly _files = signal<FileItem[]>(FILES);
  private readonly _shares = signal<FileShare[]>(SHARES);

  /** All users in the system. */
  readonly users: Signal<User[]> = this._users.asReadonly();
  /** All folders (across every user). */
  readonly folders: Signal<Folder[]> = this._folders.asReadonly();
  /** All files (across every user). */
  readonly files: Signal<FileItem[]> = this._files.asReadonly();
  /** All file shares (both directions). */
  readonly shares: Signal<FileShare[]> = this._shares.asReadonly();

  /** The fixed current user (`u1`). Falls back to the first user defensively. */
  readonly currentUser: Signal<User> = computed(
    () =>
      this._users().find((u) => u.id === CURRENT_USER_ID) ?? this._users()[0],
  );

  /** Total bytes consumed by the current user's files. */
  readonly storageUsedBytes: Signal<number> = computed(() => {
    const uid = this.currentUser().id;
    return this._files()
      .filter((f) => f.userId === uid)
      .reduce((sum, f) => sum + f.size, 0);
  });

  /** The current user's storage quota, in bytes. */
  readonly storageQuotaBytes: Signal<number> = computed(
    () => this.currentUser().storageQuotaBytes,
  );

  /** Look up a user by id. */
  userById(id: string): User | undefined {
    return this._users().find((u) => u.id === id);
  }

  /** Look up a folder by id. */
  folderById(id: string): Folder | undefined {
    return this._folders().find((f) => f.id === id);
  }

  /**
   * Direct child folders (of the current user) under `parentId`.
   * Pass `null` for the drive root. Sorted alphabetically.
   */
  childFolders(parentId: string | null): Folder[] {
    const uid = this.currentUser().id;
    return this._folders()
      .filter((f) => f.userId === uid && f.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  /**
   * Files (of the current user) directly inside `folderId`.
   * Pass `null` for files at the drive root. Sorted newest-first.
   */
  filesInFolder(folderId: string | null): FileItem[] {
    const uid = this.currentUser().id;
    return this._files()
      .filter((f) => f.userId === uid && f.folderId === folderId)
      .sort(byIsoDesc((f) => f.modifiedAt));
  }

  /**
   * Ancestor chain for `folderId`, ordered root -> ... -> current.
   * Returns an empty array for the root (`null`). Guards against cycles.
   */
  breadcrumb(folderId: string | null): Folder[] {
    const chain: Folder[] = [];
    const seen = new Set<string>();
    let current = folderId ? this.folderById(folderId) : undefined;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      chain.unshift(current);
      current = current.parentId ? this.folderById(current.parentId) : undefined;
    }
    return chain;
  }

  /** Current user's files by `modifiedAt` desc, optionally capped to `limit`. */
  recentFiles(limit?: number): FileItem[] {
    const uid = this.currentUser().id;
    const sorted = this._files()
      .filter((f) => f.userId === uid)
      .sort(byIsoDesc((f) => f.modifiedAt));
    return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
  }

  /** Current user's starred files, newest-first. */
  starredFiles(): FileItem[] {
    const uid = this.currentUser().id;
    return this._files()
      .filter((f) => f.userId === uid && f.starred === true)
      .sort(byIsoDesc((f) => f.modifiedAt));
  }

  /**
   * Files that other users have shared WITH the current user, paired with the
   * originating share and the owner (the user who shared it). Newest share
   * first. Shares whose file no longer exists are skipped.
   */
  sharedWithMe(): { file: FileItem; share: FileShare; owner: User }[] {
    const uid = this.currentUser().id;
    return this._shares()
      .filter((s) => s.sharedWithUserId === uid)
      .sort(byIsoDesc((s) => s.sharedAt))
      .map((share) => {
        const file = this._files().find((f) => f.id === share.fileId);
        const owner = this.userById(share.sharedByUserId);
        return file && owner ? { file, share, owner } : null;
      })
      .filter(
        (row): row is { file: FileItem; share: FileShare; owner: User } =>
          row !== null,
      );
  }

  /**
   * People a given file is shared with, paired with the recipient user.
   * Newest share first. Rows with an unknown recipient are skipped.
   */
  sharesForFile(fileId: string): { share: FileShare; user: User }[] {
    return this._shares()
      .filter((s) => s.fileId === fileId)
      .sort(byIsoDesc((s) => s.sharedAt))
      .map((share) => {
        const user = this.userById(share.sharedWithUserId);
        return user ? { share, user } : null;
      })
      .filter(
        (row): row is { share: FileShare; user: User } => row !== null,
      );
  }

  /**
   * A synthesized, newest-first activity feed combining share events
   * (`kind: 'shared'`) that involve the current user with recent
   * modifications to the current user's files (`kind: 'modified'`).
   */
  activityFeed(): ActivityEvent[] {
    const uid = this.currentUser().id;

    const shareEvents: ActivityEvent[] = this._shares()
      .filter(
        (s) => s.sharedByUserId === uid || s.sharedWithUserId === uid,
      )
      .map((s) => ({
        id: `act-share-${s.id}`,
        kind: 'shared',
        at: s.sharedAt,
        fileId: s.fileId,
        actorUserId: s.sharedByUserId,
        targetUserId: s.sharedWithUserId,
      }));

    const modifiedEvents: ActivityEvent[] = this.recentFiles(12).map((f) => ({
      id: `act-mod-${f.id}`,
      kind: 'modified',
      at: f.modifiedAt,
      fileId: f.id,
      actorUserId: f.userId,
    }));

    return [...shareEvents, ...modifiedEvents].sort(byIsoDesc((e) => e.at));
  }

  addFolder(folder: Folder): void {
    const newFolder = { ...folder, userId: this.currentUser().id };
    this._folders.update(folders => [...folders, newFolder]);
  }

  renameFolder(id: string, newName: string): void {
    this._folders.update(folders =>
      folders.map(f => (f.id === id ? { ...f, name: newName } : f))
    );
  }

  deleteFolder(id: string): void {
    this._folders.update(folders => folders.filter(f => f.id !== id));
  }

  addFile(file: FileItem): void {
    const newFile = { ...file, userId: this.currentUser().id };
    this._files.update(files => [newFile, ...files]);
  }
}
