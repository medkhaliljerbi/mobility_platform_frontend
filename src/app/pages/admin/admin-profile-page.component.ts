import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { FluidModule } from 'primeng/fluid';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  AdminUserService,
  AdminSelfView,
  AdminSelfUpdate
} from 'src/app/core/services/admin-users.services';

@Component({
  selector: 'app-admin-profile-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule,
    FluidModule, CardModule, ButtonModule, InputTextModule, ToastModule
  ],
  providers: [MessageService],
  styles: [`
    .page { display:flex; justify-content:center; padding:.5rem; }
    .shell { width:100%; max-width:1120px; margin:0 auto; }

    .card-title { display:flex; justify-content:space-between; align-items:center; }
    .title { font-weight:700; font-size:1.25rem; }

    .form-section { margin-top:.75rem; }
    .group { display:flex; flex-direction:column; gap:.6rem; }
    .ctrl { width:100%; font-size:1rem; }
    .field { display:flex; flex-direction:column; gap:.35rem; }
    .label { font-size:1rem; font-weight:600; color:var(--text-color); }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
    @media (max-width: 640px) { .grid-2 { grid-template-columns:1fr; } .shell { max-width:100%; } }

    input.identity[readonly] {
      background: var(--surface-100);
      color: var(--text-color-secondary);
    }

    .locked, .locked * { pointer-events: none !important; }
    .locked .p-inputtext {
      opacity: 1 !important;
      background: var(--surface-0) !important;
      color: inherit !important;
    }

    :host ::ng-deep .p-inputtext {
      font-size: 1rem;
      padding: .8rem .75rem;
    }

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
            <span class="title">Admin Profile</span>
            <span class="flex gap-2">
              <button *ngIf="!editing()" pButton label="Edit" icon="pi pi-pencil" (click)="onEdit()"></button>
              <button *ngIf="editing()" pButton class="p-button-secondary" label="Cancel" icon="pi pi-times" (click)="onCancel()"></button>
              <button *ngIf="editing()" pButton class="p-button-success" label="Save" icon="pi pi-check" (click)="onSave()" [disabled]="form.invalid || busy()"></button>
            </span>
          </div>
        </ng-template>

        <!-- Identity (always read-only) -->
        <div class="form-section group">
          <div class="grid-2">
            <div class="field">
              <div class="label">Username</div>
              <input pInputText [value]="m()?.username ?? ''" class="ctrl identity" readonly />
            </div>
            <div class="field">
              <div class="label">Role</div>
              <input pInputText [value]="m()?.role ?? ''" class="ctrl identity" readonly />
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
            <div class="field">
              <div class="label">Esprit Email</div>
              <input pInputText [value]="m()?.email ?? ''" class="ctrl identity" readonly />
            </div>
          </div>
        </div>

        <!-- Editable form (no avatar, no marital status) -->
        <div class="form-section">
          <form [formGroup]="form" class="group">
            <div class="field">
              <div class="label">Personal Email</div>
              <input pInputText formControlName="emailPersonel" class="ctrl" [readonly]="!editing()" />
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
          </form>
        </div>

      </p-card>
    </div>
  </div>
</p-fluid>

<p-toast></p-toast>
  `
})
export class AdminProfilePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AdminUserService);
  private toast = inject(MessageService);

  m = signal<AdminSelfView | null>(null);
  busy = signal(false);
  editing = signal(false);

  form = this.fb.group({
    emailPersonel: [''],
    personnelPhoneNumber: ['', Validators.required],
    domicilePhoneNumber: ['']
  });

  ngOnInit(): void {
    this.api.getSelf().subscribe({
      next: (me) => { this.m.set(me); this.patchFromModel(me); },
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
    const payload: AdminSelfUpdate = {};

    const setIfDirty = <K extends keyof AdminSelfUpdate>(ctrl: string, key: K, val: AdminSelfUpdate[K]) => {
      if (f.get(ctrl)?.dirty) (payload as any)[key] = val;
    };

    setIfDirty('emailPersonel',        'emailPersonel',        v.emailPersonel ?? null);
    setIfDirty('personnelPhoneNumber', 'personnelPhoneNumber', v.personnelPhoneNumber ?? null);
    setIfDirty('domicilePhoneNumber',  'domicilePhoneNumber',  v.domicilePhoneNumber ?? null);

    this.api.updateSelf(payload).subscribe({
      next: (res) => {
        this.m.set(res);
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

  private patchFromModel(me: AdminSelfView) {
    this.form.reset({
      emailPersonel:        me.emailPersonel ?? '',
      personnelPhoneNumber: me.personnelPhoneNumber ?? '',
      domicilePhoneNumber:  me.domicilePhoneNumber ?? ''
    });
  }

  private err(e:any){ return e?.error?.message || e?.message || 'Unexpected error'; }
}
