import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { OfferService } from '@/core/services/offer.service';

@Component({
  selector: 'app-offer-view-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    // IMPORTANT: fix p-card error
    CardModule,
    InputTextModule
  ],
  styles: [`
    .page { display:flex; justify-content:center; padding:1.5rem; background:#f9fafb; }
    .shell { width:100%; max-width:980px; }
    p-card { width:100%; display:block; }

    .image {
      width:100%; aspect-ratio:16/9; border-radius:.5rem; overflow:hidden;
      background:#f3f4f6; margin-bottom:1rem;
    }
    .image img { width:100%; height:100%; object-fit:cover; }

    .field { display:flex; flex-direction:column; gap:.35rem; margin-bottom:1rem; }
    .label { font-weight:600; font-size:.9rem; }

    .value-input {
      width:100%; padding:.55rem .75rem; border-radius:6px;
      background:#fafafa; border:1px solid #e5e7eb;
      color:var(--text-color);
    }
    .value-textarea {
      width:100%; min-height:6rem; padding:.55rem .75rem; border-radius:6px;
      background:#fafafa; border:1px solid #e5e7eb; resize:none;
    }

    .grid-2 {
      display:grid; grid-template-columns:1fr 1fr; gap:1rem;
    }
    @media (max-width:720px){ .grid-2{ grid-template-columns:1fr; } }

    .chips { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.3rem; }
    .chip {
      background:#f3f4f6; border-radius:20px; padding:.25rem .75rem;
      font-size:.8rem; font-weight:500; color:#374151;
    }

    .section-title { margin-top:1.5rem; margin-bottom:.4rem; font-weight:600; }
  `],

  template: `
<div class="page">
  <div class="shell">
    <p-card>

      <!-- IMAGE -->
      <div class="image" *ngIf="offer?.imageUrl">
        <img [src]="offer?.imageUrl" (error)="onImgError($event)">
      </div>

      <!-- TITLE + SEATS -->
      <div class="grid-2">
        <div class="field">
          <span class="label">Title</span>
          <input class="value-input" [value]="offer?.title" readonly>
        </div>

        <div class="field">
          <span class="label">Seats</span>
          <input class="value-input" [value]="offer?.seats" readonly>
        </div>
      </div>

      <!-- DESCRIPTION -->
      <div class="field">
        <span class="label">Description</span>
        <textarea class="value-textarea" readonly>{{ offer?.description }}</textarea>
      </div>

      <!-- DEADLINE + TYPE -->
      <div class="grid-2">
        <div class="field">
          <span class="label">Deadline</span>
          <input class="value-input" [value]="offer?.deadline" readonly>
        </div>

        <div class="field">
          <span class="label">Type</span>
          <input class="value-input" [value]="offer?.type" readonly>
        </div>
      </div>

      <!-- TARGET YEAR -->
      <div class="grid-2">
        <div class="field">
          <span class="label">Target Year</span>
          <input class="value-input" [value]="offer?.targetYear" readonly>
        </div>
      </div>

      <!-- TOPIC TAGS -->
      <div class="section-title">Topic Tags</div>
      <div class="chips">
        <span class="chip" *ngFor="let t of offer?.topicTags">{{ t }}</span>
      </div>

      <!-- REQUIRED DOCS -->
      <div class="section-title">Required Documents</div>
      <div class="chips">
        <span class="chip" *ngFor="let d of offer?.requiredDocs">{{ d }}</span>
      </div>

      <!-- APPLICATION FORM FIELDS -->
      <div class="section-title">Application Form Fields</div>
      <div class="chips">
        <span class="chip" *ngFor="let f of offer?.formJson?.fields">{{ f }}</span>
      </div>

      <!-- UNIVERSITY INFO -->
      <div class="section-title">University Info</div>

      <div class="grid-2">
        <div class="field">
          <span class="label">University Name</span>
          <input class="value-input" [value]="offer?.universityName" readonly>
        </div>

        <div class="field">
          <span class="label">Country Code</span>
          <input class="value-input" [value]="offer?.countryCode" readonly>
        </div>
      </div>

      <div class="field">
        <span class="label">Address</span>
        <input class="value-input" [value]="offer?.addressLine" readonly>
      </div>

      <div class="grid-2">
        <div class="field">
          <span class="label">Contact Email</span>
          <input class="value-input" [value]="offer?.contactEmail" readonly>
        </div>

        <div class="field">
          <span class="label">Contact Phone</span>
          <input class="value-input" [value]="offer?.contactPhone" readonly>
        </div>
      </div>

    </p-card>
  </div>
</div>
  `
})
export class OfferViewPageComponent implements OnInit {

  private srv = inject(OfferService);
  private route = inject(ActivatedRoute);

  offer: any = null;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.srv.getOffer(id).subscribe(o => this.offer = o);
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
          <rect width="100%" height="100%" fill="#e5e7eb"/>
          <text x="50%" y="50%" font-size="20" fill="#6b7280" text-anchor="middle">No image</text>
        </svg>
      `);
  }
}
