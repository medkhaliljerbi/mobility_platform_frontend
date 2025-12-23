import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { FluidModule } from 'primeng/fluid';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import {
  OfferService,
  OfferCreatePayload,
  OfferType,
  TargetYear
} from '@/core/services/offer.service';
import { AuthService } from '@/core/services/auth.service';

/* ---------- UI dropdown options ---------- */
const OFFER_TYPE_OPTS = [
  { label: 'Exchange',      value: 'EXCHANGE' as OfferType },
  { label: 'Double Degree', value: 'DOUBLE_DEGREE' as OfferType },
  { label: 'Master',        value: 'MASTERS' as OfferType }
];

const TARGET_YEAR_OPTS = [
  { label: '4th Year', value: 'FOURTH' as TargetYear },
  { label: '5th Year', value: 'FIFTH'  as TargetYear }
];

/* -------------------- DEFAULT NON-ESPRIT FIELDS -------------------- */
function baseCoreFields(): string[] {
  return [
    'Esprit ID',
    'Class',
    'First Name',
    'Middle Name',
    'Last Name',
    'Email (esprit.tn)',
    'Email (personal)',
    'Phone Number',
    'Civility'
  ];
}

/* -------------------- ESPRIT PROGRAM EXTERNAL STUDENTS -------------------- */
function baseCoreFieldsEsprit(): string[] {
  return [
    'Class',
    'First Name',
    'Middle Name',
    'Last Name',
    'Email (personal)',
    'University Name',
    'University Address',
    'Local Mobility Department Contact',
    'Country',
    'Nationality',
    'Phone Number',
    'Civility'
  ];
}

function gradeFieldsForYear(targetYear: TargetYear | null | undefined): string[] {
  const base = [
    'Grade – 1st Year (main session)',
    'Grade – 2nd Year (main session)',
    'Grade – 3rd Year (main session)'
  ];
  if (targetYear === 'FIFTH') {
    return [...base, 'Grade – 4th Year (main session)', 'Grade – 5th Year (main session)'];
  }
  return base;
}

/* ---------- MASTER SWITCH BETWEEN ESPRIT / NON-ESPRIT ---------- */
function fieldsFor(esprit: boolean, targetYear: TargetYear | null | undefined): string[] {
  return [
    ...(esprit ? baseCoreFieldsEsprit() : baseCoreFields()),
    ...gradeFieldsForYear(targetYear)
  ];
}

