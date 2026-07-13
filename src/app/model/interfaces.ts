export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  message: string;
}

export interface FilesResponse {
  folders: Folder[];
  files: File[];
  currentFolder: Folder | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId: null | string;
  createdAt: Date;
  starred: boolean;
  itemsCount?: number;
}

export interface File {
  id: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  folderId?: string;
  createdAt: Date;
  itemsCount?: number;
  sharedAt?: Date;
  status?: string;
  starred?: boolean;
  sharedByEmail?: string;
  sharedByFirstName?: string;
  sharedByLastName?: string;
  sharedWithEmail?: string;
  sharedWithFirstName?: string;
  sharedWithLastName?: string;
}

export interface PagedResponse<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface History {
  id: string;
  actionType: string;
  itemType: string;
  itemName: string;
  timestamp: Date;
}

export interface Stats {
  starredItems: number;
  totalFiles: number;
  sharedFiles: number;
  usedBytes: number;
}
