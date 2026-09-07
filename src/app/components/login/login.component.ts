import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    private readonly authService = inject(AuthService);

    readonly isLoading = signal(false);
    readonly errorMessage = signal('');

    async loginWithGoogle(): Promise<void> {
        this.errorMessage.set('');
        this.isLoading.set(true);

        try {
            await this.authService.signInWithGoogle();
        } catch (error) {
            this.errorMessage.set(
                error instanceof Error
                    ? error.message
                    : 'Unable to sign in with Google.',
            );
            this.isLoading.set(false);
        }
    }
}
