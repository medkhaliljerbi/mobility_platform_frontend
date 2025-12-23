// src/app/pages/auth/login.ts
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { CardModule } from 'primeng/card'; // ⬅️ add this

import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '@/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule,
    ButtonModule, CheckboxModule, InputTextModule, PasswordModule, RippleModule,
    CardModule, // ⬅️ add this
    AppFloatingConfigurator
  ],
  template: `
    <app-floating-configurator />

    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
      <div class="flex flex-col items-center justify-center">
        <div style="border-radius:56px;padding:0.3rem;background:linear-gradient(180deg,var(--primary-color) 10%, rgba(33,150,243,0) 30%)">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius:53px">

<div class="text-center mb-8 flex flex-col items-center gap-2">

  <img
    src="assets/images/esprit.png"
    alt="Esprit"
    style="height: 72px; margin: 0 auto;"
  />

  <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mt-2">
    Welcome to Esprit Mobility!
  </div>

  <span class="text-muted-color font-medium">
    Sign in to continue
  </span>

</div>



            <div>
              <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
              <input pInputText id="email1" type="text" placeholder="Email address"
                     class="w-full md:w-120 mb-8" [(ngModel)]="email" />

              <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
              <p-password id="password1" [(ngModel)]="password" placeholder="Password"
                          [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

              <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                <div class="flex items-center">
                  <p-checkbox [(ngModel)]="remember" id="rememberme1" binary class="mr-2"></p-checkbox>
                  <label for="rememberme1">Remember me</label>
                </div>
                <button type="button" class="font-medium no-underline ml-2 text-right cursor-pointer text-primary"
                        (click)="openForgot()">
                  Forgot password?
                </button>
              </div>

              <button pButton class="w-full"
                      [label]="loading ? 'Signing in…' : 'Sign In'"
                      [disabled]="loading || !email || !password"
                      (click)="signIn()">
              </button>

              <div *ngIf="error" class="mt-4 text-red-500">{{ error }}</div>
            </div>

            <!-- Forgot password card -->
            <div *ngIf="showForgot" class="mt-6">
              <p-card>
                <ng-template pTemplate="title">Password recovery</ng-template>

                <div class="flex flex-col gap-3">
                  <label for="fp_email" class="text-sm font-medium">Email</label>
                  <input id="fp_email" pInputText type="email" [(ngModel)]="forgotEmail" class="w-full" />

                  <button pButton
                          [label]="forgotLoading ? 'Sending…' : 'Send password recovery email'"
                          [disabled]="forgotLoading || !forgotEmail"
                          (click)="sendForgot()">
                  </button>

                  <div *ngIf="forgotMsg" class="text-green-600 text-sm">{{ forgotMsg }}</div>
                  <div *ngIf="forgotErr" class="text-red-600 text-sm">{{ forgotErr }}</div>
                </div>
              </p-card>
            </div>
            <!-- /Forgot password card -->

          </div>
        </div>
      </div>
    </div>
  `
})
export class Login {
  email = '';
  password = '';
  remember = false;

  loading = false;
  error: string | null = null;

  // forgot-password UI state
  showForgot = false;
  forgotEmail = '';
  forgotLoading = false;
  forgotMsg: string | null = null;
  forgotErr: string | null = null;

  private auth = inject(AuthService);
  private router = inject(Router);

  openForgot() {
    this.showForgot = true;
    this.forgotEmail = this.email || ''; // pre-fill from login email
    this.forgotMsg = null;
    this.forgotErr = null;
  }

  sendForgot() {
    this.forgotMsg = null;
    this.forgotErr = null;

    if (!this.forgotEmail) {
      this.forgotErr = 'Email is required.';
      return;
    }

    this.forgotLoading = true;
    this.auth.forgotPassword(this.forgotEmail).subscribe({
      next: () => {
        // Backend always returns 204 even if email is not found (no enumeration)
        this.forgotMsg = 'If an account exists for this email, we sent a recovery link.';
        this.forgotLoading = false;
      },
      error: (e: HttpErrorResponse) => {
        this.forgotErr = e.status === 0
          ? 'Server unreachable (check backend on http://localhost:8080).'
          : e.error?.message || 'Unable to send recovery email.';
        this.forgotLoading = false;
      }
    });
  }

  signIn() {
    this.error = null;
    if (!this.email || !this.password) {
      this.error = 'Email et mot de passe sont requis.';
      return;
    }

    this.loading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: ({ token, raw }) => {
        if (token) (this.remember ? localStorage : sessionStorage).setItem('auth_token', token);
        if ((raw as any)?.roles) localStorage.setItem('roles', JSON.stringify((raw as any).roles));
        this.router.navigateByUrl('/');
      },
      error: (e: HttpErrorResponse) => {
        this.error = e.status === 0
          ? 'Serveur injoignable (vérifie le backend sur http://localhost:8080).'
          : e.error?.message || 'Identifiants invalides ou erreur serveur.';
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }
}
