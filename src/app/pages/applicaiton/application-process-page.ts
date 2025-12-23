import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';


import { OfferService, OfferView } from '@/core/services/offer.service';
import { StudentService } from '@/core/services/student.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-application-process',
  standalone: true,
imports: [CommonModule, RouterModule, CardModule, ButtonModule, ToastModule, ConfirmDialogModule],
providers: [MessageService, ConfirmationService],

  template: `
<p-toast></p-toast>
<p-confirmDialog></p-confirmDialog>
<div class="page">
  <div class="container-box">

    <!-- Back button -->
    <div class="back-line">
      <button pButton
              label="Back to offers"
              class="p-button-secondary"
              icon="pi pi-arrow-left"
              (click)="back()">
      </button>
    </div>

    <ng-container *ngIf="ready(); else loading">

      <div class="content-grid">

        <!-- LEFT IMAGE -->
        <div class="image-box">
          <img
            [src]="offer()?.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'"
            class="offer-img"
            alt="Offer Image">
        </div>

        <!-- RIGHT COLUMN -->
        <div class="details-col">

          <!-- OFFER DETAILS -->
          <div class="block offer-block">
            <h2 class="block-title">{{ offer()?.title }}</h2>

            <div class="meta-line"><b>University:</b> {{ offer()?.universityName }}</div>
            <div class="meta-line"><b>Seats:</b> {{ offer()?.seats }}</div>
            <div class="meta-line"><b>Deadline:</b> {{ dateOnly(offer()?.deadline) }}</div>

            <!-- OFFER STATUS -->
            <span class="pill green" *ngIf="offer()?.status === 'OPEN'">Offer Open</span>
            <span class="pill red" *ngIf="offer()?.status === 'CLOSED'">Offer Closed</span>

            <hr class="sep">
          </div>

          <!-- APPLICATION DETAILS -->
          <div class="block app-block">
            <h3 class="block-title">Application Details</h3>

            <div class="meta-line"><b>Status:</b> {{ status() }}</div>
            <div class="meta-line"><b>Final Score:</b> {{ finalScore() | number:'1.0-3' }}</div>

            <!-- DOCUMENTS DEADLINE -->
            <div class="meta-line" *ngIf="showDocumentsDeadline()">
              <b>Documents deadline:</b>
              {{ dateOnly(app()?.documentsDeadline) }}

              <span *ngIf="isDocsDeadlinePassed()" class="pill red ml-2">
                Deadline passed
              </span>
            </div>

            <!-- CONTRACT DEADLINE -->
            <div class="meta-line" *ngIf="showContractDeadline()">
              <b>Contract submission deadline:</b>
              {{ dateOnly(app()?.contractSubmissionDeadline) }}

              <span *ngIf="isContractDeadlinePassed()" class="pill red ml-2">
                Deadline passed
              </span>
            </div>

            <!-- APPLICATION STATUS COLOR PILL -->
            <div class="status-line">
              <span class="pill yellow" *ngIf="isYellow()"> {{ status() }} </span>
              <span class="pill blue"   *ngIf="isBlue()"> {{ status() }} </span>
              <span class="pill red"    *ngIf="isRed()"> {{ status() }} </span>
              <span class="pill green"  *ngIf="isGreen()"> {{ status() }} </span>
            </div>

            <hr class="sep">
          </div>

        </div>

      </div>

      <!-- BUTTON BAR -->
      <div class="actions-bar">

        <!-- Upload Docs -->
        <button pButton
                [label]="status()==='DOCS_UPLOADED' ? 'Update Documents' : 'Upload Required Documents'"
                icon="pi pi-upload"
                class="p-button-success"
                [disabled]="!canUploadDocs()"
                (click)="goToDocs()">
        </button>

        <!-- Contract Submission -->
        <button pButton
                label="Contract Submission"
                icon="pi pi-file"
                class="p-button-info"
                [disabled]="!canSubmitContract()"
                (click)="goToContract()">
        </button>

        <!-- Withdraw -->
<button pButton
        label="Withdraw Application"
        icon="pi pi-trash"
        class="p-button-danger"
        (click)="confirmWithdraw($event)">
</button>


      </div>

    </ng-container>

    <ng-template #loading>
      <p-card><div>Loading…</div></p-card>
    </ng-template>

  </div>
</div>
  `,
  styles: [`
.page {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
}

.container-box {
  width: 100%;
  max-width: 1100px;
  background: white;
  border-radius: .7rem;
  padding: 2rem;
  box-shadow: 0px 3px 12px rgba(0,0,0,0.09);
}

/* BACK BUTTON */
.back-line {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

/* GRID - MATCH HEIGHTS */
.content-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  align-items: stretch;
}

/* IMAGE COLUMN */
.image-box {
  border-radius: .5rem;
  overflow: hidden;
  border: 2px solid #d1d5db; /* contour */
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.offer-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;  /* always fully visible */
}

/* RIGHT SIDE */
.details-col {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.block {
  background: white;
  border: 1px solid var(--surface-300);
  border-radius: .5rem;
  padding: 1rem 1.2rem;
}

.block-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: .5rem;
}

.sep {
  margin-top: 1rem;
  border: 0;
  border-top: 1px solid #e5e7eb;
}

.meta-line { margin-bottom: .25rem; }

/* STATUS COLORS */
.pill {
  display: inline-block;
  padding: .25rem .6rem;
  border-radius: 9999px;
  font-size: .8rem;
  font-weight: 600;
  margin-right: .4rem;
}

.green { background:#dcfce7; color:#166534; }
.yellow { background:#fef9c3; color:#854d0e; }
.red { background:#fee2e2; color:#991b1b; }
.blue { background:#dbeafe; color:#1e3a8a; }

/* BUTTON BAR */
.actions-bar {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}
  `]
})
export class ApplicationProcessPage implements OnInit {

