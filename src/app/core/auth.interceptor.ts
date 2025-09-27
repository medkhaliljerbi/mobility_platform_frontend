import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { TokenStorageService } from './services/token-storage.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStorageService);
  const router = inject(Router);

  const token = tokens.get();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
        tokens.clear();
        // ✅ make sure we use the real login route in your app
        if (!router.url.startsWith('/auth/login')) {
          router.navigateByUrl('/auth/login');
        }
      }
      return throwError(() => err);
    })
  );
};
