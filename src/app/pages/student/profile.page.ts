import { Component, OnInit, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { StudentService, StudentSelfView, StudentSelfUpdate } from '@/core/services/student.service';

import { FluidModule } from 'primeng/fluid';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

type FieldType = 'IT' | 'TELECOM' | 'GC' | 'EM';
type OptionCodeType =
  | 'ERP_BI' | 'ARCTIC' | 'SAE' | 'SIM' | 'INFINI' | 'DS' | 'SE' | 'TWIN' | 'IA' | 'NIDS' | 'GAMIX' | 'DATA_IT' | 'SLEAM'
  | 'IOSYS' | 'DATA_TEL'
  | 'SO' | 'PC' | 'RN2E'
  | 'MECATRONIQUE' | 'OGI';

const FIELD_OPTIONS: { label: string; value: FieldType }[] = [
  { label: 'IT', value: 'IT' },
  { label: 'TELECOM', value: 'TELECOM' },
  { label: 'GC', value: 'GC' },
  { label: 'EM', value: 'EM' }
];

const OPTIONCODE_OPTIONS: { field: FieldType; value: OptionCodeType; label: string }[] = [
  // IT
  { field: 'IT', value: 'ERP_BI', label: 'ERP/BI : Enterprise Resource Planning - Business Intelligence' },
  { field: 'IT', value: 'ARCTIC', label: 'ArcTIC : Architecture IT & Cloud Computing' },
  { field: 'IT', value: 'SAE', label: 'SAE : Software Architecture Engineering' },
  { field: 'IT', value: 'SIM', label: 'SIM : Systèmes Informatiques et Mobiles' },
  { field: 'IT', value: 'INFINI', label: 'INFINI : Informatique Financière et Ingénierie' },
  { field: 'IT', value: 'DS', label: 'DS : Data Science' },
  { field: 'IT', value: 'SE', label: 'SE : Software Engineering' },
  { field: 'IT', value: 'TWIN', label: 'TWIN : Technologies du Web et de l\'INternet' },
  { field: 'IT', value: 'IA', label: 'IA : Intelligence Artificielle' },
  { field: 'IT', value: 'NIDS', label: 'NIDS : Network Infrastructure Data Security' },
  { field: 'IT', value: 'GAMIX', label: 'GAMIX : Game development & Immersive eXperience' },
  { field: 'IT', value: 'DATA_IT', label: 'DATA : Data Analytics (IT)' },
  { field: 'IT', value: 'SLEAM', label: 'SLEAM : Système et Logiciel Embarqué Ambiant et Mobile' },
  // TELECOM
  { field: 'TELECOM', value: 'IOSYS', label: 'IoSyS : Internet of Things Systems & Services' },
  { field: 'TELECOM', value: 'DATA_TEL', label: 'DATA : Data Analytics for Telecommunications Applications' },
  // GC
  { field: 'GC', value: 'SO', label: 'SO : Structures et Ouvrages' },
  { field: 'GC', value: 'PC', label: 'PC : Ponts et Chaussées' },
  { field: 'GC', value: 'RN2E', label: 'RN2E : Ressources naturelles & études énergétiques' },
  // EM
  { field: 'EM', value: 'MECATRONIQUE', label: 'Mécatronique' },
  { field: 'EM', value: 'OGI', label: 'OGI : Organisation et Gestion Industrielles' }
];

const MARITAL_STATUS_OPTIONS = [
  { label: 'Married',     value: 'Married' },
  { label: 'Not married', value: 'Not married' }
];

@Component({
  selector: 'app-student-profile-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule,
    FluidModule, CardModule, ButtonModule, InputTextModule, SelectModule,
    DatePickerModule, InputNumberModule, ToastModule
  ],
  providers: [MessageService],
  styles: [`
  /* Layout */
  .page { display:flex; justify-content:center; padding:.5rem; }
  .shell { width:100%; max-width:1120px; margin:0 auto; } /* was 720px */

  /* Card header */
  .card-title { display:flex; justify-content:space-between; align-items:center; }
  .title { font-weight:700; font-size:1.25rem; } /* bigger title */

  /* Avatar */
  .avatar {
    margin: 20px auto 8px auto;
    width: 180px; height: 180px;                 /* bigger avatar */
    border-radius: 9999px; overflow: hidden;
    border: 1px solid var(--surface-300);
    position: relative; background: #1f2937;
    display:flex; align-items:center; justify-content:center;
  }
  .avatar img { width:100%; height:100%; object-fit:cover; display:block; }
  .avatar i { font-size:2.25rem; color:#cbd5e1; }
  .overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:.5rem;
             background:rgba(0,0,0,.55); opacity:0; transition:opacity .15s; }
  .avatar:hover .overlay { opacity:1; }

  /* Form blocks */
  .form-section { margin-top:.75rem; }
  .group { display:flex; flex-direction:column; gap:.6rem; }
  .ctrl { width:100%; font-size:1rem; }          /* bigger input text */
  .field { display:flex; flex-direction:column; gap:.35rem; }
  .label { font-size:1rem; font-weight:600; color:var(--text-color); } /* bigger labels */

  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  @media (max-width: 640px) {
    .grid-2 { grid-template-columns:1fr; }
    .shell { max-width:100%; }
  }

  /* Readonly look */
  input.identity[readonly] {
    background: var(--surface-100);
    color: var(--text-color-secondary);
  }

  /* Keep form enabled visuals when page is in "locked" mode */
  .locked, .locked * { pointer-events: none !important; }
  .locked .p-inputtext,
  .locked .p-inputnumber-input,
  .locked .p-dropdown-label,
  .locked .p-calendar .p-inputtext {
    opacity: 1 !important;
    background: var(--surface-0) !important;
    color: inherit !important;
  }

  /* PrimeNG control sizing (needs ::ng-deep to reach inside) */
  :host ::ng-deep .p-inputtext,
  :host ::ng-deep .p-inputnumber-input,
  :host ::ng-deep .p-dropdown .p-dropdown-label,
  :host ::ng-deep .p-calendar .p-inputtext {
    font-size: 1rem;
    padding: .8rem .75rem;                         /* slightly taller */
  }

  /* Trim card’s inner padding a bit so content feels wider */
  :host ::ng-deep .p-card .p-card-body { padding: 1rem 1.25rem; }
  :host ::ng-deep .p-card .p-card-title { font-size: 1.25rem; }
`],
  template: `
<p-fluid>
  <div class="page bg-surface-50 dark:bg-surface-950">
    <div class="shell">
      <p-card>
        <ng-template pTemplate="title">
          <div class="card-title">
            <span class="title">My Profile</span>
            <span class="flex gap-2">
              <button *ngIf="!editing()" pButton label="Edit" icon="pi pi-pencil" (click)="onEdit()"></button>
              <button *ngIf="editing()" pButton class="p-button-secondary" label="Cancel" icon="pi pi-times" (click)="onCancel()"></button>
              <button *ngIf="editing()" pButton class="p-button-success" label="Save" icon="pi pi-check"
                      (click)="onSave()"
                      [disabled]="!form.dirty || form.invalid || busy()"></button>
            </span>
          </div>
        </ng-template>

        <!-- Avatar -->
        <div class="avatar">
          <ng-container *ngIf="hasAvatar(); else placeholderIcon">
            <img [src]="avatarUrl()" alt="avatar" (error)="onImgError($event)" />
          </ng-container>
          <ng-template #placeholderIcon>
            <i class="pi pi-user"></i>
          </ng-template>
          <div class="overlay">
            <button pButton icon="pi pi-upload" class="p-button-rounded p-button-sm" (click)="file.click()"></button>
            <button pButton icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-sm" (click)="removeAvatar()" [disabled]="busy()"></button>
            <input #file type="file" accept="image/*" (change)="uploadAvatar($event)" hidden />
          </div>
        </div>

        <!-- Identity (always read-only) -->
        <div class="form-section group">
          <div class="field">
            <div class="label">Esprit Email</div>
            <input pInputText [value]="m()?.email ?? ''" class="ctrl identity" readonly />
          </div>

          <div class="grid-2">
            <div class="field" *ngIf="isSortant()">
              <div class="label">Esprit ID</div>
              <input pInputText [value]="espritId() ?? ''" class="ctrl identity" readonly />
            </div>
            <div class="field">
              <div class="label">Student Type</div>
              <input pInputText [value]="m()?.type ?? ''" class="ctrl identity" readonly />
            </div>
            <div class="field">
              <div class="label">First Name</div>
              <input pInputText [value]="m()?.firstName ?? ''" class="ctrl identity" readonly />
            </div>
            <div class="field">
              <div class="label">Middle Name</div>
              <input pInputText [value]="m()?.middleName ?? ''" class="ctrl identity" readonly />
            </div>
            <div class="field">
              <div class="label">Last Name</div>
              <input pInputText [value]="m()?.lastName ?? ''" class="ctrl identity" readonly />
            </div>
          </div>
        </div>

        <!-- Editable form -->
        <div class="form-section">
          <form [formGroup]="form" class="group">

            <!-- Contact -->
            <div class="field">
              <div class="label">Personal Email</div>
              <input pInputText formControlName="emailPersonnel" class="ctrl" [readonly]="!editing()" />
            </div>

            <div class="grid-2">
              <div class="field">
                <div class="label">Phone (Personal) *</div>
                <input pInputText formControlName="personnelPhoneNumber" class="ctrl" [readonly]="!editing()" />
              </div>
              <div class="field">
                <div class="label">Phone (Home)</div>
                <input pInputText formControlName="domicilePhoneNumber" class="ctrl" [readonly]="!editing()" />
              </div>
            </div>

            <div class="field" [class.locked]="!editing()">
              <div class="label">Marital Status</div>
              <p-select formControlName="maritalStatus"
                        [options]="maritalOptions"
                        optionLabel="label" optionValue="value"
                        class="ctrl">
              </p-select>
            </div>

            <!-- SORTANT (Esprit Enrollment) -->
            <div class="grid-2" *ngIf="isSortant()">
              <div class="field" [class.locked]="!editing()">
                <div class="label">Field</div>
                <p-select formControlName="field"
                          [options]="fieldOptions"
                          optionLabel="label" optionValue="value"
                          class="ctrl">
                </p-select>
              </div>

              <div class="field" [class.locked]="!editing()">
                <div class="label">Option Code</div>
                <p-select formControlName="optionCode"
                          [options]="filteredOptionCodes()"
                          optionLabel="label" optionValue="value"
                          class="ctrl">
                </p-select>
              </div>

              <div class="field">
                <div class="label">Current Class</div>
                <input pInputText formControlName="currentClass" class="ctrl" [readonly]="!editing()" />
              </div>

              <div class="field" [class.locked]="!editing()">
                <div class="label">Entry Date</div>
                <p-datepicker formControlName="entryDate" dateFormat="yy-mm-dd" class="ctrl"></p-datepicker>
              </div>
              <div class="field" [class.locked]="!editing()">
                <div class="label">Expected Exit Date</div>
                <p-datepicker formControlName="expectedExitDate" dateFormat="yy-mm-dd" class="ctrl"></p-datepicker>
              </div>
            </div>

            <!-- ENTRANT (Incoming Mobility) -->
            <div class="grid-2" *ngIf="isEntrant()">
              <div class="field">
                <div class="label">Home University</div>
                <input pInputText formControlName="homeUniversityName" class="ctrl" [readonly]="!editing()" />
              </div>
              <div class="field">
                <div class="label">Home Country</div>
                <input pInputText formControlName="homeUniversityCountry" class="ctrl" [readonly]="!editing()" />
              </div>
              <div class="field">
                <div class="label">Home Department/Program</div>
                <input pInputText formControlName="homeDepartmentOrProgram" class="ctrl" [readonly]="!editing()" />
              </div>
              <div class="field">
                <div class="label">Nomination Reference</div>
                <input pInputText formControlName="nominationReference" class="ctrl" [readonly]="!editing()" />
              </div>
              <div class="field">
                <div class="label">Contact Email</div>
                <input pInputText formControlName="contactEmail" class="ctrl" [readonly]="!editing()" />
              </div>
              <div class="field" [class.locked]="!editing()">
                <div class="label">Mobility Start</div>
                <p-datepicker formControlName="mobilityStart" dateFormat="yy-mm-dd" class="ctrl"></p-datepicker>
              </div>
              <div class="field" [class.locked]="!editing()">
                <div class="label">Mobility End</div>
                <p-datepicker formControlName="mobilityEnd" dateFormat="yy-mm-dd" class="ctrl"></p-datepicker>
              </div>
            </div>

            <!-- Grades (Year-based) — only for SORTANT -->
            <div class="grades" *ngIf="isSortant()">
              <div class="field" [class.locked]="!editing()">
                <div class="label">First Year *</div>
                <p-inputNumber formControlName="firstYearGrade"
                               mode="decimal" [min]="0" [max]="20" [step]="0.01"
                               locale="fr-FR" [minFractionDigits]="0" [maxFractionDigits]="2"
                               [useGrouping]="false" [showButtons]="true" inputId="y1">
                </p-inputNumber>
              </div>
              <div class="field" [class.locked]="!editing()">
                <div class="label">Second Year *</div>
                <p-inputNumber formControlName="secondYearGrade"
                               mode="decimal" [min]="0" [max]="20" [step]="0.01"
                               locale="fr-FR" [minFractionDigits]="0" [maxFractionDigits]="2"
                               [useGrouping]="false" [showButtons]="true" inputId="y2">
                </p-inputNumber>
              </div>
              <div class="field" [class.locked]="!editing()">
                <div class="label">Third Year</div>
                <p-inputNumber formControlName="thirdYearGrade"
                               mode="decimal" [min]="0" [max]="20" [step]="0.01"
                               locale="fr-FR" [minFractionDigits]="0" [maxFractionDigits]="2"
                               [useGrouping]="false" [showButtons]="true" inputId="y3">
                </p-inputNumber>
              </div>
              <div class="field" [class.locked]="!editing()">
                <div class="label">Fourth Year</div>
                <p-inputNumber formControlName="fourthYearGrade"
                               mode="decimal" [min]="0" [max]="20" [step]="0.01"
                               locale="fr-FR" [minFractionDigits]="0" [maxFractionDigits]="2"
                               [useGrouping]="false" [showButtons]="true" inputId="y4">
                </p-inputNumber>
              </div>
            </div>

          </form>
        </div>

      </p-card>
    </div>
  </div>
</p-fluid>

<p-toast></p-toast>
  `
})
export class StudentProfilePageComponent implements OnInit {
  @ViewChild('file') fileInput!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private api = inject(StudentService);
  private toast = inject(MessageService);

