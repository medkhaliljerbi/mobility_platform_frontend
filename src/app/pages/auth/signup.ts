// src/app/pages/auth/signup.component.ts (or wherever this component lives)
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { RouterModule } from '@angular/router';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, EntrantSignupPayload } from 'src/app/core/services/auth.service';

interface EntrantSignupFormModel {
  // common
  username: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  personalEmail: string | null;
  password: string;
  maritalStatus: string | null;
  personnelPhoneNumber: string;
  domicilePhoneNumber: string | null;

  // entrant only
  contactEmail: string | null;
  homeDepartmentOrProgram: string | null;
  homeUniversityName: string | null;
  homeUniversityCountry: string | null;
  mobilityStart: Date | null;
  mobilityEnd: Date | null;
  nominationReference: string | null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    SelectModule
,
    // PrimeNG
    InputTextModule,
    PasswordModule,
    RippleModule,
    DialogModule,
    DividerModule,
    DatePickerModule,
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
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">Create your Entrant account</div>
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
  <p-select
    name="maritalStatus"
    [(ngModel)]="m.maritalStatus"
    [options]="maritalOptions"
    optionLabel="label"
    optionValue="value"
    placeholder="Select status"
    appendTo="body"
    class="w-full">
  </p-select>
</div>


                <!-- ENTRANT (Incoming student) -->
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

  // phone: accepts +, spaces, dashes; ≥7 digits
  phonePattern = '^[+]?\\d[\\d\\s-]{6,}$';
    // inside export class Signup { ... }
maritalOptions = [
  { label: 'Married',  value: 'Married'  },
  { label: 'Not married', value: 'Not married' }
];
  m: EntrantSignupFormModel = this.emptyModel();

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

    const payload = this.toEntrantPayload(this.m);

    this.auth.signupEntrant(payload).subscribe({
      next: () => {
        this.toast.add({severity:'success', summary:'Success', detail:'Entrant student registered successfully!'});
        this.resetForm(f);
      },
      error: (e) => {
        const msg = e?.error?.message || 'Signup failed.';
        this.toast.add({severity:'error', summary:'Error', detail: msg});
      }
    });
  }

  // --- helpers ---
  private emptyModel(): EntrantSignupFormModel {
    return {
      username:'',
      firstName:'',
      middleName:null,
      lastName:'',
      email:'',
      personalEmail:null,
      password:'',
      maritalStatus:null,
      personnelPhoneNumber:'',
      domicilePhoneNumber:null,

      contactEmail:null,
      homeDepartmentOrProgram:null,
      homeUniversityName:null,
      homeUniversityCountry:null,
      mobilityStart:null,
      mobilityEnd:null,
      nominationReference:null
    };
  }

  private fmt(d: Date | null): string | null {
    if (!d) return null;
    const y = d.getFullYear();
    const m = `${d.getMonth()+1}`.padStart(2,'0');
    const day = `${d.getDate()}`.padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  /** Build EntrantSignupRequest payload exactly */
  private toEntrantPayload(m: EntrantSignupFormModel): EntrantSignupPayload {
    return {
      username: m.username.trim(),
      firstName: m.firstName.trim(),
      middleName: this.nullIfEmpty(m.middleName),
      lastName: m.lastName.trim(),
      email: m.email.trim(),
      personalEmail: this.nullIfEmpty(m.personalEmail),
      password: m.password,
      maritalStatus: this.nullIfEmpty(m.maritalStatus),
      personnelPhoneNumber: m.personnelPhoneNumber.trim(),
      domicilePhoneNumber: this.nullIfEmpty(m.domicilePhoneNumber),

      contactEmail: this.nullIfEmpty(m.contactEmail),
      homeDepartmentOrProgram: this.nullIfEmpty(m.homeDepartmentOrProgram),
      homeUniversityName: this.nullIfEmpty(m.homeUniversityName),
      homeUniversityCountry: this.nullIfEmpty(m.homeUniversityCountry),
      mobilityStart: this.fmt(m.mobilityStart),
      mobilityEnd: this.fmt(m.mobilityEnd),
      nominationReference: this.nullIfEmpty(m.nominationReference)
    };
  }

  private nullIfEmpty(v: string | null | undefined): string | null {
    const t = (v ?? '').trim();
    return t ? t : null;
  }
}
