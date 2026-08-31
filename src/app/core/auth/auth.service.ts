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

/** Role name that unlocks cross-user views. */
const ADMIN_ROLE = 'ROLE_ADMIN';

/** Identity the backend echoes back on login/validate. */
interface Profile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
}

/**
 * Session/auth state for the real backend. The backend issues an HttpOnly
 * `jwt` cookie on login — this service never sees or stores the token itself,
 * only the identity fields the backend echoes back on login/validate.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Everything we know about the signed-in user; `null` when signed out. */
  private readonly profile = signal<Profile | null>(null);

  /** Email of the currently authenticated user, or `null` when signed out. */
  readonly currentEmail = computed(() => this.profile()?.email ?? null);
  /** Whether a user is currently authenticated. */
  readonly isAuthenticated = computed(() => this.currentEmail() !== null);

  /**
   * Whether the session carries ROLE_ADMIN. A UI affordance only: it decides
   * what to *offer* (the cross-user analytics scope), never what to allow. The
   * authoritative check happens server-side against the JWT's `authorities`
   * claim — in the backend, and again in kubo-analytics.
   */
  readonly isAdmin = computed(() => this.profile()?.role === ADMIN_ROLE);

  /**
   * The current user as the app's domain model. `name` prefers the real
   * first/last name the backend sends and falls back to the email's local part
   * for responses that carry no name; `avatarColor` is a deterministic hash of
   * the email so it stays stable across sessions.
   */
  readonly currentUser = computed<User | null>(() => {
    const profile = this.profile();
    if (!profile) return null;

    const fullName = [profile.firstName, profile.lastName]
      .filter((part): part is string => !!part && part.trim() !== '')
      .join(' ');

    return {
      id: profile.email,
      email: profile.email,
      name: fullName || (profile.email.split('@')[0] ?? profile.email),
      avatarColor: AVATAR_COLORS[hashString(profile.email) % AVATAR_COLORS.length],
      createdAt: '',
      storageQuotaBytes: 0,
      role: profile.role ?? undefined,
    };
  });

  /** Registers a new account. Does not authenticate the caller. */
  async register(req: RegisterRequest): Promise<User> {
    return firstValueFrom(
      this.http.post<User>(`${this.baseUrl}/auth/register`, req),
    );
  }

  /** Logs in and, on success, stores the returned identity. */
  async login(email: string, password: string): Promise<AuthResponse> {
    const req: LoginRequest = { email, password };
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, req),
    );
    this.adopt(response);
    return response;
  }

  /**
   * Asks the backend whether the current `jwt` cookie is valid. Updates the
   * stored profile accordingly and returns whether the session is valid.
   * Only meaningful in the browser (the server has no cookie to send on its
   * own outgoing requests during SSR).
   */
  async validate(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;
    try {
      const response = await firstValueFrom(
        this.http.get<AuthResponse>(`${this.baseUrl}/auth/validate`),
      );
      this.adopt(response);
      return true;
    } catch {
      this.profile.set(null);
      return false;
    }
  }

  /** Logs out (clears the backend cookie) and clears local session state. */
  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.baseUrl}/auth/logout`, {}));
    this.profile.set(null);
  }

  /** Changes the current user's password. */
  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    const req: UpdatePasswordRequest = { oldPassword, newPassword };
    await firstValueFrom(
      this.http.put<void>(`${this.baseUrl}/auth/update-password`, req),
    );
  }

  /** Stores the identity carried by an auth response. */
  private adopt(response: AuthResponse): void {
    this.profile.set({
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    });
  }
}
