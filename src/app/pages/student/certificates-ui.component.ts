import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { StudentService, Certificate, CertificateLevel } from '@/core/services/student.service';

@Component({
  selector: 'app-certificates-ui',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FileUploadModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    ConfirmDialogModule
  ],
  template: `
  <p-toast />
  <p-confirmDialog />

  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-full">
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <div class="font-semibold text-xl">
            Certificates
            <span class="ml-2 text-sm opacity-70">({{ certs.length }} / {{ maxCertificates }})</span>
          </div>
          <button pButton icon="pi pi-plus" label="Add Certificate"
                  (click)="showCreate = true" [disabled]="certs.length >= maxCertificates"></button>
        </div>

        <!-- Create -->
        <div *ngIf="showCreate" class="p-4 border rounded-md mb-5">
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-4">
              <label class="block mb-1">Name</label>
              <input pInputText [(ngModel)]="create.name" placeholder="e.g. AWS Cloud Practitioner" />
            </div>

            <div class="col-span-12 md:col-span-4">
              <label class="block mb-1">Topics</label>

              <!-- chips list -->
              <div class="flex flex-wrap gap-2 mb-2">
                <span class="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-surface-200 text-sm"
                      *ngFor="let t of create.topics; let i = index">
                  {{ t }}
                  <button type="button" class="p-button p-button-text p-button-sm"
                          (click)="removeTopicFromCreate(i)">
                    <i class="pi pi-times"></i>
                  </button>
                </span>
              </div>

              <!-- add chip -->
              <div class="flex items-center gap-2">
                <input pInputText #newTopic placeholder="type tag then Enter"
                       (keyup.enter)="addTopicToCreate(newTopic)" />
                <button pButton type="button" icon="pi pi-plus" class="p-button-sm"
                        (click)="addTopicToCreate(newTopic)"></button>
              </div>
            </div>

            <div class="col-span-12 md:col-span-4">
              <label class="block mb-1">Level</label>
              <p-select [(ngModel)]="create.level"
                        [options]="levelOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select">
              </p-select>
            </div>

            <div class="col-span-12">
              <p-fileUpload #up mode="advanced" [customUpload]="true" [auto]="false"
                            (uploadHandler)="doCreate(up)"
                            [maxFileSize]="50_000_000">
                <ng-template #empty>
                  <div>Drag and drop files to here to upload.</div>
                </ng-template>
              </p-fileUpload>
            </div>

            <div class="col-span-12 flex gap-2">
              <button pButton icon="pi pi-check" label="Save" (click)="up.upload()"
                      [disabled]="!create.name || !create.level || !(create.topics?.length)">
              </button>
              <button pButton icon="pi pi-times" label="Cancel" severity="secondary" (click)="cancelCreate(up)"></button>
            </div>
          </div>
        </div>

        <!-- Table -->
        <p-table [value]="certs" dataKey="id" [showGridlines]="true" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Topics</th>
              <th>Level</th>
              <th>File</th>
              <th style="width: 20rem">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-row>
            <tr>
              <td>
                <input pInputText [(ngModel)]="row.name" (blur)="saveInfo(row)" class="w-full">
              </td>

              <td>
                <!-- chips list for row -->
                <div class="flex flex-wrap gap-2 mb-2">
                  <span class="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-surface-200 text-sm"
                        *ngFor="let t of (row.topics || []); let i = index">
                    {{ t }}
                    <button type="button" class="p-button p-button-text p-button-sm"
                            (click)="removeTopicFromRow(row, i)">
                      <i class="pi pi-times"></i>
                    </button>
                  </span>
                </div>

                <!-- add chip for row -->
                <div class="flex items-center gap-2">
                  <input pInputText #rowTopic placeholder="add topic then Enter"
                         (keyup.enter)="addTopicToRow(row, rowTopic)" />
                  <button pButton type="button" icon="pi pi-plus" class="p-button-sm"
                          (click)="addTopicToRow(row, rowTopic)"></button>
                </div>
              </td>

              <td>
                <p-select class="w-full"
                          [(ngModel)]="row.level"
                          [options]="levelOptions"
                          optionLabel="label"
                          optionValue="value"
                          (onChange)="saveInfo(row)">
                </p-select>
              </td>

              <td>{{ row.fileName }}</td>

              <td class="flex flex-wrap gap-2">
                <button pButton icon="pi pi-download" label="Download" (click)="download(row)"></button>

                <p-fileUpload
                  mode="basic"
                  [customUpload]="true"
                  [auto]="true"
                  chooseLabel="Replace File"
                  (uploadHandler)="replaceFile(row, $event.files[0])">
                </p-fileUpload>

                <button pButton icon="pi pi-trash" severity="danger" (click)="remove(row)"></button>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr><td colspan="5">No certificates yet.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  </div>
  `,
  providers: [MessageService, ConfirmationService]
})
export class CertificatesUiComponent implements OnInit {
  private api = inject(StudentService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);

