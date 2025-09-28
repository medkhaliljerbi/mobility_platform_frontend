// src/app/pages/auth/auth.routes.ts
import { Routes } from '@angular/router';
import { Access } from './access';
import { Error } from './error';
import { Login } from './login';
import { Signup } from './signup';
import { SignupInviteComponent } from './signup-invite/signup-invite.component';
import {LoginOtherComponent} from './login-other';
import{FirstLoginPasswordComponent} from './first-login-password';
// ⬇️ lazy load the headless verify component
const VerifyEmailSilent = () =>
  import('./signup-invite/verify-email-silent.component').then(m => m.VerifyEmailSilentComponent);

export default [
  { path: 'access',    component: Access },
  { path: 'error',     component: Error },
  { path: 'login',     component: Login },
  { path: 'signup',    component: Signup },
  { path:'other_login',component:LoginOtherComponent},
 { path:'first-login',component:FirstLoginPasswordComponent},
  // invite flow form (you already had this)
  { path: 'preverify', component: SignupInviteComponent },

  // ⬅️ NEW: headless verify route. Email links must point to /auth/verify-email?token=...
  { path: 'verify-email', loadComponent: VerifyEmailSilent },

] as Routes;
