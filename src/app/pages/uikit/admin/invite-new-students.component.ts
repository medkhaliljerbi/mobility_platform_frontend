// src/app/pages/uikit/admin/invite-new-students.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { AdminUserService } from 'src/app/core/services/admin-users.services';
import { RosterRow } from 'src/app/core/models/roster-row.model';
import { UploadRosterResponse } from 'src/app/core/dto/upload-roster.response';

@Component({
  selector: 'app-invite-new-students',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  styles: [`
    .toolbar { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
    .file-name { min-width: 260px; }
    .grow { flex: 1 1 auto; }
  `],
  template: `
  <p-toast></p-toast>

  <div class="card">
    <div class="font-semibold text-xl mb-4">Invite New Students</div>

    <!-- ACTION BAR -->
    <div class="toolbar mb-3">
      <div class="p-inputgroup grow">
        <button pButton type="button" label="CSV" icon="pi pi-file" class="p-button-outlined"
                (click)="filePickerEl.click()"></button>

        <input #filePickerEl type="file" accept=".csv,text/csv" style="display:none" (change)="onFileChange($event)" />

        <input pInputText class="file-name" [readonly]="true"
               [value]="selectedFile ? selectedFile.name : 'No file selected'"/>

        <button pButton type="button" label="Load CSV" icon="pi pi-upload"
                (click)="loadCsv()" [disabled]="!selectedFile || loading"></button>
      </div>

      <button pButton type="button" label="Flush Staging" icon="pi pi-trash" class="p-button-danger"
              (click)="flush()" [disabled]="loading || staging.length===0"></button>

      <button pButton type="button" label="Invite All" icon="pi pi-send" class="p-button-success"
              (click)="inviteAll()" [disabled]="loading || staging.length===0"></button>
    </div>

    <!-- LAST UPLOAD SUMMARY -->
    <div *ngIf="lastUpload" class="text-sm mb-3">
      <b>Uploaded:</b> {{ lastUpload.filename }} ({{ lastUpload.bytes | number }} bytes) |
      <b>Key:</b> <code>{{ lastUpload.key }}</code> |
      <b>Loaded:</b> {{ lastUpload.loaded }}
      <ng-container *ngIf="lastUpload.loaded && lastUpload.loadStats">
        — parsed {{ lastUpload.loadStats.parsed }},
        inserted {{ lastUpload.loadStats.inserted }},
        updated {{ lastUpload.loadStats.updated }},
        skipped {{ lastUpload.loadStats.skippedExistingUsers }}
      </ng-container>
      <ng-container *ngIf="!lastUpload.loaded && lastUpload.loadSkippedReason">
        ({{ lastUpload.loadSkippedReason }})
      </ng-container>
    </div>

    <!-- TABLE -->
    <p-table #dt
             [value]="staging"
             dataKey="espritEmail"
             [rows]="10"
             [loading]="loading"
             [rowHover]="true"
             [showGridlines]="true"
             [paginator]="true"
             [globalFilterFields]="['espritId','firstName','middleName','lastName','espritEmail','phone']"
             responsiveLayout="scroll">

      <!-- Caption: just Search + Clear search -->
      <ng-template pTemplate="caption">
        <div class="flex justify-between items-center flex-column sm:flex-row w-full">
          <button pButton label="Clear" class="p-button-outlined mb-2" icon="pi pi-filter-slash"
                  (click)="clearSearch(dt)"></button>

          <p-iconfield iconPosition="left" class="ml-auto">
            <p-inputicon><i class="pi pi-search"></i></p-inputicon>
            <input pInputText type="text"
                   [(ngModel)]="search"
                   (ngModelChange)="onSearch(dt)"
                   placeholder="Search keyword" />
          </p-iconfield>
        </div>
      </ng-template>

      <ng-template pTemplate="header">
        <tr>
          <th style="min-width: 10rem">Esprit ID</th>
          <th style="min-width: 10rem">First Name</th>
          <th style="min-width: 10rem">Middle Name</th>
          <th style="min-width: 10rem">Last Name</th>
          <th style="min-width: 18rem">Email</th>
          <th style="min-width: 12rem">Phone</th>
          <th style="min-width: 10rem">Actions</th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-r>
        <tr>
          <td>{{ r.espritId }}</td>
          <td>{{ r.firstName }}</td>
          <td>{{ r.middleName }}</td>
          <td>{{ r.lastName }}</td>
          <td>{{ r.espritEmail }}</td>
          <td>{{ r.phone }}</td>
          <td>
            <button pButton type="button" label="Invite" icon="pi pi-send" class="p-button-success p-button-sm"
                    [disabled]="!r.espritEmail || sending[r.espritEmail!]"
                    (click)="inviteOne(r.espritEmail!)"></button>
          </td>
        </tr>
      </ng-template>

      <ng-template pTemplate="emptymessage">
        <tr><td colspan="7">Staging is empty.</td></tr>
      </ng-template>

      <ng-template pTemplate="loadingbody">
        <tr><td colspan="7">Loading… Please wait.</td></tr>
      </ng-template>
    </p-table>
  </div>
  `
})
export class InviteNewStudentsComponent implements OnInit {
  @ViewChild('filePickerEl') filePickerRef!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  staging: RosterRow[] = [];
  lastUpload: UploadRosterResponse | null = null;
  loading = false;

