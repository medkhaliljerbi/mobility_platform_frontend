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
  active?: boolean; // ✅ backend now returns this
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
  // environment.apiBase MUST end with '/', e.g. 'http://localhost:8080/'
  private base = `${environment.apiBase}auth`;

  private readonly json = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient, private tokens: TokenStorageService) {}

  signup(body: any): Observable<any> {
    return this.http.post<any>(`${this.base}/signup`, body, { headers: this.json });
  }

  // ✅ Save token and active flag on successful login
  login(body: LoginRequest): Observable<{ token?: string; raw: RawLoginResponse }> {
    return this.http
      .post<RawLoginResponse>(`${this.base}/signin`, body, { headers: this.json })
      .pipe(
        map((raw) => {
          const token = raw.accessToken ?? raw.token ?? raw.jwt ?? raw.id_token ?? undefined;
          // store active flag for guards/UI
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

  // ✅ When verify succeeds, mark user as active locally too
  verifyEmail(token: string): Observable<{ message: string; jwt?: string }> {
    const params = new HttpParams().set('token', token);
    return this.http
      .post<{ message: string; jwt?: string }>(`${this.base}/email/verify`, null, { params })
      .pipe(
        tap(() => localStorage.setItem('user_active', 'true'))
        // if you want auto-login here, also do: tap(res => this.tokens.set(res.jwt))
      );
  }

  logout() {
    this.tokens.clear();
    localStorage.removeItem('user_active');
  }
}
