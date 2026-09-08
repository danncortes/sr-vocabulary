import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { Session } from '@supabase/supabase-js';
import { AuthService } from './auth.service';

interface AuthServiceTestAccess {
    supabase: unknown;
    session: Session | null;
    resolveSessionWaiters(session: Session): void;
}

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

    it('forces Google consent for the configured account', async () => {
        const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
        const testService = service as unknown as AuthServiceTestAccess;
        testService.supabase = { auth: { signInWithOAuth } };

        await service.signInWithGoogle();

        expect(signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: {
                redirectTo: expect.stringContaining('auth/callback'),
                queryParams: {
                    prompt: 'consent',
                    authuser: '0',
                },
            },
        });
    });

    it('waits for Supabase to emit the OAuth session before navigating', async () => {
        const session = { access_token: 'access-token' } as Session;
        const testService = service as unknown as AuthServiceTestAccess;
        testService.supabase = {};

        const completion = service.completeOAuthSignIn();
        testService.session = session;
        testService.resolveSessionWaiters(session);

        await completion;

        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('returns to the login page on logout', async () => {
        await service.logout();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
});
