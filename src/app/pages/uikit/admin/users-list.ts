// src/app/pages/uikit/admin/users-list.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Table, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ProgressBarModule } from 'primeng/progressbar';
import { SliderModule } from 'primeng/slider';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AdminUserService } from 'src/app/core/services/admin-users.services';
import { User } from 'src/app/core/models/user.model';
import { UserUpdateComponent } from './user-update-dialog/user-update-dialog.component';
import { UserCreateComponent } from './user-create-dialog/user-create-dialog.component'; // <-- NEW

type UserRow = User & {
  fullName: string;
  createdAtDate?: Date;
};

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    SelectModule,
    TagModule,
    ButtonModule,
    RippleModule,
    ProgressBarModule,
    SliderModule,
    ToggleButtonModule,
    ToastModule,
    UserUpdateComponent,
    UserCreateComponent // <-- NEW
  ],
  providers: [MessageService],
  template: `
  <p-toast></p-toast>

  <div class="card">
    <div class="font-semibold text-xl mb-4">All users</div>

    <p-table
      #dt
      [value]="users"
      dataKey="id"
      [rows]="10"
      [loading]="loading"
      [rowHover]="true"
      [showGridlines]="true"
      [paginator]="true"
      [globalFilterFields]="[
        'fullName','username','email','personalEmail',
        'personnelPhoneNumber','domicilePhoneNumber',
        'role','userType'
      ]"
      responsiveLayout="scroll">

      <ng-template #caption>
        <div class="flex justify-between items-center flex-column sm:flex-row gap-3">
          <div class="flex gap-2">
            <button pButton label="Add New User" icon="pi pi-user-plus" (click)="openCreate()"></button>
            <button pButton label="Clear" class="p-button-outlined" icon="pi pi-filter-slash" (click)="clear(dt)"></button>
          </div>
          <p-iconfield iconPosition="left" class="ml-auto">
            <p-inputicon><i class="pi pi-search"></i></p-inputicon>
            <input #globalFilter pInputText type="text" (input)="onGlobalFilter(dt, $event)"
                   placeholder="Search (name, username, emails, phones, role, type)" />
          </p-iconfield>
        </div>
      </ng-template>

      <ng-template #header>
        <tr>
          <th style="min-width: 16rem">Full Name</th>
          <th style="min-width: 12rem">Username</th>
          <th style="min-width: 18rem">Email</th>
          <th style="min-width: 18rem">Personal Email</th>
          <th style="min-width: 14rem">Personnel Phone</th>
          <th style="min-width: 14rem">Domicile Phone</th>
          <th style="min-width: 10rem">Role</th>
          <th style="min-width: 12rem; text-align:center">Active</th>
          <th style="min-width: 12rem">Type</th>
          <th style="min-width: 14rem">Created At</th>
          <th style="min-width: 12rem">Actions</th>
        </tr>
      </ng-template>

      <ng-template #body let-u>
        <tr [ngClass]="{ 'inactive-row': !u.active }">
          <td>{{ u.fullName }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.personalEmail || '-' }}</td>
          <td>{{ u.personnelPhoneNumber || '-' }}</td>
          <td>{{ u.domicilePhoneNumber || '-' }}</td>
          <td><span class="role-plain">{{ u.role }}</span></td>

          <td class="text-center">
            <p-toggleButton
              [onLabel]="'Active'"
              [offLabel]="'Inactive'"
              [onIcon]="'pi pi-check'"
              [offIcon]="'pi pi-times'"
              [(ngModel)]="u.active"
              (onChange)="onToggleChange(u, $event)">
            </p-toggleButton>
          </td>

          <td>{{ u.userType }}</td>
          <td>{{ u.createdAtDate || u.createdAt | date:'MM/dd/yyyy, HH:mm' }}</td>
          <td class="text-right">
            <button pButton size="small" label="Update" icon="pi pi-pencil" class="mr-2" (click)="openUpdate(u)"></button>
            <button pButton size="small" label="Delete" icon="pi pi-trash" severity="danger" (click)="deleteUserEmail(u.email)"></button>
          </td>
        </tr>
      </ng-template>

      <ng-template #emptymessage><tr><td colspan="11">No users found.</td></tr></ng-template>
      <ng-template #loadingbody><tr><td colspan="11">Loading users…</td></tr></ng-template>
    </p-table>
  </div>

  <app-user-update
    [visible]="updateVisible"
    [userId]="selectedUserId || 0"
    (closed)="onDialogClosed()"
    (updated)="onDialogUpdated($event)">
  </app-user-update>

  <app-user-create
    [visible]="createVisible"
    (closed)="onCreateClosed()"
    (created)="onUserCreated($event)">
  </app-user-create>
  `,
  styles: [`
    .role-plain { font-weight: 600; }
    :host ::ng-deep .inactive-row { background-color: #f5f5f5 !important; }
  `]
})
export class UsersListComponent implements OnInit {
  users: UserRow[] = [];
  loading = true;