  m = signal<StudentSelfView | null>(null);
  busy = signal(false);
  editing = signal(false);

  espritId = signal<string | null>(null);

  fieldOptions = FIELD_OPTIONS;
  maritalOptions = MARITAL_STATUS_OPTIONS;

  isSortant = computed(() => this.m()?.type === 'SORTANT');
  isEntrant  = computed(() => this.m()?.type === 'ENTRANT');

  form = this.fb.group({
    // contact
    emailPersonnel: [''],
    personnelPhoneNumber: ['', Validators.required],
    domicilePhoneNumber: [''],
    maritalStatus: [''],

    // SORTANT
    field: <FieldType | null>(null),
    optionCode: <OptionCodeType | null>(null),
    currentClass: [''],
    entryDate: <Date | null>(null),
    expectedExitDate: <Date | null>(null),

    // ENTRANT
    homeUniversityName: [''],
    homeUniversityCountry: [''],
    homeDepartmentOrProgram: [''],
    nominationReference: [''],
    contactEmail: [''],
    mobilityStart: <Date | null>(null),
    mobilityEnd: <Date | null>(null),

    // Year-based grades
    firstYearGrade:  <any>[null, [Validators.required, Validators.min(0), Validators.max(20)]],
    secondYearGrade: <any>[null, [Validators.required, Validators.min(0), Validators.max(20)]],
    thirdYearGrade:  <any>[null, [Validators.min(0), Validators.max(20)]],
    fourthYearGrade: <any>[null, [Validators.min(0), Validators.max(20)]]
  });

