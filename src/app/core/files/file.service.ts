import { HttpClient, HttpParams, HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map, of, concat } from 'rxjs';
import { filter } from 'rxjs/operators';
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

  getFiles(folderId: string | null, starred?: boolean): Observable<FilesResponse> {
    const params: any = {};
    if (folderId) {
      params.folderId = folderId;
    }
    if (starred !== undefined) {
      params.starred = starred;
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

  downloadFromUrl(url: string): Observable<{ type: 'progress', percent: number } | { type: 'success', blob: Blob }> {
    return this.http.get(url, { responseType: 'blob', reportProgress: true, observe: 'events' }).pipe(
      switchMap(event => {
        if (event.type === HttpEventType.DownloadProgress) {
          const progressEvent = event as HttpProgressEvent;
          let pct = 0;
          if (progressEvent.total) {
            pct = Math.round(100 * progressEvent.loaded / progressEvent.total);
          } else {
            pct = Math.min(95, Math.round((progressEvent.loaded / (1024 * 1024)) * 10));
          }
          return of({ type: 'progress' as const, percent: pct });
        }
        if (event.type === HttpEventType.Response) {
          const responseEvent = event as HttpResponse<Blob>;
          return concat(
            of({ type: 'progress' as const, percent: 100 }),
            of({ type: 'success' as const, blob: responseEvent.body! })
          );
        }
        return of(null);
      }),
      filter((x): x is { type: 'progress', percent: number } | { type: 'success', blob: Blob } => x !== null)
    );
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

  shareFile(fileId: string, targetUserEmail: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/${fileId}/share`,
      { targetUserEmail },
      { withCredentials: true },
    );
  }

  unshareFile(fileId: string, targetUserEmail: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API_URL}/${fileId}/share`,
      { params: { targetUserEmail }, withCredentials: true },
    );
  }

  shareFolder(folderId: string, targetUserEmail: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `http://localhost:8080/api/folders/${folderId}/share`,
      { targetUserEmail },
      { withCredentials: true },
    );
  }

  unshareFolder(folderId: string, targetUserEmail: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `http://localhost:8080/api/folders/${folderId}/share`,
      { params: { targetUserEmail }, withCredentials: true },
    );
  }

  getSharedWithMe(): Observable<FilesResponse> {
    return this.http.get<FilesResponse>(`${this.API_URL}/shared`, {
      withCredentials: true,
    });
  }

  getSharedByMe(): Observable<FilesResponse> {
    return this.http.get<FilesResponse>(`${this.API_URL}/shared-by-me`, {
      withCredentials: true,
    });
  }

  uploadToMinio(uploadUrl: string, file: File): Observable<{type: 'progress', percent: number} | {type: 'done'}> {
    return this.http.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progressEvent = event as HttpProgressEvent;
          const total = progressEvent.total || file.size || 1;
          const pct = Math.min(99, Math.round(100 * progressEvent.loaded / total));
          return { type: 'progress', percent: pct };
        }
        if (event.type === HttpEventType.Response) {
          return { type: 'done' };
        }
        return null;
      }),
      filter((x): x is {type: 'progress', percent: number} | {type: 'done'} => x !== null)
    );
  }

  confirmUpload(fileId: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/${fileId}/upload/confirm`,
      {},
      { withCredentials: true },
    );
  }

  uploadFile(file: File, folderId: string | null, starred: boolean): Observable<{type: 'progress', percent: number} | {type: 'success', fileId: string}> {
    return this.initiateUpload({
      folderId,
      originalName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      starred,
    }).pipe(
      switchMap((res) =>
        this.uploadToMinio(res.uploadUrl, file).pipe(
          switchMap(event => {
            if (event.type === 'progress') {
              return of(event);
            } else {
              return concat(
                of({ type: 'progress' as const, percent: 100 }),
                this.confirmUpload(res.fileId).pipe(
                  map(() => ({ type: 'success' as const, fileId: res.fileId }))
                )
              );
            }
          })
        )
      )
    );
  }

  getHistory(params: any): Observable<import('../../model/interfaces').PagedResponse<import('../../model/interfaces').History>> {
    const httpParams: any = {};
    if (params.actionType) httpParams.actionType = params.actionType;
    if (params.itemName) httpParams.itemName = params.itemName;
    if (params.startDate) httpParams.startDate = params.startDate;
    if (params.endDate) httpParams.endDate = params.endDate;
    if (params.page !== undefined) httpParams.page = params.page;
    if (params.size !== undefined) httpParams.size = params.size;

    return this.http.get<import('../../model/interfaces').PagedResponse<import('../../model/interfaces').History>>('http://localhost:8080/api/history', {
      params: httpParams,
      withCredentials: true,
    });
  }

  getStats(): Observable<import('../../model/interfaces').Stats> {
    return this.http.get<import('../../model/interfaces').Stats>(`${this.API_URL}/stats`, {
      withCredentials: true,
    });
  }
}
