import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { RouterModule } from '@angular/router';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from 'src/app/core/services/auth.service';

/** Backend enums – use exact enum names your server expects */
type Role =
  | 'STUDENT'
  | 'TEACHER'
  | 'PARTNER'
  | 'MOBILITY_OFFICER'
  | 'CHEF_OPTION'
  | 'ADMIN';

type StudentType = 'ENTRANT' | 'SORTANT';

/** Your Field/OptionCode enums are server-side; send their names as strings */
type Field = string;
type OptionCode = string;

/** Shape that matches your SignupRequest (dates will be formatted to yyyy-MM-dd) */
interface SignupFormModel {
  // common
  username: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  personalEmail: string | null;
  role: Role | '';
  password: string;
  maritalStatus: string | null;
  personnelPhoneNumber: string;
  domicilePhoneNumber: string | null;

  // student-only
  type: StudentType | null;

  // SORTANT
  department: string | null;
  entryDate: Date | null;            // UI uses Date; will be sent as yyyy-MM-dd
  expectedExitDate: Date | null;
  studentIdentifier: string | null;

  // ENTRANT
  contactEmail: string | null;
  homeDepartmentOrProgram: string | null;
  homeUniversityName: string | null;
  homeUniversityCountry: string | null;
  mobilityStart: Date | null;
  mobilityEnd: Date | null;
  nominationReference: string | null;

  // teacher
  fields: Field[] | null;

  // chef option
  option: OptionCode | null;

  // officer
  officeDepartment: string | null;

  // partner
  universityName: string | null;
  country: string | null;
  website: string | null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,

    // PrimeNG
    InputTextModule,
    PasswordModule,
    RippleModule,
    DialogModule,
    DividerModule,
    DatePickerModule,
    SelectModule,
    MultiSelectModule,
    ButtonModule,
    ToastModule,

