import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { StudentService, ProfileDocument } from '@/core/services/student.service';

@Component({
  selector: 'app-documents-ui',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    FileUploadModule, ToastModule, ButtonModule,
    InputTextModule, TableModule, ConfirmDialogModule
  ],
  template: `
  <p-toast />
  <p-confirmDialog />

  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-full">
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <div class="font-semibold text-xl">Documents</div>
          <button pButton icon="pi pi-plus" label="Add Document" (click)="showCreate = true"></button>
        </div>

        <!-- Create card -->
        <div *ngIf="showCreate" class="p-4 border rounded-md mb-5">
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-4">
              <label class="block mb-1">Name</label>
              <input pInputText [(ngModel)]="create.name" placeholder="e.g. Passport" />
            </div>
            <div class="col-span-12 md:col-span-8">
              <p-fileUpload #up   mode="basic"
  chooseLabel="Choose file"
  [auto]="false"
  (onSelect)="doCreate($event)"
                            [maxFileSize]="50_000_000">
                <ng-template #empty>
                  <div>Drag and drop files to here to upload.</div>
                </ng-template>
              </p-fileUpload>
            </div>
            <div class="col-span-12 flex gap-2">
              <button pButton icon="pi pi-check" label="Save" (click)="up.upload()" [disabled]="!create.name"></button>
              <button pButton icon="pi pi-times" label="Cancel" severity="secondary" (click)="cancelCreate(up)"></button>
            </div>
          </div>
        </div>

        <!-- Table -->
        <p-table [value]="docs" dataKey="id" [showGridlines]="true" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th style="width: 20rem">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>
                <input pInputText [(ngModel)]="row.fileName" (blur)="rename(row)" class="w-full">
              </td>
              <td class="flex flex-wrap gap-2">
                <button pButton icon="pi pi-download" label="Download" (click)="download(row)"></button>

            <p-fileUpload mode="basic" [customUpload]="true" [auto]="true" chooseLabel="Replace File"
              (uploadHandler)="replaceFile(row, $event.files[0])"></p-fileUpload>

                <button pButton icon="pi pi-trash" severity="danger" (click)="remove(row)"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="2">No documents yet.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  </div>
  `,
  providers: [MessageService, ConfirmationService]
})
export class DocumentsUiComponent implements OnInit {
  private api = inject(StudentService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);

  docs: ProfileDocument[] = [];
  showCreate = false;
  create = { name: '' };

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.api.listDocuments().subscribe(list => (this.docs = list));
  }

  cancelCreate(up: FileUpload) {
    this.showCreate = false;
    this.create = { name: '' };
    up.clear();
  }

doCreate(event: any) {
  const file = event.files?.[0];
  if (!file || !this.create.name) {
    this.toast.add({
      severity: 'warn',
      summary: 'Missing data',
      detail: 'Select a file and enter a name',
    });
    return;
  }

  this.api.createDocument(file, this.create.name).subscribe({
    next: () => {
      this.toast.add({ severity: 'success', summary: 'Document uploaded' });
      this.showCreate = false;
      this.create = { name: '' };
      this.reload();
    },
    error: (e) =>
      this.toast.add({
        severity: 'error',
        summary: 'Upload failed',
        detail: e?.error || '',
      }),
  });
}


  rename(row: ProfileDocument) {
    this.api.renameDocument(row.id, row.fileName).subscribe({
      next: () => this.toast.add({severity:'success', summary:'Renamed'}),
      error: (e) => this.toast.add({severity:'error', summary:'Rename failed', detail: e?.error || ''})
    });
  }

  replaceFile(row: ProfileDocument, file?: File) {
    if (!file) return;
    this.api.replaceDocumentFile(row.id, file).subscribe({
      next: () => { this.toast.add({severity:'success', summary:'File replaced'}); this.reload(); },
      error: (e) => this.toast.add({severity:'error', summary:'Replace failed', detail: e?.error || ''})
    });
  }

  download(row: ProfileDocument) {
    this.api.presignDocumentUrl(row.id).subscribe(url => window.open(url, '_blank'));
  }

  remove(row: ProfileDocument) {
    this.confirm.confirm({
      message: `Delete "${row.fileName}"?`,
      accept: () => {
        this.api.deleteDocument(row.id).subscribe({
          next: () => { this.toast.add({severity:'success', summary:'Deleted'}); this.reload(); },
          error: (e) => this.toast.add({severity:'error', summary:'Delete failed', detail: e?.error || ''})
        });
      }
    });
  }
}
