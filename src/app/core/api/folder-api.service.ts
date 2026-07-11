import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FolderRequest, FolderResponse, RenameRequest } from './dto';

/** Thin wrapper over the backend's `/api/folders` endpoints. */
@Injectable({ providedIn: 'root' })
export class FolderApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/folders`;

  /** Creates a new folder, optionally nested under `parentId`. */
  async create(name: string, parentId: string | null): Promise<FolderResponse> {
    const req: FolderRequest = { name, parentId };
    return firstValueFrom(this.http.post<FolderResponse>(this.baseUrl, req));
  }

  /** Renames the folder. */
  async rename(folderId: string, newName: string): Promise<void> {
    const req: RenameRequest = { newName };
    await firstValueFrom(
      this.http.put<void>(`${this.baseUrl}/${folderId}/rename`, req),
    );
  }

  /** Deletes the folder. */
  async remove(folderId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${folderId}`));
  }
}
