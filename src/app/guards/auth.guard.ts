import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { isSupabaseConfigured } from '../core/supabase-client';

export const authGuard: CanActivateFn = async () => {
  if (!isSupabaseConfigured) return true;

  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ensureReady();

  if (authService.session()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
