export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  email: string;
  firstName: string;
  lastName: string;
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
}

export interface File {
  id: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  folderId: string;
  createdAt: Date;
  status: string;
  starred: boolean;
}