  updateVisible = false;
  selectedUserId: number | null = null;

  createVisible = false; // <-- NEW

  @ViewChild('globalFilter') filter!: ElementRef;

  constructor(
    private adminUserService: AdminUserService,
    private toast: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll() {
    this.loading = true;
    this.adminUserService.getAll().subscribe({
      next: (data) => {
        this.users = (data || []).map((u) => ({
          ...u,
          fullName: [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ').trim() || u.username,
          createdAtDate: u.createdAt ? new Date(u.createdAt) : undefined
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  clear(table: Table) {
    table.clear();
    if (this.filter?.nativeElement) this.filter.nativeElement.value = '';
  }

  openUpdate(u: UserRow) {
    this.selectedUserId = u.id;
    this.updateVisible = true;
  }

  onDialogClosed() {
    this.updateVisible = false;
    this.selectedUserId = null;
  }

  onDialogUpdated(updated: User) {
    const idx = this.users.findIndex(r => r.id === updated.id);
    if (idx >= 0) {
      this.users[idx] = {
        ...updated,
        fullName: [updated.firstName, updated.middleName, updated.lastName].filter(Boolean).join(' ').trim() || updated.username,
        createdAtDate: updated.createdAt ? new Date(updated.createdAt) : undefined
      };
    }
    this.toast.add({
      severity: 'success',
      summary: 'Updated',
      detail: `${[updated.firstName, updated.lastName].filter(Boolean).join(' ') || 'User'} updated.`
    });
    this.onDialogClosed();
  }

  // NEW: open/close create dialog
  openCreate() {
    this.createVisible = true;
  }
  onCreateClosed() {
    this.createVisible = false;
  }
  onUserCreated(u: User) {
    const row: UserRow = {
      ...u,
      fullName: [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ').trim() || u.username,
      createdAtDate: u.createdAt ? new Date(u.createdAt) : undefined
    };
    this.users = [row, ...this.users];
    this.createVisible = false;

    this.toast.add({
      severity: 'success',
      summary: 'Created',
      detail: `${row.fullName || 'User'} created & invited.`
    });
  }

  // Handle ToggleButton change event object
  onToggleChange(u: UserRow, evt: any) {
    const previous = u.active;
    const nextActive: boolean = !!(evt && evt.checked);

    this.adminUserService.setActive(u.id, nextActive).subscribe({
      next: (fresh) => {
        const name = [fresh.firstName, fresh.lastName].filter(Boolean).join(' ').trim() || 'User';
        const idx = this.users.findIndex(x => x.id === fresh.id);
        if (idx >= 0) {
          this.users[idx] = {
            ...fresh,
            fullName: [fresh.firstName, fresh.middleName, fresh.lastName].filter(Boolean).join(' ').trim() || fresh.username,
            createdAtDate: fresh.createdAt ? new Date(fresh.createdAt) : undefined
          };
        }
        this.toast.add({
          severity: 'success',
          summary: nextActive ? 'Activated' : 'Deactivated',
          detail: `${name} was ${nextActive ? 'activated' : 'deactivated'}.`
        });
      },
      error: () => {
        u.active = previous; // revert on error
        this.toast.add({
          severity: 'error',
          summary: 'Status change failed',
          detail: 'Could not update active status.'
        });
      }
    });
  }

  deleteUser(u: number) {
this.adminUserService.deleteUser(u)
  }
deleteUserEmail(email: string) {
  this.adminUserService.deleteUserByEmail(email).subscribe({
    next: () => {
      this.users = this.users.filter(u => u.email !== email);
      this.toast.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'User deleted successfully'
      });
    },
    error: () => {
      this.toast.add({
        severity: 'error',
        summary: 'Delete failed',
        detail: 'Could not delete user'
      });
    }
  });
}

}
