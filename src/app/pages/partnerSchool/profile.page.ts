import { Component, OnInit, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { PartnerSchoolService, PartnerSchoolSelfView, PartnerSchoolSelfUpdate } from '@/core/services/partner-school.service';

import { FluidModule } from 'primeng/fluid';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-partner-profile-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule,
    FluidModule, CardModule, ButtonModule, InputTextModule, ToastModule
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
            <span class="title">Partner School Profile</span>
            <span class="flex gap-2">
              <button *ngIf="!editing()" pButton label="Edit" icon="pi pi-pencil" (click)="onEdit()"></button>
              <button *ngIf="editing()" pButton class="p-button-secondary" label="Cancel" icon="pi pi-times" (click)="onCancel()"></button>
              <button *ngIf="editing()" pButton class="p-button-success" label="Save" icon="pi pi-check" (click)="onSave()" [disabled]="form.invalid || busy()"></button>
            </span>
          </div>
        </ng-template>

        <!-- Avatar -->
        <div class="avatar">
          <ng-container *ngIf="hasAvatar(); else placeholderIcon">
            <img [src]="avatarUrl()" alt="avatar" (error)="onImgError($event)" />
          </ng-container>
          <ng-template #placeholderIcon>
            <i class="pi pi-building"></i>
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
            <div class="field">
              <div class="label">University Name</div>
              <input pInputText formControlName="universityName" class="ctrl" [readonly]="!editing()" />
            </div>

            <div class="grid-2">
              <div class="field">
                <div class="label">Country</div>
                <input pInputText formControlName="country" class="ctrl" [readonly]="!editing()" />
              </div>
              <div class="field">
                <div class="label">Website</div>
                <input pInputText formControlName="website" class="ctrl" [readonly]="!editing()" placeholder="https://example.edu" />
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
export class PartnerProfilePageComponent implements OnInit {
  @ViewChild('file') fileInput!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private api = inject(PartnerSchoolService);
  private toast = inject(MessageService);

  m = signal<PartnerSchoolSelfView | null>(null);
  busy = signal(false);
  editing = signal(false);

  form = this.fb.group({
    universityName: ['', [Validators.maxLength(200)]],
    country:        ['', [Validators.maxLength(120)]],
    website:        ['', [Validators.maxLength(300)]],
  });

  ngOnInit(): void {
    this.api.getMe().subscribe({
      next: (me) => { this.m.set(me); this.patchFromModel(me); },
      error: (err) => this.toast.add({ severity: 'error', summary: 'Load failed', detail: this.err(err) })
    });
  }

  onEdit()  { this.editing.set(true);  this.form.markAsPristine(); }
  onCancel(){ this.editing.set(false); this.patchFromModel(this.m()!); this.form.markAsPristine(); }

  onSave() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy.set(true);

    const f = this.form;
    const v = f.value as any;
    const payload: PartnerSchoolSelfUpdate = {};

    const setIfDirty = <K extends keyof PartnerSchoolSelfUpdate>(ctrl: string, key: K, val: PartnerSchoolSelfUpdate[K]) => {
      if (f.get(ctrl)?.dirty) (payload as any)[key] = val;
    };

    setIfDirty('universityName', 'universityName', v.universityName ?? null);
    setIfDirty('country',        'country',        v.country ?? null);
    setIfDirty('website',        'website',        v.website ?? null);

    this.api.updateMe(payload).subscribe({
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

  // avatar helpers
  hasAvatar(): boolean { return !!(this.m()?.photoUrl || this.m()?.avatarUrl); }
  avatarUrl(): string { return this.m()?.photoUrl || this.m()?.avatarUrl || ''; }
  onImgError(e:any){ e.target.style.display='none'; }

  uploadAvatar(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.busy.set(true);
    this.api.uploadAvatar(f).subscribe({
      next: (me) => { this.m.set(me); this.busy.set(false);
        this.toast.add({ severity:'success', summary:'Avatar', detail:'Photo uploaded' });
        (ev.target as HTMLInputElement).value=''; },
      error: (err) => { this.busy.set(false);
        this.toast.add({ severity:'error', summary:'Upload failed', detail:this.err(err) }); }
    });
  }
  removeAvatar() {
    this.busy.set(true);
    this.api.deleteAvatar().subscribe({
      next: (me) => { this.m.set(me); this.busy.set(false);
        this.toast.add({ severity:'success', summary:'Avatar', detail:'Photo removed' }); },
      error: (err) => { this.busy.set(false);
        this.toast.add({ severity:'error', summary:'Remove failed', detail:this.err(err) }); }
    });
  }

  private patchFromModel(me: PartnerSchoolSelfView) {
    this.form.reset({
      universityName: me.universityName ?? '',
      country:        me.country ?? '',
      website:        me.website ?? ''
    });
  }

  private err(e:any){ return e?.error?.message || e?.message || 'Unexpected error'; }
}
