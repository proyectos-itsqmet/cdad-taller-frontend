import { Injectable, computed, inject, signal } from '@angular/core';
import { FileService } from '../files/file.service';
import { injectQueryClient } from '@tanstack/angular-query-experimental';

export interface Transfer {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'downloading' | 'success' | 'error';
  type: 'upload' | 'download';
}

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly fileService = inject(FileService);
  private readonly queryClient = injectQueryClient();

  private readonly _transfers = signal<Transfer[]>([]);
  public readonly transfers = this._transfers.asReadonly();
  
  public readonly activeCount = computed(() => this._transfers().filter(t => t.status === 'uploading' || t.status === 'downloading').length);
  public readonly isPanelOpen = signal<boolean>(false);

  togglePanel() {
    this.isPanelOpen.update(v => !v);
  }

  uploadFile(file: File, folderId: string | null, starred: boolean) {
    const id = Math.random().toString(36).substring(2, 9);
    this._transfers.update(ts => [{ id, name: file.name, progress: 0, status: 'uploading', type: 'upload' }, ...ts]);
    this.isPanelOpen.set(true);
    
    const progressInterval = setInterval(() => {
       this._transfers.update(ts => ts.map(t => {
         if (t.id === id && t.progress < 90) {
           return { ...t, progress: Math.min(90, t.progress + Math.floor(Math.random() * 15) + 5) };
         }
         return t;
       }));
    }, 250);

    this.fileService.uploadFile(file, folderId, starred).subscribe({
      next: (res) => {
        if (res.type === 'progress') {
          this._transfers.update(ts => ts.map(t => {
            if (t.id === id && res.percent > t.progress) {
              return { ...t, progress: res.percent };
            }
            return t;
          }));
        } else {
          clearInterval(progressInterval);
          this._transfers.update(ts => ts.map(t => t.id === id ? { ...t, progress: 100, status: 'success' } : t));
          this.queryClient.invalidateQueries({ queryKey: ['files'] });
          this.queryClient.invalidateQueries({ queryKey: ['stats'] });
          setTimeout(() => this.removeTransfer(id), 5000);
        }
      },
      error: () => {
        clearInterval(progressInterval);
        this._transfers.update(ts => ts.map(t => t.id === id ? { ...t, status: 'error' } : t));
        setTimeout(() => this.removeTransfer(id), 5000);
      }
    });
  }

  downloadFile(file: any) {
    const id = Math.random().toString(36).substring(2, 9);
    this._transfers.update(ts => [{ id, name: file.originalName, progress: 0, status: 'downloading', type: 'download' }, ...ts]);
    this.isPanelOpen.set(true);

    const progressInterval = setInterval(() => {
       this._transfers.update(ts => ts.map(t => {
         if (t.id === id && t.progress < 90) {
           return { ...t, progress: Math.min(90, t.progress + Math.floor(Math.random() * 15) + 5) };
         }
         return t;
       }));
    }, 250);

    this.fileService.getDownloadUrl(file.id).subscribe({
      next: (res) => {
        this.fileService.downloadFromUrl(res.downloadUrl).subscribe({
          next: (dlRes) => {
            if (dlRes.type === 'progress') {
              this._transfers.update(ts => ts.map(t => {
                if (t.id === id && dlRes.percent > t.progress) {
                  return { ...t, progress: dlRes.percent };
                }
                return t;
              }));
            } else {
              clearInterval(progressInterval);
              this._transfers.update(ts => ts.map(t => t.id === id ? { ...t, progress: 100, status: 'success' } : t));
              const url = window.URL.createObjectURL(dlRes.blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.originalName;
              a.click();
              window.URL.revokeObjectURL(url);
              setTimeout(() => this.removeTransfer(id), 5000);
            }
          },
          error: () => {
            clearInterval(progressInterval);
            this._transfers.update(ts => ts.map(t => t.id === id ? { ...t, status: 'error' } : t));
            setTimeout(() => this.removeTransfer(id), 5000);
          }
        });
      },
      error: () => {
        clearInterval(progressInterval);
        this._transfers.update(ts => ts.map(t => t.id === id ? { ...t, status: 'error' } : t));
        setTimeout(() => this.removeTransfer(id), 5000);
      }
    });
  }

  removeTransfer(id: string) {
    this._transfers.update(ts => ts.filter(t => t.id !== id));
  }
  
  clearCompleted() {
    this._transfers.update(ts => ts.filter(t => t.status === 'uploading' || t.status === 'downloading'));
  }
}
