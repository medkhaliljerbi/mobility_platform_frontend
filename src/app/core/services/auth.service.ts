// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from './token-storage.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RawLoginResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  id_token?: string;
  message?: string;
  active?: boolean; // backend may return this
  // ⬇️ include role from JwtResponse
  role?: 'ADMIN' | 'MOBILITY_OFFICER' | 'TEACHER' | 'CHEF_OPTION' | 'PARTNER' | 'STUDENT';
}

export interface InvitePreviewDto {
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  espritId: string;
  personnelPhoneNumber: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // KEEP your original base
  private base = `${environment.apiBase}auth`;

  // KEEP your original headers
  private readonly json = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient, private tokens: TokenStorageService) {}

  // helper ONLY for endpoints that require Bearer (doesn't affect others)
  private authJson(): HttpHeaders {
    const token =
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token') ||
      (this.tokens as any)?.get?.();
    return token ? this.json.set('Authorization', `Bearer ${token}`) : this.json;
  }

  // ---------- existing flow ----------
  signup(body: any): Observable<any> {
    return this.http.post<any>(`${this.base}/signup`, body, { headers: this.json });
  }

  // ✅ original login (now also persists role)
  login(body: LoginRequest): Observable<{ token?: string; raw: RawLoginResponse }> {
    return this.http
      .post<RawLoginResponse>(`${this.base}/signin`, body, { headers: this.json })
      .pipe(
        map((raw) => {
          const token = raw.accessToken ?? raw.token ?? raw.jwt ?? raw.id_token ?? undefined;

          // optional: active flag
          if (typeof raw.active === 'boolean') {
            localStorage.setItem('user_active', String(raw.active));
          } else {
            localStorage.removeItem('user_active');
          }

          // 🔹 persist role for menu/profile routing
          if (raw.role) {
            localStorage.setItem('user_role', raw.role);
          } else {
            localStorage.removeItem('user_role');
          }

          return { token, raw };
        }),
        tap(({ token }) => this.tokens.set(token))
      );
  }

  // ✅ alias kept for your login-other page (fixes TS2339)
  loginOther(body: LoginRequest): Observable<{ token?: string; raw: RawLoginResponse }> {
    return this.login(body);
  }

  /** FIRST-LOGIN: submit new password (requires Bearer) -> 204; backend sends verification email */
  completeFirstLogin(newPassword: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/first-login/complete`,
      { newPassword },
      { headers: this.authJson() }
    );
  }

  // ---------- the rest (unchanged) ----------
  previewInvite(token: string): Observable<InvitePreviewDto> {
    const params = new HttpParams().set('token', token);
    return this.http.get<InvitePreviewDto>(`${this.base}/invite/preview`, { params });
  }

  completeSignup(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/signup/complete`,
      { token, password },
      { headers: this.json }
    );
  }

  verifyEmail(token: string): Observable<{ message: string; jwt?: string }> {
    const params = new HttpParams().set('token', token);
    return this.http
      .post<{ message: string; jwt?: string }>(`${this.base}/email/verify`, null, { params })
      .pipe(tap(() => localStorage.setItem('user_active', 'true')));
  }

  logout() {
    this.tokens.clear();
    localStorage.removeItem('user_active');
    localStorage.removeItem('user_role'); // clear persisted role
  }

  /** Forgot password: sends a recovery email (backend always 204) */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/password/forgot`,
      { email },
      { headers: this.json }
    );
  }

  /** Preview token -> validate before showing reset form */
  previewResetToken(token: string): Observable<{ valid: boolean; email?: string }> {
    const params = new HttpParams().set('token', token);
    return this.http.get<{ valid: boolean; email?: string }>(`${this.base}/password/preview`, { params });
  }

  /** Reset password with token */
  resetPassword(token: string, newPassword: string): Observable<void> {
    const params = new HttpParams().set('token', token);
    return this.http.post<void>(
      `${this.base}/password/reset`,
      { newPassword },
      { headers: this.json, params }
    );
  }

  // auth.service.ts
  currentRole(): string | null {
    return (localStorage.getItem('user_role') || '').toUpperCase() || null;
  }
  isActive(): boolean {
    return localStorage.getItem('user_active') === 'true';
  }
  hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }
  currentUser() { // optional convenience
    return { role: this.currentRole(), active: this.isActive(), token: this.hasToken() };
  }
}
