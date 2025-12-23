import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, switchMap, forkJoin, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs/operators';

export type OfferType   = 'EXCHANGE' | 'DOUBLE_DEGREE' | 'MASTERS';
export type TargetYear  = 'FOURTH'   | 'FIFTH';
export type OfferStatus = 'OPEN'     | 'CLOSED';
export type ApplicationStatus =
  | 'SUBMITTED'
  | 'PRESELECTED'
  | 'WAITING_DOCS'
  | 'DOCS_UPLOADED'
  | 'CONTRACT'
  | 'CONTRACT_SUBMITTED'
  | 'CONTRACT_APPROVED'
  | 'REJECTED';

export interface OfferView {
  id: number;
  title: string;
  description: string;
  seats: number;
  deadline: string | null;
  type: OfferType;
  targetYear: TargetYear;
  esprit: boolean;

  universityName: string;
  countryCode?: string | null;
  addressLine?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;

  topicTags: string[] | null;
  requiredDocs: string[] | null;
  formJson: { fields: string[] } | null;

  // ⭐ NEW: modules announced in backend DTO
  modules?: string[] | null;

  status: OfferStatus;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
  createdAt?: string;

  // ⭐ Optional: URL of attached offer file (affiche)
  offerFileUrls?: { [filename: string]: string };
}

export interface MyApplicationView {
  applicationId: number;
  status: ApplicationStatus;
  finalScore?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  offerId?: number | null;
  offerTitle?: string | null;
  offerUniversityName?: string | null;
  offerCountryCode?: string | null;
  offerDeadline?: string | null;
  offerImageUrl?: string | null;
  modules?: string[] | null;
}

export interface OfferCreatePayload {
  title: string;
  description: string;
  seats: number;
  deadline: string | null;
  type: OfferType;
  targetYear: TargetYear;
  esprit?: boolean;

  universityName: string;
  countryCode?: string | null;
  addressLine?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;

  topicTags?: string[] | null;
  requiredDocs?: string[] | null;
  formJson?: string | { fields: string[] } | null;

  // ⭐ NEW: modules field for creation
  modules?: string[] | null;

  // ⭐ NEW: map of offer files (label -> key or null)
  offerFiles?: { [label: string]: string | null } | null;
}

export interface CertContrib {
  certificateId?: number | null;
  certificateName?: string | null;
  sSem: number;
  sKw: number;
  sTopic: number;
  levelWeight: number;
  sMatch: number;
}

export interface RecommendationItem {
  offerId: number;
  title: string;
  certScore: number;
  gradeScore: number;
  recoScore: number;
  explain?: { certContribs?: CertContrib[] };
}

export interface MyScore {
  offerId: number;
  title: string;
  gradeScore: number;
  certScore: number;
  finalScore: number;
  explain?: { certContribs?: CertContrib[] };
}


interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class OfferService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBase.replace(/\/+$/, '') + '/api';
  private url(p: string) {
    return `${this.base}/${p.replace(/^\/+/, '')}`;
  }

  private authHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('token') ||
      '';
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private opts() {
    return { withCredentials: true, headers: this.authHeaders() };
  }

  // -------------------- CRUD --------------------
  createOffer(payload: OfferCreatePayload): Observable<OfferView> {
    const body =
      typeof payload.formJson === 'string'
        ? { ...payload, formJson: safeJson(payload.formJson) }
        : payload;
    return this.http.post<OfferView>(this.url('/offers'), body, this.opts());
  }

  /** PRIVATE: only my offers (Partner / Mobility Officer) */
  getMyOffers(): Observable<OfferView[]> {
    return this.http.get<OfferView[]>(this.url('/offers/mine'), this.opts());
  }

  /** PUBLIC-visible (server filters by role: entrant vs student, etc.) */
  getVisibleOffers(page = 0, size = 200): Observable<OfferView[]> {
    return this.http
      .get<Page<OfferView>>(this.url(`/offers/visible?page=${page}&size=${size}`), this.opts())
      .pipe(map(p => p?.content ?? []));
  }

  /** Legacy: all (useful for admin tools; not used in public list) */
  getAllOffers(): Observable<OfferView[]> {
    return this.http.get<OfferView[]>(this.url('/offers/all'), this.opts());
  }

  // OfferService
  getVisibleOffersOrAll(page = 0, size = 200): Observable<OfferView[]> {
    return this.getVisibleOffers(page, size).pipe(
      switchMap(rows => (rows && rows.length > 0 ? of(rows) : this.getAllOffers())),
      catchError(() => this.getAllOffers())
    );
  }

  getOffer(id: number): Observable<OfferView> {
    return this.http.get<OfferView>(this.url(`/offers/${id}`), this.opts());
  }

  updateOffer(
    id: number,
    patch: Partial<OfferCreatePayload> & {
      modules?: string[] | null;
      offerFiles?: { [label: string]: string | null } | null;
    }
  ): Observable<OfferView> {
    const body =
      typeof patch.formJson === 'string'
        ? { ...patch, formJson: safeJson(patch.formJson) }
        : patch;

    return this.http.put<OfferView>(this.url(`/offers/${id}`), body, this.opts());
  }

  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`/offers/${id}`), this.opts());
  }

  uploadOfferImage(id: number, file: File): Observable<OfferView> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<OfferView>(this.url(`/offers/${id}/image`), form, this.opts());
  }

  removeOfferImage(id: number): Observable<OfferView> {
    return this.http.delete<OfferView>(this.url(`/offers/${id}/image`), this.opts());
  }

  // ⭐ NEW: upload offer attached file (affiche PDF / DOC / image)