@Component({
  selector: 'app-offer-create-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    FluidModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    ToastModule,
    ToggleSwitchModule
  ],
  providers: [MessageService],
  styles: [`
    .page{display:flex;justify-content:center;padding:.75rem;}
    .shell{width:100%;max-width:980px;}
    .field{display:flex;flex-direction:column;gap:.4rem}
    .label{font-weight:600}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    @media (max-width:720px){.grid-2{grid-template-columns:1fr}}
    .chips{display:flex;flex-wrap:wrap;gap:.4rem}
    .chip{display:inline-flex;align-items:center;gap:.35rem;padding:.25rem .5rem;border-radius:9999px;background:var(--surface-200);font-size:.85rem}
    .chip button{border:none;background:transparent;cursor:pointer}
    .chip-input{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
    .chip-input input{min-width:220px}
    .file-name{font-size:.9rem;color:var(--text-color-secondary)}
    .image{width:100%;aspect-ratio:16/9;border:1px dashed var(--surface-300);border-radius:.5rem;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-top:.5rem}
    .image img{width:100%;height:100%;object-fit:cover;display:block}
    .image .overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);opacity:0;display:flex;align-items:center;justify-content:center;gap:.5rem}
    .image:hover .overlay{opacity:1}
    textarea.p-inputtextarea{min-height:6rem}
  `],
  template: `
<p-fluid>
  <div class="page">
    <div class="shell">
      <p-card>
        <ng-template pTemplate="title">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="font-bold text-lg">Create Offer</span>

            <div class="flex gap-2">
              <button pButton
                      label="Back to Offers List"
                      icon="pi pi-arrow-left"
                      class="p-button-secondary"
                      (click)="goBack()">
              </button>

              <button pButton
                      label="Save"
                      icon="pi pi-check"
                      (click)="onSave()"
                      [disabled]="form.invalid || busy()">
              </button>
            </div>
          </div>
        </ng-template>

        <form [formGroup]="form" class="flex flex-col gap-4">

          <div class="grid-2">
            <div class="field">
              <span class="label">Title *</span>
              <input pInputText formControlName="title"/>
            </div>

            <div class="field">
              <span class="label">Seats *</span>
              <p-inputNumber formControlName="availableSlots"
                             [min]="1" [max]="1000"
                             [useGrouping]="false"
                             [showButtons]="true"></p-inputNumber>
            </div>
          </div>

          <div class="field">
            <span class="label">Description *</span>
            <textarea class="p-inputtext p-inputtextarea" rows="6" formControlName="description"></textarea>
          </div>

          <div class="grid-2">
            <div class="field">
              <span class="label">Deadline *</span>
              <p-datepicker formControlName="deadline" dateFormat="yy-mm-dd"></p-datepicker>
            </div>

            <div class="field">
              <span class="label">Offer Type *</span>
              <p-select formControlName="type"
                        [options]="offerTypeOptions"
                        optionLabel="label"
                        optionValue="value"></p-select>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <span class="label">Target Year *</span>
              <p-select formControlName="targetYear"
                        [options]="targetYearOptions"
                        optionLabel="label"
                        optionValue="value"
                        (onChange)="onTargetYearChange()"></p-select>
            </div>

            <div class="field">
              <span class="label">Esprit Program</span>
              <p-toggleswitch formControlName="esprit"
                              (onChange)="onEspritChange()"></p-toggleswitch>
            </div>
          </div>

          <!-- Topic Tags -->
          <div class="field">
            <span class="label">Topic Tags</span>
            <div class="chips">
              <span class="chip" *ngFor="let t of topicTags(); let i = index">
                {{ t }}
                <button type="button" (click)="removeTopicTag(i)">
                  <i class="pi pi-times"></i>
                </button>
              </span>
            </div>
            <div class="chip-input">
              <input pInputText [(ngModel)]="topicDraft"
                     [ngModelOptions]="{standalone:true}"
                     (keyup.enter)="addTopicTag()"
                     placeholder="type tag then Enter"/>
              <button pButton icon="pi pi-plus" class="p-button-sm" (click)="addTopicTag()"></button>
            </div>
          </div>

          <!-- Required Documents -->
          <div class="field">
            <span class="label">Required Documents</span>
            <div class="chips">
              <span class="chip" *ngFor="let d of requiredDocs(); let i=index">
                {{ d }}
                <button type="button" (click)="removeRequiredDoc(i)">
                  <i class="pi pi-times"></i>
                </button>
              </span>
            </div>
            <div class="chip-input">
              <input pInputText [(ngModel)]="docDraft"
                     [ngModelOptions]="{standalone:true}"
                     (keyup.enter)="addRequiredDoc()"
                     placeholder="type label then Enter"/>
              <button pButton icon="pi pi-plus" class="p-button-sm" (click)="addRequiredDoc()"></button>
            </div>
          </div>

          <!-- ⭐ NEW: Modules -->
          <div class="field">
            <span class="label">Modules</span>
            <div class="chips">
              <span class="chip" *ngFor="let m of modules(); let i = index">
                {{ m }}
                <button type="button" (click)="removeModule(i)">
                  <i class="pi pi-times"></i>
                </button>
              </span>
            </div>
            <div class="chip-input">
              <input pInputText [(ngModel)]="moduleDraft"
                     [ngModelOptions]="{standalone:true}"
                     (keyup.enter)="addModule()"
                     placeholder="add module then Enter"/>
              <button pButton icon="pi pi-plus" class="p-button-sm" (click)="addModule()"></button>
            </div>
          </div>

          <!-- ⭐ NEW: Offer File (affiche / PDF / DOC / image) -->
          <div class="field">
            <span class="label">Offer File (PDF / DOC / Image)</span>
            <div class="chip-input">
              <button pButton
                      type="button"
                      label="Choose file"
                      icon="pi pi-upload"
                      (click)="offerFileInput.nativeElement.click()"></button>

              <span class="file-name" *ngIf="offerFileName">
                {{ offerFileName }}
              </span>

              <button *ngIf="offerFile"
                      pButton type="button"
                      icon="pi pi-times"
                      class="p-button-text p-button-danger p-button-sm"
                      (click)="clearOfferFile()"></button>
            </div>

            <input #offerFileRef
                   type="file"
                   hidden
                   accept=".pdf,.doc,.docx,image/*"
                   (change)="onPickOfferFile($event)"/>
          </div>

          <!-- Application Form (fields in order) -->
          <div class="field">
            <span class="label">Application Form (fields in order)</span>
            <div class="chips">
              <span class="chip" *ngFor="let f of formFields(); let i=index">
                {{ f }}
                <button type="button" (click)="removeFormField(i)">
                  <i class="pi pi-times"></i>
                </button>
              </span>
            </div>
            <div class="chip-input">
              <input pInputText [(ngModel)]="fieldDraft"
                     [ngModelOptions]="{standalone:true}"
                     (keyup.enter)="addFormField()"
                     placeholder="add field then Enter"/>
              <button pButton icon="pi pi-plus" class="p-button-sm" (click)="addFormField()"></button>
              <button pButton label="Reset to defaults"
                      class="p-button-text p-button-sm"
                      (click)="resetDefaults()"></button>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <span class="label">University Name *</span>
              <input pInputText formControlName="universityName"/>
            </div>
            <div class="field">
              <span class="label">Country Code (ISO-2)</span>
              <input pInputText formControlName="countryCode" placeholder="e.g., TN, FR"/>
            </div>
          </div>

          <div class="field">
            <span class="label">Address</span>
            <input pInputText formControlName="addressLine"/>
          </div>

          <div class="grid-2">
            <div class="field">
              <span class="label">Contact Email</span>
              <input pInputText formControlName="contactEmail" type="email"/>
            </div>
            <div class="field">
              <span class="label">Contact Phone</span>
              <input pInputText formControlName="contactPhone" placeholder="+216..."/>
            </div>
          </div>

          <!-- Offer Image (ALWAYS LAST) -->
          <div class="field">
            <span class="label">Offer Image</span>
            <div class="image">
              <ng-container *ngIf="preview(); else chooseImage">
                <img [src]="preview()!" alt="offer image">
              </ng-container>
              <ng-template #chooseImage>
                <div class="text-sm text-color-secondary">No image selected</div>
              </ng-template>
              <div class="overlay">
                <button pButton icon="pi pi-upload"
                        class="p-button-rounded p-button-sm"
                        (click)="fileInput.nativeElement.click()"></button>
                <button pButton icon="pi pi-times"
                        class="p-button-rounded p-button-danger p-button-sm"
                        (click)="removeImage()"
                        [disabled]="!file()"></button>
              </div>
              <input #fileRef type="file" accept="image/*" hidden (change)="onPickImage($event)" />
            </div>
          </div>

        </form>
      </p-card>
    </div>
  </div>
</p-fluid>

<p-toast></p-toast>
  `
})
export class OfferCreatePageComponent implements OnInit {

