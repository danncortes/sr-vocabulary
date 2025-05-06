import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-login',
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    isLoading = signal(false);
    errorMessage = signal('');
    subscriptions: Subscription[] = [];

    constructor(private authService: AuthService) {}

    onSubmit(form: NgForm) {
        if (form.valid) {
            this.errorMessage.set('');
            this.isLoading.set(true);

            this.subscriptions.push(
                this.authService
                    .login(form.value.email, form.value.password)
                    .subscribe({
                        error: (error) => {
                            this.isLoading.set(false);
                            this.errorMessage.set(
                                error.message || 'Login failed',
                            );
                        },
                        complete: () => {
                            this.isLoading.set(false);
                        },
                    }),
            );
        }
    }
}