  private route = inject(ActivatedRoute);
  private offers = inject(OfferService);
  private router = inject(Router);
    private confirmation = inject(ConfirmationService);
private studentService = inject(StudentService);
  offer = signal<OfferView | null>(null);
  app   = signal<any | null>(null);

  status = computed(() => this.app()?.status ?? 'UNKNOWN');
  finalScore = computed(() => this.app()?.finalScore ?? 0);
  ready = computed(() => !!this.offer() && !!this.app());

  ngOnInit() {
    const offerId = Number(this.route.snapshot.paramMap.get('offerId'));

    this.offers.getOffer(offerId).subscribe(o => this.offer.set(o));

    this.offers.getApplicationProcess(offerId).subscribe(a => {
      if (!a) return this.app.set(null);

      // keep your mapping as-is
      this.app.set({
        applicationId: a.applicationId ?? a.id,
        offerId,
        status: a.status,
        finalScore: a.finalScore ?? 0,
        requiredDocsJson: a.requiredDocsJson ?? {},
        certificationsJson: a.certificationsJson ?? {},
        documentsDeadline: a.documentsDeadline ?? null,
        contractSubmissionDeadline: a.contractSubmissionDeadline ?? null,
        contractApprovalDeadline: a.contractApprovalDeadline ?? null,
      });
    });
  }

  /* ---------- DEADLINES DISPLAY (ONLY LOGIC ADDED) ---------- */

  showDocumentsDeadline(): boolean {
    return ['PRESELECTED','WAITING_DOCS','DOCS_UPLOADED']
      .includes(this.status()) && !!this.app()?.documentsDeadline;
  }

  showContractDeadline(): boolean {
    return ['CONTRACT','CONTRACT_SUBMITTED','CONTRACT_APPROVED']
      .includes(this.status()) && !!this.app()?.contractSubmissionDeadline;
  }

  isDocsDeadlinePassed(): boolean {
    const d = this.app()?.documentsDeadline;
    return !!d && new Date(d).getTime() < Date.now();
  }

  isContractDeadlinePassed(): boolean {
    const d = this.app()?.contractSubmissionDeadline;
    return !!d && new Date(d).getTime() < Date.now();
  }

  /* ---------- COLOR LOGIC (UNCHANGED) ---------- */

  isYellow() {
    return ['SUBMITTED','DOCS_UPLOADED','CONTRACT_SUBMITTED'].includes(this.status());
  }
  isBlue() {
    return ['WAITING_DOCS','WAITING_LIST'].includes(this.status());
  }
  isRed() {
    return this.status() === 'REJECTED';
  }
  isGreen() {
    return ['PRESELECTED','CONTRACT','CONTRACT_APPROVED'].includes(this.status());
  }

  /* ---------- BUTTON RULES (ONLY LOGIC UPDATED) ---------- */

  canUploadDocs(): boolean {
    if (!['PRESELECTED','WAITING_DOCS','DOCS_UPLOADED'].includes(this.status())) {
      return false;
    }
    if (this.isDocsDeadlinePassed()) {
      return false;
    }
    return true;
  }

  canSubmitContract(): boolean {
    return this.status() === 'CONTRACT'||this.status()=='CONTRACT_SUBMITTED'
      && !!this.app()?.contractSubmissionDeadline
      && !this.isContractDeadlinePassed();
  }

  /* ---------- ACTIONS (UNCHANGED) ---------- */

confirmWithdraw(event: Event) {
  const appId = this.app()?.applicationId;
  if (!appId) return;

  this.confirmation.confirm({
    target: event.target as HTMLElement,
    message: 'This will permanently delete your application and all uploaded files.',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptButtonStyleClass: 'p-button-danger',
    rejectButtonStyleClass: 'p-button-text',
    accept: () => {
      this.studentService.deleteMyApplication(appId).subscribe({
        next: () => this.back(),
        error: err =>
          alert(err?.error?.message || 'Failed to withdraw application'),
      });
    },
  });
}




  goToDocs() {
    if (!this.canUploadDocs()) return;
    this.router.navigate(['/pages/student', this.app()?.offerId, 'documents']);
  }

  goToContract() {
    if (!this.canSubmitContract()) return;
    this.router.navigate(['/pages/student/application', this.app()?.offerId, 'contract']);
  }

  dateOnly(iso?: string|null) {
    if (!iso) return '—';
    return iso.split('T')[0];
  }

  back() { this.router.navigate(['/pages/offer/public']); }
}
