import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

import {
  OfferService,
  OfferView,
  OfferStatus
} from '@/core/services/offer.service';
import { AuthService } from '@/core/services/auth.service';
import { HiringService } from '@/core/services/hiring.service';

type StatusFilter = '' | OfferStatus;

interface OfferMetrics {
  total: number;
  preselected: number;
  remaining: number | null;
}

@Component({
  selector: 'app-offer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule
  ],
  styles: [`
    .list-card{ position:relative; }
    .row{ display:flex; flex-direction:column; }
    .item{ display:flex; flex-direction:column; gap:1rem; padding:1rem; background:var(--surface-0); }
    .item + .item{ border-top:1px solid var(--surface-300, #e5e7eb); }

    .line{ display:flex; gap:1rem; align-items:flex-start; }
    .thumb{ width:200px; min-width:200px; aspect-ratio:16/9; border-radius:.5rem; overflow:hidden; background:var(--surface-100); }
    .thumb img{ width:100%; height:100%; object-fit:cover; display:block; }

    .meta{ display:flex; flex-direction:column; gap:.5rem; flex:1; min-width:0; padding-right:2.5rem; }
    .title{ font-weight:700; font-size:1.125rem; letter-spacing:.2px; }
    .desc{ color:var(--text-color-secondary); line-height:1.35; max-height:4.2em; overflow:hidden; }

    .meta-chips{ display:flex; gap:1rem; flex-wrap:wrap; margin-top:.25rem; }
    .chip{ color:var(--text-color-secondary); font-size:.9rem; }
    .chip strong{ color:var(--text-color); }

    .right{ margin-left:auto; align-self:flex-start; display:flex; align-items:center; justify-content:center; width:24px; min-width:24px; }
    .dot{ width:12px; height:12px; border-radius:50%; }
    .dot.open{ background:#22c55e; }
    .dot.closed{ background:#ef4444; }

    .bottom{ display:flex; justify-content:flex-end; margin-top:.25rem; }
    .chev{ border:none; background:transparent; cursor:pointer; border-radius:.5rem; padding:.35rem; }
    .chev:hover{ background:var(--surface-100); }

    .exp{ overflow:hidden; max-height:0; opacity:0; transition:max-height .28s ease, opacity .2s ease; border-top:1px dashed var(--surface-200, #eee); margin-top:.25rem; }
    .exp.show{ max-height:640px; opacity:1; }
    .exp-inner{ padding:1rem .5rem 1rem .5rem; position:relative; }

    .block + .block{ border-top:1px solid var(--surface-200, #eee); margin-top:.75rem; padding-top:.75rem; }
    .block-title{ font-size:.9rem; font-weight:600; color:var(--text-color-secondary); margin-bottom:.5rem; }

    .chips{ display:flex; flex-wrap:wrap; gap:.4rem; }
    .chip-pill{ display:inline-flex; align-items:center; gap:.35rem; padding:.2rem .55rem; border-radius:9999px; background:var(--surface-200); font-size:.85rem; }

    .panel-actions{
      margin-top:.75rem;
      padding-top:.75rem;
      border-top:1px solid var(--surface-400, #9ca3af);
      display:flex;
      gap:.75rem;
      flex-wrap:wrap;
      justify-content:flex-end;
      position:relative;
    }

    .confirm-pop{
      position:absolute; right:0; bottom:2.75rem; width:280px;
      background:var(--surface-0); border:1px solid var(--surface-300, #e5e7eb);
      box-shadow:0 6px 18px rgba(0,0,0,.08); border-radius:.5rem; padding:.75rem; z-index:10;
    }
    .confirm-title{ font-weight:600; margin-bottom:.35rem; }
    .confirm-actions{ display:flex; gap:.5rem; justify-content:flex-end; margin-top:.5rem; }

    .toolbar{ margin-bottom:1rem; display:flex; flex-direction:column; gap:.75rem; }

    .search-row{
      display:flex;
      justify-content:flex-start;
      width:100%;
      max-width:480px;
    }

    .filters-row{
      display:flex;
      flex-wrap:wrap;
      gap:.75rem;
      align-items:center;
    }

    .filter select,
    .filter input[type="date"]{
      width:160px;
      border-radius:8px;
      border:1px solid var(--surface-300);
      padding:.45rem .75rem;
      background:var(--surface-0);
      color:var(--text-color);
      font-size:.9rem;
      cursor:pointer;
    }

    @media (max-width:640px){
      .line{ flex-direction:column; }
      .right{ align-self:flex-end; }
      .thumb{ width:100%; min-width:0; aspect-ratio:16/9; }
      .confirm-pop{ bottom:3.25rem; right:.25rem; }
    }
  `],
  template: `
  <div class="card list-card">
    <div class="text-3xl font-bold mb-4">Offers List</div>

    <!-- TOOLBAR -->
    <div class="toolbar">

      <!-- ROW 1: SEARCH -->
      <div class="search-row">
        <p-inputgroup style="width:100%;">
          <p-inputgroup-addon>
            <i class="pi pi-search"></i>
          </p-inputgroup-addon>
          <input
            pInputText
            placeholder="Search offers..."
            [(ngModel)]="filters.q"
            (ngModelChange)="applyFilters()" />
        </p-inputgroup>
      </div>

      <!-- ROW 2: FILTERS -->
      <div class="filters-row">

        <div class="filter">
          <select [(ngModel)]="filters.status" (ngModelChange)="applyFilters()">
            <option value="">Status (All)</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div class="filter">
          <select [(ngModel)]="filters.esprit" (ngModelChange)="applyFilters()">
            <option [ngValue]="null">Program: All</option>
            <option [ngValue]="true">Esprit Program</option>
            <option [ngValue]="false">External Program</option>
          </select>
        </div>

        <div class="filter">
          <select [(ngModel)]="filters.university" (ngModelChange)="applyFilters()">
            <option value="">All Universities</option>
            <option *ngFor="let u of universityOptions()" [value]="u">{{ u }}</option>
          </select>
        </div>

        <div class="filter">
          <input
            type="date"
            [(ngModel)]="filters.deadlineFrom"
            (ngModelChange)="applyFilters()"
            placeholder="From" />
        </div>

        <div class="filter">
          <input
            type="date"
            [(ngModel)]="filters.deadlineTo"
            (ngModelChange)="applyFilters()"
            placeholder="To" />
        </div>

      </div>
    </div>

    <!-- LIST -->
    <div class="row" *ngIf="offers()?.length; else empty">
      <div class="item" *ngFor="let o of offers(); trackBy: trackById">
        <div class="line">
          <div class="thumb">
            <img [src]="o.imageUrl || ''" [alt]="o.title" (error)="onImgError($event)" />
          </div>

          <div class="meta">
            <div class="title">{{ o.title }}</div>
            <div class="desc">{{ o.description }}</div>

            <div class="meta-chips">
              <span class="chip">Target: <strong>{{ o.targetYear }}</strong></span>
              <span class="chip">Seats: <strong>{{ seatsOf(o) }}</strong></span>
              <span class="chip">Deadline: <strong>{{ dateOnly(o.deadline) }}</strong></span>
              <span class="chip" *ngIf="o.universityName">University: <strong>{{ o.universityName }}</strong></span>
              <span class="chip" *ngIf="o.countryCode">Country: <strong>{{ o.countryCode }}</strong></span>

              <span class="chip" *ngIf="metrics()[o.id] as m">
                Applicants: <strong>{{ m.total }}</strong> ·
                Accepted: <strong>{{ m.preselected }}</strong>
                <ng-container *ngIf="m.remaining !== null">
                  · Remaining: <strong>{{ m.remaining }}</strong>
                </ng-container>
              </span>
            </div>
          </div>

          <div class="right">
            <span class="dot"
                  [ngClass]="{ open: o.status === 'OPEN', closed: o.status === 'CLOSED' }"
                  [title]="o.status">
            </span>
          </div>
        </div>

        <div class="bottom">
          <button class="chev" (click)="toggle(o)">
            <i class="pi" [ngClass]="expandedId() === o.id ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
          </button>
        </div>

        <div class="exp" [class.show]="expandedId() === o.id">
          <div class="exp-inner">

            <!-- Required Info -->
            <div class="block" *ngIf="(o.formJson?.fields?.length || 0) > 0">
              <div class="block-title">Required Information</div>
              <div class="chips">
                <span class="chip-pill" *ngFor="let f of o.formJson?.fields; trackBy: trackByIndex">{{ f }}</span>
              </div>
            </div>

            <!-- Tags -->
            <div class="block" *ngIf="(o.topicTags?.length || 0) > 0">
              <div class="block-title">Topic Tags</div>
              <div class="chips">
                <span class="chip-pill" *ngFor="let t of o.topicTags; trackBy: trackByIndex">{{ t }}</span>
              </div>
            </div>

            <!-- Required Documents -->
            <div class="block" *ngIf="(o.requiredDocs?.length || 0) > 0">
              <div class="block-title">Required Documents</div>
              <div class="chips">
                <span class="chip-pill" *ngFor="let d of o.requiredDocs; trackBy: trackByIndex">{{ d }}</span>
              </div>
            </div>

            <!-- ⭐ NEW: MODULES -->
            <div class="block" *ngIf="(o.modules?.length || 0) > 0">
              <div class="block-title">Modules</div>
              <div class="chips">
                <span class="chip-pill" *ngFor="let m of o.modules; trackBy: trackByIndex">
                  {{ m }}
                </span>
              </div>
            </div>

            <!-- ⭐ NEW: OFFER FILES -->
            <div class="block" *ngIf="o.offerFileUrls && objectKeys(o.offerFileUrls).length > 0">
              <div class="block-title">Offer Files</div>
              <div class="chips">
                <a
                  class="chip-pill"
                  *ngFor="let lbl of objectKeys(o.offerFileUrls)"
                  [href]="o.offerFileUrls[lbl]"
                  target="_blank"
                >
                  {{ lbl }}
                </a>
              </div>
            </div>

            <!-- Contact -->
            <div class="block" *ngIf="o.universityName || o.addressLine || o.contactEmail || o.contactPhone">
              <div class="block-title">University & Contact</div>
              <div class="chips">
                <span class="chip-pill" *ngIf="o.universityName">University: {{ o.universityName }}</span>
                <span class="chip-pill" *ngIf="o.countryCode">Country: {{ o.countryCode }}</span>
                <span class="chip-pill" *ngIf="o.addressLine">Address: {{ o.addressLine }}</span>
                <span class="chip-pill" *ngIf="o.contactEmail">Email: {{ o.contactEmail }}</span>
                <span class="chip-pill" *ngIf="o.contactPhone">Phone: {{ o.contactPhone }}</span>
              </div>
            </div>

            <!-- ACTION PANEL -->
            <div class="panel-actions">

              <p-button label="Applicants" icon="pi pi-users" severity="info" (onClick)="goToHiring(o)"></p-button>

              <p-button label="Update" icon="pi pi-pencil" (onClick)="updateItem(o)"></p-button>

              <p-button label="Delete" icon="pi pi-trash" severity="danger" (onClick)="askDelete(o)"></p-button>

              <div class="confirm-pop" *ngIf="askDeleteId() === o.id">
                <div class="confirm-title">Delete this offer?</div>
                <div class="text-sm text-color-secondary">
                  This action will permanently remove the offer and all its applications.
                </div>
                <div class="confirm-actions">
                  <p-button label="Cancel" size="small" outlined="true" (onClick)="askDeleteId.set(null)"></p-button>
                  <p-button label="Delete" size="small" severity="danger" (onClick)="confirmDelete(o)"></p-button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>

    <ng-template #empty>
      <div class="p-4 text-color-secondary">No offers to display.</div>
    </ng-template>
  </div>
  `
})
export class OfferListComponent implements OnInit {

