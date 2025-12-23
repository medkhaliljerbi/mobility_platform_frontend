// src/app/pages/public-offer-list/public-offer-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

import {
  OfferService,
  OfferView,
  RecommendationItem,
  MyApplicationView,
  OfferStatus
} from '@/core/services/offer.service';
import { AuthService } from '@/core/services/auth.service';
import { environment } from 'src/environments/environment';
import { catchError, of } from 'rxjs';

type Role =
  | 'STUDENT'
  | 'TEACHER'
  | 'CHEF-OPTION'
  | 'MOBILITY_AGENT'
  | 'ADMIN'
  | 'UNKNOWN';

type StudentType = 'ENTRANT' | 'SORTANT';
type StatusFilter = '' | OfferStatus;

interface StudentSelfView {
  type?: StudentType | null;
  currentClass?: string | null;
}

type HydratedRecommendation = OfferView & RecommendationItem;

@Injectable({ providedIn: 'root' })
class StudentService {
  constructor(private http: HttpClient) {}

  getMe() {
    const base = environment.apiBase.replace(/\/+$/, '');
    return this.http.get<StudentSelfView>(`${base}/api/student/profile`, {
      withCredentials: true
    });
  }
}

@Component({
  selector: 'app-public-offer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataViewModule,
    ButtonModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule
  ],
  styles: [
    `
      :host ::ng-deep .p-dataview-content {
        overflow: visible;
      }

      .list-card {
        position: relative;
      }
      .row {
        display: flex;
        flex-direction: column;
      }
      .item {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        background: var(--surface-0);
        transition: background 0.2s ease, opacity 0.2s ease;
      }
      .item + .item {
        border-top: 1px solid var(--surface-300, #e5e7eb);
      }

      .top-matches {
        padding: 1rem;
        margin-bottom: 1.5rem;
      }
      .top-title {
        font-weight: 700;
        margin-bottom: 0.75rem;
        font-size: 1rem;
      }
      .top-item {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        transition: background 0.2s ease, opacity 0.2s ease;
      }
      .top-item + .top-item {
        border-top: 1px solid var(--surface-300, #d1d5db);
        margin-top: 1rem;
        padding-top: 1rem;
      }

      .item.applied,
      .top-item.applied {
        opacity: 0.7;
        background: var(--surface-100);
      }

      .line {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }
      .thumb {
        width: 200px;
        min-width: 200px;
        aspect-ratio: 16/9;
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--surface-100);
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .meta {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
        padding-right: 2.5rem;
      }
      .title {
        font-weight: 700;
        font-size: 1.125rem;
        letter-spacing: 0.2px;
      }
      .desc {
        color: var(--text-color-secondary);
        line-height: 1.35;
      }
      .right {
        margin-left: auto;
        align-self: flex-start;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        min-width: 24px;
      }
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
      .dot.open {
        background: #22c55e;
      }
      .dot.closed {
        background: #ef4444;
      }

      .meta-chips {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-top: 0.25rem;
      }
      .chip {
        color: var(--text-color-secondary);
        font-size: 0.9rem;
      }
      .chip strong {
        color: var(--text-color);
      }

      .score-chips {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .score-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.2rem 0.55rem;
        border-radius: 9999px;
        background: var(--surface-200);
        font-size: 0.85rem;
      }

      .bottom {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.25rem;
      }
      .chev {
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 0.5rem;
        padding: 0.35rem;
      }
      .chev:hover {
        background: var(--surface-100);
      }

      .exp {
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transition: max-height 0.28s ease, opacity 0.2s ease;
        border-top: 1px dashed var(--surface-200, #eee);
        margin-top: 0.25rem;
      }
      .exp.show {
        max-height: 900px;
        opacity: 1;
      }

      .exp-inner {
        padding: 1rem 0.5rem 1rem 0.5rem;
        position: relative;
      }

      .block + .block {
        border-top: 1px solid var(--surface-200, #eee);
        margin-top: 0.75rem;
        padding-top: 0.75rem;
      }

      .block-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-color-secondary);
        margin-bottom: 0.5rem;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .chip-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.2rem 0.55rem;
        border-radius: 9999px;
        background: var(--surface-200);
        font-size: 0.85rem;
      }

      .panel-actions {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        position: relative;
        flex-wrap: wrap;
      }

      .section-line {
        border: 0;
        border-top: 3px solid var(--surface-400, #6b7280);
        margin: 1rem 0 1.5rem 0;
      }

      /* ===== Toolbar (copied from OfferList) ===== */
      .toolbar {
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .search-row {
        display: flex;
        justify-content: flex-start;
        width: 100%;
        max-width: 480px;
      }

      .filters-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }

      .filter select,
      .filter input[type='date'] {
        width: 160px;
        border-radius: 8px;
        border: 1px solid var(--surface-300);
        padding: 0.45rem 0.75rem;
        background: var(--surface-0);
        color: var(--text-color);
        font-size: 0.9rem;
        cursor: pointer;
      }

      @media (max-width: 640px) {
        .line {
          flex-direction: column;
        }
        .right {
          align-self: flex-end;
        }
        .thumb {
          width: 100%;
          min-width: 0;
          aspect-ratio: 16/9;
        }
      }
    `
  ],
  template: `
    <div class="card list-card">
      <div class="text-3xl font-bold mb-4">Offers</div>

      <!-- TOP MATCHES -->
      <div class="top-matches" *ngIf="isScoreEnabled && topMatches.length > 0">
        <div class="top-title">Top matches for you</div>
        <div class="row">
          <div
            class="top-item"
            *ngFor="let o of topMatches; trackBy: trackById"
            [ngClass]="{ applied: hasApplied(o) }"
          >
            <div class="line">
              <div class="thumb">
                <img
                  [src]="o.imageUrl || placeholder"
                  [alt]="o.title"
                  (error)="onImgError($event)"
                />
              </div>

              <div class="meta">
                <div class="title">{{ o.title }}</div>
                <div class="desc">{{ o.description }}</div>

                <div class="score-chips">
                  <span class="score-pill" *ngIf="o.gradeScore !== undefined">
                    Grade: <strong>{{ fmt01(o.gradeScore) }}</strong>
                  </span>

                  <span class="score-pill" *ngIf="o.certScore !== undefined">
                    Cert: <strong>{{ fmt01(o.certScore) }}</strong>
                  </span>

                  <span class="score-pill" *ngIf="o.recoScore !== undefined">
                    Final: <strong>{{ fmt01(o.recoScore) }}</strong>
                  </span>
                </div>

                <div
                  style="font-size: 0.75rem; color: var(--text-color-secondary);"
                  *ngIf="o.createdAt"
                >
                  Created: {{ dateOnly(o.createdAt) }}
                </div>
              </div>

              <div class="right">
                <span
                  class="dot"
                  [ngClass]="{ open: isActive(o), closed: !isActive(o) }"
                ></span>
              </div>
            </div>

            <div class="panel-actions">
              <p-button
                *ngIf="!hasApplied(o) && canApply(o)"
                label="Apply"
                icon="pi pi-send"
                (onClick)="apply(o)"
              ></p-button>

              <p-button
                *ngIf="hasApplied(o)"
                label="Consult application"
                icon="pi pi-eye"
                class="p-button-secondary"
                (onClick)="consult(o)"
              ></p-button>
            </div>
          </div>
        </div>
      </div>

      <hr
        class="section-line"
        *ngIf="isScoreEnabled && topMatches.length > 0"
      />

      <!-- TOOLBAR FOR ALL OFFERS (same as OfferList) -->
      <div class="toolbar">
        <!-- ROW 1: SEARCH -->
        <div class="search-row">
          <p-inputgroup style="width: 100%;">
            <p-inputgroup-addon>
              <i class="pi pi-search"></i>
            </p-inputgroup-addon>
            <input
              pInputText
              placeholder="Search offers..."
              [(ngModel)]="filters.q"
              (ngModelChange)="applyFilters()"
            />
          </p-inputgroup>
        </div>

        <!-- ROW 2: FILTERS -->
        <div class="filters-row">
          <!-- Status -->
          <div class="filter">
            <select
              [(ngModel)]="filters.status"
              (ngModelChange)="applyFilters()"
            >
              <option value="">Status (All)</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <!-- Esprit / External -->
          <div class="filter">
            <select
              [(ngModel)]="filters.esprit"
              (ngModelChange)="applyFilters()"
            >
              <option [ngValue]="null">Program: All</option>
              <option [ngValue]="true">Esprit Program</option>
              <option [ngValue]="false">External Program</option>
            </select>
          </div>

          <!-- University -->
          <div class="filter">
            <select
              [(ngModel)]="filters.university"
              (ngModelChange)="applyFilters()"
            >
              <option value="">All Universities</option>
              <option *ngFor="let u of universityOptions" [value]="u">
                {{ u }}
              </option>
            </select>
          </div>

          <!-- Deadline From -->
          <div class="filter">
            <input
              type="date"
              [(ngModel)]="filters.deadlineFrom"
              (ngModelChange)="applyFilters()"
              placeholder="From"
            />
          </div>

          <!-- Deadline To -->
          <div class="filter">
            <input
              type="date"
              [(ngModel)]="filters.deadlineTo"
              (ngModelChange)="applyFilters()"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      <div class="top-title">All Offers</div>

      <!-- ALL OFFERS -->
      <div class="row" *ngIf="filteredOffers?.length; else emptyOffers">
        <div
          class="item"
          *ngFor="let o of filteredOffers; trackBy: trackById"
          [ngClass]="{ applied: hasApplied(o) }"
        >
          <div class="line">
            <div class="thumb">
              <img
                [src]="o.imageUrl || placeholder"
                [alt]="o.title"
                (error)="onImgError($event)"
              />
            </div>

            <div class="meta">
              <div class="title">{{ o.title }}</div>
              <div class="desc">{{ o.description }}</div>

              <div class="meta-chips">
                <span class="chip">
                  Seats:
                  <strong>{{ seatsOf(o) ?? '—' }}</strong>
                </span>
                <span class="chip">
                  Deadline:
                  <strong>{{ dateOnly(o.deadline) }}</strong>
                </span>
                <span class="chip" *ngIf="o.universityName">
                  University: <strong>{{ o.universityName }}</strong>
                </span>
                <span class="chip" *ngIf="o.countryCode">
                  Country: <strong>{{ o.countryCode }}</strong>
                </span>
              </div>

              <div
                style="font-size: 0.75rem; color: var(--text-color-secondary);"
                *ngIf="o.createdAt"
              >
                Created: {{ dateOnly(o.createdAt) }}
              </div>
            </div>

            <div class="right">
              <span
                class="dot"
                [ngClass]="{ open: isActive(o), closed: !isActive(o) }"
              ></span>
            </div>
          </div>

          <div class="bottom">
            <button
              class="chev"
              (click)="toggleExpanded(o.id)"
              [attr.aria-expanded]="isExpanded(o.id)"
            >
              <i
                class="pi"
                [ngClass]="isExpanded(o.id) ? 'pi-chevron-up' : 'pi-chevron-down'"
              ></i>
            </button>
          </div>

          <div class="exp" [class.show]="isExpanded(o.id)">
            <div class="exp-inner">
              <!-- Required Information -->
              <div class="block" *ngIf="o.formJson?.fields?.length">
                <div class="block-title">Required Information</div>
                <div class="chips">
                  <span
                    class="chip-pill"
                    *ngFor="
                      let f of (o.formJson?.fields || []);
                      trackBy: trackByIndex
                    "
                    >{{ f }}</span
                  >
                </div>
              </div>

              <!-- Topic Tags -->
              <div class="block" *ngIf="o.topicTags?.length">
                <div class="block-title">Topic Tags</div>
                <div class="chips">
                  <span
                    class="chip-pill"
                    *ngFor="let t of o.topicTags; trackBy: trackByIndex"
                    >{{ t }}</span
                  >
                </div>
              </div>

              <!-- Required Docs -->
              <div class="block" *ngIf="o.requiredDocs?.length">
                <div class="block-title">Required Documents</div>
                <div class="chips">
                  <span
                    class="chip-pill"
                    *ngFor="let d of o.requiredDocs; trackBy: trackByIndex"
                    >{{ d }}</span
                  >
                </div>
              </div>

              <!-- Target Year -->
              <div class="block">
                <div class="block-title">Target Year</div>
                <div class="chips">
                  <span class="chip-pill">{{ o.targetYear }} YEAR</span>
                </div>
              </div>

              <!-- University & Contact -->
              <div
                class="block"
                *ngIf="
                  o.universityName ||
                  o.addressLine ||
                  o.contactEmail ||
                  o.contactPhone
                "
              >
                <div class="block-title">University & Contact</div>
                <div class="chips">
                  <span class="chip-pill" *ngIf="o.universityName">
                    University: {{ o.universityName }}
                  </span>
                  <span class="chip-pill" *ngIf="o.countryCode">
                    Country: {{ o.countryCode }}
                  </span>
                  <span class="chip-pill" *ngIf="o.addressLine">
                    Address: {{ o.addressLine }}
                  </span>
                  <span class="chip-pill" *ngIf="o.contactEmail">
                    Email: {{ o.contactEmail }}
                  </span>
                  <span class="chip-pill" *ngIf="o.contactPhone">
                    Phone: {{ o.contactPhone }}
                  </span>
                </div>
              </div>

              <!-- Modules -->
              <div class="block" *ngIf="o.modules?.length">
                <div class="block-title">Modules</div>
                <div class="chips">
                  <span
                    class="chip-pill"
                    *ngFor="let m of o.modules; trackBy: trackByIndex"
                    >{{ m }}</span
                  >
                </div>
              </div>

              <!-- Offer Files -->
              <div
                class="block"
                *ngIf="o.offerFileUrls && objectKeys(o.offerFileUrls).length > 0"
              >
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

              <!-- Action Panel -->
              <div class="panel-actions">
                <p-button
                  *ngIf="!hasApplied(o) && canApply(o)"
                  label="Apply"
                  icon="pi pi-send"
                  (onClick)="apply(o)"
                ></p-button>

                <p-button
                  *ngIf="hasApplied(o)"
                  label="Consult application"
                  icon="pi pi-eye"
                  class="p-button-secondary"
                  (onClick)="consult(o)"
                ></p-button>

                <!-- Recommend only if TEACHER/CHEF and offer OPEN -->
                <p-button
                  *ngIf="canRecommend(o)"
                  label="Recommend"
                  icon="pi pi-lightbulb"
                  (onClick)="recommend(o)"
                ></p-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #emptyOffers>
        <div class="p-4 text-color-secondary">No offers to display.</div>
      </ng-template>
    </div>
  `
})
export class PublicOfferListComponent implements OnInit {
  objectKeys = Object.keys;

