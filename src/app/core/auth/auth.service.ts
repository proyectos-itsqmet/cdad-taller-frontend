import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {LoginBody, LoginResponse} from '../../model/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/auth';

  public readonly currentUser = signal<LoginResponse | null>(null);

  login(credentials: LoginBody): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials, {
      withCredentials: true
    }).pipe(
      tap(res => this.currentUser.set(res))
    );
  }

  validate(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.API_URL}/validate`, {
      withCredentials: true
    }).pipe(
      tap(res => this.currentUser.set(res))
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }
}
