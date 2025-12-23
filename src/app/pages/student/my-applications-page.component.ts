import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Observable } from 'rxjs';

import {
  ApplicationStatus,
  MyApplicationView,
  OfferService
} from '@/core/services/offer.service';

@Component({
  selector: 'app-my-applications-page',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  styles: [`
    /* PAGE */
    :host {
      display: block;
      background: var(--surface-100); /* light grey page */
      min-height: 100%;
    }

    .list-card {
      padding: 0;
      margin: 0;
      width: 100%;
    }

    .row {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* APPLICATION CARD */
    .item {
      background: #ffffff; /* ✅ PURE WHITE CARD */
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 2px rgba(0,0,0,.06);
    }

    .line {
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
    }

    /* IMAGE */
    .thumb {
      width: 200px;
      min-width: 200px;
      aspect-ratio: 16 / 9;
      border-radius: .5rem;
      overflow: hidden;
      background: var(--surface-100);
    }

    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* META */
    .meta {
      display: flex;
      flex-direction: column;
      gap: .5rem;
      flex: 1;
      min-width: 0;
    }

    .title {
      font-weight: 700;
      font-size: 1.125rem;
    }

    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      margin-top: .25rem;
    }

    .chip-pill {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      padding: .25rem .6rem;
      border-radius: 9999px;
      background: var(--surface-200);
      font-size: .85rem;
    }

    .status-pill {
      font-size: .8rem;
      padding: .25rem .6rem;
      border-radius: 9999px;
      font-weight: 600;
    }

    .status-submitted          { background:#e0f2fe; color:#075985; }
    .status-preselected        { background:#dcfce7; color:#166534; }
    .status-waiting_docs       { background:#fef9c3; color:#854d0e; }
    .status-docs_uploaded      { background:#fef3c7; color:#92400e; }
    .status-contract_submitted { background:#e0e7ff; color:#3730a3; }
    .status-contract_approved  { background:#bbf7d0; color:#166534; }
    .status-rejected           { background:#fee2e2; color:#b91c1c; }

    /* ACTIONS */
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: .75rem;
      margin-top: 1rem;
    }
  `],
  template: `
<div class="list-card">
  <div class="text-3xl font-bold mb-4">My Applications</div>

  <ng-container *ngIf="apps$ | async as apps">

    <div *ngIf="apps.length === 0" class="p-4 text-color-secondary">
      You don't have any applications yet.
    </div>

    <div class="row" *ngIf="apps.length > 0">
      <div class="item" *ngFor="let a of apps; trackBy: trackByAppId">

        <div class="line">
          <!-- IMAGE -->
          <div class="thumb">
            <img
              [src]="a.offerImageUrl || placeholder"
              [alt]="a.offerTitle || ('Offer #' + a.offerId)"
              (error)="onImgError($event)" />
          </div>

          <!-- CONTENT -->
          <div class="meta">
            <div class="title">
              {{ a.offerTitle || ('Offer #' + a.offerId) }}
            </div>

            <div class="chip-row">
              <span class="chip-pill" *ngIf="a.offerUniversityName">
                University: <strong>{{ a.offerUniversityName }}</strong>
              </span>

              <span class="chip-pill" *ngIf="a.offerCountryCode">
                Country: <strong>{{ a.offerCountryCode | uppercase }}</strong>
              </span>

              <span class="chip-pill" *ngIf="a.offerDeadline">
                Deadline: <strong>{{ dateOnly(a.offerDeadline) }}</strong>
              </span>

              <span class="chip-pill"
                    *ngIf="a.finalScore !== null && a.finalScore !== undefined">
                Final score:
                <strong>{{ a.finalScore | number:'1.0-2' }}</strong>
              </span>
            </div>

            <div class="chip-row">
              <span class="status-pill" [ngClass]="statusClass(a.status)">
                {{ a.status }}
              </span>

              <span class="chip-pill" *ngIf="a.createdAt">
                Applied at:
                <strong>{{ dateOnlyTime(a.createdAt) }}</strong>
              </span>
            </div>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="actions">
          <button
            pButton
            type="button"
            label="Application process"
            icon="pi pi-eye"
            class="p-button-outlined p-button-success"
            (click)="goToProcess(a.offerId)">
          </button>

          <button
            pButton
            type="button"
            label="View offers"
            icon="pi pi-external-link"
            class="p-button-text"
            (click)="goToOffer()">
          </button>

          <button
            pButton
            *ngIf="a.status === 'WAITING_DOCS'"
            type="button"
            label="Upload documents"
            icon="pi pi-upload"
            class="p-button-sm"
            (click)="uploadDocs(a.applicationId)">
          </button>
        </div>

      </div>
    </div>

  </ng-container>
</div>
`
})
export class MyApplicationsPageComponent {

  apps$: Observable<MyApplicationView[]>;
  placeholder = 'https://via.placeholder.com/800x450?text=Application';

  constructor(
    private offers: OfferService,
    private router: Router
  ) {
    this.apps$ = this.offers.getMyApplications();
  }

  trackByAppId = (_: number, a: MyApplicationView) => a.applicationId;

  statusClass(st: ApplicationStatus): string {
    switch (st) {
      case 'SUBMITTED':          return 'status-pill status-submitted';
      case 'PRESELECTED':        return 'status-pill status-preselected';
      case 'WAITING_DOCS':       return 'status-pill status-waiting_docs';
      case 'DOCS_UPLOADED':      return 'status-pill status-docs_uploaded';
      case 'CONTRACT_SUBMITTED': return 'status-pill status-contract_submitted';
      case 'CONTRACT_APPROVED':  return 'status-pill status-contract_approved';
      case 'REJECTED':           return 'status-pill status-rejected';
      default:                   return 'status-pill';
    }
  }

  dateOnly(iso?: string | null): string {
    if (!iso) return '—';
    return iso.split('T')[0];
  }

  dateOnlyTime(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-family="sans-serif" font-size="18" fill="#6b7280">No image</text>
      </svg>`);
  }

  goToOffer() {

    this.router.navigate(['/pages/offer/public']);
  }

  goToProcess(offerId?: number | null) {
    if (!offerId) return;
    this.router.navigate(['/pages/student/application', offerId, 'process']);
  }

  uploadDocs(appId?: number | null) {
    if (!appId) return;
    console.log('TODO upload docs for application', appId);
  }
}
