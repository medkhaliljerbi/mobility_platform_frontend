// src/app/pages/auth/auth.routes.ts
import { Routes } from '@angular/router';
import { Access } from './access';
import { Error } from './error';
import { Login } from './login';
import { Signup } from './signup';
import { SignupInviteComponent } from './signup-invite/signup-invite.component';
import { LoginOtherComponent } from './login-other';
import { FirstLoginPasswordComponent } from './first-login-password';

const VerifyEmailSilent = () =>
  import('./signup-invite/verify-email-silent.component').then(m => m.VerifyEmailSilentComponent);

const ResetPassword = () =>
  import('./password_recovery/reset-password.component').then(m => m.ResetPasswordComponent);

export default [
  { path: 'access',        component: Access },
  { path: 'error',         component: Error },
  { path: 'login',         component: Login },
  { path: 'signup',        component: Signup },
  { path: 'other_login',   component: LoginOtherComponent },
  { path: 'first-login',   component: FirstLoginPasswordComponent },
  { path: 'preverify',     component: SignupInviteComponent },
  { path: 'verify-email',  loadComponent: VerifyEmailSilent },

  // 👇 use the LAZY factory here (not the class)
  { path: 'reset-password', loadComponent: ResetPassword },
] as Routes;
