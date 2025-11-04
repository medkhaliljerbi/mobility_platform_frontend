import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  TeacherService,
  RecommendableStudentView
} from 'src/app/core/services/teacher.service';

@Component({
  selector: 'app-recommend-students',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    ButtonModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="card">
      <div class="font-semibold text-xl mb-2">
        Recommend a student for this offer
      </div>

      <div class="text-color-secondary mb-4 text-sm">
        Offer ID: {{ offerId }}<br />
        Pick a student and click "Recommend". They will receive an email with a direct apply link.
      </div>

      <p-table
        #dt
        [value]="rows"
        dataKey="id"
        [rows]="10"
        [paginator]="true"
        [rowHover]="true"
        [loading]="loading"
        [showGridlines]="true"
        [globalFilterFields]="[
          'fullName','email','studentIdentifier','currentClass','speciality'
        ]"
        responsiveLayout="scroll"
      >

        <ng-template #caption>
          <div class="flex justify-between items-center flex-column sm:flex-row gap-3">
            <p-iconfield iconPosition="left" class="ml-auto w-full sm:w-64">
              <p-inputicon><i class="pi pi-search"></i></p-inputicon>
              <input #globalFilter pInputText type="text"
                     (input)="onGlobalFilter(dt, $event)"
                     placeholder="Search student..." />
            </p-iconfield>
          </div>
        </ng-template>

        <ng-template #header>
          <tr>
            <th style="min-width:16rem">Student</th>
            <th style="min-width:12rem">Esprit ID</th>
            <th style="min-width:10rem">Class</th>
            <th style="min-width:10rem">Speciality</th>
            <th style="min-width:14rem">Email</th>
            <th style="min-width:10rem; text-align:right;">Action</th>
          </tr>
        </ng-template>

        <ng-template #body let-r>
          <tr>
            <td>
              <div class="font-semibold">{{ r.fullName }}</div>
            </td>

            <td>{{ r.studentIdentifier || '-' }}</td>
            <td>{{ r.currentClass || '-' }}</td>
            <td>{{ r.speciality || '-' }}</td>

            <td>{{ r.email }}</td>

            <td class="text-right">
              <button
                pButton
                size="small"
                label="Recommend"
                icon="pi pi-send"
                (click)="onRecommend(r)"
                [disabled]="busyId === r.id"
              ></button>
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr><td colspan="6">No eligible students found.</td></tr>
        </ng-template>

        <ng-template #loadingbody>
          <tr><td colspan="6">Loading students…</td></tr>
        </ng-template>

      </p-table>
    </div>
  `,
  styles: [`
    .text-color-secondary {
      color: var(--text-color-secondary);
    }
  `]
})
export class RecommendStudentsComponent implements OnInit {

  private route  = inject(ActivatedRoute);
  private teacher= inject(TeacherService);
  private toast  = inject(MessageService);
  private router = inject(Router);

  @ViewChild('globalFilter') filter!: ElementRef;

  offerId!: number;

  rows: RecommendableStudentView[] = [];
  loading = true;
  busyId: number | null = null;

  ngOnInit(): void {
    // read offerId from route
    this.offerId = Number(this.route.snapshot.paramMap.get('offerId'));

    if (!this.offerId || Number.isNaN(this.offerId)) {
      this.loading = false;
      this.toast.add({
        severity:'error',
        summary:'Invalid offer',
        detail:'No valid offer ID in URL.'
      });
      return;
    }

    this.loading = true;
    this.teacher.getEligibleStudents(this.offerId).subscribe({
      next: (list) => {
        this.rows = list || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load eligible students', err);
        this.rows = [];
        this.loading = false;
        this.toast.add({
          severity:'error',
          summary:'Error',
          detail:'Could not load students.'
        });
      }
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  onRecommend(r: RecommendableStudentView) {
    this.busyId = r.id;

    this.teacher.recommendStudent(this.offerId, r.id, '').subscribe({
      next: () => {
        this.busyId = null;

        this.toast.add({
          severity:'success',
          summary:'Recommended',
          detail:`${r.fullName} was notified`
        });

        // remove them from list after successful recommendation
        this.rows = this.rows.filter(x => x.id !== r.id);
      },
      error: (err) => {
        this.busyId = null;
        console.error('recommend failed', err);

        this.toast.add({
          severity:'error',
          summary:'Failed',
          detail:'Could not send recommendation.'
        });
      }
    });
  }
}
