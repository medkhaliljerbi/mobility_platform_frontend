// src/app/pages/auth/reset-password.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';

import { AppFloatingConfigurator } from '@/layout/component/app.floatingconfigurator';
import { AuthService } from '@/core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    PasswordModule, ButtonModule, ToastModule, RippleModule,
    AppFloatingConfigurator
  ],
  providers: [MessageService],
  styles: [`
    :host ::ng-deep .pw-full .p-password { width: 100% !important; display: block !important; }
    :host ::ng-deep .pw-full .p-password .p-inputtext { width: 100% !important; }
  `],
  template: `
    <app-floating-configurator />
    <p-toast></p-toast>

    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
      <div class="flex flex-col items-center justify-center">
        <div style="border-radius:56px;padding:0.3rem;background:linear-gradient(180deg,var(--primary-color) 10%, rgba(33,150,243,0) 30%)">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius:53px">

            <div class="text-center mb-8">
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">
                Reset your password
              </div>
            </div>

            <!-- Token validation states -->
            <div *ngIf="previewLoading" class="text-center text-muted-color">Validating link…</div>
            <div *ngIf="!previewLoading && !tokenValid" class="text-center">
              <div class="text-red-500 mb-3">This reset link is invalid or expired.</div>
              <button pButton label="Back to login" (click)="router.navigate(['/auth/login'])"></button>
            </div>

            <!-- Form -->
            <form *ngIf="!previewLoading && tokenValid" #f="ngForm" (ngSubmit)="submit(f)" class="w-full md:w-120 mx-auto pw-full">
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
                [disabled]="saving || !newPassword || !confirmPassword || newPassword !== confirmPassword"
                [label]="saving ? 'Saving…' : 'Save Password'"
                [loading]="saving">
              </button>

              <button
                pButton
                pRipple
                type="button"
                class="w-full p-button-text mt-3"
                label="Back to login"
                (click)="router.navigate(['/auth/login'])">
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  previewLoading = true;
  tokenValid = false;

  newPassword = '';
  confirmPassword = '';
  saving = false;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private toast: MessageService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.previewLoading = false;
      this.tokenValid = false;
      return;
    }
    this.auth.previewResetToken(this.token).subscribe({
      next: () => { this.tokenValid = true; this.previewLoading = false; },
      error: () => { this.tokenValid = false; this.previewLoading = false; }
    });
  }

  submit(f: NgForm) {
    if (!f.valid || this.newPassword !== this.confirmPassword) {
      this.toast.add({ severity: 'warn', summary: 'Validation', detail: 'Please check your password fields.' });
      return;
    }

    this.saving = true;
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.saving = false;
        this.toast.add({ severity: 'success', summary: 'Password updated', detail: 'Please sign in.' });
        this.router.navigate(['/auth/login']); // ⬅️ redirect to login after success
      },
      error: (e) => {
        this.saving = false;
        const msg = e?.error?.message || 'Could not reset password.';
        this.toast.add({ severity: 'error', summary: 'Failed', detail: msg });
      }
    });
  }
}
