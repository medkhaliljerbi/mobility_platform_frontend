import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AgentMobiliteSelfView {
  // identity (read-only)
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;

  // photo
  photoUrl?: string | null;
  avatarUrl?: string | null;
  photoObjectKey?: string | null;
}

export interface AgentMobiliteSelfUpdate {
  // tri-state: omit / null / value
  photoObjectKey?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AgentMobiliteService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBase.replace(/\/+$/, '') + '/api';

  private url(p: string) { return `${this.base}/${p.replace(/^\/+/, '')}`; }

  private readonly profileUrl = this.url('/agentmobilite/profile');
  private readonly avatarUploadUrl = this.url('/agentmobilite/profile/photo/upload');

  /** add cookies + optional bearer from localStorage for all calls */
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

  getMe(): Observable<AgentMobiliteSelfView> {
    return this.http.get<AgentMobiliteSelfView>(this.profileUrl, this.opts());
  }

  updateMe(payload: AgentMobiliteSelfUpdate): Observable<AgentMobiliteSelfView> {
    return this.http.post<AgentMobiliteSelfView>(this.profileUrl, payload, this.opts());
  }

  uploadAvatar(file: File): Observable<AgentMobiliteSelfView> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<AgentMobiliteSelfView>(this.avatarUploadUrl, form, this.opts());
  }

  deleteAvatar(): Observable<AgentMobiliteSelfView> {
    return this.updateMe({ photoObjectKey: null });
  }
}
