import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth/auth.service';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authService: AuthService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormsModule, LoginComponent],
            providers: [AuthService, HttpClient, HttpHandler],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle two-factor login state and show correct button text', () => {
        const withTwoFactorButton: HTMLButtonElement =
            fixture.nativeElement.querySelector('button:first-child');
        const twoFactorSetupButton: HTMLButtonElement =
            fixture.nativeElement.querySelector('button:last-child');
        const login2FAButton: HTMLButtonElement =
            fixture.nativeElement.querySelector('.login-2FA-button');

        // Initially, "With Two Factor" should be active
        expect(withTwoFactorButton.classList).toContain('btn-primary');
        expect(twoFactorSetupButton.classList).not.toContain('btn-primary');
        expect(login2FAButton.textContent).toContain('Login with 2FA');

        // Click "Two Factor setup" button
        twoFactorSetupButton.click();
        fixture.detectChanges();

        const setup2FAButton: HTMLButtonElement =
            fixture.nativeElement.querySelector('.setup-2FA-button');

        // Now, "Two Factor setup" should be active
        expect(withTwoFactorButton.classList).not.toContain('btn-primary');
        expect(twoFactorSetupButton.classList).toContain('btn-primary');
        expect(setup2FAButton.textContent).toContain('Get 2FA QR');
    });

    it('should enable login button when form is valid', () => {
        const form = fixture.nativeElement.querySelector('form');
        const emailInput = form.querySelector('input[name="email"]');
        const passwordInput = form.querySelector('input[name="password"]');
        const loginButton = form.querySelector('button[type="submit"]');

        fixture.detectChanges();

        expect(loginButton.disabled).toBe(true);

        emailInput.value = 'test@example.com';
        emailInput.dispatchEvent(new Event('input'));
        passwordInput.value = 'password123';
        passwordInput.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(loginButton.disabled).toBe(false);
    });

    it('should show loading state when logging in', () => {
        vi.spyOn(window, 'prompt').mockReturnValue('123456');
        vi.spyOn(authService, 'login').mockReturnValue(of({}));

        const form = fixture.nativeElement.querySelector('form');
        const emailInput: HTMLInputElement = form.querySelector(
            'input[name="email"]',
        );
        const passwordInput: HTMLInputElement = form.querySelector(
            'input[name="password"]',
        );

        expect(emailInput.disabled).toBe(false);
        expect(passwordInput.disabled).toBe(false);

        component.onSubmit({
            valid: true,
            value: { email: 'test@example.com', password: 'password123' },
        } as NgForm);
        fixture.detectChanges();

        const loginButton: HTMLButtonElement =
            fixture.nativeElement.querySelector('button[type="submit"]');
        expect(loginButton.textContent).toContain('Logging in...');
        const spinner = loginButton.querySelector('.loading-spinner');
        expect(spinner).toBeTruthy();
        expect(emailInput.hasAttribute('disabled')).toBe(true);
        expect(passwordInput.hasAttribute('disabled')).toBe(true);
    });

    it('should show error message on login failure', async () => {
        vi.spyOn(window, 'prompt').mockReturnValue('123456'); // Mock prompt
        vi.spyOn(authService, 'login').mockReturnValue(
            throwError(() => new Error('Login failed')),
        );

        component.onSubmit({
            valid: true,
            value: { email: 'test@example.com', password: 'wrongpassword' },
        } as NgForm);
        await fixture.whenStable();
        fixture.detectChanges();

        const errorMessage =
            fixture.nativeElement.querySelector('.error-message');
        expect(errorMessage.textContent).toContain('Login failed');
    });
});
