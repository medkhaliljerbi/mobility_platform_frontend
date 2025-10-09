import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PartnerSchoolSelfView {
  // identity (read-only)
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;

  // partner fields (editable)
  universityName: string | null;
  country: string | null;
  website: string | null;

  // photo
  photoUrl?: string | null;
  avatarUrl?: string | null;
  photoObjectKey?: string | null;
}

export interface PartnerSchoolSelfUpdate {
  universityName?: string | null;
  country?: string | null;
  website?: string | null;
  photoObjectKey?: string | null;   // tri-state: omit / null / value
}

@Injectable({ providedIn: 'root' })
export class PartnerSchoolService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBase.replace(/\/+$/, '') + '/api';

  private url(p: string) { return `${this.base}/${p.replace(/^\/+/, '')}`; }

  private readonly profileUrl = this.url('/partner/profile');
  private readonly avatarUploadUrl = this.url('/partner/profile/photo/upload');

  private authHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('token') || '';
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
  private opts() { return { withCredentials: true, headers: this.authHeaders() }; }

  getMe(): Observable<PartnerSchoolSelfView> {
    return this.http.get<PartnerSchoolSelfView>(this.profileUrl, this.opts());
  }

  updateMe(payload: PartnerSchoolSelfUpdate): Observable<PartnerSchoolSelfView> {
    return this.http.post<PartnerSchoolSelfView>(this.profileUrl, payload, this.opts());
  }

  uploadAvatar(file: File): Observable<PartnerSchoolSelfView> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<PartnerSchoolSelfView>(this.avatarUploadUrl, form, this.opts());
  }

  deleteAvatar(): Observable<PartnerSchoolSelfView> {
    return this.updateMe({ photoObjectKey: null });
  }
}
