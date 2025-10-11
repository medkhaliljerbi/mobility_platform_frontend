import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type OfferType   = 'EXCHANGE' | 'DOUBLE_DEGREE' | 'MASTERS';
export type TargetYear  = 'FOURTH'   | 'FIFTH';
export type OfferStatus = 'OPEN'     | 'CLOSED';

export interface OfferView {
  id: number;
  title: string;
  description: string;
  seats: number;
  deadline: string | null;
  type: OfferType;
  targetYear: TargetYear;
  topicTags: string[] | null;
  requiredDocs: string[] | null;
  formJson: { fields: string[] } | null;
  status: OfferStatus;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
}

export interface OfferCreatePayload {
  title: string;
  description: string;
  seats: number;
  deadline: string | null;
  type: OfferType;
  targetYear: TargetYear;
  topicTags?: string[] | null;
  requiredDocs?: string[] | null;
  formJson?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OfferService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBase.replace(/\/+$/, '') + '/api';
  private url(p: string) { return `${this.base}/${p.replace(/^\/+/, '')}`; }

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

  createOffer(payload: OfferCreatePayload): Observable<OfferView> {
    return this.http.post<OfferView>(this.url('/offers'), payload, this.opts());
  }

  uploadOfferImage(id: number, file: File): Observable<OfferView> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<OfferView>(this.url(`/offers/${id}/image`), form, this.opts());
  }

  getOffer(id: number): Observable<OfferView> {
    return this.http.get<OfferView>(this.url(`/offers/${id}`), this.opts());
  }

  getAllOffers(): Observable<OfferView[]> {
    return this.http.get<OfferView[]>(this.url('/offers/all'), this.opts());
  }
}