  offers: OfferView[] = [];
  filteredOffers: OfferView[] = [];
  topMatches: HydratedRecommendation[] = [];
  placeholder = 'https://via.placeholder.com/800x450?text=Offer+Image';

  role: Role = 'UNKNOWN';
  isStudent = false;
  isEntrant = false;
  isScoreEnabled = false;

  myApps: MyApplicationView[] = [];
  appliedByOfferId = new Map<number, MyApplicationView>();

  universityOptions: string[] = [];

  filters: {
    q: string;
    status: StatusFilter;
    esprit: boolean | null;
    university: string;
    deadlineFrom: string;
    deadlineTo: string;
  } = {
    q: '',
    status: '' as StatusFilter,
    esprit: null,
    university: '',
    deadlineFrom: '',
    deadlineTo: ''
  };

  private expanded = new Set<number>();

  constructor(
    private offerService: OfferService,
    private auth: AuthService,
    private student: StudentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const raw = (this.auth.currentRole() || 'UNKNOWN').toUpperCase();
    this.role = (['STUDENT', 'TEACHER', 'CHEF-OPTION', 'MOBILITY_AGENT', 'ADMIN'].includes(raw)
      ? (raw as Role)
      : 'UNKNOWN') as Role;

    this.isStudent = this.role === 'STUDENT';

    if (this.role === 'MOBILITY_AGENT') {
      this.router.navigate(['/pages/offer/list']);
      return;
    }

    this.offerService.getVisibleOffersOrAll(0, 200).subscribe({
      next: rows => {
        this.offers = Array.isArray(rows) ? rows : [];
        this.buildUniversityOptions(this.offers);
        this.applyFilters(); // initialize filteredOffers

        if (!this.isStudent) return;

        // my applications
        this.offerService
          .getMyApplications()
          .pipe(catchError(() => of([] as MyApplicationView[])))
          .subscribe(apps => {
            this.myApps = Array.isArray(apps) ? apps : [];
            this.appliedByOfferId.clear();
            for (const a of this.myApps) {
              if (a.offerId != null) {
                this.appliedByOfferId.set(a.offerId, a);
              }
            }
          });

        // student type → scoring for SORTANT only
        this.student
          .getMe()
          .pipe(catchError(() => of({ type: null } as StudentSelfView)))
          .subscribe(me => {
            const t = (me?.type || '').toUpperCase();
            this.isEntrant = t === 'ENTRANT';
            this.isScoreEnabled = this.isStudent && !this.isEntrant;

            if (this.isScoreEnabled) {
              this.offerService
                .getRecommendations(20)
                .pipe(catchError(() => of([] as RecommendationItem[])))
                .subscribe(recs => {
                  const byId = new Map<number, OfferView>(
                    this.offers.map(o => [o.id, o])
                  );
                  this.topMatches = (recs ?? [])
                    .map(r => {
                      const full = byId.get(r.offerId);
                      return full
                        ? ({ ...full, ...r } as HydratedRecommendation)
                        : null;
                    })
                    .filter(
                      (x): x is HydratedRecommendation =>
                        x !== null && x !== undefined
                    )
                    .sort(
                      (a, b) => (b.recoScore ?? 0) - (a.recoScore ?? 0)
                    )
                    .slice(0, 3);
                });
            }
          });
      },
      error: () => {
        this.offers = [];
        this.filteredOffers = [];
        this.topMatches = [];
      }
    });
  }