    AppFloatingConfigurator
  ],
  providers: [MessageService],
  template: `
    <app-floating-configurator />

    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
      <div class="flex flex-col items-center justify-center">
        <div style="border-radius:56px;padding:0.3rem;background:linear-gradient(180deg,var(--primary-color) 10%, rgba(33,150,243,0) 30%)">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-10 px-6 sm:px-12" style="border-radius:53px;max-width:860px;">
            <div class="text-center mb-6">
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">Create your account</div>
              <span class="text-muted-color font-medium">Fill the form to sign up</span>
            </div>

            <p-toast></p-toast>

            <form #f="ngForm" (ngSubmit)="onSubmit(f)">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

                <!-- Username -->
                <div>
                  <label class="block text-sm mb-2">Username *</label>
                  <input pInputText name="username" [(ngModel)]="m.username" required minlength="3" maxlength="50" class="w-full" #username="ngModel" />
                  <small class="err" *ngIf="invalid(username)">Username 3–50 chars.</small>
                </div>

                <!-- Role -->
                <div>
                  <label class="block text-sm mb-2">Role *</label>
                  <p-select name="role" [(ngModel)]="m.role" [options]="roleOptions" optionLabel="label" optionValue="value"
                            placeholder="Select role" appendTo="body" class="w-full" required #role="ngModel">
                  </p-select>
                  <small class="err" *ngIf="invalid(role)">Role is required.</small>
                </div>

                <!-- First / Middle / Last -->
                <div>
                  <label class="block text-sm mb-2">First Name *</label>
                  <input pInputText name="firstName" [(ngModel)]="m.firstName" required class="w-full" #firstName="ngModel"/>
                  <small class="err" *ngIf="invalid(firstName)">First name required.</small>
                </div>

                <div>
                  <label class="block text-sm mb-2">Middle Name</label>
                  <input pInputText name="middleName" [(ngModel)]="m.middleName" class="w-full"/>
                </div>

                <div>
                  <label class="block text-sm mb-2">Last Name *</label>
                  <input pInputText name="lastName" [(ngModel)]="m.lastName" required class="w-full" #lastName="ngModel"/>
                  <small class="err" *ngIf="invalid(lastName)">Last name required.</small>
                </div>

                <!-- Emails -->
                <div>
                  <label class="block text-sm mb-2">Email *</label>
                  <input pInputText type="email" name="email" [(ngModel)]="m.email" required email class="w-full" #email="ngModel"/>
                  <small class="err" *ngIf="email.errors?.['required'] && touched(email)">Email required.</small>
                  <small class="err" *ngIf="!email.errors?.['required'] && email.invalid && touched(email)">Invalid email.</small>
                </div>

                <div>
                  <label class="block text-sm mb-2">Personal Email</label>
                  <input pInputText type="email" name="personalEmail" [(ngModel)]="m.personalEmail" email class="w-full" #pemail="ngModel"/>
                  <small class="err" *ngIf="pemail.value && pemail.invalid && touched(pemail)">Invalid email.</small>
                </div>

                <!-- Password -->
                <div class="md:col-span-2">
                  <label class="block text-sm mb-2">Password *</label>
                  <p-password
                    name="password"
                    [(ngModel)]="m.password"
                    [toggleMask]="true"
                    [feedback]="false"
                    [inputStyleClass]="'w-full'"
                    required
                    [minlength]="6"
                    [maxlength]="40"
                    #pwd="ngModel">
                  </p-password>
                  <small class="hint">Min 6 chars, max 40.</small>
                  <small class="err" *ngIf="pwd.errors?.['required'] && touched(pwd)">Password required.</small>
                  <small class="err" *ngIf="(pwd.errors?.['minlength'] || pwd.errors?.['maxlength']) && touched(pwd)">Password length invalid.</small>
                </div>

                <!-- Phones -->
                <div>
                  <label class="block text-sm mb-2">Personnel Phone *</label>
                  <input pInputText name="personnelPhoneNumber" [(ngModel)]="m.personnelPhoneNumber"
                         required [pattern]="phonePattern" class="w-full" #pp="ngModel"/>
                  <small class="hint">Accepts +, spaces, dashes. ≥7 digits.</small>
                  <small class="err" *ngIf="invalid(pp)">Valid phone required.</small>
                </div>

                <div>
                  <label class="block text-sm mb-2">Domicile Phone</label>
                  <input pInputText name="domicilePhoneNumber" [(ngModel)]="m.domicilePhoneNumber"
                         [pattern]="phonePattern" class="w-full" #dp="ngModel"/>
                  <small class="hint">Optional. Accepts +, spaces, dashes. ≥7 digits.</small>
                  <small class="err" *ngIf="dp.value && dp.invalid && touched(dp)">Invalid phone.</small>
                </div>

                <!-- Marital Status (optional) -->
                <div class="md:col-span-2">
                  <label class="block text-sm mb-2">Marital Status</label>
                  <p-select name="maritalStatus" [(ngModel)]="m.maritalStatus" [options]="maritalOptions"
                            optionLabel="label" optionValue="value" placeholder="Select status" appendTo="body" class="w-full">
                  </p-select>
                </div>

                <!-- === STUDENT-ONLY SWITCH === -->
                <ng-container *ngIf="m.role === 'STUDENT'">

                  <div class="md:col-span-2">
                    <label class="block text-sm mb-2">Student Type *</label>
                    <p-select name="type"
                              [(ngModel)]="m.type"
                              [options]="studentTypeOptions"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="Select type"
                              appendTo="body"
                              class="w-full"
                              required
                              #stype="ngModel">
                    </p-select>
                    <small class="err" *ngIf="invalid(stype)">Student type is required.</small>
                  </div>

                  <!-- SORTANT (Esprit student) -->
                  <ng-container *ngIf="m.type === 'SORTANT'">
                    <div>
                      <label class="block text-sm mb-2">Department</label>
                      <input pInputText name="department" [(ngModel)]="m.department" class="w-full"/>
                    </div>

                    <div>
                      <label class="block text-sm mb-2">Student Identifier</label>
                      <input pInputText name="studentIdentifier" [(ngModel)]="m.studentIdentifier" class="w-full"/>
                    </div>

                    <div>
                      <label class="block text-sm mb-2">Entry Date</label>
                      <p-datepicker name="entryDate" [(ngModel)]="m.entryDate" dateFormat="yy-mm-dd" class="w-full">
                        <ng-template pTemplate="inputicon"><i class="pi pi-calendar"></i></ng-template>
                      </p-datepicker>
                    </div>

                    <div>
                      <label class="block text-sm mb-2">Expected Exit Date</label>
                      <p-datepicker name="expectedExitDate" [(ngModel)]="m.expectedExitDate" dateFormat="yy-mm-dd" class="w-full">
                        <ng-template pTemplate="inputicon"><i class="pi pi-calendar"></i></ng-template>
                      </p-datepicker>
                    </div>
                  </ng-container>

                  <!-- ENTRANT (Incoming student) -->
                  <ng-container *ngIf="m.type === 'ENTRANT'">
                    <div>
                      <label class="block text-sm mb-2">Contact Email</label>
                      <input pInputText type="email" name="contactEmail" [(ngModel)]="m.contactEmail" email class="w-full"/>
                    </div>

                    <div>
                      <label class="block text-sm mb-2">Home Department/Program</label>
                      <input pInputText name="homeDepartmentOrProgram" [(ngModel)]="m.homeDepartmentOrProgram" class="w-full"/>
                    </div>

                    <div>
                      <label class="block text-sm mb-2">Home University</label>
                      <input pInputText name="homeUniversityName" [(ngModel)]="m.homeUniversityName" class="w-full"/>
                    </div>

                    <div>
                      <label class="block text-sm mb-2">Home Country</label>
                      <input pInputText name="homeUniversityCountry" [(ngModel)]="m.homeUniversityCountry" class="w-full"/>
                    </div>

                    <div>
                      <label class="block text-sm mb-2">Mobility Start</label>
                      <p-datepicker name="mobilityStart" [(ngModel)]="m.mobilityStart" dateFormat="yy-mm-dd" class="w-full">
                        <ng-template pTemplate="inputicon"><i class="pi pi-calendar"></i></ng-template>
                      </p-datepicker>
                    </div>

                    <div>
                      <label class="block text-sm mb-2">Mobility End</label>
                      <p-datepicker name="mobilityEnd" [(ngModel)]="m.mobilityEnd" dateFormat="yy-mm-dd" class="w-full">
                        <ng-template pTemplate="inputicon"><i class="pi pi-calendar"></i></ng-template>
                      </p-datepicker>
                    </div>

                    <div class="md:col-span-2">
                      <label class="block text-sm mb-2">Nomination Reference</label>
                      <input pInputText name="nominationReference" [(ngModel)]="m.nominationReference" class="w-full"/>
                    </div>
                  </ng-container>

                </ng-container>

                <!-- TEACHER -->
                <ng-container *ngIf="m.role === 'TEACHER'">
                  <div class="md:col-span-2">
                    <label class="block text-sm mb-2">Fields</label>
                    <p-multiSelect name="fields" [(ngModel)]="m.fields" [options]="fieldOptions"
                                   optionLabel="label" optionValue="value" placeholder="Select fields"
                                   display="chip" appendTo="body" class="w-full">
                    </p-multiSelect>
                  </div>
                </ng-container>

                <!-- CHEF_OPTION -->
                <ng-container *ngIf="m.role === 'CHEF_OPTION'">
                  <div class="md:col-span-2">
                    <label class="block text-sm mb-2">Option</label>
                    <p-select name="option" [(ngModel)]="m.option" [options]="optionCodeOptions"
                              optionLabel="label" optionValue="value" placeholder="Select option"
                              appendTo="body" class="w-full">
                    </p-select>
                  </div>
                </ng-container>

                <!-- MOBILITY_OFFICER -->
                <ng-container *ngIf="m.role === 'MOBILITY_OFFICER'">
                  <div class="md:col-span-2">
                    <label class="block text-sm mb-2">Office Department</label>
                    <input pInputText name="officeDepartment" [(ngModel)]="m.officeDepartment" class="w-full"/>
                  </div>
                </ng-container>

                <!-- PARTNER -->
                <ng-container *ngIf="m.role === 'PARTNER'">
                  <div>
                    <label class="block text-sm mb-2">University Name</label>
                    <input pInputText name="universityName" [(ngModel)]="m.universityName" class="w-full"/>
                  </div>
                  <div>
                    <label class="block text-sm mb-2">Country</label>
                    <input pInputText name="country" [(ngModel)]="m.country" class="w-full"/>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm mb-2">Website</label>
                    <input pInputText name="website" [(ngModel)]="m.website" class="w-full"/>
                  </div>
                </ng-container>

              </div>

              <p-divider class="my-6"></p-divider>

              <div class="flex items-center justify-end gap-3">
                <button type="button" pButton class="p-button-outlined" label="Cancel" (click)="resetForm(f)"></button>
                <button type="submit" pButton label="Sign Up"></button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hint { color: #94a3b8; display:block; margin-top:.25rem; }
    .err  { color: #ef4444; display:block; margin-top:.25rem; }
  `]
})
export class Signup {
  constructor(private auth: AuthService, private toast: MessageService) {}

