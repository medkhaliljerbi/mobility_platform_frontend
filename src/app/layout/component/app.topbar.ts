// src/app/layout/app.topbar.ts (AppTopbar)
import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '@/core/services/auth.service';

type AppRole =
  | 'STUDENT'
  | 'TEACHER'
  | 'CHEF_OPTION'
  | 'PARTNER'
  | 'MOBILITY_OFFICER'
  | string;

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
  template: `
    <div class="layout-topbar">
      <div class="layout-topbar-logo-container">
        <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
          <i class="pi pi-bars"></i>
        </button>

        <a class="layout-topbar-logo" routerLink="/">
          <!-- (unchanged) logo svg -->
          <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- … your existing paths … -->
          </svg>
          <span>SAKAI</span>
        </a>
      </div>

      <div class="layout-topbar-actions">
        <div class="layout-config-menu">
          <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()" aria-label="Toggle theme">
            <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
          </button>

          <div class="relative">
            <button
              type="button"
              class="layout-topbar-action layout-topbar-action-highlight"
              pStyleClass="@next"
              enterFromClass="hidden"
              enterActiveClass="animate-scalein"
              leaveToClass="hidden"
              leaveActiveClass="animate-fadeout"
              [hideOnOutsideClick]="true"
              aria-haspopup="true"
              aria-expanded="false"
              aria-label="Open configurator"
            >
              <i class="pi pi-palette"></i>
            </button>
            <app-configurator />
          </div>
        </div>

        <button
          class="layout-topbar-menu-button layout-topbar-action"
          pStyleClass="@next"
          enterFromClass="hidden"
          enterActiveClass="animate-scalein"
          leaveToClass="hidden"
          leaveActiveClass="animate-fadeout"
          [hideOnOutsideClick]="true"
          aria-label="Open quick menu"
        >
          <i class="pi pi-ellipsis-v"></i>
        </button>

        <div class="layout-topbar-menu hidden lg:block">
          <div class="layout-topbar-menu-content">
            <button type="button" class="layout-topbar-action">
              <i class="pi pi-calendar"></i>
              <span>Calendar</span>
            </button>
            <button type="button" class="layout-topbar-action">
              <i class="pi pi-inbox"></i>
              <span>Messages</span>
            </button>

            <!-- Profile dropdown -->
            <div class="relative">
              <button
                type="button"
                class="layout-topbar-action"
                pStyleClass="@next"
                enterFromClass="hidden"
                enterActiveClass="animate-scalein"
                leaveToClass="hidden"
                leaveActiveClass="animate-fadeout"
                [hideOnOutsideClick]="true"
                aria-haspopup="true"
                aria-expanded="false"
                aria-label="Open profile menu"
              >
                <i class="pi pi-user"></i>
                <span>Profile</span>
              </button>

              <div
                class="hidden absolute right-0 mt-2 w-56 rounded-2xl shadow-lg border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 p-2 z-50"
              >
                <a
                  [routerLink]="profileLink"
                  class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <i class="pi pi-id-card"></i>
                  <span>Profile</span>
                </a>

                <button
                  type="button"
                  (click)="logout()"
                  class="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <i class="pi pi-sign-out"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
            <!-- /Profile dropdown -->
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AppTopbar {
  items!: MenuItem[];

  constructor(
    public layoutService: LayoutService,
    private router: Router,
    private auth: AuthService
  ) {}

  // ---- UI actions ----
  toggleDarkMode() {
    this.layoutService.layoutConfig.update((s) => ({ ...s, darkTheme: !s.darkTheme }));
  }

  logout() {
    this.auth.logout();               // uses your TokenStorageService + clears user_role
    this.router.navigateByUrl('/auth/login');
  }

  // ---- Profile link (uses SAME logic as your app.menu.ts) ----
  get profileLink(): string {
    const role = this.resolveUserRole();
    const path = this.profileRouteForRole(role);
    return path ?? '/auth/login';
  }

  private profileRouteForRole(role: AppRole | null): string | null {
    if (!role) return null;

    // small normalization to handle tokens like ROLE_TEACHER
    const clean = role.replace(/^ROLE_/, '') as AppRole;

    switch (clean) {
      case 'STUDENT':
        return '/pages/student/profile';
      case 'TEACHER':
      case 'CHEF_OPTION':
        return '/pages/teacher/profile';
      case 'PARTNER':
        return '/pages/partner/profile';
      case 'MOBILITY_OFFICER':
        return '/pages/mobilityagent/profile';
          case 'ADMIN':
        return '/pages/admin/profile';
      default:
        return null;
    }
  }

  // === EXACT same storage-first + JWT-fallback pattern as your app.menu.ts ===
  private resolveUserRole(): AppRole | null {
    // 1) direct persisted role (your AuthService.login sets this)
    const stored = localStorage.getItem('user_role');
    if (stored) return stored as AppRole;

    // 2) fallback: decode JWT from common keys
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('token') ||
      '';

    if (!token || token.split('.').length < 3) return null;

    try {
      const payload = JSON.parse(this.base64UrlDecode(token.split('.')[1]));
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
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    return decodeURIComponent(
      atob(s)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
}
