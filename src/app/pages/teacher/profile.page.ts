import { Component, OnInit, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { TeacherService, TeacherSelfView, TeacherSelfUpdate, FieldType, OptionCodeType } from '@/core/services/teacher.service';

import { FluidModule } from 'primeng/fluid';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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

@Component({
  selector: 'app-teacher-profile-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule,
    FluidModule, CardModule, ButtonModule, InputTextModule, SelectModule, MultiSelectModule, ToastModule
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
            <span class="title">My Teacher Profile</span>
            <span class="flex gap-2">
              <button *ngIf="!editing()" pButton label="Edit" icon="pi pi-pencil" (click)="onEdit()"></button>
              <button *ngIf="editing()" pButton class="p-button-secondary" label="Cancel" icon="pi pi-times" (click)="onCancel()"></button>
              <button *ngIf="editing()" pButton class="p-button-success" label="Save" icon="pi pi-check" (click)="onSave()" [disabled]="busy()"></button>
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
              <div class="label">Role</div>
              <input pInputText [value]="m()?.chefOption ? 'Chef Option' : 'Teacher'" class="ctrl identity" readonly />
            </div>
          </div>
        </div>

        <!-- Editable form -->
        <div class="form-section">
          <form [formGroup]="form" class="group">

            <!-- Teacher: multiple fields -->
            <div class="field" *ngIf="!isChef()" [class.locked]="!editing()">
              <div class="label">Fields</div>
              <p-multiSelect formControlName="fields"
                             [options]="fieldOptions"
                             optionLabel="label" optionValue="value"
                             display="chip" class="ctrl">
              </p-multiSelect>
            </div>

            <!-- ChefOption: single option -->
            <div class="grid-2" *ngIf="isChef()">
              <div class="field" [class.locked]="!editing()">
                <div class="label">Option</div>
                <p-select formControlName="option"
                          [options]="optionCodeOptions"
                          optionLabel="label" optionValue="value"
                          class="ctrl">
                </p-select>
              </div>
              <div class="field">
                <div class="label">Derived Field</div>
                <input pInputText [value]="m()?.optionField ?? ''" class="ctrl identity" readonly />
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
export class TeacherProfilePageComponent implements OnInit {
  @ViewChild('file') fileInput!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private api = inject(TeacherService);
  private toast = inject(MessageService);

  m = signal<TeacherSelfView | null>(null);
  busy = signal(false);
  editing = signal(false);

  fieldOptions = FIELD_OPTIONS;
  optionCodeOptions = OPTIONCODE_OPTIONS.map(o => ({ label: `${o.value} — ${o.label}`, value: o.value }));

  isChef = computed(() => !!this.m()?.chefOption);

  form = this.fb.group({
    fields: <FieldType[] | null>(null),         // for Teacher
    option: <OptionCodeType | null>(null)       // for ChefOption
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
    this.busy.set(true);
    const f = this.form;
    const v = f.value as any;
    const payload: TeacherSelfUpdate = {};

    const setIfDirty = <K extends keyof TeacherSelfUpdate>(ctrl: string, key: K, val: TeacherSelfUpdate[K]) => {
      if (f.get(ctrl)?.dirty) (payload as any)[key] = val;
    };

    if (this.isChef()) {
      setIfDirty('option', 'option', v.option ?? null);
    } else {
      setIfDirty('fields', 'fields', (v.fields ?? null) as FieldType[] | null);
    }

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

  private patchFromModel(me: TeacherSelfView) {
    this.form.reset({
      fields: (me.fields ?? null) as FieldType[] | null,
      option: (me.option ?? null) as OptionCodeType | null
    });
  }

  private err(e:any){ return e?.error?.message || e?.message || 'Unexpected error'; }
}
