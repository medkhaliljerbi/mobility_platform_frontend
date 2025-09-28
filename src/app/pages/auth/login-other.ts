// src/app/pages/auth/login-other.ts
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

import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '@/core/services/auth.service';

@Component({
  selector: 'app-login-other',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule,
    ButtonModule, CheckboxModule, InputTextModule, PasswordModule, RippleModule,
    AppFloatingConfigurator
  ],
  template: `
    <app-floating-configurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
      <div class="flex flex-col items-center justify-center">
        <div style="border-radius:56px;padding:0.3rem;background:linear-gradient(180deg,var(--primary-color) 10%, rgba(33,150,243,0) 30%)">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius:53px">
            <div class="text-center mb-8">
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to Esprit Mobility</div>
              <span class="text-muted-color font-medium">Sign in to continue</span>
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
                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
              </div>

              <button pButton class="w-full"
                      [label]="loading ? 'Signing in…' : 'Sign In'"
                      [disabled]="loading || !email || !password"
                      (click)="signIn()">
              </button>

              <div *ngIf="error" class="mt-4 text-red-500">{{ error }}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginOtherComponent {
  email = '';
  password = '';
  remember = false;

  loading = false;
  error: string | null = null;

  private auth = inject(AuthService);
  private router = inject(Router);

  signIn() {
    this.error = null;
    if (!this.email || !this.password) {
      this.error = 'Email et mot de passe sont requis.';
      return;
    }

    this.loading = true;
    this.auth.loginOther({ email: this.email, password: this.password }).subscribe({
      next: ({ token, raw }) => {
        if (token) (this.remember ? localStorage : sessionStorage).setItem('auth_token', token);
        if ((raw as any)?.roles) localStorage.setItem('roles', JSON.stringify((raw as any).roles));

        const isActive = raw.active === true;
        if (!isActive) {
          // non-SORTANT first login → force password change
          this.router.navigateByUrl('/auth/first-login');
          return;
        }
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
