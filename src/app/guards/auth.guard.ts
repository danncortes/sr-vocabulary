import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (await authService.initializeSession()) {
        return true;
    }

    return router.parseUrl('/login');
};
