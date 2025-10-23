import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    if (token) {
        const authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
        return next(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (
                    error.status === 401 &&
                    error.error?.error?.includes('expired')
                ) {
                    authService.logout();
                }
                return throwError(() => error);
            }),
        );
    }

    return next(req);
};
