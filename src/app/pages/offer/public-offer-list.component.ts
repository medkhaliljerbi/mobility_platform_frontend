import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import {
  OfferService,
  OfferView,
  RecommendationItem
} from '@/core/services/offer.service';
import { AuthService } from '@/core/services/auth.service';

type OfferStatus = 'OPEN' | 'CLOSED';
type Role =
  | 'STUDENT'
  | 'ENTRANT'
  | 'TEACHER'
  | 'CHEF'
  | 'MOBILITY_AGENT'
  | 'ADMIN'
  | 'UNKNOWN';

type HydratedRecommendation = OfferView & RecommendationItem;

@Component({
  selector: 'app-public-offer-list',
  standalone: true,
  imports: [CommonModule, DataViewModule, ButtonModule],
  styles: [`
    :host ::ng-deep .p-dataview-content { overflow: visible; }

    .list-card{ position:relative; }
    .row{ display:flex; flex-direction:column; }

    .item{
      display:flex; flex-direction:column; gap:1rem; padding:1rem;
      background:var(--surface-0);
    }
    .item + .item{ border-top:1px solid var(--surface-300, #e5e7eb); }

    .top-matches{
      padding:1rem;
      margin-bottom:1.5rem;
    }

    .top-title{
      font-weight:700;
      margin-bottom:.75rem;
      font-size:1rem;
    }

    .top-item{
      padding:1rem;
      display:flex;
      flex-direction:column;
      gap:1rem;
    }
    .top-item + .top-item{
      border-top:1px solid var(--surface-300, #d1d5db);
      margin-top:1rem;
      padding-top:1rem;
    }

    .line{ display:flex; gap:1rem; align-items:flex-start; }

    .thumb{
      width:200px; min-width:200px; aspect-ratio:16/9;
      border-radius:.5rem; overflow:hidden; background:var(--surface-100);
    }
    .thumb img{ width:100%; height:100%; object-fit:cover; display:block; }

    .meta{
      display:flex; flex-direction:column; gap:.5rem; flex:1; min-width:0;
      padding-right:2.5rem;
    }
    .title{ font-weight:700; font-size:1.125rem; letter-spacing:.2px; }
    .desc{ color:var(--text-color-secondary); line-height:1.35; }

    .scores { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; font-size:.875rem; }
    .score-pill{
      font-size:.8rem; padding:.2rem .5rem; border-radius:9999px;
      background:var(--surface-200); color:var(--text-color);
    }

    .right{
      margin-left:auto; align-self:flex-start;
      display:flex; align-items:center; justify-content:center;
      width:24px; min-width:24px;
    }
    .dot{ width:12px; height:12px; border-radius:50%; }
    .dot.open{ background:#22c55e; }
    .dot.closed{ background:#ef4444; }

    .meta-chips{ display:flex; gap:1rem; flex-wrap:wrap; margin-top:.25rem; }
    .chip{ color:var(--text-color-secondary); font-size:.9rem; }
    .chip strong{ color:var(--text-color); }

    .bottom{ display:flex; justify-content:flex-end; margin-top:.25rem; }
    .chev{ border:none; background:transparent; cursor:pointer; border-radius:.5rem; padding:.35rem; }
    .chev:hover{ background:var(--surface-100); }

    .exp{
      overflow:hidden; max-height:0; opacity:0;
      transition:max-height .28s ease, opacity .2s ease;
      border-top:1px dashed var(--surface-200, #eee);
      margin-top:.25rem;
    }
    .exp.show{ max-height:540px; opacity:1; }

    .exp-inner{ padding:1rem .5rem 1rem .5rem; position:relative; }

    .block + .block{ border-top:1px solid var(--surface-200, #eee); margin-top:.75rem; padding-top:.75rem; }
    .block-title{ font-size:.9rem; font-weight:600; color:var(--text-color-secondary); margin-bottom:.5rem; }

    .chips{ display:flex; flex-wrap:wrap; gap:.4rem; }
    .chip-pill{
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.2rem .55rem; border-radius:9999px; background:var(--surface-200); font-size:.85rem;
    }

    .panel-actions{
      margin-top:1rem;
      display:flex;
      gap:.5rem;
      justify-content:flex-end;
      position:relative;
    }

    .section-line{
      border:0;
      border-top:3px solid var(--surface-400, #6b7280);
      margin:1rem 0 1.5rem 0;
    }
  `],
  template: `
  <div class="card list-card">
    <div class="text-3xl font-bold mb-4">Offers</div>

    <!-- TOP 3 MATCHES (only for non-Entrant students) -->
    <div class="top-matches" *ngIf="isScoreEnabled && topMatches.length > 0">
      <div class="top-title">Top matches for you</div>

      <div class="row">
        <div class="top-item" *ngFor="let o of topMatches; trackBy: trackById">
          <div class="line">
            <div class="thumb">
              <img [src]="o.imageUrl || placeholder" [alt]="o.title" (error)="onImgError($event)" />
            </div>

            <div class="meta">
              <div class="title">{{ o.title }}</div>
              <div class="desc">{{ o.description }}</div>

              <div class="scores">
                <span>Match: {{ (o.recoScore ?? 0) | number:'1.0-2' }}</span>
                <span>Certificates: {{ (o.certScore ?? 0) | number:'1.0-2' }}</span>
                <span>Grades: {{ (o.gradeScore ?? 0) | number:'1.0-2' }}</span>
              </div>
            </div>

            <div class="right">
              <span class="dot" [ngClass]="{ open: isActive(o), closed: !isActive(o) }"></span>
            </div>
          </div>

          <div class="panel-actions">
            <p-button
              *ngIf="canApply(o)"
              label="Apply"
              icon="pi pi-send"
              (onClick)="apply(o)">
            </p-button>
          </div>
        </div>
      </div>
    </div>

    <hr class="section-line" *ngIf="isScoreEnabled && topMatches.length > 0" />
    <div class="top-title">All Offers</div>

    <!-- FULL LIST -->
    <p-dataview [value]="filteredOffers" layout="list">
      <ng-template let-items #list>
        <div class="row">
          <div class="item" *ngFor="let o of items; trackBy: trackById">
            <div class="line">
              <div class="thumb">
                <img [src]="o.imageUrl || placeholder" [alt]="o.title" (error)="onImgError($event)" />
              </div>

              <div class="meta">
                <div class="title">{{ o.title }}</div>
                <div class="desc">{{ o.description }}</div>
                <div class="Target year">{{ o.targetYear }} Year students</div>
                <div class="meta-chips">
                  <span class="chip">Seats: <strong>{{ seatsOf(o) ?? '—' }}</strong></span>
                  <span class="chip">Deadline: <strong>{{ dateOnly(o.deadline) }}</strong></span>
                  <span class="chip" *ngIf="o.universityName">University: <strong>{{ o.universityName }}</strong></span>
                  <span class="chip" *ngIf="o.countryCode">Country: <strong>{{ o.countryCode }}</strong></span>
                </div>
              </div>

              <div class="right">
                <span class="dot" [ngClass]="{ open: isActive(o), closed: !isActive(o) }"></span>
              </div>
            </div>

            <div class="bottom">
              <button class="chev" (click)="o['expanded'] = !o['expanded']" [attr.aria-expanded]="!!o['expanded']">
                <i class="pi" [ngClass]="o['expanded'] ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
              </button>
            </div>

            <div class="exp" [class.show]="o['expanded']">
              <div class="exp-inner">
                <div class="block" *ngIf="(o.topicTags?.length || 0) > 0">
                  <div class="block-title">Topic Tags</div>
                  <div class="chips">
                    <span class="chip-pill" *ngFor="let t of (o.topicTags || []); trackBy: trackByIndex">{{ t }}</span>
                  </div>
                </div>

                <div class="block" *ngIf="(o.requiredDocs?.length || 0) > 0">
                  <div class="block-title">Required Documents</div>
                  <div class="chips">
                    <span class="chip-pill" *ngFor="let d of (o.requiredDocs || []); trackBy: trackByIndex">{{ d }}</span>
                  </div>
                </div>

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

                <div class="panel-actions">
                  <p-button
                    *ngIf="canApply(o)"
                    label="Apply"
                    icon="pi pi-send"
                    (onClick)="apply(o)">
                  </p-button>

                  <p-button
                    *ngIf="canRecommend()"
                    label="Recommend"
                    icon="pi pi-lightbulb"
                    (onClick)="recommend(o)">
                  </p-button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </ng-template>
    </p-dataview>
  </div>
  `
})
export class PublicOfferListComponent implements OnInit {
  offers: OfferView[] = [];
  filteredOffers: OfferView[] = [];   // <-- filtered list for the view
  topMatches: HydratedRecommendation[] = [];
  placeholder = 'https://via.placeholder.com/800x450?text=Offer+Image';