  @ViewChild('fileRef') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('offerFileRef') offerFileInput!: ElementRef<HTMLInputElement>;

  private fb     = inject(FormBuilder);
  private srv    = inject(OfferService);
  private toast  = inject(MessageService);
  private router = inject(Router);
  private auth   = inject(AuthService);

  busy    = signal(false);
  file    = signal<File | null>(null);
  preview = signal<string | null>(null);

  offerTypeOptions  = OFFER_TYPE_OPTS;
  targetYearOptions = TARGET_YEAR_OPTS;

  topicDraft = '';
  docDraft   = '';
  fieldDraft = '';

  topicTags    = signal<string[]>([]);
  requiredDocs = signal<string[]>([]);
  formFields   = signal<string[]>([]);

  // ⭐ NEW: modules
  modules      = signal<string[]>([]);
  moduleDraft  = '';

  // ⭐ NEW: offer file (affiche)
  offerFile: File | null = null;
  offerFileName = '';

  form = this.fb.group({
    title:          ['', Validators.required],
    description:    ['', Validators.required],
    availableSlots: [1, [Validators.required, Validators.min(1)]],
    deadline:       <Date | null>(null),
    type:           <OfferType | null>(null),
    targetYear:     <TargetYear | null>(null),

    universityName: ['', Validators.required],
    countryCode:    [''],
    addressLine:    [''],
    contactEmail:   ['', Validators.email],
    contactPhone:   [''],

    esprit:         [false],
  });

