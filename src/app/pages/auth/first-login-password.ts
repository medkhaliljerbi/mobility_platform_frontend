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
  styles: [`
    /* Force p-password and its inner input to fill the container */
    :host ::ng-deep .pw-full .p-password { width: 100% !important; display: block !important; }
    :host ::ng-deep .pw-full .p-password .p-inputtext { width: 100% !important; }
  `],
  template: `
    <p-toast></p-toast>

    <!-- Success overlay -->
    <div *ngIf="showOverlay" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div class="relative h-full w-full flex items-center justify-center p-4">
        <div class="w-[520px] max-w-[90vw] bg-surface-0 dark:bg-surface-900 rounded-3xl shadow-2 p-8">
          <h3 class="text-2xl font-semibold mb-2 text-surface-900 dark:text-surface-0">Password updated</h3>
          <p class="text-muted-color">
            An activation email was sent to <strong>{{ emailFromJwt || 'your email' }}</strong>.
            Please click the link inside to activate your account.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button pButton type="button" class="p-button-text" label="Close" (click)="showOverlay = false"></button>
            <button pButton type="button" label="Go to login" (click)="router.navigate(['/auth/login'])"></button>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden"
         [class.blur-sm]="showOverlay">
      <div class="flex flex-col items-center justify-center">
        <div style="border-radius:56px;padding:0.3rem;background:linear-gradient(180deg,var(--primary-color) 10%, rgba(33,150,243,0) 30%)">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius:53px">
            <div class="text-center mb-8">
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">
                Set a new password
              </div>
            </div>

            <!-- The form is the width ruler; inputs & button all fill it -->
            <form #f="ngForm" (ngSubmit)="submit(f)" class="w-full md:w-120 mx-auto pw-full">
              <label class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">New Password</label>
              <p-password
                name="newPassword"
                [(ngModel)]="newPassword"
                placeholder="New password"
                [toggleMask]="true"
                [feedback]="true"
                required
                [minlength]="8"
                autocomplete="new-password"
                [promptLabel]="'Strength'"
                [weakLabel]="'Weak'"
                [mediumLabel]="'Medium'"
                [strongLabel]="'Strong'"
                [style]="{ width: '100%', display: 'block' }"
                [inputStyle]="{ width: '100%' }">
              </p-password>

              <label class="block text-surface-900 dark:text-surface-0 text-xl font-medium mt-6 mb-2">Confirm Password</label>
              <p-password
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                placeholder="Confirm password"
                [toggleMask]="true"
                [feedback]="false"
                required
                autocomplete="new-password"
                [style]="{ width: '100%', display: 'block' }"
                [inputStyle]="{ width: '100%' }">
              </p-password>

              <small class="p-error block mt-2" *ngIf="confirmPassword && confirmPassword !== newPassword">
                Passwords do not match.
              </small>

              <button
                pButton
                class="w-full mt-6"
                type="submit"
                [disabled]="saving"
                [label]="saving ? 'Saving…' : 'Save Password'"
                [loading]="saving">
              </button>

              <button
                pButton
                pRipple
                type="button"
                class="w-full p-button-text mt-3"
                label="Back to login"
                (click)="goBack()">
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
  showOverlay = false;
  emailFromJwt: string | null = null;

  constructor(public router: Router, private auth: AuthService, private toast: MessageService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
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
    } catch { this.emailFromJwt = null; }
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
      next: () => { this.saving = false; this.showOverlay = true; },
      error: (e) => {
        this.saving = false;
        const msg = (e?.status === 401 || e?.status === 403)
          ? 'Session expired. Please open your invite link again and sign in.'
          : (e?.error?.message || 'Could not set new password.');
        this.toast.add({ severity: 'error', summary: 'Update failed', detail: msg });
      }
    });
  }
  goBack() {
    this.router.navigate(['/auth/login']);
  }
  private base64UrlDecode(input: string): string {
    const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : '';
    const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
    return decodeURIComponent(
      atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  }
}
