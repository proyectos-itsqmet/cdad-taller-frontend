import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map } from 'rxjs';
import { FilesResponse } from '../../model/interfaces';

export interface UploadInitiateBody {
  folderId: string | null;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  starred: boolean;
}

export interface UploadInitiateResponse {
  fileId: string;
  uploadUrl: string;
}

@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/files';

  initiateUpload(body: UploadInitiateBody): Observable<UploadInitiateResponse> {
    return this.http.post<UploadInitiateResponse>(`${this.API_URL}/upload/initiate`, body, {
      withCredentials: true,
    });
  }

  getFiles(folderId: string | null): Observable<FilesResponse> {
    const params: any = {};
    if (folderId) {
      params.folderId = folderId;
    }
    return this.http.get<FilesResponse>(this.API_URL, {
      params,
      withCredentials: true,
    });
  }

  getDownloadUrl(fileId: string): Observable<{ downloadUrl: string }> {
    return this.http.get<{ downloadUrl: string }>(`${this.API_URL}/${fileId}/download-url`, {
      withCredentials: true,
    });
  }

  downloadFromUrl(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${fileId}`, { withCredentials: true });
  }

  renameFile(fileId: string, newName: string): Observable<void> {
    return this.http.put<void>(
      `${this.API_URL}/${fileId}/rename`,
      { newName },
      { withCredentials: true },
    );
  }

  uploadToMinio(uploadUrl: string, file: File): Observable<void> {
    return this.http.put<void>(uploadUrl, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
  }

  confirmUpload(fileId: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/${fileId}/upload/confirm`,
      {},
      { withCredentials: true },
    );
  }

  uploadFile(file: File, folderId: string | null, starred: boolean): Observable<string> {
    return this.initiateUpload({
      folderId,
      originalName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      starred,
    }).pipe(
      switchMap((res) =>
        this.uploadToMinio(res.uploadUrl, file).pipe(
          switchMap(() => this.confirmUpload(res.fileId)),
          map(() => res.fileId),
        ),
      ),
    );
  }
}
