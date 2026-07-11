/**
 * Core domain models for KuboDrive.
 *
 * This is a READ-ONLY functional mockup: every value ultimately comes from
 * static JSON and nothing persists. These types are the single source of
 * truth shared across the whole app.
 */

/** Access level a file can be shared with. */
export type Permission = 'READ' | 'WRITE';

/** How a collection of files/folders is laid out on screen. */
export type ViewMode = 'grid-large' | 'grid-small' | 'list';

/** User-selectable theme preference. `system` follows the OS setting. */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Upload lifecycle state of a backend-tracked file. */
export type FileStatus = 'PENDING' | 'UPLOADED';

/** An account in the system. `u1` is always the fixed current user. */
export interface User {
  id: string;
  email: string;
  name: string;
  /** Hex color used as the background of the user's initials avatar. */
  avatarColor: string;
  createdAt: string;
  /** Total storage the user is allowed to consume, in bytes. */
  storageQuotaBytes: number;
}

/** A folder in a user's drive. Root folders have `parentId === null`. */
export interface Folder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  /** Optional hex accent color for the folder chip/icon. */
  color?: string;
  createdAt: string;
}

/** A stored file. `folderId === null` means it lives at the drive root. */
export interface FileItem {
  id: string;
  folderId: string | null;
  userId: string;
  originalName: string;
  /** Object key in the (mock) MinIO bucket. */
  minioObjectId: string;
  /** Size in bytes. */
  size: number;
  mimeType: string;
  createdAt: string;
  modifiedAt: string;
  starred?: boolean;
  /** Upload state when backed by the real API; absent for mock data. */
  status?: FileStatus;
}

/** A single share of a file from one user to another. */
export interface FileShare {
  id: string;
  fileId: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  permissions: Permission;
  sharedAt: string;
}

/** A synthesized event for the activity feed. */
export interface ActivityEvent {
  id: string;
  kind: 'shared' | 'modified' | 'created';
  at: string;
  fileId?: string;
  folderId?: string;
  actorUserId: string;
  targetUserId?: string;
}
