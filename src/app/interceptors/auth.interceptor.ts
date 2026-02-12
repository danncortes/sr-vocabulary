import {
    HttpInterceptorFn,
    HttpErrorResponse,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

const AUTH_ERROR_MESSAGES = ['expired', 'Invalid or missing token'];

let isRefreshing = false;

const addToken = (
    req: HttpRequest<unknown>,
    token: string,
): HttpRequest<unknown> => {
    return req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Skip auth for refresh endpoint to avoid infinite loop
    if (req.url.includes('/user/refresh')) {
        return next(req);
    }

    if (token) {
        return next(addToken(req, token)).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    const errorMessage = error.error?.error || '';
                    if (
                        AUTH_ERROR_MESSAGES.some((msg) =>
                            errorMessage.includes(msg),
                        )
                    ) {
                        // Try to refresh the token
                        if (!isRefreshing) {
                            isRefreshing = true;
                            return authService.refreshToken().pipe(
                                switchMap((result) => {
                                    isRefreshing = false;
                                    if (result?.access_token) {
                                        // Retry the original request with new token
                                        return next(
                                            addToken(req, result.access_token),
                                        );
                                    }
                                    return throwError(() => error);
                                }),
                                catchError((refreshError) => {
                                    isRefreshing = false;
                                    authService.logout();
                                    return throwError(() => refreshError);
                                }),
                            );
                        }
                    }
                }
                return throwError(() => error);
            }),
        );
    }

    return next(req);
};
