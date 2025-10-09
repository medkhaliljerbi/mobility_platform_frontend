import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type StudentType = 'SORTANT' | 'ENTRANT';

export interface StudentSelfView {
  // identity
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  studentIdentifier: string | null; // only for SORTANT
  type: StudentType;                // NEW

  // contact
  emailPersonnel: string | null;
  maritalStatus: string | null;
  personnelPhoneNumber: string | null;
  domicilePhoneNumber: string | null;

  // photo
  photoUrl?: string | null;
  avatarUrl?: string | null;
  photoObjectKey?: string | null;

  // SORTANT (EspritEnrollment)
  entryDate: string | null;
  expectedExitDate: string | null;

  field: 'IT' | 'TELECOM' | 'GC' | 'EM' | null;
  optionCode:
    | 'ERP_BI' | 'ARCTIC' | 'SAE' | 'SIM' | 'INFINI' | 'DS' | 'SE' | 'TWIN' | 'IA' | 'NIDS' | 'GAMIX' | 'DATA_IT' | 'SLEAM'
    | 'IOSYS' | 'DATA_TEL'
    | 'SO' | 'PC' | 'RN2E'
    | 'MECATRONIQUE' | 'OGI'
    | null;

  currentClass: string | null;

  // ENTRANT (IncomingMobility) — NEW
  homeUniversityName?: string | null;
  homeUniversityCountry?: string | null;
  homeDepartmentOrProgram?: string | null;
  nominationReference?: string | null;
  contactEmail?: string | null;
  mobilityStart?: string | null; // yyyy-MM-dd
  mobilityEnd?: string | null;   // yyyy-MM-dd

  // grades
  semester1Grade: number | null;
  semester2Grade: number | null;
  semester3Grade: number | null;
  semester4Grade: number | null;
  semester5Grade: number | null;
}

export interface StudentSelfUpdate {
  // contact
  emailPersonnel?: string | null;
  maritalStatus?: string | null;
  personnelPhoneNumber?: string | null;
  domicilePhoneNumber?: string | null;

  // SORTANT (EspritEnrollment)
  field?: StudentSelfView['field'];
  optionCode?: StudentSelfView['optionCode'];
  currentClass?: string | null;
  entryDate?: string | null;
  expectedExitDate?: string | null;

  // ENTRANT (IncomingMobility) — NEW
  homeUniversityName?: string | null;
  homeUniversityCountry?: string | null;
  homeDepartmentOrProgram?: string | null;
  nominationReference?: string | null;
  contactEmail?: string | null;
  mobilityStart?: string | null;
  mobilityEnd?: string | null;

  // grades
  semester1Grade?: number | null;
  semester2Grade?: number | null;
  semester3Grade?: number | null;
  semester4Grade?: number | null;
  semester5Grade?: number | null;

  // photo
  photoObjectKey?: string | null;
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBase.replace(/\/+$/, '') + '/api';

  private url(p: string) { return `${this.base}/${p.replace(/^\/+/, '')}`; }

  private readonly profileUrl = this.url('/student/profile');
  private readonly avatarUploadUrl = this.url('/student/profile/photo/upload');

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

  getMe(): Observable<StudentSelfView> {
    return this.http.get<StudentSelfView>(this.profileUrl, this.opts());
  }

  updateMe(payload: StudentSelfUpdate): Observable<StudentSelfView> {
    return this.http.post<StudentSelfView>(this.profileUrl, payload, this.opts());
  }

  getStudentProfile(): Observable<StudentSelfView> {
    return this.http.get<StudentSelfView>(this.profileUrl, this.opts());
  }

  uploadAvatar(file: File): Observable<StudentSelfView> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<StudentSelfView>(this.avatarUploadUrl, form, this.opts());
  }

  deleteAvatar(): Observable<StudentSelfView> {
    return this.updateMe({ photoObjectKey: null });
  }
}
