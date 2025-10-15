// core/guards/role-home.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@/core/services/auth.service';

export const roleHomeGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Let activeOnlyGuard handle unauthenticated/inactive users
  if (!auth.isActive() || !auth.hasToken()) return true;

  const role = (auth.currentRole() || '').toUpperCase();

  switch (role) {
    case 'MOBILITY_OFFICER':
    case 'PARTNER':
      return router.parseUrl('/pages/offer/list');

    case 'ADMIN':
      return router.parseUrl('/uikit/users-list');

    default:
      // ⬅️ IMPORTANT: allow Dashboard to render
      return true;
  }
};
