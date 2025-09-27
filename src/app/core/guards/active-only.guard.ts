import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

export const activeOnlyGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);

  // Always allow auth pages
  const url = state.url || '';
  const allow = ['/auth/login', '/auth/signup', '/auth/verify-email', '/auth/forgot-password'];
  if (allow.some(p => url.startsWith(p))) return true;

  // If user is not marked active locally, push back to login
  const isActive = localStorage.getItem('user_active') === 'true';
  if (!isActive) {
    return router.createUrlTree(['/auth/login'], { queryParams: { inactive: 1 } });
  }

  return true;
};
