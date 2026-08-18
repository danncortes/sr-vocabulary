import type { MockedObject } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
    HttpClient,
    HttpErrorResponse,
    provideHttpClient,
    withInterceptors,
} from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth/auth.service';

describe('authInterceptor', () => {
    let httpClient: HttpClient;
    let httpMock: HttpTestingController;
    let authServiceSpy: Pick<
        MockedObject<AuthService>,
        'getToken' | 'logout' | 'refreshToken'
    >;

    beforeEach(() => {
        authServiceSpy = {
            getToken: vi.fn().mockName('AuthService.getToken'),
            logout: vi.fn().mockName('AuthService.logout'),
            refreshToken: vi.fn().mockName('AuthService.refreshToken'),
        };

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceSpy },
            ],
        });

        httpClient = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should add Authorization header when token exists', () => {
        authServiceSpy.getToken.mockReturnValue('test-token');

        httpClient.get('/api/test').subscribe();

        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.get('Authorization')).toBe(
            'Bearer test-token',
        );
        req.flush({});
    });

    it('should not add Authorization header when no token', () => {
        authServiceSpy.getToken.mockReturnValue(null);

        httpClient.get('/api/test').subscribe();

        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
    });

    it('should skip auth for refresh endpoint', () => {
        authServiceSpy.getToken.mockReturnValue('test-token');

        httpClient.post('/user/refresh', {}).subscribe();

        const req = httpMock.expectOne('/user/refresh');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
    });

    it('should attempt token refresh on 401 with expired message', () => {
        authServiceSpy.getToken.mockReturnValue('old-token');
        authServiceSpy.refreshToken.mockReturnValue(
            of({ access_token: 'new-token', refresh_token: 'new-refresh' }),
        );

        httpClient.get('/api/test').subscribe();

        const req = httpMock.expectOne('/api/test');
        req.flush(
            { error: 'expired' },
            { status: 401, statusText: 'Unauthorized' },
        );

        expect(authServiceSpy.refreshToken).toHaveBeenCalled();

        // After refresh, the interceptor retries the original request
        const retryReq = httpMock.expectOne('/api/test');
        expect(retryReq.request.headers.get('Authorization')).toBe(
            'Bearer new-token',
        );
        retryReq.flush({});
    });

    it('should logout when refresh fails', () => {
        authServiceSpy.getToken.mockReturnValue('old-token');
        authServiceSpy.refreshToken.mockReturnValue(
            throwError(() => new Error('Refresh failed')),
        );

        httpClient.get('/api/test').subscribe({
            error: () => undefined,
        });

        const req = httpMock.expectOne('/api/test');
        req.flush(
            { error: 'expired' },
            { status: 401, statusText: 'Unauthorized' },
        );

        expect(authServiceSpy.logout).toHaveBeenCalled();
    });

    it('should pass through non-401 errors', () => {
        authServiceSpy.getToken.mockReturnValue('test-token');

        let errorResponse: HttpErrorResponse | undefined;
        httpClient.get('/api/test').subscribe({
            error: (err) => (errorResponse = err),
        });

        const req = httpMock.expectOne('/api/test');
        req.flush(
            { error: 'Server error' },
            { status: 500, statusText: 'Internal Server Error' },
        );

        expect(errorResponse?.status).toBe(500);
        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
        expect(authServiceSpy.logout).not.toHaveBeenCalled();
    });
});
