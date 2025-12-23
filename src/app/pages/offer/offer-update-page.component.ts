import { Component, OnInit, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { FileUploadModule } from 'primeng/fileupload';

import { AuthService } from '@/core/services/auth.service';
import { OfferService, OfferCreatePayload, OfferType, TargetYear } from '@/core/services/offer.service';

const OFFER_TYPE_OPTS = [
  { label: 'Exchange', value: 'EXCHANGE' as OfferType },
  { label: 'Double Degree', value: 'DOUBLE_DEGREE' as OfferType },
  { label: 'Master', value: 'MASTERS' as OfferType },
];

const TARGET_YEAR_OPTS = [
  { label: '4th Year', value: 'FOURTH' as TargetYear },
  { label: '5th Year', value: 'FIFTH' as TargetYear },
];

@Component({
  selector: 'app-offer-update-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule,
    FluidModule, CardModule, ButtonModule, InputTextModule,
    InputNumberModule, DatePickerModule, SelectModule,
    ToastModule, ToggleSwitchModule, FileUploadModule
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
    .chip{display:flex;align-items:center;gap:.35rem;padding:.3rem .6rem;
      border-radius:9999px;background:var(--surface-200);font-size:.85rem}
    .chip button{border:none;background:transparent;cursor:pointer}
    .image{width:100%;aspect-ratio:16/9;border:1px dashed var(--surface-300);
      border-radius:.5rem;display:flex;align-items:center;justify-content:center;
      position:relative;overflow:hidden;margin-top:.5rem}
    .image img{width:100%;height:100%;object-fit:cover;display:block}
    .image .overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);
      opacity:0;display:flex;align-items:center;justify-content:center;gap:.5rem}
    .image:hover .overlay{opacity:1}
    .chip-input{display:flex;gap:.5rem;margin-top:.35rem}
  `],
  template: `
<p-fluid>
  <div class="page">
    <div class="shell">
      <p-card>

        <ng-template pTemplate="title">
          <div class="flex items-center justify-between">
            <span class="font-bold text-lg">Update Offer</span>
            <button pButton label="Save" icon="pi pi-check"
                    (click)="onSave()" [disabled]="form.invalid || busy()"></button>
          </div>
        </ng-template>

        <form [formGroup]="form" class="flex flex-col gap-4">

          <!-- BASIC INFO -->
          <div class="grid-2">
            <div class="field">
              <span class="label">Title *</span>
              <input pInputText formControlName="title"/>
            </div>

            <div class="field">
              <span class="label">Seats *</span>
              <p-inputNumber formControlName="seats" [min]="1" [max]="1000"
                             [useGrouping]="false" [showButtons]="true"></p-inputNumber>
            </div>
          </div>

          <div class="field">
            <span class="label">Description *</span>
            <textarea class="p-inputtext p-inputtextarea" rows="6"
                      formControlName="description"></textarea>
          </div>

          <div class="grid-2">
            <div class="field">
              <span class="label">Deadline *</span>
              <p-datepicker formControlName="deadline" dateFormat="yy-mm-dd"></p-datepicker>
            </div>

            <div class="field">
              <span class="label">Offer Type *</span>
              <p-select formControlName="type" [options]="offerTypeOptions"
                        optionLabel="label" optionValue="value"></p-select>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <span class="label">Target Year *</span>
              <p-select formControlName="targetYear" [options]="targetYearOptions"
                        optionLabel="label" optionValue="value"></p-select>
            </div>

            <!-- TOPIC TAGS -->
            <div class="field">
              <span class="label">Topic Tags</span>
              <div class="chips">
                <span class="chip" *ngFor="let t of topicTags(); let i=index">
                  {{t}}
                  <button (click)="removeTopicTag(i)"><i class="pi pi-times"></i></button>
                </span>
              </div>
              <div class="chip-input">
                <input pInputText [(ngModel)]="topicDraft" [ngModelOptions]="{standalone:true}"
                       (keyup.enter)="addTopicTag()" placeholder="Add tag"/>
                <button pButton icon="pi pi-plus" class="p-button-sm" type="button"
                        (click)="addTopicTag()"></button>
              </div>
            </div>
          </div>

          <!-- ESPRIT -->
          <div class="field">
            <span class="label">Esprit Program</span>
            <p-toggleswitch formControlName="esprit"></p-toggleswitch>
          </div>

          <!-- UNIVERSITY DATA -->
          <div class="grid-2">
            <div class="field">
              <span class="label">University Name *</span>
              <input pInputText formControlName="universityName"/>
            </div>
            <div class="field">
              <span class="label">Country Code</span>
              <input pInputText formControlName="countryCode"/>
            </div>
          </div>

          <div class="field">
            <span class="label">Address</span>
            <input pInputText formControlName="addressLine"/>
          </div>

          <div class="grid-2">
            <div class="field">
              <span class="label">Contact Email</span>
              <input pInputText formControlName="contactEmail"/>
            </div>
            <div class="field">
              <span class="label">Contact Phone</span>
              <input pInputText formControlName="contactPhone"/>
            </div>
          </div>

          <!-- REQUIRED DOCS -->
          <div class="field">
            <span class="label">Required Documents</span>
            <div class="chips">
              <span class="chip" *ngFor="let d of requiredDocs(); let i=index">
                {{d}}
                <button (click)="removeRequiredDoc(i)"><i class="pi pi-times"></i></button>
              </span>
            </div>
            <div class="chip-input">
              <input pInputText [(ngModel)]="docDraft" [ngModelOptions]="{standalone:true}"
                     (keyup.enter)="addRequiredDoc()" placeholder="Add doc"/>
              <button pButton icon="pi pi-plus" class="p-button-sm" type="button"
                      (click)="addRequiredDoc()"></button>
            </div>
          </div>

          <!-- FORM FIELDS -->
          <div class="field">
            <span class="label">Application Form Fields</span>
            <div class="chips">
              <span class="chip" *ngFor="let f of formFields(); let i=index">
                {{f}}
                <button (click)="removeFormField(i)"><i class="pi pi-times"></i></button>
              </span>
            </div>
            <div class="chip-input">
              <input pInputText [(ngModel)]="fieldDraft" [ngModelOptions]="{standalone:true}"
                     (keyup.enter)="addFormField()" placeholder="Add field"/>
              <button pButton icon="pi pi-plus" class="p-button-sm" type="button"
                      (click)="addFormField()"></button>
            </div>
          </div>

          <!-- MODULES -->
          <div class="field">
            <span class="label">Modules</span>
            <div class="chips">
              <span class="chip" *ngFor="let m of modules(); let i=index">
                {{m}}
                <button (click)="removeModule(i)"><i class="pi pi-times"></i></button>
              </span>
            </div>
            <div class="chip-input">
              <input pInputText [(ngModel)]="moduleDraft" [ngModelOptions]="{standalone:true}"
                     (keyup.enter)="addModule()" placeholder="Add module"/>
              <button pButton icon="pi pi-plus" class="p-button-sm" type="button"
                      (click)="addModule()"></button>
            </div>
          </div>

          <!-- OFFER FILES -->
          <div class="field">
            <span class="label">Offer Files</span>

            <!-- EXISTING -->
            <div class="chips" *ngIf="existingFiles().length > 0">
              <span class="chip" *ngFor="let ef of existingFiles(); let i=index">
                {{ef.label}}
                <button (click)="removeExistingFile(i)">
                  <i class="pi pi-times"></i>
                </button>
              </span>
            </div>

            <!-- NEW FILES -->
            <div class="chips" *ngIf="newFiles().length > 0">
              <span class="chip" *ngFor="let nf of newFiles(); let i=index">
                {{nf.name}}
                <button (click)="removeNewFile(i)">
                  <i class="pi pi-times"></i>
                </button>
              </span>
            </div>

            <!-- INPUT PRIME NG -->
            <p-fileUpload
              mode="basic"
              [multiple]="true"
              [customUpload]="true"
              [auto]="false"
              chooseLabel="Select files"
              accept=".pdf,.doc,.docx,image/*"
              (onSelect)="onPickOfferFile($event)">
            </p-fileUpload>
          </div>

          <!-- IMAGE -->
          <div class="field">
            <span class="label">Offer Image</span>
            <div class="image">
              <ng-container *ngIf="preview(); else noImg">
                <img [src]="preview()">
              </ng-container>

              <ng-template #noImg>
                <div class="text-sm">No image selected</div>
              </ng-template>

              <div class="overlay">
                <button pButton icon="pi pi-upload"
                        class="p-button-rounded p-button-sm"
                        type="button"
                        (click)="fileInput.nativeElement.click()"></button>

                <button pButton icon="pi pi-times"
                        class="p-button-rounded p-button-danger p-button-sm"
                        type="button"
                        (click)="removeImage()" [disabled]="!file()"></button>
              </div>

              <input #fileRef type="file" hidden accept="image/*"
                     (change)="onPickImage($event)"/>
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
export class OfferUpdatePageComponent implements OnInit {

  @ViewChild('fileRef') fileInput!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private srv = inject(OfferService);
  private toast = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  busy = signal(false);

  file = signal<File | null>(null);
  preview = signal<string | null>(null);

  existingFiles = signal<{ label: string, url: string }[]>([]);
  newFiles = signal<File[]>([]);

  modules = signal<string[]>([]);
  moduleDraft = '';

  topicDraft = '';
  docDraft = '';
  fieldDraft = '';
  topicTags = signal<string[]>([]);
  requiredDocs = signal<string[]>([]);
  formFields = signal<string[]>([]);

  offerTypeOptions = OFFER_TYPE_OPTS;
  targetYearOptions = TARGET_YEAR_OPTS;

  id!: number;

  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    seats: [1, [Validators.required, Validators.min(1)]],
    deadline: <Date | null>(null),
    type: <OfferType | null>(null),
    targetYear: <TargetYear | null>(null),
    universityName: ['', Validators.required],
    countryCode: [''],
    addressLine: [''],
    contactEmail: ['', Validators.email],
    contactPhone: [''],
    esprit: [false],
  });

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    this.srv.getOffer(this.id).subscribe({
      next: (o) => {
        this.form.patchValue({
          title: o.title,
          description: o.description,
          seats: o.seats,
          deadline: o.deadline ? new Date(o.deadline) : null,
          type: o.type,
          targetYear: o.targetYear,
          universityName: o.universityName,
          countryCode: o.countryCode ?? '',
          addressLine: o.addressLine ?? '',
          contactEmail: o.contactEmail ?? '',
          contactPhone: o.contactPhone ?? '',
          esprit: o.esprit === true,
        });

        this.topicTags.set(o.topicTags ?? []);
        this.requiredDocs.set(o.requiredDocs ?? []);
        this.formFields.set(o.formJson?.fields ?? []);
        this.modules.set(o.modules ?? []);

        const fileMap = o.offerFileUrls || {};
        this.existingFiles.set(Object.keys(fileMap).map(lbl => ({
          label: lbl,
          url: fileMap[lbl]
        })));

        this.preview.set(o.imageUrl || null);
      }
    });
  }

  private pushUnique(list: string[], v: string) {
    v = v.trim();
    if (!v) return list;
    return list.includes(v) ? list : [...list, v];
  }

  addTopicTag() { this.topicTags.set(this.pushUnique(this.topicTags(), this.topicDraft)); this.topicDraft=''; }
  removeTopicTag(i: number) { const a=[...this.topicTags()]; a.splice(i,1); this.topicTags.set(a); }

  addRequiredDoc() { this.requiredDocs.set(this.pushUnique(this.requiredDocs(), this.docDraft)); this.docDraft=''; }
  removeRequiredDoc(i: number) { const a=[...this.requiredDocs()]; a.splice(i,1); this.requiredDocs.set(a); }

  addFormField() { this.formFields.set(this.pushUnique(this.formFields(), this.fieldDraft)); this.fieldDraft=''; }
  removeFormField(i: number) { const a=[...this.formFields()]; a.splice(i,1); this.formFields.set(a); }

  addModule() { this.modules.set(this.pushUnique(this.modules(), this.moduleDraft)); this.moduleDraft=''; }
  removeModule(i: number) { const a=[...this.modules()]; a.splice(i,1); this.modules.set(a); }

  onPickImage(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.file.set(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => this.preview.set(reader.result as string);
      reader.readAsDataURL(f);
    }
  }

  removeImage() {
    this.file.set(null);
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  }

  // adapté pour p-fileUpload
  onPickOfferFile(event: any) {
    const files: File[] = event.files || [];
    if (files.length > 0) {
      this.newFiles.set([...this.newFiles(), ...files]);
    }
  }

  removeNewFile(i: number) {
    const arr=[...this.newFiles()]; arr.splice(i,1); this.newFiles.set(arr);
  }

  removeExistingFile(i: number) {
    const arr=[...this.existingFiles()]; arr.splice(i,1); this.existingFiles.set(arr);
  }

  private ymd(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T00:00:00`;
  }

  private buildFormJson(fields: string[]) {
    const clean = fields.map(s=>s.trim()).filter(Boolean);
    return clean.length ? { fields: clean } : null;
  }

  onSave() {
    if (this.form.invalid) return;

    this.busy.set(true);

    const v = this.form.value as any;

    const existingLabels = this.existingFiles().map(f => f.label);
    const fileMap: Record<string, string | null> = {};
    existingLabels.forEach(lbl => fileMap[lbl] = null);

    const patch: Partial<OfferCreatePayload> & any = {
      title: v.title,
      description: v.description,
      seats: Number(v.seats),
      deadline: v.deadline ? this.ymd(v.deadline) : null,
      type: v.type,
      targetYear: v.targetYear,
      topicTags: this.topicTags(),
      requiredDocs: this.requiredDocs(),
      formJson: this.buildFormJson(this.formFields()),
      universityName: v.universityName,
      countryCode: v.countryCode || null,
      addressLine: v.addressLine || null,
      contactEmail: v.contactEmail || null,
      contactPhone: v.contactPhone || null,
      esprit: v.esprit === true,
      modules: this.modules(),
      offerFiles: fileMap
    };

    this.srv.updateOffer(this.id, patch).subscribe({
      next: () => this.uploadImageThenFiles(),
      error: () => { this.busy.set(false); }
    });
  }

  private uploadImageThenFiles() {
    const img = this.file();
    if (!img) return this.uploadFiles();

    this.srv.uploadOfferImage(this.id, img).subscribe({
      next: () => this.uploadFiles(),
      error: () => this.uploadFiles()
    });
  }

  private uploadFiles() {
    const list = this.newFiles();
    if (list.length === 0) return this.finish();

    let pending = list.length;

    list.forEach(f => {
      this.srv.uploadOfferFile(this.id, f).subscribe({
        next: () => { if (--pending === 0) this.finish(); },
        error: () => { if (--pending === 0) this.finish(); }
      });
    });
  }

  private finish() {
    this.toast.add({ severity: 'success', summary: 'Offer updated' });
    this.busy.set(false);
    this.router.navigate(['/pages/offer/list']);
  }
}
