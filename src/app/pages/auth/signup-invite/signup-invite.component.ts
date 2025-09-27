import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// ✅ correct relative path to the service & exported DTO
import { AuthService, InvitePreviewDto } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-signup-invite',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    InputTextModule,
    PasswordModule,
    RippleModule,
    DialogModule,
    DividerModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
      <div class="flex flex-col items-center justify-center">
        <div style="border-radius:56px;padding:0.3rem;background:linear-gradient(180deg,var(--primary-color) 10%, rgba(33,150,243,0) 30%)">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-10 px-6 sm:px-12" style="border-radius:53px;max-width:700px;">
            <div class="text-center mb-6">
              <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">Create your account</div>
              <span class="text-muted-color font-medium">Opened from your email invite link</span>
            </div>

            <p-toast></p-toast>

            <!-- Loading -->
            <div *ngIf="loading" class="card"><h3>Loading…</h3></div>

            <!-- Error -->
            <div *ngIf="!loading && error && !done" class="card error">
              <h3>{{ error }}</h3>
            </div>

            <!-- Success -->
            <div *ngIf="done" class="card success">
              <h3>Account created</h3>
              <p>We sent you a verification email. Please click the link to activate your account.</p>
              <div class="mt-5 text-center">
                <button pButton label="Go to login" class="p-button" (click)="goLogin()"></button>
              </div>
            </div>

            <!-- Form -->
            <form *ngIf="!loading && preview && !done" #f="ngForm" (ngSubmit)="submit(f)">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <div>
                  <label class="block text-sm mb-2">Esprit Email</label>
                  <input pInputText [value]="preview.email" class="w-full" readonly />
                </div>
                <div>
                  <label class="block text-sm mb-2">Esprit ID</label>
                  <input pInputText [value]="preview.espritId" class="w-full" readonly />
                </div>
                <div>
                  <label class="block text-sm mb-2">First Name</label>
                  <input pInputText [value]="preview.firstName" class="w-full" readonly />
                </div>
                <div *ngIf="preview.middleName">
                  <label class="block text-sm mb-2">Middle Name</label>
                  <input pInputText [value]="preview.middleName" class="w-full" readonly />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm mb-2">Last Name</label>
                  <input pInputText [value]="preview.lastName" class="w-full" readonly />
                </div>
              </div>

              <p-divider class="my-4"></p-divider>

              <div class="mb-3">
                <label class="block text-sm mb-2">Password *</label>
                <p-password
                  name="password"
                  [(ngModel)]="password"
                  [toggleMask]="true"
                  [feedback]="false"
                  [inputStyleClass]="'w-full'"
                  required
                  [minlength]="6"
                  [maxlength]="40"
                  #pwd="ngModel">
                </p-password>
                <small class="hint">Min 6 chars, max 40.</small>
                <small class="err" *ngIf="pwd.errors?.['required'] && touched(pwd)">Password required.</small>
                <small class="err" *ngIf="(pwd.errors?.['minlength'] || pwd.errors?.['maxlength']) && touched(pwd)">Password length invalid.</small>
              </div>

              <div class="mb-5">
                <label class="block text-sm mb-2">Confirm Password *</label>
                <p-password
                  name="confirm"
                  [(ngModel)]="confirm"
                  [toggleMask]="true"
                  [feedback]="false"
                  [inputStyleClass]="'w-full'"
                  required
                  [minlength]="6"
                  [maxlength]="40"
                  #cp="ngModel">
                </p-password>
                <small class="err" *ngIf="confirm && password !== confirm">Passwords do not match.</small>
              </div>

              <div class="flex items-center justify-end gap-3">
                <button type="button" pButton class="p-button-outlined" label="Cancel" (click)="cancel()"></button>
                <button type="submit" pButton label="Create account"></button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hint { color:#94a3b8; display:block; margin-top:.25rem; }
    .err  { color:#ef4444; display:block; margin-top:.25rem; }
    .card.error { background:#fee2e2; padding:1rem; border-radius:.5rem; }
    .card.success { background:#ecfdf5; padding:1rem; border-radius:.5rem; }
  `]
})
export class SignupInviteComponent implements OnInit {
  token = '';
  loading = true;
  error = '';
  done = false;

  preview: InvitePreviewDto | null = null;

  password = '';
  confirm  = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private toast: MessageService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = 'Missing invite token.';
      this.loading = false;
      return;
    }
    this.auth.previewInvite(this.token).subscribe({
      next: (res) => { this.preview = res; this.loading = false; },
      error: (err) => { this.error = err?.error?.message || 'Invalid or expired invite.'; this.loading = false; }
    });
  }

  touched(ctrl: any) { return !!(ctrl?.dirty || ctrl?.touched); }

  submit(f: NgForm) {
    if (!this.preview) return;
    if (!f.valid || !this.password || !this.confirm) {
      Object.values(f.controls ?? {}).forEach(c => (c as any)?.markAsTouched?.());
      this.toast.add({severity:'warn', summary:'Validation', detail:'Please fill the required fields.'});
      return;
    }
    if (this.password !== this.confirm) {
      this.toast.add({severity:'warn', summary:'Validation', detail:'Passwords do not match.'});
      return;
    }

    this.loading = true;
    this.auth.completeSignup(this.token, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.done = true;
        this.toast.add({severity:'success', summary:'Account created', detail:'Check your email to verify your account.'});
      },
      error: (e) => {
        const msg = e?.error?.message || 'Signup failed.';
        this.loading = false;
        this.toast.add({severity:'error', summary:'Error', detail: msg});
      }
    });
  }

  cancel() { this.router.navigateByUrl('/'); }
  goLogin() { this.router.navigateByUrl('/auth/login'); }
}
