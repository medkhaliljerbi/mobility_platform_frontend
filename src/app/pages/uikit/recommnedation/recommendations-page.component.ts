import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { HiringService } from '@/core/services/hiring.service';
import { AuthService } from '@/core/services/auth.service';
import { TeacherRecommendationView, StudentRecommendationView } from '@/core/dto/recommendation.dto';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';

type Role =
  | 'STUDENT'
  | 'TEACHER'
  | 'CHEF'
  | 'CHEF_OPTION'
  | 'MOBILITY_AGENT'
  | 'ADMIN'
  | 'UNKNOWN';

@Component({
  selector: 'app-recommendations-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  styles: [`
    /* GENERIC STATUS PILLS */
    .pill {
      display:inline-block;
      padding:4px 12px;
      border-radius:20px;
      font-size:0.85rem;
      font-weight:600;
      background:#f3f4f6;
      color:#374151;
    }

    .pill.submitted { color:#047857; background:#d1fae5; }
    .pill.preselected { color:#047857; background:#d1fae5; }
    .pill.waiting { color:#92400e; background:#fef3c7; }
    .pill.rejected { color:#b91c1c; background:#fee2e2; }

    /* OFFER PILL – white with thin black contour */
    .pill-link {
      display:inline-block;
      padding:4px 12px;
      border-radius:20px;
      background:#ffffff;
      border:1px solid #00000040; /* soft black outline */
      text-decoration:none;
      color:#111827;
      font-size:0.85rem;
      font-weight:600;
      transition:0.15s;
    }

    .pill-link:hover {
      background:#f9fafb;
      border-color:#00000080;
    }

    th {
      font-weight:700 !important;
      color:var(--text-color);
    }

    .green-btn {
      background:#22c55e !important;
      border:none !important;
      color:white !important;
      border-radius:8px !important;
      padding:0.45rem 1.2rem !important;
    }
  `],
  template: `
    <!-- BACK BUTTON -->
    <button
      pButton
      label="Back to offers"
      icon="pi pi-arrow-left"
      class="green-btn mb-4"
      (click)="goBack()">
    </button>

    <div class="font-semibold text-xl mb-4">Recommendations</div>

    <!-- DELETE BUTTON FOR TEACHERS -->
    <div class="mb-3" *ngIf="isTeacherLike">
      <button pButton label="Delete Selected"
              class="p-button-danger"
              icon="pi pi-trash"
              [disabled]="!selectedRows.length"
              (click)="deleteSelected()">
      </button>
    </div>

    <p-table
      #dt
      [value]="rows"
      dataKey="recommendationId"
      [rows]="10"
      [loading]="loading"
      [rowHover]="true"
      [showGridlines]="true"
      [paginator]="true"
      [selection]="selectedRows"
      (selectionChange)="selectedRows = $event"
      [globalFilterFields]="['name', 'email', 'offerTitle', 'applicationStatus']"
      responsiveLayout="scroll">

      <!-- FILTER HEADER -->
      <ng-template pTemplate="caption">
        <div class="flex justify-between items-center">
          <button pButton label="Clear" icon="pi pi-filter-slash"
                  class="p-button-outlined"
                  (click)="clear(dt)">
          </button>

          <p-iconfield iconPosition="left">
            <p-inputicon><i class="pi pi-search"></i></p-inputicon>
            <input pInputText type="text"
                   placeholder="Search keyword"
                   (input)="onGlobalFilter(dt, $event)" />
          </p-iconfield>
        </div>
      </ng-template>

      <!-- HEADER -->
      <ng-template pTemplate="header">
        <tr>
          <th *ngIf="isTeacherLike" style="width:3rem;">
            <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
          </th>

          <th>Name</th>
          <th>Email</th>
          <th *ngIf="isTeacherLike">Student ID</th>
          <th>Offer</th>
          <th>Application Status</th>
        </tr>
      </ng-template>

      <!-- BODY -->
      <ng-template pTemplate="body" let-row>
        <tr [pSelectableRow]="row">

          <td *ngIf="isTeacherLike">
            <p-tableCheckbox [value]="row"></p-tableCheckbox>
          </td>

          <td>{{ row.name }}</td>
          <td>{{ row.email }}</td>

          <td *ngIf="isTeacherLike">{{ row.studentIdentifier }}</td>

          <!-- OFFER PILL ALWAYS CLICKABLE -->
          <td>
<a [routerLink]="['/uikit/view', row.offerId]" class="pill-link">
    {{ row.offerTitle }}
</a>

          </td>

          <!-- APPLICATION STATUS PILL -->
          <td>

            <!-- STUDENT: status clickable -->
            <ng-container *ngIf="!isTeacherLike && row.applicationStatus; else teacherOrNoApp">
              <a [routerLink]="['/pages/student/apply', row.offerId]"
                 class="pill"
                 [ngClass]="row.applicationStatus.toLowerCase()">
                 {{ row.applicationStatus }}
              </a>
            </ng-container>

            <!-- TEACHER SEES PLAIN PILL -->
            <ng-template #teacherOrNoApp>
              <span class="pill"
                    [ngClass]="row.applicationStatus ? row.applicationStatus.toLowerCase() : ''"
              >
                {{ row.applicationStatus || 'NOT APPLIED' }}
              </span>
            </ng-template>

          </td>

        </tr>
      </ng-template>

      <ng-template pTemplate="emptymessage">
        <tr><td colspan="10">No recommendations found.</td></tr>
      </ng-template>

    </p-table>
  `
})
export class RecommendationsPageComponent implements OnInit {

  role: Role = 'UNKNOWN';
  isTeacherLike = false;

  rows: any[] = [];
  selectedRows: any[] = [];
  loading = true;

  constructor(
    private hiring: HiringService,
    private auth: AuthService,
    private msg: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    const raw = (this.auth.currentRole() || 'UNKNOWN').toUpperCase();

    this.role = (['STUDENT','TEACHER','CHEF_OPTION'].includes(raw)
      ? raw as Role
      : 'UNKNOWN');

    if (this.role === 'UNKNOWN') {
      this.router.navigate(['/pages/notfound']);
      return;
    }

    this.isTeacherLike = this.role === 'TEACHER' || this.role === 'CHEF_OPTION';

    this.loadData();
  }

  goBack() {
    this.router.navigate(['/pages/offer/public']);
  }

  loadData() {
    this.loading = true;

    if (this.isTeacherLike) {
      this.hiring.getMyGivenRecommendations().subscribe({
        next: res => {
          this.rows = res.map(r => ({
            ...r,
            name: r.studentFullName,
            email: r.studentEmail
          }));
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      this.hiring.getMyReceivedRecommendations().subscribe({
        next: res => {
          this.rows = res.map(r => ({
            ...r,
            name: r.teacherFullName,
            email: r.teacherEmail
          }));
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }

  deleteSelected() {
    const ids = this.selectedRows.map(r => r.recommendationId);
    this.hiring.deleteManyRecommendations(ids).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Recommendations removed'
        });
        this.loadData();
        this.selectedRows = [];
      }
    });
  }

  clear(dt: any) { dt.clear(); }

  onGlobalFilter(dt: any, event: Event) {
    dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
}
