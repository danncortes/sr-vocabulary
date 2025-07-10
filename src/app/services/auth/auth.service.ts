import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

type LoginResponse = TwoFARequiredResponse | UnverifiedTwoFAResponse;
export interface TwoFARequiredResponse {
    message: '2FA required';
    factorId: string;
    userId: string;
    token: string;
}
export interface UnverifiedTwoFAResponse {
    message: 'unverified';
    factorId: string;
    token: string;
}

export interface TwoFactorEnrollResponse {
    id: string;
    type: 'totp';
    friendly_name: string;
    totp: {
        qr_code: string;
        secret: string;
        uri: string;
    };
}

interface TwoFactorResponse {
    access_token: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private baseUrl = `${environment.apiBaseUrl}`;

    constructor(@Inject(PLATFORM_ID) private platformId: object) {}

    private getStorage(key: string): string | null {
        if (isPlatformBrowser(this.platformId)) {
            return sessionStorage.getItem(key);
        }
        return null;
    }

    private setStorage(key: string, value: string): void {
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem(key, value);
        }
    }

    private removeStorage(key: string): void {
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.removeItem(key);
        }
    }

    // TODO: add two-factor authentication
    login(
        email: string,
        password: string,
        code: string,
    ): Observable<
        Partial<LoginResponse | TwoFactorEnrollResponse | TwoFactorResponse>
    > {
        return this.http
            .post<Partial<TwoFactorResponse>>(`${this.baseUrl}/user/login`, {
                email,
                password,
                code,
            })
            .pipe(
                tap((resp) => {
                    if (resp.access_token) {
                        this.setStorage('token', resp.access_token);
                        this.router.navigate(['/dashboard']);
                    }
                    return of(resp);
                }),
                catchError((error) => {
                    console.error(
                        'Error during two-factor verification:',
                        error,
                    ); // Error log
                    throw error;
                }),
            );
    }

    logout(): void {
        this.removeStorage('token');
        this.router.navigate(['/login']);
    }

    isAuthenticated(): boolean {
        return !!this.getStorage('token');
    }

    getToken(): string | null {
        return this.getStorage('token');
    }
}