  objectKeys = Object.keys;

  private offerService = inject(OfferService);
  private hiringService = inject(HiringService);
  private router = inject(Router);
  private auth = inject(AuthService);

  private allOffers = signal<OfferView[]>([]);
  offers = signal<OfferView[]>([]);
  universityOptions = signal<string[]>([]);

  expandedId = signal<number | null>(null);
  askDeleteId = signal<number | null>(null);
  metrics = signal<Record<number, OfferMetrics>>({});

  filters = {
    q: '',
    status: '' as StatusFilter,
    esprit: null as boolean | null,
    university: '',
    deadlineBefore: '',
    deadlineFrom: '',
    deadlineTo: ''
  };

  ngOnInit(): void {
    const role = (this.auth.currentRole() || '').toUpperCase();
    const allowed = role === 'PARTNER' || role === 'MOBILITY_OFFICER' || role === 'MOBILITY_AGENT';

    if (!allowed) {
      this.router.navigate(['/pages/notfound']);
      return;
    }

    this.offerService.getVisibleOffersOrAll(0, 200).subscribe({
      next: rows => {
        const list = rows ?? [];
        this.allOffers.set(list);
        this.buildUniversityOptions(list);
        this.applyFilters();
        this.loadMetricsForOffers(list);
      },
      error: e => {
        console.error('Failed to load offers list', e);
        this.offers.set([]);
      }
    });
  }

