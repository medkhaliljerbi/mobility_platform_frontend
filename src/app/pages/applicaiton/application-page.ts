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
                <span class="status-pill"
                      [ngStyle]="{background: offerActive() ? '#dcfce7' : '#fee2e2', color: offerActive() ? '#166534' : '#991b1b'}">
                  {{ offerActive() ? 'Open' : 'Closed' }}
                </span>

                <ng-container *ngIf="alreadyApplied()">
                  <span class="status-pill">Submitted</span>
                  <span class="status-pill">Score: {{ finalScore() | number:'1.0-2' }}</span>
                </ng-container>
              </div>
            </div>
          </div>
        </ng-template>

        <!-- IF ALREADY APPLIED -->
        <div *ngIf="alreadyApplied(); else newAppForm" class="group">
          <div class="field">
            <div class="label">Your final score snapshot</div>
            <div class="p-inputtext p-component ctrl" style="background:var(--surface-100);border:1px solid var(--surface-300);cursor:not-allowed;">
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

  ngOnInit(): void {
    const offerId = Number(this.route.snapshot.paramMap.get('offerId'));

    // step 1: load offer
    this.offers.getOffer(offerId).subscribe({
      next: (o) => {
        this.offer.set(o || null);
        this.tryBuildAndPrefill(); // but we also need student data
      },
      error: (e) => { console.error('failed to load offer', e); this.offer.set(null); }
    });

    // step 2: load student
    this.student.getMe().subscribe({
      next: (info) => {
        this.me.set(info || null);
        this.tryBuildAndPrefill(); // once we have both we can prefill
      },
      error: (e) => { console.warn('getMe failed', e); this.me.set(null); }
    });

    // step 3: load my app status
    this.offers.getMyApplicationForOffer(offerId).subscribe({
      next: (info) => {
        if (info && info.status && info.status !== 'NONE') {
          this.myApp.set(info);
        } else {
          this.myApp.set(null);
        }
      },
      error: (e) => { console.warn('getMyApplicationForOffer failed', e); this.myApp.set(null); }
    });
  }

  /**
   * Build form controls (from offer.formJson.fields)
   * then patch values from student profile into the matching fields.
   * We call this after we (might) have offer + me.
   */
  private tryBuildAndPrefill() {
    const o = this.offer();
    const s = this.me();
    if (!o || !s) return; // wait until both are loaded in this run

    const fields = this.questionList(); // ordered list of string labels from offer
    const group: Record<string, any> = {};

    for (const q of fields) {
      const isMiddleName =
        q.trim().toLowerCase() === 'middle name';
      group[this.ctrlName(q)] = [
        '',                                // initial value (we'll patch after)
        isMiddleName ? [] : [Validators.required]
      ];
    }

    this.form = this.fb.group(group);

    // now prefill each known field with backend data
    this.prefillIfPresent('Esprit ID',               s.studentIdentifier);
    this.prefillIfPresent('First Name',              s.firstName);
    this.prefillIfPresent('Middle Name',             (s as any).middleName || '');
    this.prefillIfPresent('Last Name',               s.lastName);
    this.prefillIfPresent('Email',                   s.email);
    this.prefillIfPresent('Email (esprit.tn)',       s.email);
    this.prefillIfPresent('Email (personal)',        (s as any).emailPersonnel || (s as any).emailPersonel || '');
    this.prefillIfPresent('Phone Number',            (s as any).personnelPhoneNumber || (s as any).Personnel_PhoneNumber || '');
    this.prefillIfPresent('Civility',                (s as any).maritalStatus || '');

    // Program/Class stuff (depends on how you named it in formJson)
    const programStr = this.formatProgram(s);
    this.prefillIfPresent('Program / Class',         programStr);
    this.prefillIfPresent('Program',                 programStr);
    this.prefillIfPresent('Class',                   s.currentClass || programStr);

    // Grades snapshot can appear as a combined field OR per-year lines
    const gradesSnapshot = this.formatGrades(s);
    this.prefillIfPresent('Grades snapshot', gradesSnapshot);

    // Also patch per-year grade fields individually if they exist:
    if (s.firstYearGrade  != null)
      this.prefillIfPresent('Grade – 1st Year (main session)', String(s.firstYearGrade));
    if (s.secondYearGrade != null)
      this.prefillIfPresent('Grade – 2nd Year (main session)', String(s.secondYearGrade));
    if (s.thirdYearGrade  != null)
      this.prefillIfPresent('Grade – 3rd Year (main session)', String(s.thirdYearGrade));
    if (s.fourthYearGrade != null)
      this.prefillIfPresent('Grade – 4th Year (main session)', String(s.fourthYearGrade));
    if ((s as any).fifthYearGrade != null)
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
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  }

  formatProgram(s: StudentSelfView): string {
    // try to reconstruct what you showed in screenshot:
    // "TELECOM - IOSYS · Class 4TH" style
    const bits: string[] = [];
    if ((s as any).field)        bits.push(String((s as any).field));
    if ((s as any).optionCode)   bits.push(String((s as any).optionCode));
    if ((s as any).currentClass) bits.push(`Class ${String((s as any).currentClass)}`);
    return bits.join(' · ');
  }

  formatGrades(s: StudentSelfView): string {
    const parts: string[] = [];
    if ((s as any).firstYearGrade  != null) parts.push(`Y1:${(s as any).firstYearGrade}`);
    if ((s as any).secondYearGrade != null) parts.push(`Y2:${(s as any).secondYearGrade}`);
    if ((s as any).thirdYearGrade  != null) parts.push(`Y3:${(s as any).thirdYearGrade}`);
    if ((s as any).fourthYearGrade != null) parts.push(`Y4:${(s as any).fourthYearGrade}`);
    if ((s as any).fifthYearGrade  != null) parts.push(`Y5:${(s as any).fifthYearGrade}`);
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

  backToOffers() {
    history.back();
  }

  trackByIndex(i:number){ return i; }
}