  ngOnInit(): void {
    const roleRaw = (this.auth.currentRole() || '').toUpperCase();
    const isPartner = roleRaw === 'PARTNER';
    const isOfficer = roleRaw === 'MOBILITY_OFFICER';

    if (!isPartner && !isOfficer) {
      this.router.navigate(['/pages/notfound']);
      return;
    }

    // Partner can NEVER create Esprit offers: always false + disabled
    if (isOfficer) {
      this.form.get('esprit')!.setValue(true);
      this.form.get('esprit')!.enable({ emitEvent: false });
    } else {
      this.form.get('esprit')!.setValue(false);
      this.form.get('esprit')!.disable({ emitEvent: false });
    }

    const ty = this.form.get('targetYear')?.value as TargetYear | null;
    const espritVal = this.form.get('esprit')!.value === true;
    this.formFields.set(fieldsFor(espritVal, ty));
  }

  /* --------- BASIC CHIP HELPERS --------- */

  private pushUnique(arr: string[], v: string) {
    const t = v.trim();
    if (!t) return arr;
    return arr.includes(t) ? arr : [...arr, t];
  }

  addTopicTag() {
    this.topicTags.set(this.pushUnique(this.topicTags(), this.topicDraft));
    this.topicDraft = '';
  }

  removeTopicTag(i: number) {
    const a = [...this.topicTags()];
    a.splice(i, 1);
    this.topicTags.set(a);
  }

  addRequiredDoc() {
    this.requiredDocs.set(this.pushUnique(this.requiredDocs(), this.docDraft));
    this.docDraft = '';
  }

  removeRequiredDoc(i: number) {
    const a = [...this.requiredDocs()];
    a.splice(i, 1);
    this.requiredDocs.set(a);
  }

  addFormField() {
    this.formFields.set(this.pushUnique(this.formFields(), this.fieldDraft));
    this.fieldDraft = '';
  }

  removeFormField(i: number) {
    const a = [...this.formFields()];
    a.splice(i, 1);
    this.formFields.set(a);
  }

  resetDefaults() {
    const ty = this.form.get('targetYear')?.value as TargetYear | null;
    const espritVal = this.form.get('esprit')!.value === true;
    this.formFields.set(fieldsFor(espritVal, ty));
  }

  onTargetYearChange() {
    const ty = this.form.get('targetYear')?.value as TargetYear | null;
    const espritVal = this.form.get('esprit')!.value === true;
    this.formFields.set(fieldsFor(espritVal, ty));
  }

  /* --------- ESPRIT CHANGE → RESET FIELDS --------- */
  onEspritChange() {
    const espritVal = this.form.get('esprit')!.value === true;
    const ty = this.form.get('targetYear')?.value as TargetYear | null;
    this.formFields.set(fieldsFor(espritVal, ty));
  }