  private buildUniversityOptions(list: OfferView[]) {
    const set = new Set<string>();
    for (const o of list) {
      if (o.universityName) set.add(o.universityName.trim());
    }
    this.universityOptions.set(Array.from(set).sort());
  }

  applyFilters() {
    const f = this.filters;
    let rows = [...this.allOffers()];

    if (f.q.trim()) {
      const q = f.q.trim().toLowerCase();
      rows = rows.filter(o => {
        const hay = [
          o.title,
          o.description,
          o.universityName,
          o.countryCode
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    if (f.status) {
      rows = rows.filter(o => o.status === f.status);
    }

    if (f.esprit !== null) {
      rows = rows.filter(o => o.esprit === f.esprit);
    }

    if (f.university) {
      rows = rows.filter(o => o.universityName === f.university);
    }

    if (f.deadlineFrom || f.deadlineTo) {
      rows = rows.filter(o => {
        const d = this.dateOnly(o.deadline);
        if (d === '—') return false;

        if (f.deadlineFrom && !f.deadlineTo) {
          return d >= f.deadlineFrom;
        }
        if (!f.deadlineFrom && f.deadlineTo) {
          return d <= f.deadlineTo;
        }
        if (f.deadlineFrom && f.deadlineTo) {
          return d >= f.deadlineFrom && d <= f.deadlineTo;
        }
        return true;
      });
    }

    this.offers.set(rows);
  }

  private loadMetricsForOffers(list: OfferView[]) {
    for (const o of list) {
      this.hiringService.listApplications(o.id).subscribe({
        next: apps => {
          const total = Array.isArray(apps) ? apps.length : 0;
          const preselected = Array.isArray(apps)
            ? apps.filter(a => a.status === 'PRESELECTED'||a.status === 'CONTRACT'||a.status === 'DOCS_UPLOADED'||a.status === 'CONTRACT_SUBMITTED'||a.status === 'CONTRACT_APPROVED').length
            : 0;

          const seats = this.seatsOf(o);
          const remaining = seats != null ? Math.max(seats - preselected, 0) : null;

          this.metrics.update(curr => ({
            ...curr,
            [o.id]: { total, preselected, remaining }
          }));
        },
        error: e => console.error('Failed to load applications for offer', o.id, e)
      });
    }
  }

  toggle(o: OfferView) {
    this.expandedId.set(this.expandedId() === o.id ? null : o.id);
  }

  seatsOf(o: OfferView): number | null {
    return typeof o.seats === 'number' ? o.seats : null;
  }

  dateOnly(iso: string | null | undefined): string {
    if (!iso) return '—';
    const s = String(iso);
    if (s.includes('T')) return s.split('T')[0];
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
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

  updateItem(o: OfferView) {
    this.router.navigate(['/pages/offer/update', o.id]);
  }

  askDelete(o: OfferView) {
    this.askDeleteId.set(o.id);
  }

  confirmDelete(o: OfferView) {
    this.offerService.deleteOffer(o.id).subscribe({
      next: () => {
        const rest = this.allOffers().filter(x => x.id !== o.id);
        this.allOffers.set(rest);
        this.applyFilters();
        this.askDeleteId.set(null);
        if (this.expandedId() === o.id) this.expandedId.set(null);
      },
      error: e => {
        console.error('Failed to delete offer', e);
        this.askDeleteId.set(null);
      }
    });
  }

  goToHiring(o: OfferView) {
    this.router.navigate(['/pages/hiring/offers', o.id]);
  }

  trackById = (_: number, o: OfferView) => o.id;
  trackByIndex = (i: number) => i;
}
