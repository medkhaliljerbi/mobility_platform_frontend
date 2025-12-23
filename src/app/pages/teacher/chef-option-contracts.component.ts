import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  HiringService,
  ChefOptionContractView
} from '@/core/services/hiring.service';

@Component({
  selector: 'app-chef-option-contracts',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    SelectModule,
    ToastModule
  ],
  template: `
<p-toast></p-toast>

<div class="card">
  <div class="font-semibold text-xl mb-3">
    Mobility Contracts
  </div>

  <p-table
    #dt
    [value]="contracts"
    dataKey="applicationId"
    [rows]="10"
    [paginator]="true"
    [loading]="loading"
    [rowHover]="true"
    [showGridlines]="true"
    responsiveLayout="scroll"
    [globalFilterFields]="['studentFullName','offerTitle']"
  >

    <!-- Caption -->
    <ng-template pTemplate="caption">
      <div class="flex justify-between items-center">
        <button
          pButton
          type="button"
          label="Clear"
          icon="pi pi-filter-slash"
          class="p-button-outlined"
          (click)="dt.clear()"
        ></button>

        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input
            pInputText
            type="text"
            (input)="dt.filterGlobal($any($event.target).value, 'contains')"
            placeholder="Search student or offer"
          />
        </span>
      </div>
    </ng-template>

    <!-- Header -->
    <ng-template pTemplate="header">
      <tr>
        <th>Student</th>
        <th>Offer</th>
        <th>Deadline</th>
        <th>Status</th>
        <th>Contract</th>
        <th>Action</th>
      </tr>
    </ng-template>

    <!-- Body -->
    <ng-template pTemplate="body" let-row>
      <tr>
        <td>{{ row.studentFullName }}</td>

        <td>{{ row.offerTitle }}</td>

        <td>
          {{ row.contractApprovalDeadline ? (row.contractApprovalDeadline | date) : '—' }}
        </td>

        <td>
          <p-tag
            [value]="statusLabel(row.approved)"
            [severity]="statusSeverity(row.approved)"
          ></p-tag>
        </td>

        <!-- Download -->
        <td class="text-center">
          <a
            [href]="row.contractDownloadUrl"
            target="_blank"
            title="Download contract"
          >
            <i class="pi pi-file-pdf text-xl"></i>
          </a>
        </td>

        <!-- Actions -->
        <td>
          <input
            pInputText
            class="mb-2 w-full"
            placeholder="Optional note"
            [(ngModel)]="notes[row.applicationId]"
            [disabled]="row.approved !== null || processing[row.applicationId]"
          />

          <div class="flex gap-2">
            <button
              pButton
              icon="pi pi-check"
              class="p-button-success p-button-sm"
              [loading]="processing[row.applicationId]"
              [disabled]="row.approved !== null"
              (click)="approve(row)"
            ></button>

            <button
              pButton
              icon="pi pi-times"
              class="p-button-danger p-button-sm"
              [loading]="processing[row.applicationId]"
              [disabled]="row.approved !== null"
              (click)="refuse(row)"
            ></button>
          </div>
        </td>
      </tr>
    </ng-template>

    <ng-template pTemplate="emptymessage">
      <tr>
        <td colspan="6">No contracts found.</td>
      </tr>
    </ng-template>

  </p-table>
</div>
`
})
export class ChefOptionContractsComponent implements OnInit {

  private hiringService = inject(HiringService);
  private messageService = inject(MessageService);

  contracts: ChefOptionContractView[] = [];
  loading = true;

  /** per-row note (email only) */
  notes: Record<number, string> = {};

  /** per-row processing flag */
  processing: Record<number, boolean> = {};

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.hiringService.getMyContractsForChefOption().subscribe({
      next: rows => {
        this.contracts = rows ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load contracts'
        });
      }
    });
  }

  approve(row: ChefOptionContractView): void {
    this.processing[row.applicationId] = true;

    this.hiringService
      .approveContract(row.applicationId, this.notes[row.applicationId])
      .subscribe({
        next: () => {
          row.approved = true;
          this.processing[row.applicationId] = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Approved',
            detail: 'Contract approved and email sent'
          });
        },
        error: () => {
          this.processing[row.applicationId] = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Approval failed. Email not sent.'
          });
        }
      });
  }

  refuse(row: ChefOptionContractView): void {
    this.processing[row.applicationId] = true;

    this.hiringService
      .refuseContract(row.applicationId, this.notes[row.applicationId])
      .subscribe({
        next: () => {
          row.approved = false;
          this.processing[row.applicationId] = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Refused',
            detail: 'Contract refused and email sent'
          });
        },
        error: () => {
          this.processing[row.applicationId] = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Refusal failed. Email not sent.'
          });
        }
      });
  }

  statusLabel(v: boolean | null): string {
    if (v === null) return 'PENDING';
    return v ? 'APPROVED' : 'REFUSED';
  }

  statusSeverity(v: boolean | null): 'warning' | 'success' | 'danger' {
    if (v === null) return 'warning';
    return v ? 'success' : 'danger';
  }
}
