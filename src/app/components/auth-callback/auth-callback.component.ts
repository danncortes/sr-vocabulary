import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
    selector: 'app-auth-callback',
    template: `
        <main class="flex min-h-screen items-center justify-center bg-gray-200 px-4">
            <section class="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-lg">
                @if (errorMessage()) {
                    <h1 class="mb-3 text-xl font-semibold">Unable to sign in</h1>
                    <p class="mb-6 text-sm text-red-600" role="alert">
                        {{ errorMessage() }}
                    </p>
                    <button class="btn btn-primary" (click)="returnToLogin()">
                        Return to sign in
                    </button>
                } @else {
                    <span class="loading loading-spinner loading-lg"></span>
                    <p class="mt-4 text-sm text-gray-600">Completing sign-in…</p>
                }
            </section>
        </main>
    `,
})
export class AuthCallbackComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    readonly errorMessage = signal('');

    async ngOnInit(): Promise<void> {
        try {
            await this.authService.completeOAuthSignIn();
        } catch (error) {
            this.errorMessage.set(
                error instanceof Error
                    ? error.message
                    : 'Unable to complete sign-in with Google.',
            );
        }
    }

    returnToLogin(): void {
        void this.router.navigate(['/login']);
    }
}
