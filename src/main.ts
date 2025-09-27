// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';

import { authInterceptorFn } from './app/core/auth.interceptor';
import { TokenStorageService } from './app/core/services/token-storage.service';

function clearExpiredTokenOnStart(tokens: TokenStorageService) {
  // Runs once at app bootstrap; removes an already-expired JWT from localStorage
  return () => { if (tokens.isExpired()) tokens.clear(); };
}

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),

    // ✅ HTTP client with Authorization header + 401/403 handling
    provideHttpClient(withInterceptors([authInterceptorFn])),

    // ✅ Clear expired token on startup
    { provide: APP_INITIALIZER, useFactory: clearExpiredTokenOnStart, deps: [TokenStorageService], multi: true }
  ]
}).catch((err) => console.error(err));
