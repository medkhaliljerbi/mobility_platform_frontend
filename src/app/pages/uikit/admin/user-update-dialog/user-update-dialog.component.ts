import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AdminUserService } from 'src/app/core/services/admin-users.services';
import { User } from 'src/app/core/models/user.model';
import { UserUpsertRequest } from 'src/app/core/dto/user-upsert-request';

type UpsertPayload = Omit<UserUpsertRequest, 'active'>;

@Component({
  selector: 'app-user-update',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    ProgressBarModule,
    DividerModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
  <p-dialog
    [(visible)]="visible"
    [modal]="true"
    [draggable]="false"
    [resizable]="false"
    [dismissableMask]="true"
    [closable]="true"
    header="Update User"
    (onHide)="onCancel()"
    [style]="{ width: '560px', maxWidth: '95vw' }"
    contentStyleClass="centered-dialog-content">

    <p-toast></p-toast>

    <ng-container *ngIf="!loading; else loadingTpl">
      <form #f="ngForm" (ngSubmit)="onSubmit(f)">
        <div class="form-shell">

          <div class="section-title">Identity</div>

          <div class="field">
            <label class="required">Username</label>
            <input pInputText name="username" [(ngModel)]="form.username" required #username="ngModel"/>
            <small class="err" *ngIf="username.invalid && (username.dirty || username.touched)">Username is required.</small>
          </div>

          <div class="field">
            <label class="required">First Name</label>
            <input pInputText name="firstName" [(ngModel)]="form.firstName" required #firstName="ngModel"/>
            <small class="err" *ngIf="firstName.invalid && (firstName.dirty || firstName.touched)">First name is required.</small>
          </div>

          <div class="field">
            <label>Middle Name</label>
            <input pInputText name="middleName" [(ngModel)]="form.middleName"/>
          </div>

          <div class="field">
            <label class="required">Last Name</label>
            <input pInputText name="lastName" [(ngModel)]="form.lastName" required #lastName="ngModel"/>
            <small class="err" *ngIf="lastName.invalid && (lastName.dirty || lastName.touched)">Last name is required.</small>
          </div>

          <p-divider class="divider"></p-divider>

          <div class="section-title">Emails</div>

          <div class="field">
            <label class="required">Email</label>
            <input pInputText type="email" name="email" [(ngModel)]="form.email" required #email="ngModel"/>
            <small class="err" *ngIf="email.errors?.['required'] && (email.dirty || email.touched)">Email is required.</small>
            <small class="err" *ngIf="!email.errors?.['required'] && email.invalid && (email.dirty || email.touched)">Enter a valid email.</small>
          </div>

          <div class="field">
            <label>Personal Email</label>
            <input pInputText type="email" name="personalEmail" [(ngModel)]="form.personalEmail" #personalEmail="ngModel"/>
            <small class="err" *ngIf="personalEmail.value && personalEmail.invalid && (personalEmail.dirty || personalEmail.touched)">
              Enter a valid personal email.
            </small>
          </div>

          <p-divider class="divider"></p-divider>

          <div class="section-title">Phones</div>

          <div class="field">
            <label>Personnel Phone</label>
            <input pInputText name="personnelPhoneNumber"
                   [(ngModel)]="form.personnelPhoneNumber"
                   [pattern]="phonePattern" #pp="ngModel"/>
            <small class="hint">Optional. Accepts +, spaces, dashes. ≥7 digits.</small>
            <small class="err" *ngIf="pp.value && pp.invalid && (pp.dirty || pp.touched)">Enter a valid phone.</small>
          </div>

          <div class="field">
            <label>Domicile Phone</label>
            <input pInputText name="domicilePhoneNumber"
                   [(ngModel)]="form.domicilePhoneNumber"
                   [pattern]="phonePattern" #dp="ngModel"/>
            <small class="hint">Optional. Accepts +, spaces, dashes. ≥7 digits.</small>
            <small class="err" *ngIf="dp.value && dp.invalid && (dp.dirty || dp.touched)">Enter a valid phone.</small>
          </div>

          <p-divider class="divider"></p-divider>

          <div class="section-title">Status</div>

          <div class="field">
            <label>Marital Status</label>
            <p-select
              name="maritalStatus"
              [options]="maritalOptions"
              optionLabel="label"
              optionValue="value"
              [(ngModel)]="form.maritalStatus"
              placeholder="Select status"
              appendTo="body">
            </p-select>
          </div>

          <div class="field">
            <label>New Password</label>
            <input pInputText type="password" name="newPassword"
                   [(ngModel)]="newPassword"
                   [pattern]="passwordPattern"
                   minlength="8"
                   autocomplete="new-password"
                   #np="ngModel"/>
            <small class="hint">Optional. Min 8 chars, must contain letters and digits.</small>
            <small class="err" *ngIf="np.value && (np.errors?.['minlength'] || np.errors?.['pattern'])">
              Password must be 8+ chars and include letters & digits.
            </small>
          </div>

          <div class="field" *ngIf="newPassword">
            <label>Confirm Password</label>
            <input pInputText type="password" name="confirmPassword"
                   [(ngModel)]="confirmPassword"
                   autocomplete="new-password"
                   #cp="ngModel"/>
            <small class="err" *ngIf="newPassword && confirmPassword && newPassword !== confirmPassword">
              Passwords do not match.
            </small>
          </div>

          <div class="actions">
            <button type="button" pButton label="Cancel" class="p-button-outlined" (click)="onCancel()" [disabled]="saving"></button>
            <button type="submit" pButton label="Update" icon="pi pi-check" [loading]="saving" [disabled]="saving"></button>
          </div>
        </div>
      </form>
    </ng-container>

    <ng-template #loadingTpl>
      <div class="loading-wrap"><p-progressbar mode="indeterminate" styleClass="w-full"></p-progressbar></div>
    </ng-template>
  </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .p-dialog-mask.p-component-overlay { backdrop-filter: blur(6px); background: rgba(0,0,0,0.08); }
    :host ::ng-deep .centered-dialog-content { padding-top: .75rem !important; }
    .form-shell { width: 460px; max-width: 86vw; margin: 0 auto; }
    .section-title { text-align: center; font-weight: 600; font-size: 1rem; margin: .5rem 0 1rem; color: #334155; }
    .divider { margin: 1rem 0; }
    .field { display: flex; flex-direction: column; align-items: center; margin-bottom: .75rem; }
    .field label { width: 100%; max-width: 360px; text-align: left; margin-bottom: .375rem; color: #64748b; font-size: .875rem; }
    .field :is(input.p-inputtext, .p-select) { width: 100%; max-width: 360px; }
    /* Align helper text with the input's inner text (match input left padding ~0.75rem) */
    .hint, .err { color: #94a3b8; align-self: flex-start; width: 100%; max-width: 360px; margin-top: .25rem; padding-left: .75rem; }
    .err { color: #ef4444; }
    .actions { display: flex; justify-content: center; gap: .5rem; margin-top: 1rem; }
    .required::after { content: ' *'; color: #ef4444; font-weight: 700; }
    .loading-wrap { min-height: 200px; display: flex; align-items: center; justify-content: center; }
    :host ::ng-deep .p-inputtext { padding-top: .55rem; padding-bottom: .55rem; }
  `]
})
export class UserUpdateComponent implements OnChanges {
  @Input() visible = false;
  @Input() userId!: number;

  @Output() closed  = new EventEmitter<void>();
  @Output() updated = new EventEmitter<User>();

  loading = false;
  saving  = false;

  phonePattern = '^[+]?\\d[\\d\\s-]{6,}$';
  passwordPattern = '^(?=.*[A-Za-z])(?=.*\\d).{8,}$';

  maritalOptions = [
    { label: 'Married', value: 'Married' },
    { label: 'Single',  value: 'Single'  }
  ];

  form: UpsertPayload = this.emptyForm();
  private original!: UpsertPayload;

  newPassword = '';
  confirmPassword = '';

  constructor(private svc: AdminUserService, private toast: MessageService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.userId) this.fetch();
  }

  private fetch() {
    this.loading = true;
    this.svc.getById(this.userId).subscribe({
      next: (u) => {
        this.form     = this.mapUserToForm(u);
        this.original = { ...this.form };
        this.newPassword = '';
        this.confirmPassword = '';
        this.loading  = false;
      },
      error: () => {
        this.loading = false;
        this.toast.add({ severity: 'error', summary: 'Load failed', detail: 'Could not fetch user.' });
      }
    });
  }

  onCancel() {
    this.visible = false;
    this.closed.emit();
  }

  onSubmit(f: NgForm) {
    if (!this.userId) return;

    if (!f.valid) {
      Object.values(f.controls || {}).forEach(c => c.markAsTouched());
      this.toast.add({ severity: 'warn', summary: 'Validation', detail: 'Please fix the highlighted fields.' });
      return;
    }

    const passProvided = !!this.newPassword.trim();
    if (passProvided) {
      if (!new RegExp(this.passwordPattern).test(this.newPassword)) {
        this.toast.add({ severity: 'warn', summary: 'Validation', detail: 'Password must be 8+ chars and include letters & digits.' });
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.toast.add({ severity: 'warn', summary: 'Validation', detail: 'Passwords do not match.' });
        return;
      }
    }

    const diff = this.buildDiff(this.original, this.form);
    const hasProfileChanges = Object.keys(diff).length > 0;

    this.saving = true;

    const submitProfile = hasProfileChanges
      ? this.svc.patchUpdate(this.userId, diff as Partial<UserUpsertRequest>)
      : this.svc.getById(this.userId);

    submitProfile.subscribe({
      next: () => {
        const afterProfile = () => {
          this.svc.getById(this.userId).subscribe({
            next: (freshUser) => {
              const name = [freshUser.firstName, freshUser.lastName].filter(Boolean).join(' ').trim();
              this.toast.add({ severity: 'success', summary: 'Updated', detail: `${name || 'User'} updated.` });
              this.saving = false;
              this.visible = false;
              this.updated.emit(freshUser);
            },
            error: () => {
              this.saving = false;
              this.toast.add({ severity: 'error', summary: 'Update failed', detail: 'Could not load updated user.' });
            }
          });
        };

        if (passProvided) {
          this.svc.resetPassword(this.userId, this.newPassword).subscribe({
            next: () => {
              this.toast.add({ severity: 'success', summary: 'Password', detail: 'Password updated.' });
              afterProfile();
            },
            error: () => {
              this.saving = false;
              this.toast.add({ severity: 'error', summary: 'Password', detail: 'Could not update password.' });
            }
          });
        } else {
          afterProfile();
        }
      },
      error: () => {
        this.saving = false;
        this.toast.add({ severity: 'error', summary: 'Update failed', detail: 'Could not save changes.' });
      }
    });
  }

  private normalizeOpt(v: string | null | undefined): string {
    return (v ?? '').trim();
  }
  private onlyDigitsPlus(v: string | null | undefined): string {
    const s = (v ?? '').trim();
    if (!s) return '';
    const hasPlus = s.startsWith('+');
    const digits  = s.replace(/[^\d]/g, '');
    return hasPlus ? `+${digits}` : digits;
  }

  private buildDiff(prev: UpsertPayload, cur: UpsertPayload): Partial<UpsertPayload> {
    const out: Partial<UpsertPayload> = {};

    (['username','firstName','lastName','email'] as const).forEach(k => {
      const a = (prev[k] ?? '').trim();
      const b = (cur[k]  ?? '').trim();
      if (a !== b) (out as any)[k] = b;
    });

    (['middleName','personalEmail','maritalStatus'] as const).forEach(k => {
      const a = (prev[k] ?? '').trim();
      const b = this.normalizeOpt(cur[k]);
      if (a !== b) (out as any)[k] = b; // send "" to clear
    });

    const aPP = this.onlyDigitsPlus(prev.personnelPhoneNumber);
    const bPP = this.onlyDigitsPlus(cur.personnelPhoneNumber);
    if (aPP !== bPP) (out as any)['personnelPhoneNumber'] = this.normalizeOpt(cur.personnelPhoneNumber);

    const aDP = this.onlyDigitsPlus(prev.domicilePhoneNumber);
    const bDP = this.onlyDigitsPlus(cur.domicilePhoneNumber);
    if (aDP !== bDP) (out as any)['domicilePhoneNumber'] = this.normalizeOpt(cur.domicilePhoneNumber);

    return out;
  }

  private mapUserToForm(u: User): UpsertPayload {
    return {
      username: (u.username || '').trim(),
      firstName: (u.firstName || '').trim(),
      lastName: (u.lastName || '').trim(),
      email: (u.email || '').trim(),
      domicilePhoneNumber: (u.domicilePhoneNumber || '').trim(),
      middleName: this.opt(u.middleName),
      personalEmail: this.opt(u.personalEmail),
      personnelPhoneNumber: this.opt(u.personnelPhoneNumber),
      maritalStatus: this.opt(u.maritalStatus)
    };
  }
  private opt(v?: string | null): string | null {
    const t = (v ?? '').trim();
    return t ? t : null;
  }
  private emptyForm(): UpsertPayload {
    return {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      domicilePhoneNumber: '',
      middleName: null,
      personalEmail: null,
      personnelPhoneNumber: null,
      maritalStatus: null
    };
  }
}