  // role & other option lists
  roleOptions = [
    {label:'Student', value:'STUDENT' as Role},
    {label:'Teacher', value:'TEACHER' as Role},
    {label:'Mobility Officer', value:'MOBILITY_OFFICER' as Role},
    {label:'Chef Option', value:'CHEF_OPTION' as Role},
    {label:'Partner', value:'PARTNER' as Role},
    {label:'Admin', value:'ADMIN' as Role},
  ];

  studentTypeOptions = [
    {label:'Entrant', value:'ENTRANT' as StudentType},
    {label:'Sortant', value:'SORTANT' as StudentType},
  ];

  maritalOptions = [
    {label:'Single', value:'Single'},
    {label:'Married', value:'Married'}
  ];

  // replace with your real Field / OptionCode lists
  fieldOptions = [
    {label:'Computer Science', value:'COMPUTER_SCIENCE'},
    {label:'Networks', value:'NETWORKS'},
    {label:'AI', value:'AI'}
  ];
  optionCodeOptions = [
    {label:'OPT-A', value:'OPT_A'},
    {label:'OPT-B', value:'OPT_B'}
  ];

  // phone: accepts +, spaces, dashes; ≥7 digits
  phonePattern = '^[+]?\\d[\\d\\s-]{6,}$';

  m: SignupFormModel = this.emptyModel();