  certs: Certificate[] = [];
  maxCertificates = 30;

  showCreate = false;
  create: { name: string; topics: string[]; level: CertificateLevel | null } =
    { name: '', topics: [], level: null };

  levelOptions = [
    { label: 'Beginner',     value: 'BEGINNER' as CertificateLevel },
    { label: 'Intermediate', value: 'INTERMEDIATE' as CertificateLevel },
    { label: 'Advanced',     value: 'ADVANCED' as CertificateLevel },
    { label: 'Professional', value: 'PROFESSIONAL' as CertificateLevel }
  ];

  ngOnInit() {
    this.reload();
    this.api.countCertificates().subscribe({
      next: () => (this.maxCertificates = 30),
      error: () => (this.maxCertificates = 30),
    });
  }

  // chips helpers
  private addUnique(list: string[], raw: string): string[] {
    const v = (raw || '').trim();
    if (!v) return list;
    return Array.from(new Set([...list, v]));
  }

  addTopicToCreate(input: HTMLInputElement) {
    this.create.topics = this.addUnique(this.create.topics, input.value);
    input.value = '';
  }
  removeTopicFromCreate(index: number) {
    this.create.topics = this.create.topics.filter((_, i) => i !== index);
  }

  addTopicToRow(row: Certificate, input: HTMLInputElement) {
    const next = this.addUnique(row.topics || [], input.value);
    if (!row.topics || next.length !== row.topics.length) {
      row.topics = next as any;
      this.saveInfo(row);
    }
    input.value = '';
  }
  removeTopicFromRow(row: Certificate, index: number) {
    row.topics = (row.topics || []).filter((_, i) => i !== index) as any;
    this.saveInfo(row);
  }

  reload() {
    this.api.listCertificates().subscribe(list => (this.certs = list));
  }

  cancelCreate(up: FileUpload) {
    this.showCreate = false;
    this.create = { name: '', topics: [], level: null };
    up.clear();
  }

  doCreate(up: FileUpload) {
    const file = up.files?.[0] as File | undefined;
    if (!file || !this.create.name || !this.create.level) return;

    this.api.createCertificate(file, this.create.name, this.create.topics, this.create.level).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Certificate created' });
        this.cancelCreate(up);
        this.reload();
      },
      error: (e) => this.toast.add({ severity: 'error', summary: 'Create failed', detail: e?.error || '' })
    });
  }

  saveInfo(row: Certificate) {
    this.api.updateCertificateInfo(row.id, {
      name: row.name,
      topics: row.topics as any,
      level: row.level
    }).subscribe({
      next: () => this.toast.add({ severity: 'success', summary: 'Saved' }),
      error: (e) => this.toast.add({ severity: 'error', summary: 'Save failed', detail: e?.error || '' })
    });
  }

  replaceFile(row: Certificate, file?: File) {
    if (!file) return;
    this.api.replaceCertificateFile(row.id, file).subscribe({
      next: () => { this.toast.add({ severity: 'success', summary: 'File replaced' }); this.reload(); },
      error: (e) => this.toast.add({ severity: 'error', summary: 'Replace failed', detail: e?.error || '' })
    });
  }

  download(row: Certificate) {
    this.api.presignCertificateUrl(row.id).subscribe(url => window.open(url, '_blank'));
  }

  remove(row: Certificate) {
    this.confirm.confirm({
      message: `Delete "${row.name}"?`,
      accept: () => {
        this.api.deleteCertificate(row.id).subscribe({
          next: () => { this.toast.add({ severity: 'success', summary: 'Deleted' }); this.reload(); },
          error: (e) => this.toast.add({ severity: 'error', summary: 'Delete failed', detail: e?.error || '' })
        });
      }
    });
  }
}