  filteredOptionCodes = computed(() => {
    const f = this.form.get('field')?.value as FieldType | null;
    return (f ? OPTIONCODE_OPTIONS.filter(o => o.field === f) : OPTIONCODE_OPTIONS)
      .map(o => ({ label: `${o.value} — ${o.label}`, value: o.value }));
  });

  ngOnInit(): void {
    this.form.get('field')?.valueChanges.subscribe((f) => {
      const oc = this.form.get('optionCode')?.value as OptionCodeType | null;
      if (oc && !OPTIONCODE_OPTIONS.some(o => o.field === f && o.value === oc)) {
        this.form.get('optionCode')?.setValue(null);
      }
    });

    this.api.getMe().subscribe({
      next: (me) => {
        this.m.set(me);
        this.espritId.set(me.studentIdentifier ?? null);
        this.patchFromModel(me);

        // Adjust grade validators based on type so ENTRANT doesn't get blocked
        this.setGradeValidators(me.type === 'SORTANT');
      },
      error: (err) => this.toast.add({ severity: 'error', summary: 'Load failed', detail: this.err(err) })
    });
  }

  onEdit()  { this.editing.set(true); this.form.markAsPristine(); }
  onCancel(){ this.editing.set(false); this.patchFromModel(this.m()!); this.form.markAsPristine(); }

