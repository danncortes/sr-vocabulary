import { Component, OnDestroy, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { from, Observable, Subscription, switchMap } from 'rxjs';

@Component({
    selector: 'app-login',
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnDestroy {
    isLoading = signal(false);
    errorMessage = signal('');
    subscriptions: Subscription[] = [];
    qrCodeUrl = signal('');
    twoFactorloginActive = signal(true);

    constructor(private authService: AuthService) {}

    onSubmit(form: NgForm) {
        if (form.valid) {
            this.errorMessage.set('');
            this.isLoading.set(true);

            const loginSubscription = this.getTwoFactorCode()
                .pipe(
                    switchMap((code) => {
                        return this.authService.login(
                            form.value.email,
                            form.value.password,
                            code,
                        );
                    }),
                )
                .subscribe({
                    next: () => {
                        this.isLoading.set(false);
                        // Handle successful login
                    },
                    error: (error) => {
                        this.isLoading.set(false);
                        this.errorMessage.set(error.message || 'Login failed');
                    },
                    complete: () => {
                        this.isLoading.set(false);
                    },
                });

            this.subscriptions.push(loginSubscription);
        }
    }

    getTwoFactorCode(): Observable<string> {
        return from(
            new Promise<string>((resolve) => {
                const code = prompt('Enter your 2FA code:');
                resolve(code || '');
            }),
        );
    }

    setTwoFactorloginActive(value: boolean) {
        this.twoFactorloginActive.set(value);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
