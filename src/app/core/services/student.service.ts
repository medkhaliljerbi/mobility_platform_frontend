import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type CertificateLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';

export interface Certificate {
  id: number;
  name: string;
  topics: string[];
  level: CertificateLevel;
  fileName: string;
  fileObjectKey?: string | null;
}

export interface ProfileDocument {
  id: number;
  fileName: string;
  fileObjectKey?: string | null;
}

export type StudentType = 'SORTANT' | 'ENTRANT';

// ===== Mobility Contract (Student POV) =====

export interface ChefOptionStudentView {
  id: number;
  fullName: string;
  field: string;
  option: string;
}

export interface StudentMobilityContractView {
  chefOptionId: number;
  chefOptionName: string;
  approved: boolean | null; // null = pending, true = approved, false = rejected
  contractDownloadUrl: string;
}

export interface StudentSelfView {
  // identity
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  studentIdentifier: string | null;
  type: 'SORTANT' | 'ENTRANT';

  // contact
  emailPersonnel: string | null;
  maritalStatus: string | null;
  personnelPhoneNumber: string | null;
  domicilePhoneNumber: string | null;

  // photo
  photoUrl?: string | null;
  avatarUrl?: string | null;
  photoObjectKey?: string | null;

  // SORTANT
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

  // ENTRANT
  homeUniversityName?: string | null;
  homeUniversityCountry?: string | null;
  homeDepartmentOrProgram?: string | null;
  nominationReference?: string | null;
  contactEmail?: string | null;
  mobilityStart?: string | null;
  mobilityEnd?: string | null;

  // === Year-based grades (NEW) ===
  firstYearGrade: number | null;
  secondYearGrade: number | null;
  thirdYearGrade: number | null;
  fourthYearGrade: number | null;
}

export interface StudentSelfUpdate {
  // contact
  emailPersonnel?: string | null;
  maritalStatus?: string | null;
  personnelPhoneNumber?: string | null;
  domicilePhoneNumber?: string | null;

  // SORTANT
  field?: StudentSelfView['field'];
  optionCode?: StudentSelfView['optionCode'];
  currentClass?: string | null;
  entryDate?: string | null;
  expectedExitDate?: string | null;

  // ENTRANT
  homeUniversityName?: string | null;
  homeUniversityCountry?: string | null;
  homeDepartmentOrProgram?: string | null;
  nominationReference?: string | null;
  contactEmail?: string | null;
  mobilityStart?: string | null;
  mobilityEnd?: string | null;

