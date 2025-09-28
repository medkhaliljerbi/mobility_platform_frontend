import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { UserUpsertRequest } from '../dto/user-upsert-request';
import { UploadRosterResponse } from '../dto/upload-roster.response';
import { RosterRow } from '../models/roster-row.model';
import { InviteResult } from '../dto/invite-result.dto';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private base = `${environment.apiBase}api/admin/users`;

  constructor(private http: HttpClient) {}

  // ---- dynamic token from localStorage / sessionStorage ----
  private authHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token found in storage');
      return new HttpHeaders();
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // ---- users ----
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.base, { headers: this.authHeaders() });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`, { headers: this.authHeaders() });
  }

  patchUpdate(id: number, body: Partial<UserUpsertRequest>): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}`, body, { headers: this.authHeaders() });
  }

  setActive(id: number, active: boolean): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}/active`, { active }, { headers: this.authHeaders() });
  }

  resetPassword(id: number, newPassword: string): Observable<void> {
    const body = { newPassword };
    return this.http.patch<void>(`${this.base}/${id}/password`, body, { headers: this.authHeaders() });
  }

  // ---- roster: upload (multipart) → load staging ----
  uploadRosterAndLoad(
    file: File,
    opts: { useCase?: string; groupId?: string; filename?: string; contentType?: string; load?: boolean } = {}
  ): Observable<UploadRosterResponse> {
    const form = new FormData();
    form.append('file', file, opts.filename || file.name);
    // these extra fields are optional on backend; harmless if present
    form.append('useCase', opts.useCase ?? 'roster');
    form.append('groupId', opts.groupId ?? 'staging');
    form.append('load', String(opts.load ?? true));
    if (opts.filename) form.append('filename', opts.filename);
    if (opts.contentType) form.append('contentType', opts.contentType);

    return this.http.post<UploadRosterResponse>(`${this.base}/roster/load`, form, {
      headers: this.authHeaders()
    });
  }

  // optional alternative: load by S3/MinIO key
  loadRosterByKey(key: string): Observable<UploadRosterResponse> {
    const params = new HttpParams().set('key', key);
    return this.http.post<UploadRosterResponse>(`${this.base}/roster/load`, null, {
      headers: this.authHeaders(),
      params
    });
  }

  // preview (file or key)
  previewRosterFile(file: File): Observable<SortantCsvRow[]> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<SortantCsvRow[]>(`${this.base}/roster/preview-new`, form, {
      headers: this.authHeaders()
    });
  }

  previewRosterByKey(key: string): Observable<SortantCsvRow[]> {
    const params = new HttpParams().set('key', key);
    return this.http.post<SortantCsvRow[]>(`${this.base}/roster/preview-new`, null, {
      headers: this.authHeaders(),
      params
    });
  }

  listStaging(): Observable<RosterRow[]> {
    return this.http.get<RosterRow[]>(`${this.base}/roster/staging`, { headers: this.authHeaders() });
  }

  clearStaging(): Observable<void> {
    return this.http.delete<void>(`${this.base}/roster/staging`, { headers: this.authHeaders() });
  }

  inviteAll(dryRun = false): Observable<InviteResult> {
    return this.http.post<InviteResult>(`${this.base}/roster/invite?dryRun=${dryRun}`, {}, {
      headers: this.authHeaders()
    });
  }

  inviteOne(email: string): Observable<any> {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.base}/roster/invite-one`, null, {
      headers: this.authHeaders(),
      params
    });
  }

// --- inside AdminUserService class ---
createAndInvite(body: AdminCreateUserRequest): Observable<User> {
  return this.http.post<User>(`${this.base}/createandinvite`, body, { headers: this.authHeaders() });
}

}

// Add this interface locally (or reuse your existing one)
export interface SortantCsvRow {
  espritId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  espritEmail: string;
  phone?: string | null;
}
// --- add near other imports or at bottom of file ---
export type AdminCreateUserRequest = {
  username?: string | null;

  firstName: string;
  middleName?: string | null;
  lastName: string;

  email: string;
  personalEmail?: string | null;

  role:
    | 'STUDENT'
    | 'TEACHER'
    | 'PARTNER'
    | 'MOBILITY_OFFICER'
    | 'CHEF_OPTION'
    | 'ADMIN';

  personnelPhoneNumber: string;
  domicilePhoneNumber?: string | null;

  maritalStatus?: string | null;
};
