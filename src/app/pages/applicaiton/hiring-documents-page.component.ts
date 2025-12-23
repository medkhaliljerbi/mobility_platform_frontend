import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

import {
  HiringService,
  HiringApplicationView
} from '@/core/services/hiring.service';

import {
  OfferService,
  OfferView
} from '@/core/services/offer.service';

@Component({
  selector: 'app-hiring-documents-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    DatePicker
  ],
  providers: [MessageService],
  template: `
<!-- ============================================================ -->
<!-- HEADER -->
<!-- ============================================================ -->

<div class="card" *ngIf="offer">
  <div class="flex justify-between items-center">
    <div>
      <div class="text-2xl font-bold">{{ offer.title }}</div>
      <div class="text-sm text-color-secondary">
        {{ offer.universityName }} · {{ offer.countryCode }}
      </div>
    </div>

    <div class="flex gap-2">
      <button pButton icon="pi pi-download"
              class="p-button-sm p-button-success"
              label="Download ALL Documents"
              (click)="onDownloadAll()"
              [disabled]="loadingZipAll">
      </button>

      <button pButton icon="pi pi-check"
              class="p-button-sm p-button-warning"
              label="Finalize Selection"
              (click)="onFinalizeSelection()"
              [disabled]="loadingFinalize">
      </button>

      <button pButton icon="pi pi-file-edit"
              class="p-button-sm p-button-danger"
              label="Move ALL DOCS_UPLOADED → CONTRACT"
              (click)="bulkMoveToContract()"
              [disabled]="!canBulkMoveToContract()">
      </button>
    </div>
  </div>
</div>

<!-- ============================================================ -->
<!-- BULK DEADLINE -->
<!-- ============================================================ -->

<div class="card mt-4" *ngIf="offer">
  <div class="flex flex-col gap-3">

    <div class="flex items-center gap-3">
      <strong>
        {{ bulkMode === 'DOCS'
          ? 'Documents upload deadline (PRESELECTED + DOCS_UPLOADED)'
          : 'Contract submission deadline (CONTRACT)' }}
      </strong>

      <button pButton
              class="p-button-text p-button-sm"
              icon="pi pi-refresh"
              (click)="toggleBulkMode()">
        Switch
      </button>
    </div>

    <p-datepicker
      [(ngModel)]="bulkDeadline"
      dateFormat="yy-mm-dd">
    </p-datepicker>

    <button pButton
            icon="pi pi-save"
            label="Apply to all"
            class="p-button-sm p-button-primary"
            [disabled]="!bulkDeadline"
            (click)="applyBulkDeadline()">
    </button>

    <div class="text-sm text-color-secondary">
      Seats: {{ offer.seats }}
      · Accepted: {{ acceptedCount }}
      · Remaining: {{ remainingSeats }}
    </div>

  </div>
</div>

<!-- ============================================================ -->
<!-- APPLICATIONS TABLE -->
<!-- ============================================================ -->

<div class="card mt-4">
  <div class="text-xl font-semibold mb-3">Applications</div>

  <p-table [value]="rows"
           [loading]="loading"
           [scrollable]="true"
           scrollHeight="420px"
           [style]="{ 'min-width': '65rem' }">

    <ng-template pTemplate="header">
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Score</th>
        <th>Docs Deadline</th>
        <th>Contract Deadline</th>
        <th>Files</th>
        <th>Actions</th>
      </tr>
    </ng-template>

    <ng-template pTemplate="body" let-row>
      <tr>

        <td class="font-semibold">{{ getName(row) }}</td>

        <td>
          <p-tag [value]="row.status"
                 [severity]="statusSeverity(row.status)"
                 style="cursor:pointer"
                 (click)="rollbackIfContract(row)">
          </p-tag>
        </td>

        <td>{{ row.finalScore | number:'1.2-2' }}</td>

        <!-- DISPLAY DATE ONLY -->
        <td>{{ row.documentsDeadline ? (row.documentsDeadline | date:'yyyy-MM-dd') : '—' }}</td>
        <td>{{ row.contractSubmissionDeadline ? (row.contractSubmissionDeadline | date:'yyyy-MM-dd') : '—' }}</td>

        <td>
          <button pButton icon="pi pi-folder-open"
                  class="p-button-rounded p-button-text"
                  (click)="openFiles(row)">
          </button>

          <button pButton icon="pi pi-download"
                  class="p-button-rounded p-button-text p-button-success ml-2"
                  (click)="onDownloadStudent(row)">
          </button>
        </td>

        <td class="flex gap-2">

          <!-- NO DEADLINE BUTTON FOR WAITING_LIST -->
          <button *ngIf="row.status !== 'WAITING_LIST'||row.status !== 'REJECTED'"
                  pButton icon="pi pi-clock"
                  class="p-button-rounded p-button-warning p-button-text"
                  (click)="openDeadlines(row)">
          </button>

          <button *ngIf="row.status === 'WAITING_LIST'"
                  pButton icon="pi pi-arrow-up"
                  class="p-button-rounded p-button-success p-button-text"
                  [disabled]="remainingSeats <= 0"
                  (click)="onElevate(row)">
          </button>

          <button *ngIf="row.status === 'DOCS_UPLOADED'"
                  pButton icon="pi pi-file-edit"
                  class="p-button-rounded p-button-info p-button-text"
                  (click)="moveToContract(row)">
          </button>

          <button pButton icon="pi pi-times"
                  class="p-button-rounded p-button-danger p-button-text"
                  (click)="onReject(row)">
          </button>

        </td>
      </tr>
    </ng-template>
  </p-table>
</div>

<!-- ============================================================ -->
<!-- DEADLINES DIALOG -->
<!-- ============================================================ -->

<p-dialog
  [(visible)]="dlgDeadlines"
  header="Edit deadlines"
  [modal]="true"
  [style]="{ width: '480px' }"
  [contentStyle]="{ 'min-height': '420px', 'overflow': 'visible' }">

  <label class="block mb-2">Documents deadline</label>
  <p-datepicker [(ngModel)]="editDocs" dateFormat="yy-mm-dd"></p-datepicker>

  <label class="block mt-3 mb-2">Contract submission deadline</label>
  <p-datepicker [(ngModel)]="editContractSubmit" dateFormat="yy-mm-dd"></p-datepicker>

  <button pButton
          label="Save"
          class="mt-4"
          (click)="saveDeadlines()">
  </button>
</p-dialog>

<!-- ============================================================ -->
<!-- FILES DIALOG -->
<!-- ============================================================ -->

<p-dialog [(visible)]="dlgFiles"
          [modal]="true"
          [style]="{width:'520px'}"
          header="Student Documents">

  <div *ngIf="selectedRow">
    <div class="mb-2 text-lg font-semibold">
      {{ getName(selectedRow) }}
    </div>

    <ul>
      <li *ngFor="let r of requiredPairs">
        <a (click)="downloadKey(r.key)" style="cursor:pointer">
          {{ r.label }}
        </a>
      </li>
    </ul>
  </div>
</p-dialog>

<p-toast></p-toast>
  `
})
export class HiringDocumentsPageComponent implements OnInit {