  role: Role = 'UNKNOWN';
  isStudent = false;
  isEntrant = false;
  isScoreEnabled = false; // non-entrant students only

  constructor(
    private offerService: OfferService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const roleRaw = (this.auth.currentRole() || 'UNKNOWN').toUpperCase();
    this.role = (['STUDENT','ENTRANT','TEACHER','CHEF','MOBILITY_AGENT','ADMIN'].includes(roleRaw)
      ? (roleRaw as Role)
      : 'UNKNOWN');

    this.isStudent = this.role === 'STUDENT';
    this.isEntrant = this.role === 'ENTRANT';
    this.isScoreEnabled = this.isStudent && !this.isEntrant;

    if (this.role === 'MOBILITY_AGENT') {
      this.router.navigate(['/pages/offer/list']);
      return;
    }

    this.offerService.getAllOffers().subscribe({
      next: (rows) => {
        this.offers = rows ?? [];
        this.applyEspritFilter();        // <-- apply after load
      },
      error: (e) => {
        console.error('Failed to load offers', e);
        this.offers = [];
        this.filteredOffers = [];
      }
    });

    // also apply early in case role gate matters before load completes
    this.applyEspritFilter();

    if (this.isScoreEnabled) {
      this.offerService.getOffersRankedByMyScore(20).subscribe({
        next: (rows) => this.topMatches = (rows ?? []).slice(0, 3),
        error: (e) => { console.warn('My-score unavailable', e); this.topMatches = []; }
      });
    }
  }

