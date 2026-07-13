import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {LoginBody, LoginResponse, RegisterBody, RegisterResponse} from '../../model/interfaces';

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

  register(userData: RegisterBody): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, userData);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => this.currentUser.set(null))
    );
  }
}
