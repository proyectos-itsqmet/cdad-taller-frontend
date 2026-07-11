/**
 * Wire-format DTOs for the Spring Boot backend, plus mappers into the app's
 * domain models (`../models/models`). Keep these shapes in lockstep with the
 * backend contract — they are the only place that should know about JSON
 * field names like `sizeBytes` or `originalName`.
 */

import { FileItem, Folder } from '../models/models';

// ---- Files -----------------------------------------------------------

/** A file as returned by the backend. */
export interface FileResponse {
  id: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  folderId: string | null;
  /** ISO date-time string, no timezone offset. */
  createdAt: string;
  status: 'PENDING' | 'UPLOADED';
}

/** A folder as returned by the backend. */
export interface FolderResponse {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

/** Response body of `GET /api/files`. */
export interface ListContentsResponse {
  folders: FolderResponse[];
  files: FileResponse[];
}

/** Request body of `POST /api/files/upload/initiate`. */
export interface FileInitUploadRequest {
  folderId: string | null;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
}

/** Response body of `POST /api/files/upload/initiate`. */
export interface FileInitUploadResponse {
  fileId: string;
  uploadUrl: string;
}

/** Request body of `POST /api/files/{fileId}/share`. */
export interface FileShareRequest {
  targetUserEmail: string;
}

/** Request body shared by the file and folder rename endpoints. */
export interface RenameRequest {
  newName: string;
}

// ---- Folders -----------------------------------------------------------

/** Request body of `POST /api/folders`. */
export interface FolderRequest {
  name: string;
  parentId: string | null;
}

// ---- Auth -----------------------------------------------------------

/** Request body of `POST /auth/register`. */
export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

/** Request body of `POST /auth/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Response body of `POST /auth/login` and `GET /auth/validate`. */
export interface AuthResponse {
  message: string;
  email: string;
}

/** Request body of `PUT /auth/update-password`. */
export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ---- Mappers -----------------------------------------------------------

/**
 * Maps a `FileResponse` into the app's `FileItem` model. Fields the backend
 * doesn't expose (`userId`, `minioObjectId`, `starred`) are synthesized with
 * safe defaults since nothing in the authenticated layer reads them directly;
 * `modifiedAt` mirrors `createdAt` because the backend has no separate
 * "last modified" timestamp.
 */
export function mapFileResponseToFileItem(dto: FileResponse): FileItem {
  return {
    id: dto.id,
    folderId: dto.folderId,
    userId: '',
    originalName: dto.originalName,
    minioObjectId: '',
    size: dto.sizeBytes,
    mimeType: dto.mimeType,
    createdAt: dto.createdAt,
    modifiedAt: dto.createdAt,
    starred: false,
    status: dto.status,
  };
}

/** Maps a `FolderResponse` into the app's `Folder` model. */
export function mapFolderResponseToFolder(dto: FolderResponse): Folder {
  return {
    id: dto.id,
    userId: '',
    parentId: dto.parentId,
    name: dto.name,
    createdAt: dto.createdAt,
  };
}