  /* --------- MODULES --------- */
  addModule() {
    this.modules.set(this.pushUnique(this.modules(), this.moduleDraft));
    this.moduleDraft = '';
  }

  removeModule(i: number) {
    const a = [...this.modules()];
    a.splice(i, 1);
    this.modules.set(a);
  }

  /* --------- OFFER FILE (AFFICHE) --------- */
  onPickOfferFile(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0] || null;
    this.offerFile = f;
    this.offerFileName = f ? f.name : '';
  }

  clearOfferFile() {
    this.offerFile = null;
    this.offerFileName = '';
    if (this.offerFileInput?.nativeElement) {
      this.offerFileInput.nativeElement.value = '';
    }
  }

  /* --------- IMAGE HANDLING --------- */

  onPickImage(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0] || null;
    this.file.set(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => this.preview.set(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      this.preview.set(null);
    }
  }

  removeImage() {
    this.file.set(null);
    this.preview.set(null);
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  }

  goBack() {
    this.router.navigate(['/pages/offer/list']);
  }

  /* --------- SAVE --------- */

  private ymd(d: Date) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const da = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${da}T00:00:00`;
  }

  private buildFormJson(fields: string[]): any | null {
    const clean = fields.map(s => s.trim()).filter(Boolean);
    return clean.length ? { fields: clean } : null;
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);

    const v = this.form.value as any;

    const payload: OfferCreatePayload & any = {
      title: v.title,
      description: v.description,
      seats: Number(v.availableSlots),
      deadline: v.deadline ? this.ymd(v.deadline as Date) : null,
      type: v.type!,
      targetYear: v.targetYear!,

      topicTags: this.topicTags(),
      requiredDocs: this.requiredDocs(),
      formJson: this.buildFormJson(this.formFields()),

      // ⭐ NEW: modules sent to backend
      modules: this.modules(),

      universityName: v.universityName,
      countryCode: v.countryCode || null,
      addressLine: v.addressLine || null,
      contactEmail: v.contactEmail || null,
      contactPhone: v.contactPhone || null,

      esprit: this.form.get('esprit')!.value === true,
    };

    this.srv.createOffer(payload).subscribe({
      next: (created) => {
        const img = this.file();
        const offerDoc = this.offerFile;

        // No image, no file -> same old flow
        if (!img && !offerDoc) {
          this.toast.add({ severity: 'success', summary: 'Offer created' });
          this.busy.set(false);
          this.router.navigate(['/pages/offer/list']);
          return;
        }

        const doneOk = (summary: string) => {
          this.toast.add({ severity: 'success', summary });
          this.busy.set(false);
          this.router.navigate(['/pages/offer/list']);
        };

        const handleUploadError = (err: any) => {
          this.busy.set(false);
          this.toast.add({
            severity: 'warn',
            summary: 'Offer ok (upload failed)',
            detail: this.err(err)
          });
          this.router.navigate(['/pages/offer/list']);
        };

        // First upload image (if any), then offer file (if any), using nested subscribes (no rxjs ops).
        if (img) {
          this.srv.uploadOfferImage(created.id!, img).subscribe({
            next: () => {
              if (offerDoc) {
                this.srv.uploadOfferFile(created.id!, offerDoc).subscribe({
                  next: () => doneOk('Offer created with attachments'),
                  error: handleUploadError
                });
              } else {
                doneOk('Offer created with image');
              }
            },
            error: handleUploadError
          });
        } else if (offerDoc) {
          this.srv.uploadOfferFile(created.id!, offerDoc).subscribe({
            next: () => doneOk('Offer created with file'),
            error: handleUploadError
          });
        }
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.add({ severity: 'error', summary: 'Create failed', detail: this.err(err) });
      }
    });
  }

  private err(e: any) {
    return e?.error?.message || e?.message || 'Unexpected error';
  }
}