  private buildUniversityOptions(list: OfferView[]): void {
    const set = new Set<string>();
    for (const o of list) {
      if (o.universityName) {
        set.add(o.universityName.trim());
      }
    }
    this.universityOptions = Array.from(set).sort();
  }

  applyFilters(): void {
    const f = this.filters;
    let rows = [...this.offers];

    // text search
    if (f.q.trim()) {
      const q = f.q.trim().toLowerCase();
      rows = rows.filter(o => {
        const hay = [
          o.title,
          o.description,
          o.universityName,
          o.countryCode
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // status
    if (f.status) {
      rows = rows.filter(o => o.status === f.status);
    }

    // esprit / external
    if (f.esprit !== null) {
      rows = rows.filter(o => o.esprit === f.esprit);
    }

    // university
    if (f.university) {
      rows = rows.filter(o => o.universityName === f.university);
    }

    // deadline range
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

    this.filteredOffers = rows;
  }

  // expand/collapse
  isExpanded(id: number): boolean {
    return this.expanded.has(id);
  }

  toggleExpanded(id: number): void {
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
  }

  isActive(o: OfferView): boolean {
    const open = o.status === 'OPEN';
    if (!o.deadline) return open;
    const d = new Date(o.deadline);
    if (isNaN(d.getTime())) return open;
    const eod = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23,
      59,
      59,
      999
    ).getTime();
    return open && eod >= Date.now();
  }

  canApply(o: OfferView): boolean {
    return this.isStudent && this.isActive(o) && !this.hasApplied(o);
  }

  // Teachers/CHEF-option cannot recommend when CLOSED
  canRecommend(o: OfferView): boolean {
    const teacher = this.role === 'TEACHER' || this.role === 'CHEF-OPTION';
    return teacher && o.status === 'OPEN';
  }

  seatsOf(o: OfferView): number | null {
    return typeof o.seats === 'number'
      ? o.seats
      : typeof (o as any).availableSlots === 'number'
      ? (o as any).availableSlots
      : null;
  }

  dateOnly(iso: string | null | undefined): string {
    if (!iso) return '—';
    const s = String(iso);
    if (s.includes('T')) return s.split('T')[0];
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    return `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d
      .getDate()
      .toString()
      .padStart(2, '0')}`;
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

  fmt01(n?: number) {
    return n == null ? '—' : n.toFixed(2);
  }

  trackById = (_: number, o: OfferView) => o.id;
  trackByIndex = (i: number) => i;

  hasApplied(o: { id: number }): boolean {
    return this.appliedByOfferId.has(o.id);
  }

  apply(o: OfferView) {
    if (!this.canApply(o)) return;
    this.router.navigate(['/pages/student/apply', o.id]);
  }

  consult(o: OfferView) {
    if (!this.hasApplied(o)) return;
    this.router.navigate(['/pages/student/application', o.id, 'process']);
  }

  recommend(o: OfferView) {
    if (!this.canRecommend(o)) return;
    this.router.navigate(['/pages/teacher/recommend', o.id]);
  }
}
