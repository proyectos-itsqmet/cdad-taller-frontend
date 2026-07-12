import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Folder } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/folders';

  create(name: string, parentId: string | null, starred: boolean): Observable<Folder> {
    return this.http.post<Folder>(this.API_URL, { name, parentId, starred }, {
      withCredentials: true
    });
  }

  rename(folderId: string, newName: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${folderId}/rename`, { newName }, {
      withCredentials: true
    });
  }

  delete(folderId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${folderId}`, {
      withCredentials: true
    });
  }
}