  offer: OfferView | null = null;
  rows: HiringApplicationView[] = [];

  loading = false;
  loadingZipAll = false;
  loadingFinalize = false;

  bulkMode: 'DOCS' | 'CONTRACT' = 'DOCS';
  bulkDeadline: Date | null = null;

  dlgFiles = false;
  dlgDeadlines = false;
  selectedRow: HiringApplicationView | null = null;

  requiredPairs: { label: string; key: string }[] = [];

  editDocs: Date | null = null;
  editContractSubmit: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private hiring: HiringService,
    private offers: OfferService,
    private messages: MessageService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;
    this.offers.getOffer(id).subscribe(o => this.offer = o);
    this.loadRows(id);
  }

 loadRows(id: number) {
  this.loading = true;
  this.hiring.listApplications(id).subscribe(r => {
    // ❌ hide rejected applications
    this.rows = r.filter(a => a.status !== 'REJECTED');
    this.loading = false;
  });
}

  get acceptedCount() {
    return this.rows.filter(r =>
      ['PRESELECTED','DOCS_UPLOADED','CONTRACT','CONTRACT_SUBMITTED','CONTRACT_APPROVED']
        .includes(String(r.status))
    ).length;
  }

  get remainingSeats() {
    return Math.max((this.offer?.seats ?? 0) - this.acceptedCount, 0);
  }

  toggleBulkMode() {
    this.bulkMode = this.bulkMode === 'DOCS' ? 'CONTRACT' : 'DOCS';
  }

  applyBulkDeadline() {
    if (!this.offer || !this.bulkDeadline) return;
    const date = this.toBackendDate(this.bulkDeadline);

    if (this.bulkMode === 'DOCS') {
      this.hiring.setDocumentsDeadline(this.offer.id, date)
        .subscribe(() => this.loadRows(this.offer!.id));
    } else {
      this.rows
        .filter(r => r.status === 'CONTRACT')
        .forEach(r =>
          this.hiring.updateDeadlines(r.id, { contractSubmissionDeadline: date }).subscribe()
        );
      this.loadRows(this.offer!.id);
    }
  }

  saveDeadlines() {
    if (!this.selectedRow) return;
    this.hiring.updateDeadlines(this.selectedRow.id, {
      documentsDeadline: this.editDocs ? this.toBackendDate(this.editDocs) : null,
      contractSubmissionDeadline: this.editContractSubmit ? this.toBackendDate(this.editContractSubmit) : null
    }).subscribe(() => {
      this.dlgDeadlines = false;
      this.loadRows(this.offer!.id);
    });
  }

  private toBackendDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}T00:00:00`;
  }

  // ===== BASE LOGIC (UNCHANGED) =====

  canBulkMoveToContract() {
    return this.rows.some(r => r.status === 'DOCS_UPLOADED');
  }

  bulkMoveToContract() {
    this.rows
      .filter(r => r.status === 'DOCS_UPLOADED')
      .forEach(r => this.hiring.moveToContract(r.id).subscribe());
    this.loadRows(this.offer!.id);
  }

  moveToContract(row: HiringApplicationView) {
    this.hiring.moveToContract(row.id)
      .subscribe(() => this.loadRows(this.offer!.id));
  }

  rollbackIfContract(row: HiringApplicationView) {
    if (row.status === 'CONTRACT') {
      this.hiring.revertStatus(row.id, 'DOCS_UPLOADED')
        .subscribe(() => this.loadRows(this.offer!.id));
    }
  }

  openDeadlines(row: HiringApplicationView) {
    this.selectedRow = row;
    this.editDocs = row.documentsDeadline ? new Date(row.documentsDeadline) : null;
    this.editContractSubmit = row.contractSubmissionDeadline ? new Date(row.contractSubmissionDeadline) : null;
    this.dlgDeadlines = true;
  }

  openFiles(row: HiringApplicationView) {
    this.selectedRow = row;
    this.requiredPairs = Object.entries(row.requiredDocsJson ?? {})
      .map(([label, key]) => ({ label, key: String(key) }));
    this.dlgFiles = true;
  }

  downloadKey(key: string) {
    this.hiring.getPresignedUrl(key)
      .subscribe(url => window.open(url, '_blank'));
  }

  onDownloadAll() {
    if (!this.offer) return;
    this.loadingZipAll = true;
    this.hiring.downloadAllDocsZip(this.offer.id).subscribe(r => {
      this.loadingZipAll = false;
      if (r?.downloadUrl) {
        this.hiring.getPresignedUrl(r.downloadUrl)
          .subscribe(url => window.location.href = url);
      }
    });
  }

  onDownloadStudent(row: HiringApplicationView) {
    this.hiring.downloadStudentDocsZip(row.id).subscribe(r => {
      if (r?.downloadUrl) {
        this.hiring.getPresignedUrl(r.downloadUrl)
          .subscribe(url => window.location.href = url);
      }
    });
  }

  onFinalizeSelection() {
    if (!this.offer) return;
    this.loadingFinalize = true;
    this.hiring.finalizeSelection(this.offer.id)
      .subscribe(() => {
        this.loadingFinalize = false;
        this.loadRows(this.offer!.id);
      });
  }

  onElevate(row: HiringApplicationView) {
    this.hiring.elevateFromWaitingList(row.id)
      .subscribe(() => this.loadRows(this.offer!.id));
  }

  onReject(row: HiringApplicationView) {
    this.hiring.revertStatus(row.id, 'REJECTED')
      .subscribe(() => this.loadRows(this.offer!.id));
  }

  getName(r: HiringApplicationView) {
    const a = r.answersJson || {};
    return [a['First Name'], a['Middle Name'], a['Last Name']]
      .filter(Boolean).join(' ');
  }

  statusSeverity(s: any) {
    switch (String(s)) {
      case 'WAITING_LIST': return 'warn';
      case 'REJECTED': return 'danger';
      default: return 'success';
    }
  }
}