  touched(ctrl: any) { return !!(ctrl?.dirty || ctrl?.touched); }
  invalid(ctrl: any) { return !!(ctrl?.invalid && this.touched(ctrl)); }

  resetForm(f: NgForm) {
    f.resetForm(this.emptyModel());
  }

  onSubmit(f: NgForm) {
    if (!f.valid) {
      Object.values(f.controls ?? {}).forEach(c => c.markAsTouched());
      this.toast.add({severity:'warn', summary:'Validation', detail:'Please fix highlighted fields.'});
      return;
    }

    // 🔒 extra guard: if Student, require type
    if (this.m.role === 'STUDENT' && !this.m.type) {
      this.toast.add({severity:'warn', summary:'Validation', detail:'Please choose Student Type (Entrant/Sortant).'});
      return;
    }

    const payload = this.toPayload(this.m);

    this.auth.signup(payload).subscribe({
      next: () => {
        this.toast.add({severity:'success', summary:'Success', detail:'User registered successfully!'});
        this.resetForm(f);
      },
      error: (e) => {
        const msg = e?.error?.message || 'Signup failed.';
        this.toast.add({severity:'error', summary:'Error', detail: msg});
      }
    });
  }

  // --- helpers ---
  private emptyModel(): SignupFormModel {
    return {
      username:'',
      firstName:'',
      middleName:null,
      lastName:'',
      email:'',
      personalEmail:null,
      role:'' as any,
      password:'',
      maritalStatus:null,
      personnelPhoneNumber:'',
      domicilePhoneNumber:null,

      type:null,

      department:null,
      entryDate:null,
      expectedExitDate:null,
      studentIdentifier:null,

      contactEmail:null,
      homeDepartmentOrProgram:null,
      homeUniversityName:null,
      homeUniversityCountry:null,
      mobilityStart:null,
      mobilityEnd:null,
      nominationReference:null,

      fields:null,
      option:null,
      officeDepartment:null,

      universityName:null,
      country:null,
      website:null
    };
  }

