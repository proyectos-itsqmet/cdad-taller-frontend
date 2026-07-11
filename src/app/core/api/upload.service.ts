import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FileApiService } from './file-api.service';

/**
 * Orchestrates the 3-step direct-to-MinIO upload flow: initiate (gets a
 * pre-signed URL) -> raw PUT of the file body to that URL -> confirm.
 *
 * The PUT in step 2 targets MinIO, not the backend, so it must NOT carry
 * credentials — the `apiInterceptor` only adds `withCredentials` to requests
 * whose URL starts with `environment.apiBaseUrl`, so a plain `HttpClient.put`
 * here is already safe by construction.
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly fileApi = inject(FileApiService);

  /** Uploads `file` into `folderId` (`null` for the drive root). */
  async upload(file: File, folderId: string | null): Promise<void> {
    const mimeType = file.type || 'application/octet-stream';

    const { fileId, uploadUrl } = await this.fileApi.initiateUpload({
      folderId,
      originalName: file.name,
      sizeBytes: file.size,
      mimeType,
    });

    await firstValueFrom(
      this.http.put(uploadUrl, file, {
        headers: { 'Content-Type': mimeType },
      }),
    );

    await this.fileApi.confirmUpload(fileId);
  }
}
