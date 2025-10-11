import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { OfferService, OfferView } from '@/core/services/offer.service';

type OfferStatus = 'OPEN' | 'CLOSED';

@Component({
  selector: 'app-offer-list',
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

    .meta-chips{ display:flex; gap:1rem; flex-wrap:wrap; margin-top:.25rem; }
    .chip{ color:var(--text-color-secondary); }
    .chip strong{ color:var(--text-color); }

    .right{
      margin-left:auto; align-self:flex-start;
      display:flex; align-items:center; justify-content:center;
      width:24px; min-width:24px;
    }
    .dot{ width:12px; height:12px; border-radius:50%; }
    .dot.open{ background:#22c55e; }
    .dot.closed{ background:#ef4444; }

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

    /* bottom-right actions row */
    .panel-actions{
      margin-top:1rem;
      display:flex;
      gap:.5rem;
      justify-content:flex-end;
      position:relative; /* anchor for local popup */
    }

    /* local confirmation card */
    .confirm-pop{
      position:absolute;
      right:0;
      bottom:2.75rem; /* appears above the buttons */
      width:260px;
      background:var(--surface-0);
      border:1px solid var(--surface-300, #e5e7eb);
      box-shadow:0 6px 18px rgba(0,0,0,.08);
      border-radius:.5rem;
      padding:.75rem;
      z-index:10;
    }
    .confirm-title{ font-weight:600; margin-bottom:.35rem; }
    .confirm-actions{ display:flex; gap:.5rem; justify-content:flex-end; margin-top:.5rem; }
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

    <p-dataview [value]="offers" layout="list">
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

                <div class="meta-chips">
                  <span class="chip">Seats: <strong>{{ seatsOf(o) ?? '—' }}</strong></span>
                  <span class="chip">Deadline: <strong>{{ dateOnly(o.deadline) }}</strong></span>
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
                <div class="block" *ngIf="(o.formJson?.fields?.length || 0) > 0">
                  <div class="block-title">Required Information</div>
                  <div class="chips">
                    <span class="chip-pill" *ngFor="let f of (o.formJson?.fields || []); trackBy: trackByIndex">{{ f }}</span>
                  </div>
                </div>

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

                <!-- Bottom-right buttons -->
                <div class="panel-actions">
                  <!-- inline confirm -->
                  <div class="confirm-pop" *ngIf="o['_askDelete']">
                    <div class="confirm-title">Delete offer?</div>
                    <div class="text-color-secondary text-sm">{{ o.title }}</div>
                    <div class="confirm-actions">
                      <p-button label="Cancel" (onClick)="cancelAsk(o)" [text]="true"></p-button>
                      <p-button label="Delete" icon="pi pi-trash" severity="danger" (onClick)="confirmDelete(o)"></p-button>
                    </div>
                  </div>

                  <p-button label="Update" icon="pi pi-pencil" (onClick)="updateItem(o)"></p-button>
                  <p-button label="Delete" icon="pi pi-trash" severity="danger" (onClick)="askDelete(o)"></p-button>
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
export class OfferListComponent implements OnInit {
  offers: OfferView[] = [];
  placeholder = 'https://via.placeholder.com/800x450?text=Offer+Image';

  constructor(private offerService: OfferService, private router: Router) {}

  ngOnInit(): void {
    this.offerService.getAllOffers().subscribe({
      next: (rows) => this.offers = rows ?? [],
      error: (e) => { console.error('Failed to load offers', e); this.offers = []; }
    });
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

  /** green if status OPEN and deadline not passed; red otherwise */
  isActive(o: OfferView): boolean {
    const status: OfferStatus = (o as any).status;
    const open = status === 'OPEN';
    const s = o.deadline;
    if (!s) return false;
    const d = new Date(s);
    if (isNaN(d.getTime())) return open;
    const norm = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const due = norm(d) < norm(new Date());
    return open && !due;
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

  /* ----- actions ----- */

  updateItem(o: OfferView){
    this.router.navigate(['/pages/offer/update', o.id]);
  }

  /** show local inline confirmation */
  askDelete(o: OfferView){
    (o as any)['_askDelete'] = true;
  }

  cancelAsk(o: OfferView){
    (o as any)['_askDelete'] = false;
  }

  confirmDelete(o: OfferView){
    this.offerService.deleteOffer(o.id).subscribe({
      next: () => {
        this.offers = this.offers.filter(x => x.id !== o.id);
      },
      error: (e) => {
        // fallback inline error; no alert()
        console.error('Failed to delete', e);
        (o as any)['_askDelete'] = false;
      }
    });
  }
}
