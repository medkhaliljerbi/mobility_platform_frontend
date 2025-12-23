import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AgentMobiliteService } from '@/core/services/agent-mobilite.service';

@Component({
  selector: 'app-mobility-contract-template',
  standalone: true,
  imports: [
    CommonModule,
    FileUploadModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <div class="font-semibold text-xl">
          Mobility Contract Template
        </div>
      </div>

      <!-- Upload (ONLY if no file exists) -->
      <p-fileUpload
        *ngIf="!fileUrl"
        mode="advanced"
        [customUpload]="true"
        [auto]="false"
        [maxFileSize]="50000000"
        chooseLabel="Upload Mobility Contract"
        (uploadHandler)="upload($event.files[0])">
      </p-fileUpload>

      <!-- Existing file -->
      <div *ngIf="fileUrl" class="mt-4 flex items-center gap-3">
        <i class="pi pi-file text-2xl"></i>

        <a
          href="#"
          class="font-medium underline"
          (click)="openFile($event)">
          Mobility Contract
        </a>
      </div>

      <!-- Delete (ONLY if file exists) -->
      <div class="mt-4">
        <button
          *ngIf="fileUrl"
          pButton
          icon="pi pi-trash"
          severity="danger"
          label="Delete"
          (click)="remove()">
        </button>
      </div>
    </div>
  `
})
export class MobilityContractTemplateComponent implements OnInit {

  private api = inject(AgentMobiliteService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);

  /** Presigned URL if the template exists */
  fileUrl?: string;

  ngOnInit() {
    this.refresh();
  }

  /** Check if file exists and get its URL */
  private refresh() {
    this.api.download().subscribe({
      next: url => this.fileUrl = url,
      error: () => this.fileUrl = undefined
    });
  }

  upload(file?: File) {
    if (!file) return;

    this.api.upload(file).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Mobility contract uploaded'
        });
        this.refresh();
      },
      error: () =>
        this.toast.add({
          severity: 'error',
          summary: 'Upload failed'
        })
    });
  }

  openFile(event: Event) {
    event.preventDefault();
    if (this.fileUrl) {
      window.open(this.fileUrl, '_blank');
    }
  }

  remove() {
    this.confirm.confirm({
      message: 'Delete the mobility contract template?',
      accept: () => {
        this.api.delete().subscribe({
          next: () => {
            this.toast.add({
              severity: 'success',
              summary: 'Mobility contract deleted'
            });
            this.fileUrl = undefined;
          },
          error: () =>
            this.toast.add({
              severity: 'error',
              summary: 'Delete failed'
            })
        });
      }
    });
  }
}
