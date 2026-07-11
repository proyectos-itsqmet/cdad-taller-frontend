import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdatePasswordRequest,
} from '../api/dto';
import { User } from '../models/models';

/** Palette the deterministic avatar-color hash picks from. */
const AVATAR_COLORS = [
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#f59e0b',
];

/** Small, stable string hash (djb2) used to pick a deterministic avatar color. */
function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Session/auth state for the real backend. The backend issues an HttpOnly
 * `jwt` cookie on login — this service never sees or stores the token
 * itself, only the authenticated user's email, which the backend echoes
 * back on login/validate.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Email of the currently authenticated user, or `null` when signed out. */
  readonly currentEmail = signal<string | null>(null);
  /** Whether a user is currently authenticated. */
  readonly isAuthenticated = computed(() => this.currentEmail() !== null);

  /**
   * The current user, synthesized from `currentEmail` since the backend only
   * exposes the email on auth responses. `name` is the email's local part;
   * `avatarColor` is a deterministic hash of the email so it stays stable
   * across sessions.
   */
  readonly currentUser = computed<User | null>(() => {
    const email = this.currentEmail();
    if (!email) return null;
    const localPart = email.split('@')[0] ?? email;
    return {
      id: email,
      email,
      name: localPart,
      avatarColor: AVATAR_COLORS[hashString(email) % AVATAR_COLORS.length],
      createdAt: '',
      storageQuotaBytes: 0,
    };
  });

  /** Registers a new account. Does not authenticate the caller. */
  async register(req: RegisterRequest): Promise<User> {
    return firstValueFrom(
      this.http.post<User>(`${this.baseUrl}/auth/register`, req),
    );
  }

  /** Logs in and, on success, stores the authenticated email. */
  async login(email: string, password: string): Promise<AuthResponse> {
    const req: LoginRequest = { email, password };
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, req),
    );
    this.currentEmail.set(response.email);
    return response;
  }

  /**
   * Asks the backend whether the current `jwt` cookie is valid. Updates
   * `currentEmail` accordingly and returns whether the session is valid.
   * Only meaningful in the browser (the server has no cookie to send on its
   * own outgoing requests during SSR).
   */
  async validate(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;
    try {
      const response = await firstValueFrom(
        this.http.get<AuthResponse>(`${this.baseUrl}/auth/validate`),
      );
      this.currentEmail.set(response.email);
      return true;
    } catch {
      this.currentEmail.set(null);
      return false;
    }
  }

  /** Logs out (clears the backend cookie) and clears local session state. */
  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.baseUrl}/auth/logout`, {}));
    this.currentEmail.set(null);
  }

  /** Changes the current user's password. */
  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    const req: UpdatePasswordRequest = { oldPassword, newPassword };
    await firstValueFrom(
      this.http.put<void>(`${this.baseUrl}/auth/update-password`, req),
    );
  }
}
