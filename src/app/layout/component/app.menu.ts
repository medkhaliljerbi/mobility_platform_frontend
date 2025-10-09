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
  | string; // fallback for unknown/custom roles

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `
    <ul class="layout-menu">
      <ng-container *ngFor="let item of model; let i = index">
        <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
        <li *ngIf="item.separator" class="menu-separator"></li>
      </ng-container>
    </ul>
  `
})
export class AppMenu {
  model: MenuItem[] = [];

  ngOnInit() {
    const role = this.resolveUserRole();

    // Build a single Profile item based on role (same icon)
    const profileRoute = this.profileRouteForRole(role);
    const profileItem: MenuItem | null = profileRoute
      ? { label: 'Profile', icon: 'pi pi-user', routerLink: [profileRoute] }
      : null;

    this.model = [
      {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
      },
      {
        label: 'UI Components',
        items: [
          { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
          { label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
          { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/uikit/button'] },
          { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
          { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/uikit/list'] },
          { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/uikit/tree'] },
          { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/uikit/panel'] },
          { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/uikit/overlay'] },
          { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/uikit/media'] },
          { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'] },
          { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/uikit/message'] },
          { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/uikit/file'] },
          { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
          { label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: ['/uikit/timeline'] },
          { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/uikit/misc'] },
          { label: 'Users List', icon: 'pi pi-fw pi-users', routerLink: ['/uikit/users-list'] },
          { label: 'Invite Students', icon: 'pi pi-fw pi-user-plus', routerLink: ['/uikit/invite-students'] }
        ]
      },
      {
        label: 'Pages',
        icon: 'pi pi-fw pi-briefcase',
        routerLink: ['/pages'],
        items: [
          { label: 'Landing', icon: 'pi pi-fw pi-globe', routerLink: ['/landing'] },
          {
            label: 'Auth',
            icon: 'pi pi-fw pi-user',
            items: [
              { label: 'Login', icon: 'pi pi-fw pi-sign-in', routerLink: ['/auth/login'] },
              { label: 'Error', icon: 'pi pi-fw pi-times-circle', routerLink: ['/auth/error'] },
              { label: 'Access Denied', icon: 'pi pi-fw pi-lock', routerLink: ['/auth/access'] }
            ]
          },
          { label: 'Crud', icon: 'pi pi-fw pi-pencil', routerLink: ['/pages/crud'] },
          { label: 'Not Found', icon: 'pi pi-fw pi-exclamation-circle', routerLink: ['/pages/notfound'] },
          { label: 'Empty', icon: 'pi pi-fw pi-circle-off', routerLink: ['/pages/empty'] },
          ...(profileItem ? [profileItem] : []) // ✅ add the single, role-based Profile item
        ]
      },
      {
        label: 'Hierarchy',
        items: [
          {
            label: 'Submenu 1',
            icon: 'pi pi-fw pi-bookmark',
            items: [
              {
                label: 'Submenu 1.1',
                icon: 'pi pi-fw pi-bookmark',
                items: [
                  { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                  { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                  { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
                ]
              },
              {
                label: 'Submenu 1.2',
                icon: 'pi pi-fw pi-bookmark',
                items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
              }
            ]
          },
          {
            label: 'Submenu 2',
            icon: 'pi pi-fw pi-bookmark',
            items: [
              {
                label: 'Submenu 2.1',
                icon: 'pi pi-fw pi-bookmark',
                items: [
                  { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                  { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
                ]
              },
              {
                label: 'Submenu 2.2',
                icon: 'pi pi-fw pi-bookmark',
                items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
              }
            ]
          }
        ]
      },
      {
        label: 'Get Started',
        items: [
          { label: 'Documentation', icon: 'pi pi-fw pi-book', routerLink: ['/documentation'] },
          { label: 'View Source', icon: 'pi pi-fw pi-github', url: 'https://github.com/primefaces/sakai-ng', target: '_blank' }
        ]
      }
    ];
  }

  // --- helpers --------------------------------------------------------------

  private profileRouteForRole(role: AppRole | null): string | null {
    switch (role) {
      case 'STUDENT':
        return '/pages/student/profile';
      case 'TEACHER':
      case 'CHEF_OPTION': // chef is still served by Teacher profile UI
        return '/pages/teacher/profile';
      case 'PARTNER':
        return '/pages/partner/profile';
      case 'MOBILITY_OFFICER': // keeping enum name as you requested
        return '/pages/mobilityagent/profile';
      default:
        return null; // unknown role => no profile item
    }
  }

  private resolveUserRole(): AppRole | null {
    // 1) If you already stash role after login, use it:
    const stored = localStorage.getItem('user_role');
    if (stored) return stored as AppRole;

    // 2) Otherwise, try to decode from JWT (no dependency on your login code)
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('token') ||
      '';

    if (!token || token.split('.').length < 3) return null;

    try {
      const payload = JSON.parse(this.base64UrlDecode(token.split('.')[1]));
      // common claim names for roles
      const r =
        payload['role'] ??
        (Array.isArray(payload['roles']) ? payload['roles'][0] : payload['roles']) ??
        (Array.isArray(payload['authorities']) ? payload['authorities'][0] : payload['authorities']) ??
        payload['scope'] ??
        null;
      return typeof r === 'string' ? (r as AppRole) : null;
    } catch {
      return null;
    }
  }

  private base64UrlDecode(s: string): string {
    // convert base64url to base64
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    // pad
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
