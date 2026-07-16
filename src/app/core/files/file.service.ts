import { HttpClient, HttpParams, HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map, of, concat, from, throwError, defer } from 'rxjs';
import { filter, catchError, concatMap, retry } from 'rxjs/operators';
import { FilesResponse } from '../../model/interfaces';
import { sliceFile } from '../util/files';

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

export interface MultipartInitiateBody {
  folderId: string | null;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  starred: boolean;
}

export interface PartUploadUrl {
  partNumber: number;
  url: string;
}

export interface MultipartInitiateResponse {
  fileId: string;
  uploadId: string;
  partSizeBytes: number;
  totalParts: number;
  partUrls: PartUploadUrl[];
}

export interface PartEtag {
  partNumber: number;
  etag: string;
}

export interface CompleteMultipartBody {
  uploadId: string;
  parts: PartEtag[];
}

@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/files';

  /**
   * Files smaller than this threshold keep using the fast single-shot presigned upload.
   * Must match the backend default part size (100 MB) for consistent behavior.
   */
  private readonly MULTIPART_THRESHOLD_BYTES = 100 * 1024 * 1024;

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

  downloadFromUrl(url: string): Observable<{ type: 'progress'; percent: number } | { type: 'success'; blob: Blob }> {
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
      filter((x): x is { type: 'progress'; percent: number } | { type: 'success'; blob: Blob } => x !== null)
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

  uploadToMinio(uploadUrl: string, file: File): Observable<{ type: 'progress'; percent: number } | { type: 'done' }> {
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
      filter((x): x is { type: 'progress'; percent: number } | { type: 'done' } => x !== null)
    );
  }

  confirmUpload(fileId: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/${fileId}/upload/confirm`,
      {},
      { withCredentials: true },
    );
  }

  uploadFile(
    file: File,
    folderId: string | null,
    starred: boolean,
  ): Observable<{ type: 'progress'; percent: number } | { type: 'success'; fileId: string }> {
    if (file.size >= this.MULTIPART_THRESHOLD_BYTES) {
      return this.uploadMultipart(file, folderId, starred);
    }
    return this.uploadSingle(file, folderId, starred);
  }

  private uploadSingle(
    file: File,
    folderId: string | null,
    starred: boolean,
  ): Observable<{ type: 'progress'; percent: number } | { type: 'success'; fileId: string }> {
    return this.initiateUpload({
      folderId,
      originalName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      starred,
    }).pipe(
      switchMap(res =>
        this.uploadToMinio(res.uploadUrl, file).pipe(
          switchMap(event => {
            if (event.type === 'progress') {
              return of(event);
            }
            return concat(
              of({ type: 'progress' as const, percent: 100 }),
              this.confirmUpload(res.fileId).pipe(
                map(() => ({ type: 'success' as const, fileId: res.fileId }))
              )
            );
          })
        )
      )
    );
  }

  private initiateMultipartUpload(body: MultipartInitiateBody): Observable<MultipartInitiateResponse> {
    return this.http.post<MultipartInitiateResponse>(`${this.API_URL}/upload/multipart/initiate`, body, {
      withCredentials: true,
    });
  }

  private completeMultipartUpload(fileId: string, body: CompleteMultipartBody): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${fileId}/upload/multipart/complete`, body, {
      withCredentials: true,
    });
  }

  private abortMultipartUpload(fileId: string, uploadId: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${fileId}/upload/multipart/abort`, null, {
      params: { uploadId },
      withCredentials: true,
    });
  }

  private uploadChunk(
    url: string,
    chunk: Blob,
    contentType: string,
  ): Observable<{ type: 'progress'; loaded: number; total: number } | { type: 'done'; etag: string }> {
    return this.http.put(url, chunk, {
      headers: { 'Content-Type': contentType },
      reportProgress: true,
      observe: 'events',
      responseType: 'text',
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progressEvent = event as HttpProgressEvent;
          return {
            type: 'progress' as const,
            loaded: progressEvent.loaded,
            total: progressEvent.total || chunk.size,
          };
        }
        if (event.type === HttpEventType.Response) {
          const response = event as HttpResponse<string>;
          const etag = response.headers.get('ETag') ?? '';
          return { type: 'done' as const, etag };
        }
        return null;
      }),
      filter((x): x is { type: 'progress'; loaded: number; total: number } | { type: 'done'; etag: string } => x !== null)
    );
  }

  private uploadChunkWithRetry(
    url: string,
    chunk: Blob,
    contentType: string,
    retries = 3,
  ): Observable<{ type: 'progress'; loaded: number; total: number } | { type: 'done'; etag: string }> {
    return this.uploadChunk(url, chunk, contentType).pipe(
      retry({ count: retries, delay: 1000 }),
    );
  }

  private uploadMultipart(
    file: File,
    folderId: string | null,
    starred: boolean,
  ): Observable<{ type: 'progress'; percent: number } | { type: 'success'; fileId: string }> {
    console.log('here multipart');
    
    return this.initiateMultipartUpload({
      folderId,
      originalName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      starred,
    }).pipe(
      switchMap(({ fileId, uploadId, partSizeBytes, partUrls }) => {
        const chunks = sliceFile(file, partSizeBytes);
        const etags: PartEtag[] = [];
        let uploadedBytes = 0;

        // Emits real global progress while uploading every chunk sequentially.
        const uploadParts$ = from(partUrls).pipe(
          concatMap((partUrl, index) => {
            const chunk = chunks[index];
            return this.uploadChunkWithRetry(partUrl.url, chunk, file.type || 'application/octet-stream').pipe(
              map(event => {
                if (event.type === 'progress') {
                  const loaded = uploadedBytes + event.loaded;
                  const percent = Math.min(99, Math.round((loaded / file.size) * 100));
                  return { type: 'progress' as const, percent };
                }

                uploadedBytes += chunk.size;
                etags.push({ partNumber: partUrl.partNumber, etag: event.etag });
                const percent = Math.min(99, Math.round((uploadedBytes / file.size) * 100));
                return { type: 'progress' as const, percent };
              })
            );
          }),
        );

        // concat guarantees the complete call is subscribed ONLY after every
        // chunk finished (switchMap here would fire once per progress event).
        return concat(
          uploadParts$,
          of({ type: 'progress' as const, percent: 100 }),
          defer(() => {
            if (etags.some(part => !part.etag)) {
              return throwError(() => new Error(
                'No se pudo leer el ETag de una o mas partes. Revisa que MinIO exponga el header ETag (Access-Control-Expose-Headers).',
              ));
            }
            return this.completeMultipartUpload(fileId, { uploadId, parts: etags }).pipe(
              map(() => ({ type: 'success' as const, fileId }))
            );
          }),
        ).pipe(
          catchError(error =>
            // Best-effort cleanup: never let a failing abort mask the real error.
            this.abortMultipartUpload(fileId, uploadId).pipe(
              catchError(() => of(void 0)),
              switchMap(() => throwError(() => error))
            )
          )
        );
      })
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
