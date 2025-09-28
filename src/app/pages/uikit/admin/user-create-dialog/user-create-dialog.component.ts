import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AdminUserService, AdminCreateUserRequest } from 'src/app/core/services/admin-users.services';
import { User } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
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
    header="Add New User"
    (onHide)="onCancel()"
    [style]="{ width: '560px', maxWidth: '95vw' }"
    contentStyleClass="centered-dialog-content">

    <p-toast></p-toast>

    <form #f="ngForm" (ngSubmit)="onSubmit(f)">
      <div class="form-shell">

        <div class="section-title">Identity</div>

        <div class="field">
          <label>Username (optional)</label>
          <input pInputText name="username" [(ngModel)]="m.username" class="w-full" />
          <small class="hint">If empty, it will be derived from the email.</small>
        </div>

        <div class="field">
          <label class="required">First Name</label>
          <input pInputText name="firstName" [(ngModel)]="m.firstName" required #fn="ngModel" />
          <small class="err" *ngIf="fn.invalid && (fn.dirty || fn.touched)">First name is required.</small>
        </div>

        <div class="field">
          <label>Middle Name</label>
          <input pInputText name="middleName" [(ngModel)]="m.middleName" />
        </div>

        <div class="field">
          <label class="required">Last Name</label>
          <input pInputText name="lastName" [(ngModel)]="m.lastName" required #ln="ngModel" />
          <small class="err" *ngIf="ln.invalid && (ln.dirty || ln.touched)">Last name is required.</small>
        </div>

        <p-divider class="divider"></p-divider>

        <div class="section-title">Contact</div>

        <div class="field">
          <label class="required">Role</label>
          <p-select name="role" [(ngModel)]="m.role" [options]="roleOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Select role" appendTo="body" required #role="ngModel">
          </p-select>
          <small class="err" *ngIf="role.invalid && (role.dirty || role.touched)">Role is required.</small>
        </div>

        <div class="field">
          <label class="required">Email</label>
          <input pInputText type="email" name="email" [(ngModel)]="m.email" required #em="ngModel" />
          <small class="err" *ngIf="em.errors?.['required'] && (em.dirty || em.touched)">Email is required.</small>
          <small class="err" *ngIf="!em.errors?.['required'] && em.invalid && (em.dirty || em.touched)">Enter a valid email.</small>
        </div>

        <div class="field">
          <label>Personal Email</label>
          <input pInputText type="email" name="personalEmail" [(ngModel)]="m.personalEmail" #pem="ngModel" />
          <small class="err" *ngIf="pem.value && pem.invalid && (pem.dirty || pem.touched)">Invalid personal email.</small>
        </div>

        <div class="field">
          <label class="required">Personnel Phone</label>
          <input pInputText name="personnelPhoneNumber" [(ngModel)]="m.personnelPhoneNumber"
                 required [pattern]="phonePattern" #pp="ngModel" />
          <small class="hint">Accepts +, spaces, dashes. ≥7 digits.</small>
          <small class="err" *ngIf="pp.errors?.['required'] && (pp.dirty || pp.touched)">Phone required.</small>
          <small class="err" *ngIf="pp.value && pp.errors?.['pattern']">Invalid phone format.</small>
        </div>

        <div class="field">
          <label>Domicile Phone</label>
          <input pInputText name="domicilePhoneNumber" [(ngModel)]="m.domicilePhoneNumber"
                 [pattern]="phonePattern" #dp="ngModel" />
          <small class="hint">Optional. Accepts +, spaces, dashes. ≥7 digits.</small>
          <small class="err" *ngIf="dp.value && dp.errors?.['pattern']">Invalid phone format.</small>
        </div>

        <div class="field">
          <label>Marital Status</label>
          <p-select name="maritalStatus" [(ngModel)]="m.maritalStatus" [options]="maritalOptions"
                    optionLabel="label" optionValue="value" placeholder="Select status"
                    appendTo="body">
          </p-select>
        </div>

        <p-divider class="divider"></p-divider>

        <div class="actions">
          <button type="button" pButton label="Cancel" class="p-button-outlined" (click)="onCancel()" [disabled]="saving"></button>
          <button type="submit" pButton label="Create & Invite" icon="pi pi-user-plus" [loading]="saving" [disabled]="saving"></button>
        </div>

      </div>
    </form>
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
    .hint, .err { color: #94a3b8; align-self: flex-start; width: 100%; max-width: 360px; margin-top: .25rem; padding-left: .75rem; }
    .err { color: #ef4444; }
    .actions { display: flex; justify-content: center; gap: .5rem; margin-top: 1rem; }
    .required::after { content: ' *'; color: #ef4444; font-weight: 700; }
    :host ::ng-deep .p-inputtext { padding-top: .55rem; padding-bottom: .55rem; }
  `]
})
export class UserCreateComponent {
  @Input()  visible = false;
  @Output() closed  = new EventEmitter<void>();
  @Output() created = new EventEmitter<User>();

  saving = false;

  phonePattern = '^[+]?\\d[\\d\\s-]{6,}$';

  roleOptions = [
    {label:'Student', value:'STUDENT'},
    {label:'Teacher', value:'TEACHER'},
    {label:'Mobility Officer', value:'MOBILITY_OFFICER'},
    {label:'Chef Option', value:'CHEF_OPTION'},
    {label:'Partner', value:'PARTNER'},
    {label:'Admin', value:'ADMIN'},
  ];

  maritalOptions = [
    {label:'Single',  value:'Single'},
    {label:'Married', value:'Married'}
  ];

  m: AdminCreateUserRequest = this.empty();

  constructor(private svc: AdminUserService, private toast: MessageService) {}

  onCancel() {
    this.visible = false;
    this.closed.emit();
  }

  onSubmit(f: NgForm) {
    if (!f.valid) {
      Object.values(f.controls || {}).forEach(c => c.markAsTouched());
      this.toast.add({ severity:'warn', summary:'Validation', detail:'Please fix highlighted fields.' });
      return;
    }
    this.saving = true;

    // backend only needs the minimal set; we pass exactly what it expects
    const payload: AdminCreateUserRequest = {
      username: this.nullIfEmpty(this.m.username),
      firstName: this.m.firstName.trim(),
      middleName: this.nullIfEmpty(this.m.middleName),
      lastName: this.m.lastName.trim(),
      email: this.m.email.trim(),
      personalEmail: this.nullIfEmpty(this.m.personalEmail),
      role: this.m.role!,
      personnelPhoneNumber: this.m.personnelPhoneNumber.trim(),
      domicilePhoneNumber: this.nullIfEmpty(this.m.domicilePhoneNumber),
      maritalStatus: this.nullIfEmpty(this.m.maritalStatus)
    };

    this.svc.createAndInvite(payload).subscribe({
      next: (user) => {
        this.toast.add({ severity:'success', summary:'User created', detail:`Invite sent to ${user.email}` });
        this.saving = false;
        this.visible = false;
        this.created.emit(user);
        this.m = this.empty();
        f.resetForm(this.m);
      },
      error: (e) => {
        this.saving = false;
        const msg = e?.error?.message || 'Creation failed.';
        this.toast.add({ severity:'error', summary:'Error', detail: msg });
      }
    });
  }

  private empty(): AdminCreateUserRequest {
    return {
      username: null,
      firstName: '',
      middleName: null,
      lastName: '',
      email: '',
      personalEmail: null,
      role: undefined as any,
      personnelPhoneNumber: '',
      domicilePhoneNumber: null,
      maritalStatus: null
    };
  }

  private nullIfEmpty(v?: string | null): string | null {
    const t = (v ?? '').trim();
    return t ? t : null;
  }
}
