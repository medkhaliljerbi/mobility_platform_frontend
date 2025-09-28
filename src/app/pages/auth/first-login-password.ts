// src/app/pages/auth/first-login/first-login-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';

import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-first-login-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    PasswordModule, ButtonModule, ToastModule, RippleModule,
    AppFloatingConfigurator
  ],
  providers: [MessageService],
  template: `
    <app-floating-configurator />
    <p-toast></p-toast>

    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
      <div class="flex flex-col items-center justify-center">
        <div style="border-radius:56px;padding:0.3rem;background:linear-gradient(180deg,var(--primary-color) 10%, rgba(33,150,243,0) 30%)">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius:53px">
            <div class="text-center mb-8">
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">
                Set a new password
              </div>
              <span class="text-muted-color font-medium">
                For your first login
                <ng-container *ngIf="emailFromJwt">&nbsp;—&nbsp;<strong>{{ emailFromJwt }}</strong></ng-container>
              </span>
            </div>

            <form #f="ngForm" (ngSubmit)="submit(f)" class="w-full md:w-120 mx-auto">
              <label class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">New Password</label>
              <p-password
                name="newPassword"
                [(ngModel)]="newPassword"
                placeholder="New password"
                [toggleMask]="true"
                [feedback]="true"
                [inputStyleClass]="'w-full'"
                required
                [minlength]="8"
                autocomplete="new-password"
                [promptLabel]="'Strength'"
                [weakLabel]="'Weak'"
                [mediumLabel]="'Medium'"
                [strongLabel]="'Strong'">
              </p-password>

              <label class="block text-surface-900 dark:text-surface-0 text-xl font-medium mt-6 mb-2">Confirm Password</label>
              <p-password
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                placeholder="Confirm password"
                [toggleMask]="true"
                [feedback]="false"
                [inputStyleClass]="'w-full'"
                required
                autocomplete="new-password">
              </p-password>

              <small class="p-error block mt-2" *ngIf="confirmPassword && confirmPassword !== newPassword">
                Passwords do not match.
              </small>

              <button
                pButton
                class="w-full mt-6"
                type="submit"
                [label]="saving ? 'Saving…' : 'Save Password'"
                [loading]="saving">
              </button>

              <button
                pButton
                pRipple
                type="button"
                class="w-full p-button-text mt-3"
                label="Back to login"
                (click)="router.navigate(['/auth/login-other'])">
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FirstLoginPasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  saving = false;

  emailFromJwt: string | null = null;

  constructor(
    public router: Router,
    private auth: AuthService,
    private toast: MessageService
  ) {}

  ngOnInit(): void {
    // Read JWT from storage and show the email (sub) in the subtitle.
    const token =
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token');

    if (!token) {
      this.toast.add({ severity: 'warn', summary: 'Session', detail: 'Login session missing. Please sign in again.' });
      this.router.navigate(['/auth/login-other']);
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payloadJson = JSON.parse(this.base64UrlDecode(parts[1]));
        this.emailFromJwt = payloadJson?.sub || payloadJson?.email || null;
      }
    } catch {
      // don’t block UI; just omit the subtitle
      this.emailFromJwt = null;
    }
  }

  submit(f: NgForm) {
    if (!f.valid) {
      Object.values(f.controls ?? {}).forEach(c => c.markAsTouched());
      this.toast.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill the required fields.' });
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toast.add({ severity: 'warn', summary: 'Validation', detail: 'Passwords do not match.' });
      return;
    }

    this.saving = true;
    this.auth.completeFirstLogin(this.newPassword).subscribe({
      next: () => {
        this.saving = false;
        this.toast.add({ severity: 'success', summary: 'Password updated', detail: 'Check your inbox for the verification email.' });
        this.router.navigate(['/auth/login-other']);
      },
      error: (e) => {
        this.saving = false;
        const msg = (e?.status === 401 || e?.status === 403)
          ? 'Session expired. Please open your invite link again and sign in.'
          : (e?.error?.message || 'Could not set new password.');
        this.toast.add({ severity: 'error', summary: 'Update failed', detail: msg });
      }
    });
  }

  // --- helpers ---
  private base64UrlDecode(input: string): string {
    const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : '';
    const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
    return decodeURIComponent(
      atob(b64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
}
