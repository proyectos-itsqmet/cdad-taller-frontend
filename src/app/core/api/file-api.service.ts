import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  FileInitUploadRequest,
  FileInitUploadResponse,
  FileShareRequest,
  ListContentsResponse,
  RenameRequest,
} from './dto';

/** Thin wrapper over the backend's `/api/files` endpoints. */
@Injectable({ providedIn: 'root' })
export class FileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/files`;

  /** Lists the folders and files directly inside `folderId` (root when omitted/null). */
  async listContents(folderId?: string | null): Promise<ListContentsResponse> {
    let params = new HttpParams();
    if (folderId) params = params.set('folderId', folderId);
    return firstValueFrom(
      this.http.get<ListContentsResponse>(this.baseUrl, { params }),
    );
  }

  /** Step 1 of the upload flow: registers the upload and gets a pre-signed PUT URL. */
  async initiateUpload(
    req: FileInitUploadRequest,
  ): Promise<FileInitUploadResponse> {
    return firstValueFrom(
      this.http.post<FileInitUploadResponse>(
        `${this.baseUrl}/upload/initiate`,
        req,
      ),
    );
  }

  /** Step 3 of the upload flow: flips the file from PENDING to UPLOADED. */
  async confirmUpload(fileId: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${this.baseUrl}/${fileId}/upload/confirm`, {}),
    );
  }

  /** Gets a pre-signed, time-limited URL to download the file's content. */
  async getDownloadUrl(fileId: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.get<{ downloadUrl: string }>(
        `${this.baseUrl}/${fileId}/download-url`,
      ),
    );
    return response.downloadUrl;
  }

  /** Shares the file (read access) with another user by email. */
  async share(fileId: string, targetUserEmail: string): Promise<void> {
    const req: FileShareRequest = { targetUserEmail };
    await firstValueFrom(this.http.post<void>(`${this.baseUrl}/${fileId}/share`, req));
  }

  /** Renames the file. */
  async rename(fileId: string, newName: string): Promise<void> {
    const req: RenameRequest = { newName };
    await firstValueFrom(
      this.http.put<void>(`${this.baseUrl}/${fileId}/rename`, req),
    );
  }

  /** Deletes the file. */
  async remove(fileId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${fileId}`));
  }
}