  // search text for global filter
  search = '';

  // track per-email sending state to disable row buttons
  sending: Record<string, boolean> = {};

  constructor(private api: AdminUserService, private msg: MessageService) {}

  ngOnInit(): void { this.refreshStaging(); }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length ? input.files[0] : null;
  }

  loadCsv() {
    if (!this.selectedFile) return;
    this.loading = true;
    this.api.uploadRosterAndLoad(this.selectedFile, {
      useCase: 'roster',
      groupId: 'staging',
      contentType: this.selectedFile.type || 'text/csv',
      load: true
    }).subscribe({
      next: (res) => {
        this.lastUpload = res;
        this.msg.add({ severity: 'success', summary: 'Uploaded', detail: res.loaded ? 'Loaded into staging' : 'Uploaded' });
        if (this.filePickerRef) this.filePickerRef.nativeElement.value = '';
        this.selectedFile = null;
        this.refreshStaging();
      },
      error: (err) => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Upload failed', detail: err?.error?.message || err.statusText });
      }
    });
  }

  refreshStaging() {
    this.api.listStaging().subscribe({
      next: (rows) => { this.staging = rows; this.loading = false; },
      error: (err) => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Load staging failed', detail: err?.error?.message || err.statusText });
      }
    });
  }

  flush() {
    this.loading = true;
    this.api.clearStaging().subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Staging cleared', detail: 'All rows removed' });
        this.refreshStaging();
      },
      error: (err) => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Clear failed', detail: err?.error?.message || err.statusText });
      }
    });
  }

  inviteAll() {
    this.loading = true;
    this.api.inviteAll().subscribe({
      next: (res) => {
        this.loading = false;
        this.msg.add({ severity: 'success', summary: 'Invitations sent', detail: `sent=${res?.sent ?? 0}, failures=${res?.failures ?? 0}` });
      },
      error: (err) => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Invite failed', detail: err?.error?.message || err.statusText });
      }
    });
  }

  inviteOne(email: string) {
    if (!email) return;
    this.sending[email] = true;
    this.api.inviteOne(email).subscribe({
      next: () => {
        this.sending[email] = false;
        this.msg.add({ severity: 'success', summary: 'Invite sent', detail: email });
      },
      error: (err) => {
        this.sending[email] = false;
        this.msg.add({ severity: 'error', summary: 'Invite failed', detail: err?.error?.message || err.statusText });
      }
    });
  }

  // ---- search helpers (global filter only) ----
  onSearch(dt: Table) {
    dt.filterGlobal(this.search, 'contains');
  }
  clearSearch(dt: Table) {
    this.search = '';
    dt.filterGlobal('', 'contains');
  }
}
