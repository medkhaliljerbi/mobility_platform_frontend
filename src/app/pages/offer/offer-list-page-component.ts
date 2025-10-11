import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

    /* grey separators like UI kit */
    .item{
      display:flex; flex-direction:column; gap:1rem; padding:1rem;
      background:var(--surface-0);
    }
    .item + .item{ border-top:1px solid var(--surface-300, #e5e7eb); }

    .line{ display:flex; gap:1rem; align-items:flex-start; }
    .thumb{
      width:140px; min-width:140px; aspect-ratio:16/9;
      border-radius:.5rem; overflow:hidden; background:var(--surface-100);
    }
    .thumb img{ width:100%; height:100%; object-fit:cover; display:block; }

    .meta{ display:flex; flex-direction:column; gap:.5rem; flex:1; }
    .title{ font-weight:700; font-size:1.125rem; letter-spacing:.2px; }
    .desc{ color:var(--text-color-secondary); line-height:1.35; }

    .right{ margin-left:auto; display:flex; align-items:center; gap:.5rem; white-space:nowrap; }
    .dot{ width:12px; height:12px; border-radius:50%; }
    .dot.open{ background:#22c55e; }   /* green */
    .dot.closed{ background:#ef4444; } /* red   */

    .bottom{ display:flex; justify-content:flex-end; margin-top:.25rem; }
    .chev{ border:none; background:transparent; cursor:pointer; border-radius:.5rem; padding:.35rem; }
    .chev:hover{ background:var(--surface-100); }

    /* slide-down content */
    .exp{
      overflow:hidden;
      max-height:0;
      opacity:0;
      transition:max-height .28s ease, opacity .2s ease;
      border-top:1px dashed var(--surface-200, #eee);
      margin-top:.25rem;
    }
    .exp.show{ max-height:540px; opacity:1; }

    .exp-inner{
      padding:1rem .5rem .75rem .5rem;
      color:var(--text-color);
      position:relative;
    }

    /* mini section headings + separators inside panel */
    .block + .block{ border-top:1px solid var(--surface-200, #eee); margin-top:.75rem; padding-top:.75rem; }
    .block-title{ font-size:.9rem; font-weight:600; color:var(--text-color-secondary); margin-bottom:.5rem; }

    /* chips (read-only) */
    .chips{ display:flex; flex-wrap:wrap; gap:.4rem; }
    .chip{
      display:inline-flex; align-items:center; gap:.35rem;
      padding:.2rem .55rem; border-radius:9999px;
      background:var(--surface-200); font-size:.85rem;
    }

    .panel-actions{
      display:flex; gap:.5rem;
      position:absolute; right:.5rem; bottom:.5rem;
    }

    @media (max-width:640px){
      .line{ flex-direction:column; }
      .right{ margin-left:0; }
      .panel-actions{ position:static; justify-content:flex-end; margin-top:.75rem; }
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
                <img [src]="o.imageUrl || placeholder" [alt]="o.title" />
              </div>

              <div class="meta">
                <div class="title">{{ o.title }}</div>
                <div class="desc">{{ o.description }}</div>
              </div>

              <div class="right">
                <span class="closing">{{ o.deadline || '—' }}</span>
                <span class="dot" [ngClass]="{ open: o.status==='OPEN', closed: o.status==='CLOSED' }"></span>
              </div>
            </div>

            <div class="bottom">
              <button class="chev" (click)="o['expanded'] = !o['expanded']" [attr.aria-expanded]="!!o['expanded']">
                <i class="pi" [ngClass]="o['expanded'] ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
              </button>
            </div>

            <!-- slide-down panel -->
            <div class="exp" [class.show]="o['expanded']">
              <div class="exp-inner">
                <!-- Required information (form_json.fields) -->
                <div class="block" *ngIf="(o.formJson?.fields?.length || 0) > 0">
                  <div class="block-title">Required Information</div>
                  <div class="chips">
                    <span class="chip" *ngFor="let f of (o.formJson?.fields || []); trackBy: trackByIndex">
                      {{ f }}
                    </span>
                  </div>
                </div>

                <!-- Topic tags -->
                <div class="block" *ngIf="(o.topicTags?.length || 0) > 0">
                  <div class="block-title">Topic Tags</div>
                  <div class="chips">
                    <span class="chip" *ngFor="let t of (o.topicTags || []); trackBy: trackByIndex">{{ t }}</span>
                  </div>
                </div>

                <!-- Required documents -->
                <div class="block" *ngIf="(o.requiredDocs?.length || 0) > 0">
                  <div class="block-title">Required Documents</div>
                  <div class="chips">
                    <span class="chip" *ngFor="let d of (o.requiredDocs || []); trackBy: trackByIndex">{{ d }}</span>
                  </div>
                </div>

                <!-- actions -->
                <div class="panel-actions">
                  <p-button label="Update" icon="pi pi-pencil" (onClick)="updateItem(o)"></p-button>
                  <p-button label="Delete" icon="pi pi-trash" severity="danger" (onClick)="deleteItem(o)"></p-button>
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
  placeholder = 'https://via.placeholder.com/640x360?text=Offer+Image';

  constructor(private offerService: OfferService) {}

  ngOnInit(): void {
    this.offerService.getAllOffers().subscribe({
      next: (rows) => this.offers = rows ?? [],
      error: (e) => { console.error('Failed to load offers', e); this.offers = []; }
    });
  }

  trackById = (_: number, o: OfferView) => o.id;
  trackByIndex = (i: number) => i;

  updateItem(o: OfferView){ console.log('update', o); }
  deleteItem(o: OfferView){ console.log('delete', o); }
}
