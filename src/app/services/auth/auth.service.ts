import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

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

    login(
        email: string,
        password: string,
    ): Observable<Partial<{ access_token: string }>> {
        return this.http
            .post<Partial<{ access_token: string }>>(
                `${environment.apiUrl}/user/login`,
                {
                    email,
                    password,
                },
            )
            .pipe(
                tap((resp) => {
                    if (resp.access_token) {
                        this.setStorage('token', resp.access_token);
                        this.router.navigate(['/dashboard']);
                    }
                    return of(resp);
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