  // === Year-based grades (NEW) ===
  firstYearGrade?: number | null;
  secondYearGrade?: number | null;
  thirdYearGrade?: number | null;
  fourthYearGrade?: number | null;

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
// ===== Certificates =====
listCertificates() {
  return this.http.get<Certificate[]>(`${this.profileUrl}/files/certificates`, this.opts());
}

// create
createCertificate(file: File, name: string, topics: string[], level: CertificateLevel) {
  const form = new FormData();
  form.append('file', file);
  form.append('name', name);
  (topics ?? []).forEach(t => form.append('topics', t));       // ← repeat
  form.append('level', String(level));
  return this.http.post<Certificate>(`${this.profileUrl}/files/certificates`, form, this.opts());
}

// update info (PATCH)
updateCertificateInfo(id: number, params: { name?: string; topics?: string[]; level?: CertificateLevel }) {
  let httpParams = new HttpParams();
  if (params.name  != null) httpParams = httpParams.set('name', params.name);
  if (params.level != null) httpParams = httpParams.set('level', String(params.level));
  (params.topics ?? []).forEach(t => httpParams = httpParams.append('topics', t));   // ← repeat
  return this.http.patch<Certificate>(`${this.profileUrl}/files/certificates/${id}`, null, {
    ...this.opts(),
    params: httpParams,
  });
}


replaceCertificateFile(id: number, file: File) {
  const form = new FormData();
  form.append('file', file);
  return this.http.post<Certificate>(`${this.profileUrl}/files/certificates/${id}/file`, form, this.opts());
}

deleteCertificate(id: number) {
  return this.http.delete<void>(`${this.profileUrl}/files/certificates/${id}`, this.opts());
}

presignCertificateUrl(id: number) {
  return this.http.get(`${this.profileUrl}/files/certificates/${id}/url`, {
    ...this.opts(),
    responseType: 'text',
  });
}
countCertificates() {
  return this.http.get<number>(`${this.profileUrl}/files/certificates/count`, this.opts());
}
// ===== Documents =====
listDocuments() {
  return this.http.get<ProfileDocument[]>(`${this.profileUrl}/files/documents`, this.opts());
}

// replace your current createDocument(...)
createDocument(file: File, name: string) {
  const form = new FormData();
  form.append('file', file);
  form.append('name', name);
  return this.http.post<ProfileDocument>(`${this.profileUrl}/files/documents`, form, this.opts());
}


renameDocument(id: number, fileName: string) {
  const params = new HttpParams({ fromObject: { fileName } });
  return this.http.patch<ProfileDocument>(`${this.profileUrl}/files/documents/${id}`, null, {
    ...this.opts(),
    params,
  });
}

replaceDocumentFile(id: number, file: File) {
  const form = new FormData();
  form.append('file', file);
  return this.http.post<ProfileDocument>(`${this.profileUrl}/files/documents/${id}/file`, form, this.opts());
}

deleteDocument(id: number) {
  return this.http.delete<void>(`${this.profileUrl}/files/documents/${id}`, this.opts());
}

presignDocumentUrl(id: number) {
  return this.http.get(`${this.profileUrl}/files/documents/${id}/url`, {
    ...this.opts(),
    responseType: 'text',
  });
}
// ===== Applications =====

// HARD DELETE application (student only)
deleteMyApplication(appId: number) {
  return this.http.delete<{
    message: string;
    applicationId: number;
  }>(`${this.base}/applications/${appId}`, this.opts());
}
// =====================================================
// MOBILITY CONTRACT — STUDENT SIDE
// =====================================================

/**
 * Download the GENERIC mobility contract template
 * (uploaded by Mobility Officer)
 */
downloadMobilityContractTemplate(): Observable<string> {
  return this.http.get(
    `${this.base}/mobility-contract/template/download`,
    {
      ...this.opts(),
      responseType: 'text'
    }
  );
}

/**
 * List ChefOptions available for contract submission
 */
getChefOptionsForContract(): Observable<ChefOptionStudentView[]> {
  return this.http.get<ChefOptionStudentView[]>(
    `${this.base}/mobility-contract/chef-options`,
    this.opts()
  );
}

/**
 * Upload signed mobility contract to ONE ChefOption
 * → sets approved = null
 * → application status becomes CONTRACT_SUBMITTED (backend)
 */
uploadSignedMobilityContract(
  applicationId: number,
  chefOptionId: number,
  file: File
): Observable<void> {

  const form = new FormData();
  form.append('applicationId', String(applicationId));
  form.append('chefOptionId', String(chefOptionId));
  form.append('file', file);

  return this.http.post<void>(
    `${this.base}/mobility-contract/signed`,
    form,
    this.opts()
  );
}

/**
 * Get student mobility contract (if already submitted)
 * Used to:
 *  - disable upload
 *  - show approval / rejection
 */
getMyMobilityContract(
  applicationId: number
): Observable<StudentMobilityContractView | null> {

  return this.http.get<StudentMobilityContractView | null>(
    `${this.base}/mobility-contract/my`,
    {
      ...this.opts(),
      params: new HttpParams().set('applicationId', String(applicationId))
    }
  );
}

/**
 * Download the signed mobility contract uploaded by the student
 */
downloadMySignedMobilityContract(
  applicationId: number
): Observable<string> {

  return this.http.get(
    `${this.base}/mobility-contract/signed/download`,
    {
      ...this.opts(),
      params: new HttpParams().set('applicationId', String(applicationId)),
      responseType: 'text'
    }
  );
}

}
