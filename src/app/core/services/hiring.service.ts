// src/app/core/services/hiring.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of,forkJoin  } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApplicationStatus } from '@/core/services/offer.service'; // or copy the type if needed
import { TeacherRecommendationView, StudentRecommendationView } from '@/core/dto/recommendation.dto';


export interface HiringApplicationView {
  id: number;
  status: ApplicationStatus;
  finalScore?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  answersJson?: Record<string, any> | null;

  recommended?: boolean; // <-- ADD THIS LINE
    // NEW for documents UI
  requiredDocsJson?: Record<string, string> | null;
  certificationsJson?: Record<string, string> | null;

  documentsDeadline?: string | null;
  contractSubmissionDeadline?: string | null;
  contractApprovalDeadline?: string | null;
}
export interface ChefOptionContractView {
  applicationId: number;
  studentFullName: string;
  offerTitle: string;
  contractDownloadUrl: string;
  approved: boolean | null;
  contractApprovalDeadline: string | null;
}


@Injectable({ providedIn: 'root' })
export class HiringService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBase.replace(/\/+$/, '') + '/api';
  private url(p: string) { return `${this.base}/${p.replace(/^\/+/, '')}`; }

  private authHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('token') || '';
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
  private opts() { return { withCredentials: true, headers: this.authHeaders() }; }

  /** List applications for one offer (Officer / Partner only). Backend: GET /api/hiring?offerId=... */
listApplications(offerId: number): Observable<HiringApplicationView[]> {
  return this.http
    .get<HiringApplicationView[]>(this.url(`/hiring/${offerId}`), this.opts())
    .pipe(
      map(rows => Array.isArray(rows) ? rows : []),
      catchError(err => {
        console.error('listApplications() error', err);
        return of([]);
      })
    );
}


  /** Submit PRESELECTED: POST /api/hiring?offerId=... */
  submitPreselected(offerId: number, applicationIds: number[]): Observable<void> {
    return this.http
      .post<void>(this.url(`/hiring?offerId=${offerId}`), applicationIds ?? [], this.opts())
      .pipe(
        catchError(err => {
          console.error('submitPreselected() error', err);
          throw err;
        })
      );
  }

  /** Submit WAITING_LIST: POST /api/hiring/waiting?offerId=... */
  submitWaitingList(offerId: number, applicationIds: number[]): Observable<void> {
    return this.http
      .post<void>(this.url(`/hiring/waiting?offerId=${offerId}`), applicationIds ?? [], this.opts())
      .pipe(
        catchError(err => {
          console.error('submitWaitingList() error', err);
          throw err;
        })
      );
  }

  /**
   * Generate Excel in MinIO and receive a downloadUrl.
   * Backend: POST /api/hiring/excel?offerId=...
   * Body: [applicationId,...] or [] for "all".
   */
  generateExcel(
    offerId: number,
    applicationIds: number[] | null
  ): Observable<{ downloadUrl: string }> {
    const body = applicationIds && applicationIds.length ? applicationIds : [];
    return this.http
      .post<{ downloadUrl: string }>(this.url(`/hiring/excel?offerId=${offerId}`), body, this.opts())
      .pipe(
        catchError(err => {
          console.error('generateExcel() error', err);
          throw err;
        })
      );
  }

  deleteApplication(appId: number): Observable<void> {
  return this.http
    .delete<void>(this.url(`/hiring/${appId}`), this.opts());
}

revertStatus(appId: number, status: ApplicationStatus): Observable<void> {
  return this.http
    .put<void>(this.url(`/hiring/revert?appId=${appId}&status=${status}`), {}, this.opts());
}



/////////////////////////////////Recommendations/////////////////////////////////////

getMyGivenRecommendations() {
  return this.http.get<TeacherRecommendationView[]>(
    this.url('/recommendations/my-given'),
    this.opts()
  );
}

getMyReceivedRecommendations() {
  return this.http.get<StudentRecommendationView[]>(
    this.url('/recommendations/my-received'),
    this.opts()
  );
}

deleteRecommendation(id: number) {
  return this.http.delete(
    this.url(`/recommendations/${id}`),
    this.opts()
  );
}

