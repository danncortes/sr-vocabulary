import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    const router = { navigate: vi.fn().mockResolvedValue(true) };

    beforeEach(() => {
        router.navigate.mockClear();
        TestBed.configureTestingModule({
            providers: [{ provide: Router, useValue: router }],
        });
        service = TestBed.inject(AuthService);
    });

    it('starts unauthenticated when Supabase is not configured', async () => {
        expect(await service.initializeSession()).toBe(false);
        expect(service.getToken()).toBeNull();
    });

    it('reports missing public configuration when login is attempted', async () => {
        await expect(service.signInWithGoogle()).rejects.toThrow(
            'The Supabase URL and publishable key are not configured.',
        );
    });

    it('returns to the login page on logout', async () => {
        await service.logout();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
});