  onSave() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy.set(true);

    const f = this.form;
    const v = f.value as any;
    const payload: StudentSelfUpdate = {};

    const setIfDirty = <K extends keyof StudentSelfUpdate>(ctrl: string, key: K, val: StudentSelfUpdate[K]) => {
      if (f.get(ctrl)?.dirty) (payload as any)[key] = val;
    };

    // contact
    setIfDirty('emailPersonnel',      'emailPersonnel',      v.emailPersonnel ?? null);
    setIfDirty('personnelPhoneNumber','personnelPhoneNumber',v.personnelPhoneNumber ?? null);
    setIfDirty('domicilePhoneNumber', 'domicilePhoneNumber', v.domicilePhoneNumber ?? null);
    setIfDirty('maritalStatus',       'maritalStatus',       v.maritalStatus ?? null);

    // SORTANT
    setIfDirty('field',               'field',               v.field ?? null);
    setIfDirty('optionCode',          'optionCode',          v.optionCode ?? null);
    setIfDirty('currentClass',        'currentClass',        v.currentClass ?? null);
    setIfDirty('entryDate',           'entryDate',           v.entryDate ? this.ymd(v.entryDate as Date) : null);
    setIfDirty('expectedExitDate',    'expectedExitDate',    v.expectedExitDate ? this.ymd(v.expectedExitDate as Date) : null);

