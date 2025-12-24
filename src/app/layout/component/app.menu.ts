// src/app/layout/app.menu.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

type AppRole =
  | 'STUDENT'
  | 'TEACHER'
  | 'CHEF_OPTION'
  | 'PARTNER'
  | 'MOBILITY_OFFICER'
  | 'ADMIN'
  | string;

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `
    <ul class="layout-menu">
      <ng-container *ngFor="let item of model; let i = index">
        <li
          app-menuitem
          *ngIf="!item.separator"
          [item]="item"
          [index]="i"
          [root]="true">
        </li>
        <li *ngIf="item.separator" class="menu-separator"></li>
      </ng-container>
    </ul>
  `
})
export class AppMenu {
  model: MenuItem[] = [];

  ngOnInit() {
    const role = this.resolveUserRole();

    /* ================= ROLE EXTRAS ================= */
        const chefOptionMenu: MenuItem[] =
      role === 'CHEF_OPTION'
        ? [    { label: 'Offers', icon: 'pi pi-briefcase', routerLink: ['/pages/offer/public'] },
              { label: 'Profile', icon: 'pi pi-user', routerLink: ['/pages/teacher/profile'] },
              { label: 'Contracts', icon: 'pi pi-file-edit', routerLink: ['/pages/teacher/contracts'] }
            ]

        : [];

    const studentExtras: MenuItem[] =
      role === 'STUDENT'
        ? [
            { label: 'Offers', icon: 'pi pi-briefcase', routerLink: ['/pages/offer/public'] },
            { label: 'My Applications', icon: 'pi pi-list', routerLink: ['/pages/student/myapplications'] },
            { label: 'Documents', icon: 'pi pi-file', routerLink: ['/pages/student/profile/documents'] },
            { label: 'Certificates', icon: 'pi pi-id-card', routerLink: ['/pages/student/profile/certificates'] },
            { label: 'Profile', icon: 'pi pi-user', routerLink: ['/pages/student/profile'] }
          ]
        : [];

    const teacherExtras: MenuItem[] =
      role === 'TEACHER'
        ? [
            { label: 'Public Offers', icon: 'pi pi-briefcase', routerLink: ['/pages/offer/public'] },
            { label: 'Profile', icon: 'pi pi-user', routerLink: ['/pages/teacher/profile'] }
          ]
        : [];

    const partnerExtras: MenuItem[] =
      role === 'PARTNER'
        ? [
            { label: 'Public Offers', icon: 'pi pi-briefcase', routerLink: ['/pages/offer/public'] },
            { label: 'My Offers', icon: 'pi pi-list', routerLink: ['/pages/offer/list'] },
             {
          label: 'Create Offer',
          icon: 'pi pi-plus-circle',
          routerLink: ['/pages/offer/create']
        },
            { label: 'Profile', icon: 'pi pi-user', routerLink: ['/pages/partner/profile'] }
          ]
        : [];

    const mobilityOfficerExtras: MenuItem[] =
      role === 'MOBILITY_OFFICER'
        ? [
            { label: 'Public Offers', icon: 'pi pi-briefcase', routerLink: ['/pages/offer/public'] },
            { label: 'My Offers', icon: 'pi pi-list', routerLink: ['/pages/offer/list'] },
            {
              label: 'Mobility Contract',
              icon: 'pi pi-file-edit',
              routerLink: ['/pages/mobilityagent/mobility-contract']
            },   {
          label: 'Create Offer',
          icon: 'pi pi-plus-circle',
          routerLink: ['/pages/offer/create']
        },
            { label: 'Profile', icon: 'pi pi-user', routerLink: ['/pages/mobilityagent/profile'] }
          ]
        : [];

    const adminExtras: MenuItem[] =
      role === 'ADMIN'
        ? [
            { label: 'Public Offers', icon: 'pi pi-briefcase', routerLink: ['/pages/offer/public'] },
            { label: 'Users List', icon: 'pi pi-users', routerLink: ['/uikit/users-list'] },
            { label: 'Invite Students', icon: 'pi pi-user-plus', routerLink: ['/uikit/invite-students'] }
          ]
        : [];

    /* ================= MENU MODEL ================= */

    this.model = [

      {
        label: 'Menu',
        icon: 'pi pi-fw pi-briefcase',
        items: [
          ...studentExtras,
          ...teacherExtras,
          ...partnerExtras,
          ...mobilityOfficerExtras,
          ...adminExtras,
          ...chefOptionMenu
        ]
      }
    ];
  }

  /* ================= HELPERS ================= */

  private resolveUserRole(): AppRole | null {
    const stored = localStorage.getItem('user_role');
    if (stored) return stored as AppRole;

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('token') ||
      '';

    if (!token || token.split('.').length < 3) return null;

    try {
      const payload = JSON.parse(this.base64UrlDecode(token.split('.')[1]));
      return (
        payload['role'] ||
        payload['roles']?.[0] ||
        payload['authorities']?.[0] ||
        payload['scope'] ||
        null
      );
    } catch {
      return null;
    }
  }

  private base64UrlDecode(s: string): string {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    return decodeURIComponent(
      atob(s)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
}
