import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type FieldType = 'IT' | 'TELECOM' | 'GC' | 'EM';
export type OptionCodeType =
  | 'ERP_BI' | 'ARCTIC' | 'SAE' | 'SIM' | 'INFINI' | 'DS' | 'SE' | 'TWIN' | 'IA' | 'NIDS' | 'GAMIX' | 'DATA_IT' | 'SLEAM'
  | 'IOSYS' | 'DATA_TEL'
  | 'SO' | 'PC' | 'RN2E'
  | 'MECATRONIQUE' | 'OGI';

export interface TeacherSelfView {
  // identity
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;

  // photo
  photoUrl?: string | null;
  avatarUrl?: string | null;
  photoObjectKey?: string | null;

  // role
  chefOption: boolean;

  // teacher fields
  fields: FieldType[] | null;

  // chef option
  option: OptionCodeType | null;
  optionField: FieldType | null; // derived server-side
}

export interface TeacherSelfUpdate {
  photoObjectKey?: string | null;
  fields?: FieldType[] | null;          // for Teacher
  option?: OptionCodeType | null;       // for ChefOption
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBase.replace(/\/+$/, '') + '/api';

  private url(p: string) { return `${this.base}/${p.replace(/^\/+/, '')}`; }

  private readonly profileUrl = this.url('/teacher/profile');
  private readonly avatarUploadUrl = this.url('/teacher/profile/photo/upload');

  private authHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('token') ||
      '';
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
  private opts() { return { withCredentials: true, headers: this.authHeaders() }; }

  getMe(): Observable<TeacherSelfView> {
    return this.http.get<TeacherSelfView>(this.profileUrl, this.opts());
  }

  updateMe(payload: TeacherSelfUpdate): Observable<TeacherSelfView> {
    return this.http.post<TeacherSelfView>(this.profileUrl, payload, this.opts());
  }

  uploadAvatar(file: File): Observable<TeacherSelfView> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<TeacherSelfView>(this.avatarUploadUrl, form, this.opts());
  }

  deleteAvatar(): Observable<TeacherSelfView> {
    return this.updateMe({ photoObjectKey: null });
  }
}