    // ENTRANT
    setIfDirty('homeUniversityName',      'homeUniversityName',      v.homeUniversityName ?? null);
    setIfDirty('homeUniversityCountry',   'homeUniversityCountry',   v.homeUniversityCountry ?? null);
    setIfDirty('homeDepartmentOrProgram', 'homeDepartmentOrProgram', v.homeDepartmentOrProgram ?? null);
    setIfDirty('nominationReference',     'nominationReference',     v.nominationReference ?? null);
    setIfDirty('contactEmail',            'contactEmail',            v.contactEmail ?? null);
    setIfDirty('mobilityStart',           'mobilityStart',           v.mobilityStart ? this.ymd(v.mobilityStart as Date) : null);
    setIfDirty('mobilityEnd',             'mobilityEnd',             v.mobilityEnd ? this.ymd(v.mobilityEnd as Date) : null);

    // Grades
    setIfDirty('firstYearGrade',  'firstYearGrade',  typeof v.firstYearGrade  === 'number' ? v.firstYearGrade  : null);
    setIfDirty('secondYearGrade', 'secondYearGrade', typeof v.secondYearGrade === 'number' ? v.secondYearGrade : null);
    setIfDirty('thirdYearGrade',  'thirdYearGrade',  typeof v.thirdYearGrade  === 'number' ? v.thirdYearGrade  : null);
    setIfDirty('fourthYearGrade', 'fourthYearGrade', typeof v.fourthYearGrade === 'number' ? v.fourthYearGrade : null);