uploadOfferFile(id: number, file: File): Observable<OfferView> {
  const form = new FormData();

  // label = nom du fichier (ce que tu veux voir dans les chips côté UI)
  form.append('label', file.name);
  form.append('file', file);

  return this.http.post<OfferView>(this.url(`/offers/${id}/file`), form, this.opts());
}



  openOffer(id: number) {
    return this.http.put<OfferView>(this.url(`/offers/${id}/open`), {}, this.opts());
  }
  closeOffer(id: number) {
    return this.http.put<OfferView>(this.url(`/offers/${id}/close`), {}, this.opts());
  }

  // --------------- recommendations ---------------
  getRecommendations(limit = 20): Observable<RecommendationItem[]> {
    return this.http.get<RecommendationItem[]>(
      this.url(`/offers/recommendations?limit=${limit}`),
      this.opts()
    );
  }

  getMyScore(offerId: number): Observable<MyScore> {
    return this.http.get<MyScore>(this.url(`/offers/${offerId}/my-score`), this.opts());
  }

  /** Hydrate recs with visible offers only (server already filtered by role) */
  getRecommendedOffersHydrated(limit = 20): Observable<(OfferView & RecommendationItem)[]> {
    return forkJoin({
      offers: this.getVisibleOffers(0, 200),
      recs: this.getRecommendations(limit)
    }).pipe(
      map(({ offers, recs }) => {
        const byId = new Map<number, OfferView>(offers.map(o => [o.id, o]));
        return recs
          .map(r => {
            const full = byId.get(r.offerId);
            if (!full) return null;
            return { ...full, ...r } as OfferView & RecommendationItem;
          })
          .filter((x): x is OfferView & RecommendationItem => x !== null)
          .sort((a, b) => (b.recoScore ?? 0) - (a.recoScore ?? 0));
      }),
      catchError(() => of([]))
    );
  }

  /* ------------------------- applications (Module 1) ------------------------- */

  getMyApplicationForOffer(offerId: number) {
    return this.http.get<any>(this.url(`/applications/${offerId}/me`), this.opts());
  }

  submitApplication(offerId: number, answers: Record<string, string>) {
    return this.http.post<any>(
      this.url(`/applications/${offerId}`),
      { answers },
      this.opts()
    );
  }

  getApplicationProcess(offerId: number) {
    return this.http.get<any>(
      this.url(`/applications/${offerId}/process`),
      this.opts()
    );
  }

  getMyApplications(): Observable<MyApplicationView[]> {
    return this.http
      .get<MyApplicationView[]>(this.url('/applications/my'), this.opts())
      .pipe(
        map(rows => {
          if (!Array.isArray(rows)) return [];
          return rows.map(r => ({
            offerTitle: null,
            offerUniversityName: null,
            offerCountryCode: null,
            offerDeadline: null,
            offerImageUrl: null,
            updatedAt: null,
            ...r
          }));
        }),
        catchError((err: any) => {
          console.error('getMyApplications() error', err);
          return of([]);
        })
      );
  }

  uploadRequiredDocument(
    appId: number,
    label: string,
    file?: File,
    existingDocumentId?: number
  ) {
    const form = new FormData();
    form.append('label', label);

    if (file) form.append('file', file);
    if (existingDocumentId != null) {
      form.append('existingDocumentId', String(existingDocumentId));
    }

    return this.http.post<any>(
      this.url(`/applications/${appId}/required-doc`),
      form,
      this.opts()
    );
  }

  uploadCertification(
    appId: number,
    label: string,
    file?: File,
    existingCertId?: number
  ) {
    const form = new FormData();
    form.append('label', label);

    if (file) form.append('file', file);
    if (existingCertId != null) {
      form.append('existingCertId', String(existingCertId));
    }

    return this.http.post<any>(
      this.url(`/applications/${appId}/certification`),
      form,
      this.opts()
    );
  }

  deleteCertification(appId: number, label: string) {
    return this.http.delete<any>(
      this.url(`/applications/${appId}/certification?label=${encodeURIComponent(label)}`),
      this.opts()
    );
  }

  deleteRequiredDocument(appId: number, label: string) {
    return this.http.delete<any>(
      this.url(`/applications/${appId}/required-doc?label=${encodeURIComponent(label)}`),
      this.opts()
    );
  }

  submitAllDocuments(appId: number): Observable<any> {
    return this.http.post<any>(
      this.url(`/applications/${appId}/submit-docs`),
      {},
      this.opts()
    );
  }
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
