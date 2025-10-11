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

import { OfferService, OfferCreatePayload, OfferType, TargetYear } from '@/core/services/offer.service';

const OFFER_TYPE_OPTS = [
  { label: 'Exchange', value: 'EXCHANGE' as OfferType },
  { label: 'Double Degree', value: 'DOUBLE_DEGREE' as OfferType },
  { label: 'Master', value: 'MASTERS' as OfferType }, // <- backend enum expects MASTERS
];

const TARGET_YEAR_OPTS = [
  { label: '4th Year', value: 'FOURTH' as TargetYear },
  { label: '5th Year', value: 'FIFTH' as TargetYear },
];

const DEFAULT_FORM_FIELDS = [
  'Email',
  'Last Name',
  'First Name',
  'Email (esprit.tn)',
  'Email (personal)',
  'Civility',
  'Phone Number',
  'Grade – 3rd Year (main session)',
  'Grade – 4th Year (main session)',
  'Grade – 5th Year (main session)',
];

@Component({
  selector: 'app-offer-create-page',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule,
    FluidModule, CardModule, ButtonModule, InputTextModule,
    InputNumberModule, DatePickerModule, SelectModule, ToastModule
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
    .chip-input{display:flex;gap:.5rem;align-items:center}
    .chip-input input{min-width:220px}

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
          <div class="flex items-center justify-between">
            <span class="font-bold text-lg">Create Offer</span>
            <button pButton label="Save" icon="pi pi-check"
                    (click)="onSave()" [disabled]="form.invalid || busy()"></button>
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
              <!-- IMPORTANT: binds to availableSlots, which the backend expects -->
              <p-inputNumber formControlName="availableSlots" [min]="1" [max]="1000" [useGrouping]="false" [showButtons]="true"></p-inputNumber>
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
              <p-select formControlName="type" [options]="offerTypeOptions" optionLabel="label" optionValue="value"></p-select>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <span class="label">Target Year *</span>
              <p-select formControlName="targetYear" [options]="targetYearOptions" optionLabel="label" optionValue="value"></p-select>
            </div>

            <div class="field">
              <span class="label">Topic Tags</span>
              <div class="chips">
                <span class="chip" *ngFor="let t of topicTags(); let i=index">
                  {{t}} <button type="button" (click)="removeTopicTag(i)" title="remove"><i class="pi pi-times"></i></button>
                </span>
              </div>
              <div class="chip-input">
                <input pInputText [(ngModel)]="topicDraft" [ngModelOptions]="{standalone:true}" (keyup.enter)="addTopicTag()" placeholder="type tag then Enter"/>
                <button pButton type="button" icon="pi pi-plus" class="p-button-sm" (click)="addTopicTag()"></button>
              </div>
            </div>
          </div>

          <div class="field">
            <span class="label">Required Documents</span>
            <div class="chips">
              <span class="chip" *ngFor="let d of requiredDocs(); let i=index">
                {{d}} <button type="button" (click)="removeRequiredDoc(i)" title="remove"><i class="pi pi-times"></i></button>
              </span>
            </div>
            <div class="chip-input">
              <input pInputText [(ngModel)]="docDraft" [ngModelOptions]="{standalone:true}" (keyup.enter)="addRequiredDoc()" placeholder="type label then Enter"/>
              <button pButton type="button" icon="pi pi-plus" class="p-button-sm" (click)="addRequiredDoc()"></button>
            </div>
          </div>

          <div class="field">
            <span class="label">Application Form (fields)</span>
            <div class="chips">
              <span class="chip" *ngFor="let f of formFields(); let i=index">
                {{f}} <button type="button" (click)="removeFormField(i)" title="remove"><i class="pi pi-times"></i></button>
              </span>
            </div>
            <div class="chip-input">
              <input pInputText [(ngModel)]="fieldDraft" [ngModelOptions]="{standalone:true}" (keyup.enter)="addFormField()" placeholder="add field then Enter"/>
              <button pButton type="button" icon="pi pi-plus" class="p-button-sm" (click)="addFormField()"></button>
              <button pButton type="button" label="Reset to defaults" class="p-button-text p-button-sm" (click)="resetDefaults()"></button>
            </div>
          </div>

          <div class="field">
            <span class="label">Offer Image</span>
            <div class="image">
              <ng-container *ngIf="preview(); else chooseImage">
                <img [src]="preview()" alt="offer image">
              </ng-container>
              <ng-template #chooseImage>
                <div class="text-sm text-color-secondary">No image selected</div>
              </ng-template>
              <div class="overlay">
                <button pButton icon="pi pi-upload" (click)="fileInput.nativeElement.click()" class="p-button-rounded p-button-sm"></button>
                <button pButton icon="pi pi-times" class="p-button-rounded p-button-danger p-button-sm" (click)="removeImage()" [disabled]="!file()"></button>
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

  private fb = inject(FormBuilder);
  private srv = inject(OfferService);
  private toast = inject(MessageService);
  private router = inject(Router);

  busy = signal(false);
  file = signal<File | null>(null);
  preview = signal<string | null>(null);

  offerTypeOptions = OFFER_TYPE_OPTS;
  targetYearOptions = TARGET_YEAR_OPTS;

  topicDraft = '';   docDraft = '';   fieldDraft = '';
  topicTags = signal<string[]>([]);
  requiredDocs = signal<string[]>([]);
  formFields = signal<string[]>([...DEFAULT_FORM_FIELDS]);

  form = this.fb.group({
    title:          ['', Validators.required],
    description:    ['', Validators.required],
    availableSlots: [1, [Validators.required, Validators.min(1)]], // <- renamed
    deadline:       <Date | null>(null),
    type:           <OfferType | null>(null),
    targetYear:     <TargetYear | null>(null),
  });

  ngOnInit(): void {}

  private pushUnique(arr: string[], v: string){ v=v.trim(); if(!v) return arr; if(!arr.includes(v)) arr = [...arr, v]; return arr; }
  addTopicTag(){ this.topicTags.set(this.pushUnique(this.topicTags(), this.topicDraft)); this.topicDraft=''; }
  removeTopicTag(i: number){ const a=[...this.topicTags()]; a.splice(i,1); this.topicTags.set(a); }

  addRequiredDoc(){ this.requiredDocs.set(this.pushUnique(this.requiredDocs(), this.docDraft)); this.docDraft=''; }
  removeRequiredDoc(i: number){ const a=[...this.requiredDocs()]; a.splice(i,1); this.requiredDocs.set(a); }

  addFormField(){ this.formFields.set(this.pushUnique(this.formFields(), this.fieldDraft)); this.fieldDraft=''; }
  removeFormField(i: number){ const a=[...this.formFields()]; a.splice(i,1); this.formFields.set(a); }
  resetDefaults(){ this.formFields.set([...DEFAULT_FORM_FIELDS]); }

  onPickImage(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0] || null;
    this.file.set(f);
    if (f) { const reader = new FileReader(); reader.onload = () => this.preview.set(reader.result as string); reader.readAsDataURL(f); }
    else { this.preview.set(null); }
  }
  removeImage(){ this.file.set(null); this.preview.set(null); if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = ''; }

  private ymd(d: Date){
    const y=d.getFullYear(), m=(d.getMonth()+1).toString().padStart(2,'0'), da=d.getDate().toString().padStart(2,'0');
    return `${y}-${m}-${da}T00:00:00`;
  }

  // return an OBJECT for jsonb, not a string
  private buildFormJson(fields: string[]): any | null {
    const clean = fields.map(s => s.trim()).filter(Boolean);
    return clean.length ? { fields: clean } : null;
  }

  onSave(){
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy.set(true);

    const v = this.form.value as any;

    // Build payload with correct names & types for backend
    const payload: OfferCreatePayload & any = {
      title: v.title,
      description: v.description,
      seats: Number(v.availableSlots),                   // <- matches entity
      deadline: v.deadline ? this.ymd(v.deadline as Date) : null,
      type: v.type!,                                           // 'EXCHANGE' | 'DOUBLE_DEGREE' | 'MASTERS'
      targetYear: v.targetYear!,
      topicTags: this.topicTags(),                             // <- array -> jsonb
      requiredDocs: this.requiredDocs(),                       // <- array -> jsonb
      formJson: this.buildFormJson(this.formFields()),         // <- object -> jsonb
    };

    this.srv.createOffer(payload).subscribe({
      next: (created) => {
        const img = this.file();
        if (!img) {
          this.toast.add({severity:'success', summary:'Offer created'});
          this.busy.set(false);
          this.router.navigate(['/offers', created.id]);
          return;
        }
        this.srv.uploadOfferImage(created.id!, img).subscribe({
          next: () => {
            this.toast.add({severity:'success', summary:'Offer created with image'});
            this.busy.set(false);
            this.router.navigate(['/offers', created.id]);
          },
          error: (err) => { this.busy.set(false); this.toast.add({severity:'warn', summary:'Offer ok (image failed)', detail: this.err(err)}); }
        });
      },
      error: (err) => { this.busy.set(false); this.toast.add({severity:'error', summary:'Create failed', detail:this.err(err)}); }
    });
  }

  private err(e:any){ return e?.error?.message || e?.message || 'Unexpected error'; }
}
