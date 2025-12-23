import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';

import {
  StudentService,
  ChefOptionStudentView,
  StudentMobilityContractView,
  StudentSelfView
} from '@/core/services/student.service';

import {
  OfferService,
  OfferView
} from '@/core/services/offer.service';

@Component({
  selector: 'app-student-contract-submission',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    DividerModule
  ],
  providers: [MessageService],
  template: `
<p-toast></p-toast>

<div class="card list-card">

  <!-- ================= OFFER + APPLICATION ================= -->
  <div class="item">
    <div class="offer-row">

      <!-- IMAGE (LEFT – FIXED) -->
      <div class="thumb">
        <img
          [src]="offer()?.imageUrl || placeholder"
          (error)="onImgError($event)"
        />
      </div>

      <!-- DETAILS (RIGHT – FLEXIBLE) -->
      <div class="meta">
        <div class="title">{{ offer()?.title }}</div>
        <div class="desc">{{ offer()?.description }}</div>

        <div class="meta-chips">
          <span class="chip" *ngIf="offer()?.universityName">
            University: <strong>{{ offer()?.universityName }}</strong>
          </span>

          <span class="chip" *ngIf="offer()?.countryCode">
            Country: <strong>{{ offer()?.countryCode }}</strong>
          </span>
        </div>

        <p-divider></p-divider>

        <div class="meta-chips">
          <span>
            <strong>Application status:</strong>
            <p-tag [value]="applicationStatus"></p-tag>
          </span>

          <span *ngIf="applicationContractDeadline">
            <strong>Contract deadline:</strong>
            {{ formatDate(applicationContractDeadline) }}
          </span>
        </div>
      </div>

    </div>
  </div>

  <!-- ================= STUDENT INFO (UNCHANGED) ================= -->
  <div class="card mt-4">
    <h4>Student information</h4>

    <div class="student-grid">
      <div class="cell">
        <span class="label">Full name</span>
        <span class="value">{{ fullName() }}</span>
      </div>

      <div class="cell">
        <span class="label">Student identifier</span>
        <span class="value">{{ student()?.studentIdentifier || '—' }}</span>
      </div>

      <div class="cell">
        <span class="label">Email</span>
        <span class="value">{{ student()?.email }}</span>
      </div>

      <div class="cell">
        <span class="label">Personal email</span>
        <span class="value">{{ student()?.emailPersonnel || '—' }}</span>
      </div>

      <div class="cell">
        <span class="label">Phone</span>
        <span class="value">{{ student()?.personnelPhoneNumber || '—' }}</span>
      </div>

      <div class="cell">
        <span class="label">Field</span>
        <span class="value">{{ student()?.field || '—' }}</span>
      </div>

      <div class="cell">
        <span class="label">Option</span>
        <span class="value">{{ student()?.optionCode || '—' }}</span>
      </div>

      <div class="cell">
        <span class="label">Class</span>
        <span class="value">{{ student()?.currentClass || '—' }}</span>
      </div>
    </div>
  </div>

  <!-- ================= CONTRACT EXISTS ================= -->
  <div class="card mt-4" *ngIf="contract()">
    <h4>Contract status</h4>

    <p>
      Submitted to <strong>{{ contract()?.chefOptionName }}</strong>
    </p>

    <p-tag
      [severity]="statusSeverity()"
      [value]="statusLabel()">
    </p-tag>

    <div class="mt-3">
      <button
        pButton
        icon="pi pi-download"
        label="Download signed contract"
        (click)="downloadSigned()">
      </button>
    </div>
  </div>

  <!-- ================= CHEF OPTIONS ================= -->
  <div class="card mt-4" *ngIf="!contract()">

    <div class="flex justify-content-between align-items-center mb-2">
      <h4>Select Chef Option & Upload Contract</h4>

      <button
        pButton
        icon="pi pi-download"
        class="p-button-sm p-button-text"
        label="Template"
        (click)="downloadTemplate()">
      </button>
    </div>

    <p-table [value]="chefOptions()">
      <ng-template pTemplate="header">
        <tr>
          <th>Name</th>
          <th>Field</th>
          <th>Option</th>
          <th>Select file</th>
          <th>Upload</th>
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-row>
        <tr>
          <td>{{ row.fullName }}</td>
          <td>{{ row.field }}</td>
          <td>{{ row.option }}</td>

          <td>
            <input
              type="file"
              (change)="onFileSelected(row.id, $event)"
            />
          </td>

          <td>
            <button
              pButton
              icon="pi pi-upload"
              label="Upload"
              [disabled]="!selectedFiles[row.id]"
              (click)="upload(row)">
            </button>
          </td>
        </tr>
      </ng-template>
    </p-table>
  </div>

</div>
`,
  styles: [`
.offer-row {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.thumb {
  flex: 0 0 180px;
}

.thumb img {
  width: 100%;
  max-height: 120px;
  object-fit: contain;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.student-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 1rem;
}

.cell {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.value {
  font-size: 1rem;
  font-weight: 600;
}
`]
})
export class StudentContractSubmissionComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private studentApi = inject(StudentService);
  private offerApi = inject(OfferService);
  private toast = inject(MessageService);

  placeholder = 'https://via.placeholder.com/160x100?text=Offer';

  offerId!: number;
  applicationId!: number;
  applicationStatus?: string;
  applicationContractDeadline?: string;

  offer = signal<OfferView | null>(null);
  student = signal<StudentSelfView | null>(null);
  chefOptions = signal<ChefOptionStudentView[]>([]);
  contract = signal<StudentMobilityContractView | null>(null);

  selectedFiles: Record<number, File> = {};

  ngOnInit() {
    this.offerId = Number(this.route.snapshot.paramMap.get('offerId'));

    this.offerApi.getOffer(this.offerId).subscribe(o => this.offer.set(o));

    this.offerApi.getApplicationProcess(this.offerId).subscribe(p => {
      this.applicationId = p.applicationId;
      this.applicationStatus = p.status;
      this.applicationContractDeadline = p.contractSubmissionDeadline;
      this.loadContract();
    });

    this.studentApi.getMe().subscribe(s => this.student.set(s));
    this.studentApi.getChefOptionsForContract()
      .subscribe(rows => this.chefOptions.set(rows));
  }

  formatDate(value?: string) {
    return value ? value.substring(0, 10) : '';
  }

  fullName() {
    const s = this.student();
    return [s?.firstName, s?.middleName, s?.lastName].filter(Boolean).join(' ');
  }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).src = this.placeholder;
  }

  onFileSelected(chefId: number, e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.selectedFiles[chefId] = file;
  }

  upload(row: ChefOptionStudentView) {
    const file = this.selectedFiles[row.id];
    if (!file) return;

    this.studentApi.uploadSignedMobilityContract(
      this.applicationId,
      row.id,
      file
    ).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Contract submitted' });
        this.loadContract();
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Upload failed' });
      }
    });
  }

  loadContract() {
    this.studentApi.getMyMobilityContract(this.applicationId)
      .subscribe(c => this.contract.set(c));
  }

  downloadTemplate() {
    this.studentApi.downloadMobilityContractTemplate()
      .subscribe(url => window.open(url, '_blank'));
  }

  downloadSigned() {
    this.studentApi.downloadMySignedMobilityContract(this.applicationId)
      .subscribe(url => window.open(url, '_blank'));
  }

  statusLabel() {
    if (this.contract()?.approved === null) return 'Waiting for approval';
    if (this.contract()?.approved === true) return 'Approved';
    return 'Rejected';
  }

  statusSeverity() {
    if (this.contract()?.approved === null) return 'info';
    if (this.contract()?.approved === true) return 'success';
    return 'danger';
  }
}