  private fmt(d: Date | null): string | null {
    if (!d) return null;
    // yyyy-MM-dd
    const y = d.getFullYear();
    const m = `${d.getMonth()+1}`.padStart(2,'0');
    const day = `${d.getDate()}`.padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  /** Build request object exactly like your SignupRequest (nulls for optional/irrelevant) */
  private toPayload(m: SignupFormModel) {
    // clear role-specific fields that don’t apply
    const isStudent = m.role === 'STUDENT';
    const isSortant = isStudent && m.type === 'SORTANT';
    const isEntrant = isStudent && m.type === 'ENTRANT';

    return {
      // common
      username: m.username.trim(),
      firstName: m.firstName.trim(),
      middleName: this.nullIfEmpty(m.middleName),
      lastName: m.lastName.trim(),
      email: m.email.trim(),
      personalEmail: this.nullIfEmpty(m.personalEmail),
      role: m.role,
      password: m.password,
      maritalStatus: this.nullIfEmpty(m.maritalStatus),
      personnelPhoneNumber: m.personnelPhoneNumber.trim(),
      domicilePhoneNumber: this.nullIfEmpty(m.domicilePhoneNumber),

      // student only
      type: isStudent ? m.type : null,

      // SORTANT
      department: isSortant ? this.nullIfEmpty(m.department) : null,
      entryDate: isSortant ? this.fmt(m.entryDate) : null,
      expectedExitDate: isSortant ? this.fmt(m.expectedExitDate) : null,
      studentIdentifier: isSortant ? this.nullIfEmpty(m.studentIdentifier) : null,

      // ENTRANT
      contactEmail: isEntrant ? this.nullIfEmpty(m.contactEmail) : null,
      homeDepartmentOrProgram: isEntrant ? this.nullIfEmpty(m.homeDepartmentOrProgram) : null,
      homeUniversityName: isEntrant ? this.nullIfEmpty(m.homeUniversityName) : null,
      homeUniversityCountry: isEntrant ? this.nullIfEmpty(m.homeUniversityCountry) : null,
      mobilityStart: isEntrant ? this.fmt(m.mobilityStart) : null,
      mobilityEnd: isEntrant ? this.fmt(m.mobilityEnd) : null,
      nominationReference: isEntrant ? this.nullIfEmpty(m.nominationReference) : null,

      // TEACHER
      fields: m.role === 'TEACHER' ? (m.fields ?? []) : null,

      // CHEF_OPTION
      option: m.role === 'CHEF_OPTION' ? this.nullIfEmpty(m.option) : null,

      // MOBILITY_OFFICER
      officeDepartment: m.role === 'MOBILITY_OFFICER' ? this.nullIfEmpty(m.officeDepartment) : null,

      // PARTNER
      universityName: m.role === 'PARTNER' ? this.nullIfEmpty(m.universityName) : null,
      country: m.role === 'PARTNER' ? this.nullIfEmpty(m.country) : null,
      website: m.role === 'PARTNER' ? this.nullIfEmpty(m.website) : null
    };
  }

  private nullIfEmpty(v: string | null | undefined): string | null {
    const t = (v ?? '').trim();
    return t ? t : null;
  }
}
