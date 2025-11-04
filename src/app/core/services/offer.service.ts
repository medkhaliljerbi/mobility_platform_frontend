import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, forkJoin, map,of,switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

export type OfferType   = 'EXCHANGE' | 'DOUBLE_DEGREE' | 'MASTERS';
export type TargetYear  = 'FOURTH'   | 'FIFTH';
export type OfferStatus = 'OPEN'     | 'CLOSED';

export interface OfferView {
  id: number;
  title: string;
  description: string;
  seats: number;                 // maps to backend column (a.k.a availableSlots in some UIs)
  deadline: string | null;       // ISO
  type: OfferType;
  targetYear: TargetYear;
esprit: boolean;
  // snapshot fields on the Offer entity
  universityName: string;
  countryCode?: string | null;
  addressLine?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;

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
  esprit?: boolean;
  // snapshot fields in payload
  universityName: string;
  countryCode?: string | null;
  addressLine?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;

  topicTags?: string[] | null;
  requiredDocs?: string[] | null;
  formJson?: string | { fields: string[] } | null; // jsonb
}

/* ------------ NEW: scoring/recommendation DTOs (mirror backend) ------------ */
export interface CertContrib {
  certificateId?: number | null;
  certificateName?: string | null;
  sSem: number;     // semantic
  sKw: number;      // keyword
  sTopic: number;   // topic-tag
  levelWeight: number;
  sMatch: number;   // combined
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

/* ------------ NEW: application DTOs ------------ */
export interface MyApplicationView {
  id: number;
  offerId: number;
  status: string;          // "SUBMITTED", etc.
  createdAt?: string;
  gradeScore?: number;
  certScore?: number;
  finalScore?: number;
  answersJson?: Record<string, any>;
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

  /* ----------------------------- CRUD + image ------------------------------ */

  createOffer(payload: OfferCreatePayload): Observable<OfferView> {
    const body: any = { ...payload };
    if (typeof body.formJson === 'string') {
      try { body.formJson = JSON.parse(body.formJson); } catch {}
    }
    return this.http.post<OfferView>(this.url('/offers'), body, this.opts());
  }

  getAllOffers(): Observable<OfferView[]> {
    return this.http.get<OfferView[]>(this.url('/offers/all'), this.opts());
  }

  getOffer(id: number): Observable<OfferView> {
    return this.http.get<OfferView>(this.url(`/offers/${id}`), this.opts());
  }

  updateOffer(id: number, patch: Partial<OfferCreatePayload & { status: OfferStatus }>): Observable<OfferView> {
    const body: any = { ...patch };
    if (typeof body.formJson === 'string') {
      try { body.formJson = JSON.parse(body.formJson); } catch {}
    }
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

  openOffer(id: number){  return this.http.put<OfferView>(this.url(`/offers/${id}/open`),  {}, this.opts()); }
  closeOffer(id: number){ return this.http.put<OfferView>(this.url(`/offers/${id}/close`), {}, this.opts()); }

  /* ----------------- student recommendations & scoring ----------------- */

  /** GET /api/offers/recommendations?limit=N */
  getRecommendations(limit = 20): Observable<RecommendationItem[]> {
    return this.http.get<RecommendationItem[]>(
      this.url(`/offers/recommendations?limit=${limit}`),
      this.opts()
    );
  }

  /** GET /api/offers/{offerId}/my-score */
  getMyScore(offerId: number): Observable<MyScore> {
    return this.http.get<MyScore>(this.url(`/offers/${offerId}/my-score`), this.opts());
  }

  /**
   * Fetch recommendations and hydrate each item with full OfferView (for image, tags…).
   * Returns an array sorted by recoScore desc.
   */
  getRecommendedOffersHydrated(limit = 20): Observable<(OfferView & RecommendationItem)[]> {
    return forkJoin({
      offers: this.getAllOffers(),
      recs:   this.getRecommendations(limit)
    }).pipe(
      map(({ offers, recs }) => {
        const byId = new Map<number, OfferView>(offers.map(o => [o.id, o]));
        return recs
          .map(r => {
            const full = byId.get(r.offerId);
            if (!full) return null; // drop if no full offer data
            return { ...full, ...r } as (OfferView & RecommendationItem);
          })
          .filter((x): x is OfferView & RecommendationItem => x !== null)
          .sort((a, b) => (b.recoScore ?? 0) - (a.recoScore ?? 0));
      })
    );
  }

  /* ------------------------- applications (Module 1) ------------------------- */

// check if I already applied to this offer
getMyApplicationForOffer(offerId: number) {
  return this.http.get<any>(
    this.url(`/applications/${offerId}/me`),
    this.opts()
  );
}

// submit first-stage application
submitApplication(offerId: number, answers: Record<string,string>) {
  return this.http.post<any>(
    this.url(`/applications/${offerId}`),
    { answers }, // matches backend controller body { "answers": {...} }
    this.opts()
  );
}

getOffersRankedByMyScore(limit = 20): Observable<(OfferView & RecommendationItem)[]> {
  return this.getAllOffers().pipe(
    switchMap((offers) => {
      if (!offers || offers.length === 0) return of([]);

      const calls = offers.map((o) =>
        this.getMyScore(o.id).pipe(
          map((ms) => ({
            ...o,
            // map my-score fields into the RecommendationItem shape
            certScore: ms.certScore,
            gradeScore: ms.gradeScore,
            recoScore: ms.finalScore,   // <-- reuse existing UI field
          }) as OfferView & RecommendationItem),
          // if a single my-score fails, just drop that item
          catchError(() => of(null))
        )
      );

      return forkJoin(calls).pipe(
        map(items =>
          (items.filter(Boolean) as (OfferView & RecommendationItem)[])
            .sort((a,b) => (b.recoScore ?? 0) - (a.recoScore ?? 0))
            .slice(0, limit)
        )
      );
    })
  );
}

}
