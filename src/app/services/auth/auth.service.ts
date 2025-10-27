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
        const token = this.getStorage('token');
        if (!token) {
            return false;
        }

        // Check if token is well-formed and not expired
        if (!this.isTokenValid(token)) {
            this.removeStorage('token'); // Clean up invalid token
            return false;
        }

        return true;
    }

    getToken(): string | null {
        return this.getStorage('token');
    }

    private isTokenValid(token: string): boolean {
        try {
            // Check if token is well-formed (has 3 parts separated by dots)
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }

            const payload = this.decodeToken(token);
            if (!payload.exp) {
                return false; // If no expiration, consider it invalid
            }

            // JWT exp is in seconds, Date.now() is in milliseconds
            const expirationTime = payload.exp * 1000;
            return Date.now() < expirationTime; // Valid if not expired
        } catch {
            // If token can't be decoded or parsed, it's invalid
            return false;
        }
    }

    private decodeToken(token: string): {
        exp?: number;
        [key: string]: unknown;
    } {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    }
}