  // ---- esprit filter ----
  private applyEspritFilter() {
    // esprit flag may be boolean or undefined, so compare strictly for entrant case
    if (this.isEntrant) {
      this.filteredOffers = (this.offers ?? []).filter(o => (o as any).esprit === true);
    } else if (this.isStudent) {
      this.filteredOffers = (this.offers ?? []).filter(o => (o as any).esprit !== true);
    } else {
      this.filteredOffers = this.offers ?? [];
    }
  }

  seatsOf(o: OfferView): number | null {
    const v: any = (o as any);
    return (typeof v.seats === 'number') ? v.seats
         : (typeof v.availableSlots === 'number') ? v.availableSlots
         : null;
  }

  dateOnly(iso: string | null | undefined): string {
    if (!iso) return '—';
    const s = String(iso);
    if (s.includes('T')) return s.split('T')[0];
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    const y = d.getFullYear();
    const m = (d.getMonth()+1).toString().padStart(2,'0');
    const da = d.getDate().toString().padStart(2,'0');
    return `${y}-${m}-${da}`;
  }

  isActive(o: OfferView): boolean {
    const status: OfferStatus = (o as any).status;
    const open = status === 'OPEN';

    const s = o.deadline;
    if (!s) return false;

    const d = new Date(s);
    if (isNaN(d.getTime())) return open;

    const norm = (x: Date) =>
      new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const expired = norm(d) < norm(new Date());

    return open && !expired;
  }

  canApply(o: OfferView): boolean {
    const allowedRole = this.isStudent || this.isEntrant;
    return allowedRole && this.isActive(o);
  }

  canRecommend(): boolean {
    return this.role === 'TEACHER' || this.role === 'CHEF';
  }

  onImgError(ev: Event){
    (ev.target as HTMLImageElement).src =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              font-family="sans-serif" font-size="18" fill="#6b7280">No image</text>
      </svg>`);
  }

  trackById = (_: number, o: OfferView) => o.id;
  trackByIndex = (i: number) => i;

  apply(o: OfferView){
    if (!this.canApply(o)) return;
    this.router.navigate(['/pages/student/apply', o.id]);
  }

  recommend(o: OfferView){
    if (!this.canRecommend()) return;
    this.router.navigate(['/pages/teacher/recommend', o.id]);
  }
}