    this.api.updateMe(payload).subscribe({
      next: (res) => {
        this.m.set(res);
        this.espritId.set(res.studentIdentifier ?? null);
        this.toast.add({ severity:'success', summary:'Saved', detail:'Profile updated' });
        this.busy.set(false);
        this.editing.set(false);
        this.form.markAsPristine();
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.add({ severity:'error', summary:'Save failed', detail:this.err(err) });
      }
    });
  }

  // avatar helpers
  hasAvatar(): boolean { return !!(this.m()?.photoUrl || this.m()?.avatarUrl); }
  avatarUrl(): string { return this.m()?.photoUrl || this.m()?.avatarUrl || ''; }
  onImgError(e:any){ e.target.style.display='none'; }

  uploadAvatar(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.busy.set(true);
    this.api.uploadAvatar(f).subscribe({
      next: (me) => { this.m.set(me); this.espritId.set(me.studentIdentifier ?? null); this.busy.set(false);
        this.toast.add({ severity:'success', summary:'Avatar', detail:'Photo uploaded' });
        (ev.target as HTMLInputElement).value=''; },
      error: (err) => { this.busy.set(false); this.toast.add({ severity:'error', summary:'Upload failed', detail:this.err(err) }); }
    });
  }
  removeAvatar() {
    this.busy.set(true);
    this.api.deleteAvatar().subscribe({
      next: (me) => { this.m.set(me); this.espritId.set(me.studentIdentifier ?? null); this.busy.set(false);
        this.toast.add({ severity:'success', summary:'Avatar', detail:'Photo removed' }); },
      error: (err) => { this.busy.set(false); this.toast.add({ severity:'error', summary:'Remove failed', detail:this.err(err) }); }
    });
  }

  private patchFromModel(me: StudentSelfView) {
    const ms = (me.maritalStatus || '').trim();
    const normalizedMarital =
      (ms === 'Mr' || ms === 'Mrs' || ms.toLowerCase() === 'married') ? 'Married' :
      (ms.toLowerCase() === 'single' || ms.toLowerCase() === 'not married') ? 'Not married' :
      '';

    this.form.reset({
      // contact
      emailPersonnel: me.emailPersonnel ?? '',
      maritalStatus: normalizedMarital,
      personnelPhoneNumber: me.personnelPhoneNumber ?? '',
      domicilePhoneNumber: me.domicilePhoneNumber ?? '',

      // SORTANT
      field: (me.field ?? null) as FieldType | null,
      optionCode: (me.optionCode ?? null) as OptionCodeType | null,
      currentClass: me.currentClass ?? '',
      entryDate: me.entryDate ? new Date(me.entryDate) : null,
      expectedExitDate: me.expectedExitDate ? new Date(me.expectedExitDate) : null,

      // ENTRANT
      homeUniversityName: me.homeUniversityName ?? '',
      homeUniversityCountry: me.homeUniversityCountry ?? '',
      homeDepartmentOrProgram: me.homeDepartmentOrProgram ?? '',
      nominationReference: me.nominationReference ?? '',
      contactEmail: me.contactEmail ?? '',
      mobilityStart: me.mobilityStart ? new Date(me.mobilityStart) : null,
      mobilityEnd: me.mobilityEnd ? new Date(me.mobilityEnd) : null,

      // Grades
      firstYearGrade:  me.firstYearGrade ?? null,
      secondYearGrade: me.secondYearGrade ?? null,
      thirdYearGrade:  me.thirdYearGrade ?? null,
      fourthYearGrade: me.fourthYearGrade ?? null
    });
  }

  private setGradeValidators(isSortant: boolean) {
    const y1 = this.form.get('firstYearGrade')!;
    const y2 = this.form.get('secondYearGrade')!;
    const y3 = this.form.get('thirdYearGrade')!;
    const y4 = this.form.get('fourthYearGrade')!;

    if (isSortant) {
      y1.setValidators([Validators.required, Validators.min(0), Validators.max(20)]);
      y2.setValidators([Validators.required, Validators.min(0), Validators.max(20)]);
    } else {
      // entrant: grades can all be null (no required)
      y1.setValidators([Validators.min(0), Validators.max(20)]);
      y2.setValidators([Validators.min(0), Validators.max(20)]);
    }
    y3.setValidators([Validators.min(0), Validators.max(20)]);
    y4.setValidators([Validators.min(0), Validators.max(20)]);

    y1.updateValueAndValidity({ emitEvent: false });
    y2.updateValueAndValidity({ emitEvent: false });
    y3.updateValueAndValidity({ emitEvent: false });
    y4.updateValueAndValidity({ emitEvent: false });
  }

  private ymd(d: Date){ const y=d.getFullYear(), m=(d.getMonth()+1).toString().padStart(2,'0'), da=d.getDate().toString().padStart(2,'0'); return `${y}-${m}-${da}`; }
  private err(e:any){ return e?.error?.message || e?.message || 'Unexpected error'; }
}
