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
  // ✅ KEEP YOUR ORIGINAL BASE
  // environment.apiBase MUST end with '/', e.g. 'http://localhost:8080/'
  private base = `${environment.apiBase}auth`;

  // ✅ KEEP YOUR ORIGINAL JSON HEADERS
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

  // ---------- EXISTING FLOW (unchanged) ----------
  signup(body: any): Observable<any> {
    return this.http.post<any>(`${this.base}/signup`, body, { headers: this.json });
  }

  // ✅ DO NOT TOUCH: your original login
  login(body: LoginRequest): Observable<{ token?: string; raw: RawLoginResponse }> {
    return this.http
      .post<RawLoginResponse>(`${this.base}/signin`, body, { headers: this.json })
      .pipe(
        map((raw) => {
          const token = raw.accessToken ?? raw.token ?? raw.jwt ?? raw.id_token ?? undefined;
          // (Optional) keep storing active flag; harmless for old flow
          if (typeof raw.active === 'boolean') {
            localStorage.setItem('user_active', String(raw.active));
          } else {
            localStorage.removeItem('user_active');
          }
          return { token, raw };
        }),
        tap(({ token }) => this.tokens.set(token))
      );
  }

  // ---------- NEW: NON-SORTANT FLOW ADDITIONS ----------
  // separate name for the non-sortant login screen (same endpoint, same headers)
  loginOther(body: LoginRequest): Observable<{ token?: string; raw: RawLoginResponse }> {
    // reuse the exact same call to avoid divergence
    return this.login(body);
  }

  /** FIRST-LOGIN: submit new password (requires Bearer) -> 204; backend sends verification email */
  completeFirstLogin(newPassword: string): Observable<void> {
    return this.http.post<void>(
      `${this.base}/first-login/complete`,
      { newPassword },
      { headers: this.authJson() } // << Bearer added here ONLY
    );
  }

  // ---------- The rest (unchanged / already present) ----------
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
  }
}
