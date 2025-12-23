import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { OfferService, OfferView } from '@/core/services/offer.service';
import { StudentService, StudentSelfView } from '@/core/services/student.service';

import { FluidModule } from 'primeng/fluid';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

type OfferStatus = 'OPEN' | 'CLOSED';

@Component({
  selector: 'app-apply-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    FluidModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
  styles: [`
    .page { display:flex; justify-content:center; padding:.5rem; }
    .shell { width:100%; max-width:720px; margin:0 auto; }

    .card-title {
      display:flex; justify-content:space-between; align-items:flex-start;
      flex-wrap:wrap; gap:.5rem;
    }
    .title { font-weight:700; font-size:1.25rem; line-height:1.2; }

    .meta-line {
      font-size:.9rem;
      color:var(--text-color-secondary);
      line-height:1.4;
    }

    .status-pill{
      font-size:.8rem;
      padding:.2rem .5rem;
      border-radius:9999px;
      background:var(--surface-200);
      color:var(--text-color);
      font-weight:600;
      margin-right:.5rem;
    }

    .group { display:flex; flex-direction:column; gap:1rem; margin-top:1rem; }
    .field { display:flex; flex-direction:column; gap:.4rem; }
    .label { font-size:1rem; font-weight:600; color:var(--text-color); }
    .ctrl  { width:100%; font-size:1rem; }

    .footer-actions{
      display:flex;
      justify-content:flex-end;
      margin-top:1rem;
      gap:.5rem;
      flex-wrap:wrap;
    }

    :host ::ng-deep .p-inputtext {
      font-size:1rem;
      padding:.8rem .75rem;
    }

    :host ::ng-deep .p-card .p-card-body { padding:1rem 1.25rem; }
    :host ::ng-deep .p-card .p-card-title { font-size:1.25rem; }

    /* Offer header block (image + info) */
    .offer-header {
      display:flex;
      flex-direction:row;
      gap:1rem;
      margin-bottom:1rem;
      margin-top:.5rem;
    }
    .offer-header-img {
      width:180px;
      min-width:180px;
      height:110px;
      border-radius:.5rem;
      overflow:hidden;
      background:var(--surface-100);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:.8rem;
      color:var(--text-color-secondary);
    }
    .offer-header-img img{
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
    }
    .offer-header-meta{
      flex:1;
      display:flex;
      flex-direction:column;
      gap:.35rem;
    }
    .offer-tag-row{
      display:flex;
      flex-wrap:wrap;
      gap:.4rem;
      font-size:.8rem;
    }
    .offer-desc{
      font-size:.9rem;
      color:var(--text-color-secondary);
    }
  `],
  template: `
<p-fluid>
  <div class="page bg-surface-50 dark:bg-surface-950">
    <div class="shell">
      <p-card>
        <ng-template pTemplate="title">
          <div class="card-title">
            <div>
              <div class="title">{{ offer()?.title || 'Application' }}</div>

              <div class="meta-line" *ngIf="offer()">
                University: {{ offer()?.universityName }} ·
                Seats: {{ offer()?.seats ?? '—' }} ·
                Deadline: {{ deadline(offer()?.deadline) }}
              </div>

              <div class="meta-line">
                <!-- OFFER STATUS (same logic, just display pill) -->
                <span class="status-pill"
                      [ngStyle]="{background: offerActive() ? '#dcfce7' : '#fee2e2', color: offerActive() ? '#166534' : '#991b1b'}">
                  {{ offerActive() ? 'Open' : 'Closed' }}
                </span>

                <!-- APPLICATION STATUS: now dynamic from backend -->
                <ng-container *ngIf="alreadyApplied()">
                  <span class="status-pill">
                    {{ appStatus() }}
                  </span>

                  <span class="status-pill" *ngIf="finalScore() !== 0">
                    Score: {{ finalScore() | number:'1.0-2' }}
                  </span>
                </ng-container>
              </div>
            </div>
          </div>
        </ng-template>

        <!-- Show loading skeleton until both offer + me are ready -->
        <ng-container *ngIf="ready(); else loading">

          <!-- ===== Offer header block (image + tags) ===== -->
          <div class="offer-header" *ngIf="offer() as o">
            <div class="offer-header-img">
              <img *ngIf="o.imageUrl"
                   [src]="o.imageUrl"
                   (error)="onOfferImgError($event)"
                   alt="offer image" />
              <span *ngIf="!o.imageUrl">No image</span>
            </div>

            <div class="offer-header-meta">
              <div class="offer-desc">
                {{ o.description }}
              </div>

              <div class="offer-tag-row">
                <span class="status-pill">
                  {{ o.type }}
                </span>
                <span class="status-pill">
                  {{ o.status }}
                </span>
              </div>

              <div class="meta-line" *ngIf="o.topicTags?.length">
                Topics:
                {{ (o.topicTags || []).join(', ') }}
              </div>

              <div class="meta-line" *ngIf="o.requiredDocs?.length">
                Required docs:
                {{ (o.requiredDocs || []).join(', ') }}
              </div>
            </div>
          </div>

          <!-- IF ALREADY APPLIED -->
          <div *ngIf="alreadyApplied(); else newAppForm" class="group">
            <div class="field">
              <div class="label">Your final score snapshot</div>
              <div class="p-inputtext p-component ctrl"
                   style="background:var(--surface-100);border:1px solid var(--surface-300);cursor:not-allowed;">
                {{ finalScore() | number:'1.0-3' }}
              </div>
            </div>

            <div class="footer-actions">
              <button pButton
                      label="Back to offers"
                      icon="pi pi-arrow-left"
                      class="p-button-secondary"
                      (click)="backToOffers()"></button>
            </div>
          </div>

          <!-- IF NOT APPLIED YET -->
          <ng-template #newAppForm>
            <form [formGroup]="form" class="group">
              <!-- Render inputs in the SAME order as offer.formJson.fields -->
              <div class="field" *ngFor="let q of questionList(); trackBy: trackByIndex">
                <div class="label">{{ q }}</div>
                <input
                  pInputText
                  class="ctrl"
                  [readonly]="!offerActive()"
                  [formControlName]="ctrlName(q)"
                />
              </div>

              <div class="footer-actions">
                <button pButton
                        type="button"
                        label="Cancel"
                        icon="pi pi-times"
                        class="p-button-secondary"
                        (click)="backToOffers()"></button>

                <button pButton
                        type="button"
                        label="Submit application"
                        icon="pi pi-check"
                        class="p-button-success"
                        [disabled]="busy() || form.invalid || !offerActive()"
                        (click)="onSubmit()"></button>
              </div>
            </form>
          </ng-template>
        </ng-container>

        <ng-template #loading>
          <div class="group">
            <div class="label">Loading application…</div>
          </div>
        </ng-template>

      </p-card>
    </div>
  </div>
</p-fluid>

<p-toast></p-toast>
  `
})
export class ApplyPageComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private offers  = inject(OfferService);
  private student = inject(StudentService);
  private toast   = inject(MessageService);
  private fb      = inject(FormBuilder);

  offer   = signal<OfferView | null>(null);
  me      = signal<StudentSelfView | null>(null);
  myApp   = signal<any | null>(null); // { applicationId, status, finalScore } | null

  form: FormGroup = this.fb.group({});
  busy = signal(false);

  // derived flags
  alreadyApplied = computed(() => !!this.myApp());
  appStatus      = computed(() => this.myApp()?.status ?? 'SUBMITTED');
  finalScore     = computed(() => this.myApp()?.finalScore ?? 0);

  // open = offer.status === 'OPEN' and deadline >= today
  offerActive = computed(() => {
    const o = this.offer();
    if (!o) return false;
    const open = (o as any).status === 'OPEN';
    if (!open) return false;
    if (!o.deadline) return false;
    const d = new Date(o.deadline);
    if (isNaN(d.getTime())) return open;
    const today = new Date(); today.setHours(0,0,0,0);
    const deadlineDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return open && deadlineDay.getTime() >= today.getTime();
  });

  // do not render form until offer + me are loaded
  ready = computed(() => !!this.offer() && !!this.me());

  ngOnInit(): void {
    const offerId = Number(this.route.snapshot.paramMap.get('offerId'));

    this.busy.set(true);

    forkJoin({
      offer: this.offers.getOffer(offerId),
      me:    this.student.getMe(),
      app:   this.offers.getMyApplicationForOffer(offerId).pipe(
               map(info => (info && info.status && info.status !== 'NONE') ? info : null),
               catchError(() => of(null))
             )
    }).subscribe({
      next: ({ offer, me, app }) => {
        this.offer.set(offer ?? null);
        this.me.set(me ?? null);
        this.myApp.set(app);

        // Build form from the offer schema and then prefill from student
        this.buildFormOnce();
        this.prefillAll();

        this.busy.set(false);
      },
      error: (e) => {
        console.error('init failed', e);
        this.offer.set(null);
        this.me.set(null);
        this.myApp.set(null);
        this.busy.set(false);
      }
    });
  }

  /** Build controls in the SAME order as offer.formJson.fields */
  private buildFormOnce() {
    const fields = this.questionList();
    const group: Record<string, any> = {};
    for (const q of fields) {
      const isMiddleName = q.trim().toLowerCase() === 'middle name';
      group[this.ctrlName(q)] = ['', isMiddleName ? [] : [Validators.required]];
    }
    this.form = this.fb.group(group);
  }

  /** Patch student data into matching fields after both offer + me are ready */
  private prefillAll() {
    const s = this.me();
    if (!s) return;

    this.prefillIfPresent('Esprit ID',               (s as any).studentIdentifier);
    this.prefillIfPresent('First Name',              (s as any).firstName);
    this.prefillIfPresent('Middle Name',             (s as any).middleName || '');
    this.prefillIfPresent('Last Name',               (s as any).lastName);
    this.prefillIfPresent('Email',                   (s as any).email);
    this.prefillIfPresent('Email (esprit.tn)',       (s as any).email);
    this.prefillIfPresent('Email (personal)',        (s as any).emailPersonnel || (s as any).emailPersonel || '');
    this.prefillIfPresent('Phone Number',            (s as any).personnelPhoneNumber || '');  // ✅ FIXED HERE
    this.prefillIfPresent('Civility',                (s as any).maritalStatus || '');

    const programStr = this.formatProgram(s as any);
    this.prefillIfPresent('Program / Class',         programStr);
    this.prefillIfPresent('Program',                 programStr);
    this.prefillIfPresent('Class',                   (s as any).currentClass || programStr);

    const gradesSnapshot = this.formatGrades(s as any);
    this.prefillIfPresent('Grades snapshot', gradesSnapshot);

    if ((s as any).firstYearGrade  != null)
      this.prefillIfPresent('Grade – 1st Year (main session)', String((s as any).firstYearGrade));
    if ((s as any).secondYearGrade != null)
      this.prefillIfPresent('Grade – 2nd Year (main session)', String((s as any).secondYearGrade));
    if ((s as any).thirdYearGrade  != null)
      this.prefillIfPresent('Grade – 3rd Year (main session)', String((s as any).thirdYearGrade));
    if ((s as any).fourthYearGrade != null)
      this.prefillIfPresent('Grade – 4th Year (main session)', String((s as any).fourthYearGrade));
    if ((s as any).fifthYearGrade  != null)
      this.prefillIfPresent('Grade – 5th Year (main session)', String((s as any).fifthYearGrade));
  }

  /**
   * Helper: set value in form control matching that label,
   * IF that label exists in offer.formJson.fields
   */
  private prefillIfPresent(label: string, value: any) {
    if (value === undefined || value === null) return;
    const ctrl = this.form.get(this.ctrlName(label));
    if (!ctrl) return;
    ctrl.setValue(String(value));
  }

  // --- mapping helpers ----

  questionList(): string[] {
    const f = this.offer()?.formJson?.fields;
    return Array.isArray(f) ? f : [];
  }

  ctrlName(q: string): string {
    return q.toLowerCase()
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_|_$/g,'');
  }

  deadline(iso: string | null | undefined): string {
    if (!iso) return '—';
    const s = String(iso);
    if (s.includes('T')) return s.split('T')[0];
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const da = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${da}`;
  }

  formatProgram(s: any): string {
    const bits: string[] = [];
    if (s.field)        bits.push(String(s.field));
    if (s.optionCode)   bits.push(String(s.optionCode));
    if (s.currentClass) bits.push(`Class ${String(s.currentClass)}`);
    return bits.join(' · ');
  }

  formatGrades(s: any): string {
    const parts: string[] = [];
    if (s.firstYearGrade  != null) parts.push(`Y1:${s.firstYearGrade}`);
    if (s.secondYearGrade != null) parts.push(`Y2:${s.secondYearGrade}`);
    if (s.thirdYearGrade  != null) parts.push(`Y3:${s.thirdYearGrade}`);
    if (s.fourthYearGrade != null) parts.push(`Y4:${s.fourthYearGrade}`);
    if (s.fifthYearGrade  != null) parts.push(`Y5:${s.fifthYearGrade}`);
    return parts.join(' | ');
  }

  // --- submit ----
  onSubmit() {
    if (!this.offerActive()) {
      this.toast.add({
        severity:'error',
        summary:'Closed',
        detail:'Deadline passed or offer closed.'
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);

    const offerId = Number(this.route.snapshot.paramMap.get('offerId'));
    const answers: Record<string, string> = {};
    for (const q of this.questionList()) {
      answers[q] = this.form.get(this.ctrlName(q))?.value ?? '';
    }

    this.offers.submitApplication(offerId, answers).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.myApp.set({
          applicationId: res.applicationId,
          status:        res.status,
          finalScore:    res.finalScore
        });
        this.toast.add({ severity:'success', summary:'Application sent', detail:'Good luck!' });
      },
      error: (err) => {
        this.busy.set(false);
        const detail =
          err?.error?.message ||
          err?.error?.error ||
          err.message ||
          'Failed';
        this.toast.add({ severity:'error', summary:'Cannot submit', detail });
      }
    });
  }

  backToOffers() { history.back(); }

  trackByIndex(i:number){ return i; }

  onOfferImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = '';
  }
}
