import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  OfferService,
  OfferView,
  ApplicationStatus
} from '@/core/services/offer.service';

import {
  HiringService,
  HiringApplicationView
} from '@/core/services/hiring.service';

@Component({
  selector: 'app-hiring-applications-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CheckboxModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  styles: [`
    .row-locked {
      opacity: 0.6;
      background: var(--surface-100);
    }
    .row-locked td {
      cursor: not-allowed;
    }
    .offer-image {
      width: 100%;
      height: 170px;
      border-radius: 0.5rem;
      object-fit: cover;
    }
  `],
  template: `

<!-- ============================== -->
<!-- OFFER HEADER CARD              -->
<!-- ============================== -->

<div class="card" *ngIf="offer; else loadingTpl">

  <div class="flex flex-col gap-3">
    <!-- top row: title + big export button -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <div class="text-2xl font-bold">{{ offer?.title }}</div>
        <div class="text-sm text-color-secondary">
          {{ offer?.universityName }}
          <span *ngIf="offer?.countryCode">· {{ offer?.countryCode }}</span>
        </div>
      </div>
  <div class="flex gap-2">
  <button
    pButton
    type="button"
    icon="pi pi-folder-open"
    class="p-button-info"
    label="Documents"
    (click)="goToDocuments()">
  </button>

  <button
    pButton
    type="button"
    icon="pi pi-file-excel"
    class="p-button-success"
    label="Export Final Result"
    (click)="onExportFinal()"
    [disabled]="loadingExcel || (!hasAnyPreselectedOrWaiting())">
  </button>
</div>

    </div>

    <div class="flex flex-col md:flex-row gap-4">

      <!-- IMAGE -->
      <div class="w-full md:w-80 h-44 rounded-lg overflow-hidden bg-surface-200">
        <img
          *ngIf="offer?.imageUrl"
          [src]="offer.imageUrl"
          class="offer-image"
          (error)="onImgError($event)"
        />
        <div *ngIf="!offer?.imageUrl"
             class="w-full h-full flex items-center justify-center text-color-secondary text-sm">
          No image
        </div>
      </div>

      <!-- OFFER INFO -->
      <div class="flex flex-col flex-1 gap-2">

        <!-- TAGS -->
        <div class="flex flex-wrap gap-2 mt-1">
          <p-tag [value]="offer?.type" severity="info"></p-tag>
          <p-tag [value]="offer?.status" [severity]="statusSeverity(offer?.status)"></p-tag>

          <p-tag *ngIf="offer?.deadline"
                 [value]="'Deadline: ' + (offer.deadline | date:'yyyy-MM-dd')"
                 severity="warn"></p-tag>

          <p-tag *ngIf="offer?.seats != null"
                 [value]="'Seats: ' + offer?.seats"
                 severity="success"></p-tag>
        </div>

        <!-- COUNTERS WITH RESERVED SEATS -->
        <div class="mt-1 text-sm text-color-secondary">
          Applicants: {{ applications.length + recommended.length }}
          · Normal seats: {{ normalQuota }}
          · Reserved for recommendations: {{ reservedSeats }}
          <span *ngIf="normalRemaining > 0">
            · Remaining normal seats: {{ normalRemaining }}
          </span>
          <span *ngIf="recommendedRemaining > 0">
            · Remaining recommended seats: {{ recommendedRemaining }}
          </span>
        </div>

      </div>
    </div>
  </div>
</div>


<!-- ============================== -->
<!-- NORMAL APPLICATIONS            -->
<!-- ============================== -->

<div class="card mt-4">

  <div class="text-xl font-semibold mb-3">Normal Applications</div>
<!-- DOCUMENTS DEADLINE -->


  <div class="flex flex-wrap gap-3 mb-3">

    <button pButton icon="pi pi-download" label="Generate Excel"
            (click)="onGenerateExcelNormal()"
            [disabled]="loadingExcel || loadingData || !selectedNormalIds.size">
    </button>

    <button pButton icon="pi pi-check" label="Submit Selected"
            class="p-button-success"
            (click)="onSubmitPreselected(false)"
            [disabled]="!hasSelectableSelection(false) || loadingSubmitPreselected || normalRemaining === 0">
    </button>

<button pButton icon="pi pi-list" label="Submit Waiting List"
        class="p-button-warning"
        (click)="onSubmitWaitingList(false)"
        [disabled]="!hasSelectableSelection(false) || loadingSubmitWaiting">
</button>


    <button pButton icon="pi pi-trash" label="Delete Selected"
            class="p-button-danger"
            (click)="onDeleteSelected(false)"
            [disabled]="!selectedNormalIds.size">
    </button>

    <button pButton icon="pi pi-times" label="Reject"
            class="p-button-danger"
            (click)="onReject(false)">
    </button>

  </div>


  <p-table
    [value]="applications"
    [scrollable]="true"
    scrollHeight="370px"
    [loading]="loadingData"
    [style]="{ 'min-width': '60rem' }">

    <ng-template pTemplate="header">
      <tr>

        <th style="width:3rem" pFrozenColumn alignFrozen="left">
          <p-checkbox
            [binary]="true"
            [(ngModel)]="allSelectedNormal"
            (ngModelChange)="onToggleSelectAll(false, $event)">
          </p-checkbox>
        </th>

        <th style="min-width:180px" pFrozenColumn alignFrozen="left">Name</th>
        <th style="min-width:100px">Score</th>
        <th style="min-width:120px">Status</th>
        <th style="min-width:160px">Docs Deadline</th>
        <th style="min-width:140px">Applied At</th>
        <th style="min-width:130px">Actions</th>


        <th *ngFor="let col of answerColumns" style="min-width:150px">{{ col }}</th>

      </tr>
    </ng-template>

    <ng-template pTemplate="body" let-row>
      <tr [ngClass]="{ 'row-locked': isLocked(row) }">

        <td pFrozenColumn alignFrozen="left">
          <p-checkbox
            [binary]="true"
            [ngModel]="isSelected(false, row.id)"
            (ngModelChange)="onToggleRow(false, row.id, $event)"
            [disabled]="isLocked(row)">
          </p-checkbox>
        </td>

        <td pFrozenColumn alignFrozen="left" class="font-semibold">{{ getName(row) }}</td>
        <td>{{ (row.finalScore ?? 0) | number:'1.2-2' }}</td>

        <td>
          <p-tag
            [value]="row.status"
            [severity]="statusSeverity(row.status)"
            styleClass="cursor-pointer"
            (click)="onStatusClick(row)">
          </p-tag>
        </td>
<td>
  <ng-container *ngIf="row.documentsDeadline; else noDocsDeadline">
    {{ row.documentsDeadline | date:'yyyy-MM-dd' }}
  </ng-container>
  <ng-template #noDocsDeadline>
    <span class="text-color-secondary">—</span>
  </ng-template>
</td>

        <td>{{ row.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>

        <td>
          <button
            pButton
            type="button"
            icon="pi pi-check"
            class="p-button-sm p-button-text p-button-success"
            (click)="onQuickPreselect(row)"
            [disabled]="isLocked(row) || normalRemaining === 0 || loadingSubmitPreselected">
          </button>

          <button
            pButton
            type="button"
            icon="pi pi-list"
            class="p-button-sm p-button-text p-button-warning ml-1"
            (click)="onQuickWaiting(row)"
            [disabled]="isLocked(row) || normalRemaining > 0 || loadingSubmitWaiting || totalSeats === 0">
          </button>
        </td>

        <td *ngFor="let col of answerColumns">
          {{ getAnswer(row, col) }}
        </td>

      </tr>
    </ng-template>

  </p-table>
</div>


<!-- ============================== -->
<!-- RECOMMENDED STUDENTS           -->
<!-- ============================== -->

<div class="card mt-4">

  <div class="text-xl font-semibold mb-3">Recommended Students</div>

  <div class="flex flex-wrap gap-3 mb-3">

    <button pButton icon="pi pi-download" label="Generate Excel"
            (click)="onGenerateExcelRecommended()"
            [disabled]="loadingExcel || loadingData || !selectedRecommendedIds.size">
    </button>

    <button pButton icon="pi pi-check" label="Submit Selected"
            class="p-button-success"
            (click)="onSubmitPreselected(true)"
            [disabled]="!hasSelectableSelection(true) || loadingSubmitPreselected || recommendedRemaining === 0">
    </button>

 <button pButton icon="pi pi-list" label="Submit Waiting List"
        class="p-button-warning"
        (click)="onSubmitWaitingList(true)"
        [disabled]="!hasSelectableSelection(true) || loadingSubmitWaiting">
</button>


    <button pButton icon="pi pi-trash" class="p-button-danger"
            label="Delete Selected"
            (click)="onDeleteSelected(true)"
            [disabled]="!selectedRecommendedIds.size">
    </button>

    <button pButton icon="pi pi-times" class="p-button-danger"
            label="Reject"
            (click)="onReject(true)">
    </button>

  </div>

  <p-table [value]="recommended">
    <ng-template pTemplate="header">
      <tr>
        <th style="width:3rem">
          <p-checkbox
            [binary]="true"
            [(ngModel)]="allSelectedRecommended"
            (ngModelChange)="onToggleSelectAll(true, $event)">
          </p-checkbox>
        </th>
        <th style="min-width:180px">Name</th>
        <th style="min-width:100px">Score</th>
        <th style="min-width:160px">Docs Deadline</th>
        <th style="min-width:120px">Status</th>
        <th *ngFor="let col of answerColumns" style="min-width:150px">{{ col }}</th>
      </tr>
    </ng-template>

    <ng-template pTemplate="body" let-row>
      <tr [ngClass]="{ 'row-locked': isLocked(row) }">
        <td>
          <p-checkbox
            [binary]="true"
            [ngModel]="isSelected(true, row.id)"
            (ngModelChange)="onToggleRow(true, row.id, $event)"
            [disabled]="isLocked(row)">
          </p-checkbox>
        </td>
        <td class="font-semibold">{{ getName(row) }}</td>
        <td>{{ (row.finalScore ?? 0) | number:'1.2-2' }}</td>
        <td>
          <p-tag
            [value]="row.status"
            [severity]="statusSeverity(row.status)"
            styleClass="cursor-pointer"
            (click)="onStatusClick(row)">
          </p-tag>
        </td>
<td>
  <ng-container *ngIf="row.documentsDeadline; else noDocsDeadlineRec">
    {{ row.documentsDeadline | date:'yyyy-MM-dd' }}
  </ng-container>
  <ng-template #noDocsDeadlineRec>
    <span class="text-color-secondary">—</span>
  </ng-template>
</td>

        <td *ngFor="let col of answerColumns">
          {{ getAnswer(row, col) }}
        </td>
      </tr>
    </ng-template>

    <ng-template pTemplate="emptymessage">
      <tr><td colspan="5" class="text-center">No recommended students.</td></tr>
    </ng-template>

  </p-table>

</div>

<p-toast></p-toast>

<ng-template #loadingTpl>
  <div class="card">Loading offer...</div>
</ng-template>

  `
})
export class HiringApplicationsPageComponent implements OnInit {
  offer: OfferView | null = null;
  applications: HiringApplicationView[] = [];
  recommended: HiringApplicationView[] = [];
  answerColumns: string[] = [];

  loadingData = false;
  loadingExcel = false;
  loadingSubmitPreselected = false;
  loadingSubmitWaiting = false;

  selectedNormalIds: Set<number> = new Set<number>();
  selectedRecommendedIds: Set<number> = new Set<number>();

  allSelectedNormal = false;
  allSelectedRecommended = false;

  private quotaToastShown = false;

  private readonly cycleOrder: ApplicationStatus[] = [
    'REJECTED',
    'SUBMITTED',
    'PRESELECTED'
  ];

  constructor(
    private route: ActivatedRoute,
    private offers: OfferService,
    private hiring: HiringService,
    private messages: MessageService,
    private router: Router
  ) {}

  // ===========================
  // LIFECYCLE
  // ===========================

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('id');
    const offerId = idStr ? +idStr : 0;

    if (!offerId) return;

    this.loadingData = true;

    this.offers.getOffer(offerId).subscribe({
      next: o => this.offer = o,
      error: () =>
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load offer'
        })
    });

    this.hiring.listApplications(offerId).subscribe({
      next: rows => {
        const apps = rows ?? [];

        this.recommended = apps.filter(a => a.recommended === true);
        this.applications = apps.filter(a => !a.recommended);


        this.answerColumns = this.buildAnswerColumns(apps);

        this.loadingData = false;

        this.refreshSelectAll(false);
        this.refreshSelectAll(true);

        this.checkSeatQuotaToast();
      },
      error: () => {
        this.loadingData = false;
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load applications'
        });
      }
    });
  }

  // ===========================
  // QUOTAS
  // ===========================

  get totalSeats(): number {
    return this.offer?.seats ?? 0;
  }

  get reservedSeats(): number {
    const s = this.totalSeats;
    if (s <= 1) return 0;
    return Math.max(Math.floor(s * 0.05), 1);
  }

  get normalQuota(): number {
    return Math.max(this.totalSeats - this.reservedSeats, 0);
  }

  get recommendedQuota(): number {
    return this.reservedSeats;
  }

  get normalPreselected(): number {
    return this.applications.filter(a => a.status === 'PRESELECTED').length;
  }

  get recommendedPreselected(): number {
    return this.recommended.filter(a => a.status === 'PRESELECTED').length;
  }

  get normalRemaining(): number {
    return Math.max(this.normalQuota - this.normalPreselected, 0);
  }

  get recommendedRemaining(): number {
    return Math.max(this.recommendedQuota - this.recommendedPreselected, 0);
  }

  // ===========================
  // ANSWERS
  // ===========================

  private buildAnswerColumns(rows: HiringApplicationView[]): string[] {
    const base = [
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

    const set = new Set<string>(base);

    for (const row of rows) {
      if (row.answersJson && typeof row.answersJson === 'object') {
        Object.keys(row.answersJson).forEach(k => set.add(k));
      }
    }

    return Array.from(set);
  }

  getName(row: HiringApplicationView): string {
    const a = row.answersJson || {};
    const fn = a['First Name'] || '';
    const mid = a['Middle Name'] || '';
    const ln = a['Last Name'] || '';
    return [fn, mid, ln].filter(Boolean).join(' ');
  }

  getAnswer(row: HiringApplicationView, col: string): string {
    const ans = row.answersJson || {};
    const val = ans[col];
    return val === undefined || val === null ? '' : String(val);
  }

  // ===========================
  // STATUS
  // ===========================

  statusSeverity(s?: ApplicationStatus | string | null) {
    if (!s) return 'info';
    const x = String(s).toUpperCase();
    switch (x) {
      case 'PRESELECTED':
      case 'DOCS_UPLOADED':
      case 'CONTRACT_APPROVED':
        return 'success';
      case 'WAITING_DOCS':
      case 'CONTRACT_SUBMITTED':
      case 'WAITING_LIST':
        return 'warn';
      case 'REJECTED':
        return 'danger';
      default:
        return 'info';
    }
  }

  isLocked(row: HiringApplicationView) {
    const x = String(row.status).toUpperCase();
    return x === 'PRESELECTED' || x === 'WAITING_LIST';
  }

  onStatusClick(row: HiringApplicationView) {
    const current = (row.status || 'SUBMITTED') as ApplicationStatus;
    const idx = this.cycleOrder.indexOf(current);
    const next = this.cycleOrder[(idx + 1) % this.cycleOrder.length];

    if (next === current) return;

    this.hiring.revertStatus(row.id, next).subscribe({
      next: () => {
        row.status = next;
        this.checkSeatQuotaToast();
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update status'
        });
      }
    });
  }

  // ===========================
  // SELECTION
  // ===========================

  private getSet(isRecommended: boolean): Set<number> {
    return isRecommended ? this.selectedRecommendedIds : this.selectedNormalIds;
  }

  hasSelectableSelection(isRecommended: boolean): boolean {
    const list = isRecommended ? this.recommended : this.applications;
    const set = this.getSet(isRecommended);
    return list.some(a => set.has(a.id) && !this.isLocked(a));
  }

  isSelected(isRecommended: boolean, id: number) {
    return this.getSet(isRecommended).has(id);
  }

  onToggleRow(isRecommended: boolean, id: number, checked: boolean) {
    const set = this.getSet(isRecommended);
    checked ? set.add(id) : set.delete(id);
    this.refreshSelectAll(isRecommended);
  }

  onToggleSelectAll(isRecommended: boolean, checked: boolean) {
    const set = this.getSet(isRecommended);
    if (isRecommended) {
      this.allSelectedRecommended = checked;
    } else {
      this.allSelectedNormal = checked;
    }

    set.clear();

    const list = isRecommended ? this.recommended : this.applications;
    if (checked) {
      list.forEach(r => {
        if (!this.isLocked(r)) set.add(r.id);
      });
    }
  }

  refreshSelectAll(isRecommended: boolean) {
    const list = isRecommended ? this.recommended : this.applications;
    const set = this.getSet(isRecommended);
    const selectable = list.filter(a => !this.isLocked(a));

    const allSelected =
      selectable.length > 0 && selectable.every(a => set.has(a.id));

    if (isRecommended) {
      this.allSelectedRecommended = allSelected;
    } else {
      this.allSelectedNormal = allSelected;
    }
  }

  private getSelectedUnlockedIds(isRecommended: boolean): number[] {
    const list = isRecommended ? this.recommended : this.applications;
    const set = this.getSet(isRecommended);

    return list
      .filter(a => set.has(a.id) && !this.isLocked(a))
      .map(a => a.id);
  }

  // ===========================
  // DELETE + REJECT
  // ===========================

  onDeleteSelected(isRecommended: boolean) {
    const set = this.getSet(isRecommended);
    const ids = Array.from(set);
    if (!ids.length) return;

    ids.forEach(id => this.hiring.deleteApplication(id).subscribe());
    set.clear();

    setTimeout(() => this.reload(), 400);
  }

  onReject(isRecommended: boolean) {
    const list = isRecommended ? this.recommended : this.applications;
    const set = this.getSet(isRecommended);

    let target: HiringApplicationView[];

    if (set.size > 0) {
      target = list.filter(a => set.has(a.id));
    } else {
      target = list.filter(a => a.status === 'SUBMITTED');
    }

    if (!target.length) return;

    target.forEach(a => {
      this.hiring.revertStatus(a.id, 'REJECTED').subscribe();
    });

    set.clear();

    setTimeout(() => this.reload(), 400);
  }

  // ===========================
  // SUBMIT PRESELECTED
  // ===========================

  onSubmitPreselected(isRecommended: boolean) {
    if (!this.offer) return;
    const ids = this.getSelectedUnlockedIds(isRecommended);

    const remaining = isRecommended ? this.recommendedRemaining : this.normalRemaining;

    if (!ids.length || remaining === 0) {
      this.checkSeatQuotaToast();
      return;
    }

    this.loadingSubmitPreselected = true;

    this.hiring.submitPreselected(this.offer.id, ids).subscribe({
      next: () => {
        this.loadingSubmitPreselected = false;
        this.messages.add({
          severity: 'success',
          summary: 'Done',
          detail: `${ids.length} students set to PRESELECTED`
        });
        this.reload();
      },
      error: () => {
        this.loadingSubmitPreselected = false;
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Submit failed'
        });
      }
    });
  }

  // ===========================
  // SUBMIT WAITING
  // ===========================

  onSubmitWaitingList(isRecommended: boolean) {
    if (!this.offer) return;
    const ids = this.getSelectedUnlockedIds(isRecommended);

if (!ids.length) return;


    this.loadingSubmitWaiting = true;

    this.hiring.submitWaitingList(this.offer.id, ids).subscribe({
      next: () => {
        this.loadingSubmitWaiting = false;
        this.messages.add({
          severity: 'success',
          summary: 'Done',
          detail: `${ids.length} students set to WAITING_LIST`
        });
        this.reload();
      },
      error: () => {
        this.loadingSubmitWaiting = false;
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Submit failed'
        });
      }
    });
  }

  // ===========================
  // QUICK ACTIONS (NORMAL)
  // ===========================

  onQuickPreselect(row: HiringApplicationView) {
    if (!this.offer) return;

    if (this.isLocked(row) || this.normalRemaining === 0) {
      this.checkSeatQuotaToast();
      return;
    }

    this.loadingSubmitPreselected = true;

    this.hiring.submitPreselected(this.offer.id, [row.id]).subscribe({
      next: () => {
        this.loadingSubmitPreselected = false;
        this.messages.add({
          severity: 'success',
          summary: 'Done',
          detail: `Student set to PRESELECTED`
        });
        this.reload();
      },
      error: () => {
        this.loadingSubmitPreselected = false;
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Submit failed'
        });
      }
    });
  }

  onQuickWaiting(row: HiringApplicationView) {
    if (!this.offer) return;

if (this.isLocked(row)) {
  return;
}


    this.loadingSubmitWaiting = true;

    this.hiring.submitWaitingList(this.offer.id, [row.id]).subscribe({
      next: () => {
        this.loadingSubmitWaiting = false;
        this.messages.add({
          severity: 'success',
          summary: 'Done',
          detail: `Student set to WAITING_LIST`
        });
        this.reload();
      },
      error: () => {
        this.loadingSubmitWaiting = false;
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Submit failed'
        });
      }
    });
  }

  // ===========================
  // GENERATE EXCEL
  // ===========================

  onGenerateExcelNormal() {
    if (!this.offer) return;

    const ids = Array.from(this.selectedNormalIds);
    if (!ids.length) return;

    this.loadingExcel = true;

    this.hiring.generateExcel(this.offer.id, ids).subscribe({
      next: r => {
        this.loadingExcel = false;
        if (r?.downloadUrl) {
          window.location.href = r.downloadUrl;
        }
      },
      error: () => {
        this.loadingExcel = false;
        this.messages.add({
          severity: 'error',
          summary: 'Excel error',
          detail: 'Failed to generate file'
        });
      }
    });
  }

  onGenerateExcelRecommended() {
    if (!this.offer) return;

    const ids = Array.from(this.selectedRecommendedIds);
    if (!ids.length) return;

    this.loadingExcel = true;

    this.hiring.generateExcel(this.offer.id, ids).subscribe({
      next: r => {
        this.loadingExcel = false;
        if (r?.downloadUrl) {
          window.location.href = r.downloadUrl;
        }
      },
      error: () => {
        this.loadingExcel = false;
        this.messages.add({
          severity: 'error',
          summary: 'Excel error',
          detail: 'Failed to generate file'
        });
      }
    });
  }

  // FINAL EXPORT
  onExportFinal() {
    if (!this.offer) return;

    const ids = [...this.applications, ...this.recommended]
      .filter(a => {
        const s = String(a.status);
        return s === 'PRESELECTED' || s === 'WAITING_LIST';
      })
      .map(a => a.id);

    if (!ids.length) {
      this.messages.add({
        severity: 'info',
        summary: 'Nothing to export',
        detail: 'No PRESELECTED or WAITING_LIST students.'
      });
      return;
    }

    this.loadingExcel = true;

    this.hiring.generateExcel(this.offer.id, ids).subscribe({
      next: r => {
        this.loadingExcel = false;
        if (r?.downloadUrl) {
          window.location.href = r.downloadUrl;
        }
      },
      error: () => {
        this.loadingExcel = false;
        this.messages.add({
          severity: 'error',
          summary: 'Excel error',
          detail: 'Failed to generate file'
        });
      }
    });
  }

  hasAnyPreselectedOrWaiting(): boolean {
    return [...this.applications, ...this.recommended].some(a => {
      const s = String(a.status);
      return s === 'PRESELECTED' || s === 'WAITING_LIST';
    });
  }

  // ===========================
  // RELOAD
  // ===========================

  reload() {
    if (!this.offer) return;

    const id = this.offer.id;

    this.hiring.listApplications(id).subscribe(rows => {
      const apps = rows ?? [];

      this.recommended = apps.filter(a => a.recommended === true);
      this.applications = apps.filter(a => !a.recommended);

      this.answerColumns = this.buildAnswerColumns(apps);

      this.selectedNormalIds.clear();
      this.selectedRecommendedIds.clear();
      this.allSelectedNormal = false;
      this.allSelectedRecommended = false;

      this.checkSeatQuotaToast();
    });
  }

  // ===========================
  // IMAGE
  // ===========================

  onImgError(ev: any) {
    ev.target.src = '';
  }

  // ===========================
  // QUOTA TOAST
  // ===========================

  private checkSeatQuotaToast(): void {
    const quota = this.normalQuota;
    const remaining = this.normalRemaining;

    if (quota > 0 && remaining === 0 && !this.quotaToastShown) {
      this.messages.add({
        severity: 'warn',
        summary: 'Seat quota reached',
        detail: 'Additional selected students will automatically go to the waiting list.',
        life: 4500
      });
      this.quotaToastShown = true;
    }

    if (remaining > 0) {
      this.quotaToastShown = false;
    }
  }
  goToDocuments() {
  if (!this.offer) return;
  this.router.navigate(['/pages/hiring/offers', this.offer.id, 'documents']);
}



}