deleteManyRecommendations(ids: number[]) {
  return forkJoin(ids.map(id => this.deleteRecommendation(id)));
}
/////////////////////////////////////////////////////////////////////////////////////
/** Update deadlines for one application */
updateDeadlines(
  appId: number,
  payload: {
    documentsDeadline?: string | null,
    contractSubmissionDeadline?: string | null,
    contractApprovalDeadline?: string | null
  }
): Observable<void> {
  return this.http
    .put<void>(
      this.url(`/hiring/${appId}/deadlines`),
      payload,
      this.opts()
    )
    .pipe(
      catchError(err => {
        console.error('updateDeadlines() error', err);
        throw err;
      })
    );
}
//////////////////////////
finalizeSelection(offerId: number): Observable<void> {
  return this.http
    .post<void>(this.url(`/hiring/${offerId}/finalize`), {}, this.opts())
    .pipe(
      catchError(err => {
        console.error('finalizeSelection() error', err);
        throw err;
      })
    );
}
/**
 * Set documents upload deadline for ALL PRESELECTED applications of an offer
 * Backend: POST /api/hiring/{offerId}/deadlines/docs
 */
setDocumentsDeadline(
  offerId: number,
  documentsDeadlineIso: string
): Observable<void> {
  return this.http
    .post<void>(
      this.url(`/hiring/${offerId}/deadlines/docs`),
      {
        documentsDeadline: documentsDeadlineIso // ✅ MUST match backend DTO
      },
      this.opts()
    )
    .pipe(
      catchError(err => {
        console.error('setDocumentsDeadline() error', err);
        throw err;
      })
    );
}

listByStatus(offerId: number, status: ApplicationStatus): Observable<HiringApplicationView[]> {
  return this.http
    .get<HiringApplicationView[]>(this.url(`/hiring/${offerId}/status/${status}`), this.opts())
    .pipe(
      map(rows => Array.isArray(rows) ? rows : []),
      catchError(err => {
        console.error('listByStatus() error', err);
        return of([]);
      })
    );
}
elevateFromWaitingList(appId: number): Observable<void> {
  return this.http
    .post<void>(this.url(`/hiring/${appId}/elevate`), {}, this.opts())
    .pipe(
      catchError(err => {
        console.error('elevateFromWaitingList() error', err);
        throw err;
      })
    );
}
rejectBulk(appIds: number[]): Observable<void> {
  return this.http
    .post<void>(this.url(`/hiring/reject`), appIds ?? [], this.opts())
    .pipe(
      catchError(err => {
        console.error('rejectBulk() error', err);
        throw err;
      })
    );
}
downloadAllDocsZip(offerId: number): Observable<{ downloadUrl: string }> {
  return this.http
    .get<{ downloadUrl: string }>(this.url(`/hiring/${offerId}/zip-all`), this.opts())
    .pipe(
      catchError(err => {
        console.error('downloadAllDocsZip() error', err);
        throw err;
      })
    );
}
downloadStudentDocsZip(appId: number): Observable<{ downloadUrl: string }> {
  return this.http
    .get<{ downloadUrl: string }>(this.url(`/hiring/${appId}/zip`), this.opts())
    .pipe(
      catchError(err => {
        console.error('downloadStudentDocsZip() error', err);
        throw err;
      })
    );
}
getDownloadUrl(key: string): Observable<string> {
  return this.http
    .post<{ url: string }>(
      this.url('/uploads/download-url'),
      { key },
      this.opts()
    )
    .pipe(
      map(resp => resp.url),
      catchError(err => {
        console.error('download-url error', err);
        throw err;
      })
    );

}
getPresignedUrl(key: string): Observable<string> {
  return this.http
    .get<{ url: string }>(
      this.url(`/uploads/download-url?key=${encodeURIComponent(key)}`),
      this.opts()
    )
    .pipe(
      map(r => r.url),
      catchError(err => {
        console.error('download-url error', err);
        throw err;
      })
    );
}

moveToContract(appId: number): Observable<void> {
  return this.http
    .post<void>(this.url(`/hiring/${appId}/to-contract`), {}, this.opts())
    .pipe(
      catchError(err => {
        console.error('moveToContract() error', err);
        throw err;
      })
    );
}

getMyContractsForChefOption(): Observable<ChefOptionContractView[]> {
  return this.http
    .get<ChefOptionContractView[]>(
      this.url('/mobility-contract/chef-option/contracts'),
      this.opts()
    )
    .pipe(
      map(rows => Array.isArray(rows) ? rows : []),
      catchError(err => {
        console.error('getMyContractsForChefOption() error', err);
        return of([]);
      })
    );
}
approveContract(
  applicationId: number,
  note?: string
): Observable<void> {
  return this.http.post<void>(
    this.url(`/mobility-contract/chef-option/${applicationId}/approve`),
    null,
    {
      ...this.opts(),
      params: note ? { note } : {}
    }
  );
}
refuseContract(
  applicationId: number,
  note?: string
): Observable<void> {
  return this.http.post<void>(
    this.url(`/mobility-contract/chef-option/${applicationId}/refuse`),
    null,
    {
      ...this.opts(),
      params: note ? { note } : {}
    }
  );
}


}
