import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../services/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let signInWithGoogle: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        signInWithGoogle = vi.fn().mockResolvedValue(undefined);
        await TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [
                {
                    provide: AuthService,
                    useValue: { signInWithGoogle },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders Google as the only login method', () => {
        expect(component).toBeTruthy();
        expect(
            fixture.nativeElement.querySelector('.google-login-button')
                .textContent,
        ).toContain('Continue with Google');
        expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });

    it('starts Google sign-in', async () => {
        await component.loginWithGoogle();
        expect(signInWithGoogle).toHaveBeenCalledOnce();
    });

    it('shows an authentication error', async () => {
        signInWithGoogle.mockRejectedValueOnce(new Error('OAuth failed'));
        await component.loginWithGoogle();
        fixture.detectChanges();

        expect(
            fixture.nativeElement.querySelector('.error-message').textContent,
        ).toContain('OAuth failed');
    });
});
