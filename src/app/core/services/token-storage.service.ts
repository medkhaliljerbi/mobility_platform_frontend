import { Injectable } from '@angular/core';

const KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  set(token?: string) {
    if (!token) { localStorage.removeItem(KEY); return; }
    localStorage.setItem(KEY, token);
  }

  get(): string | null {
    return localStorage.getItem(KEY);
  }

  clear() {
    localStorage.removeItem(KEY);
  }

  /** Best-effort JWT exp check (safe if not JWT) */
  isExpired(token?: string | null): boolean {
    const t = token ?? this.get();
    if (!t) return true;
    const parts = t.split('.');
    if (parts.length !== 3) return false; // non-JWT: let backend decide
    try {
      const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);
      if (!payload.exp) return false;
      const nowSec = Math.floor(Date.now() / 1000);
      return nowSec >= payload.exp;
    } catch {
      return false;
    }
  }
}
