import { TestBed } from '@angular/core/testing';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: Router, useValue: routerSpy },
                { provide: PLATFORM_ID, useValue: 'browser' },
            ],
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);

        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('login', () => {
        it('should store access_token and refresh_token on successful login', () => {
            const mockResponse = {
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
            };

            service
                .login('test@example.com', 'password', '123456')
                .subscribe();

            const req = httpMock.expectOne(
                `${environment.apiBaseUrl}/user/login`,
            );
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                email: 'test@example.com',
                password: 'password',
                code: '123456',
            });

            req.flush(mockResponse);

            expect(localStorage.getItem('token')).toBe('test-access-token');
            expect(localStorage.getItem('refresh_token')).toBe(
                'test-refresh-token',
            );
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
        });

        it('should not navigate if no access_token in response', () => {
            const mockResponse = { message: 'unverified', factorId: '123' };

            service
                .login('test@example.com', 'password', '')
                .subscribe();

            const req = httpMock.expectOne(
                `${environment.apiBaseUrl}/user/login`,
            );
            req.flush(mockResponse);

            expect(localStorage.getItem('token')).toBeNull();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('should remove token and refresh_token from storage', () => {
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('refresh_token', 'test-refresh');

            service.logout();

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('refresh_token')).toBeNull();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
        });
    });

    describe('getToken', () => {
        it('should return token from storage', () => {
            localStorage.setItem('token', 'stored-token');
            expect(service.getToken()).toBe('stored-token');
        });

        it('should return null if no token', () => {
            expect(service.getToken()).toBeNull();
        });
    });

    describe('getRefreshToken', () => {
        it('should return refresh_token from storage', () => {
            localStorage.setItem('refresh_token', 'stored-refresh-token');
            expect(service.getRefreshToken()).toBe('stored-refresh-token');
        });

        it('should return null if no refresh_token', () => {
            expect(service.getRefreshToken()).toBeNull();
        });
    });

    describe('refreshToken', () => {
        it('should return null if no refresh_token in storage', () => {
            service.refreshToken().subscribe((result) => {
                expect(result).toBeNull();
            });
        });

        it('should call refresh endpoint and update tokens', () => {
            localStorage.setItem('refresh_token', 'old-refresh-token');

            const mockResponse = {
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
            };

            service.refreshToken().subscribe((result) => {
                expect(result).toEqual(mockResponse);
            });

            const req = httpMock.expectOne(
                `${environment.apiBaseUrl}/user/refresh`,
            );
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                refresh_token: 'old-refresh-token',
            });

            req.flush(mockResponse);

            expect(localStorage.getItem('token')).toBe('new-access-token');
            expect(localStorage.getItem('refresh_token')).toBe(
                'new-refresh-token',
            );
        });

        it('should logout and return null on refresh error', () => {
            localStorage.setItem('token', 'old-token');
            localStorage.setItem('refresh_token', 'old-refresh-token');

            service.refreshToken().subscribe((result) => {
                expect(result).toBeNull();
            });

            const req = httpMock.expectOne(
                `${environment.apiBaseUrl}/user/refresh`,
            );
            req.flush({ error: 'Invalid token' }, { status: 401, statusText: 'Unauthorized' });

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('refresh_token')).toBeNull();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
        });
    });

    describe('isAuthenticated', () => {
        it('should return false if no token', () => {
            expect(service.isAuthenticated()).toBeFalse();
        });

        it('should return false for invalid token format', () => {
            localStorage.setItem('token', 'invalid-token');
            expect(service.isAuthenticated()).toBeFalse();
        });

        it('should return false for expired token', () => {
            // Create an expired JWT (exp in the past)
            const expiredPayload = btoa(
                JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }),
            );
            const expiredToken = `header.${expiredPayload}.signature`;
            localStorage.setItem('token', expiredToken);

            expect(service.isAuthenticated()).toBeFalse();
        });

        it('should return true for valid non-expired token', () => {
            // Create a valid JWT (exp in the future)
            const validPayload = btoa(
                JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
            );
            const validToken = `header.${validPayload}.signature`;
            localStorage.setItem('token', validToken);

            expect(service.isAuthenticated()).toBeTrue();
        });
    });
});
