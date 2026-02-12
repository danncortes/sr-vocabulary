import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService, NotificationsDict } from '../../services/toast/toast.service';
import { signal, WritableSignal } from '@angular/core';

describe('ToastComponent', () => {
    let component: ToastComponent;
    let fixture: ComponentFixture<ToastComponent>;
    let mockToastService: {
        notifications: WritableSignal<NotificationsDict>;
        toast: jasmine.Spy;
        dismiss: jasmine.Spy;
    };

    beforeEach(async () => {
        mockToastService = {
            notifications: signal<NotificationsDict>({}),
            toast: jasmine.createSpy('toast'),
            dismiss: jasmine.createSpy('dismiss'),
        };

        await TestBed.configureTestingModule({
            imports: [ToastComponent],
            providers: [{ provide: ToastService, useValue: mockToastService }],
        }).compileComponents();

        fixture = TestBed.createComponent(ToastComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should inject ToastService', () => {
        expect(component.toastService).toBeTruthy();
    });

    describe('notifications rendering', () => {
        it('should display no notifications when empty', () => {
            mockToastService.notifications.set({});
            fixture.detectChanges();
            const alerts = fixture.nativeElement.querySelectorAll('.alert');
            expect(alerts.length).toBe(0);
        });

        it('should display a single notification', () => {
            mockToastService.notifications.set({
                1: { message: 'Test message', type: 'info', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            const alerts = fixture.nativeElement.querySelectorAll('.alert');
            expect(alerts.length).toBe(1);
        });

        it('should display multiple notifications', () => {
            mockToastService.notifications.set({
                1: { message: 'Message 1', type: 'info', duration: 5000, permanent: false },
                2: { message: 'Message 2', type: 'success', duration: 5000, permanent: false },
                3: { message: 'Message 3', type: 'error', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            const alerts = fixture.nativeElement.querySelectorAll('.alert');
            expect(alerts.length).toBe(3);
        });

        it('should display notification message text', () => {
            mockToastService.notifications.set({
                1: { message: 'Hello World', type: 'info', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            const span = fixture.nativeElement.querySelector('.alert span');
            expect(span.textContent).toBe('Hello World');
        });
    });

    describe('notification types', () => {
        it('should apply alert-info class for info type', () => {
            mockToastService.notifications.set({
                1: { message: 'Info message', type: 'info', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            const alert = fixture.nativeElement.querySelector('.alert');
            expect(alert.classList.contains('alert-info')).toBeTrue();
        });

        it('should apply alert-success class for success type', () => {
            mockToastService.notifications.set({
                1: { message: 'Success message', type: 'success', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            const alert = fixture.nativeElement.querySelector('.alert');
            expect(alert.classList.contains('alert-success')).toBeTrue();
        });

        it('should apply alert-error class for error type', () => {
            mockToastService.notifications.set({
                1: { message: 'Error message', type: 'error', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            const alert = fixture.nativeElement.querySelector('.alert');
            expect(alert.classList.contains('alert-error')).toBeTrue();
        });
    });

    describe('notification styling', () => {
        it('should have shadow-lg class on alerts', () => {
            mockToastService.notifications.set({
                1: { message: 'Test', type: 'info', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            const alert = fixture.nativeElement.querySelector('.alert');
            expect(alert.classList.contains('shadow-lg')).toBeTrue();
        });

        it('should have rounded-lg class on alerts', () => {
            mockToastService.notifications.set({
                1: { message: 'Test', type: 'info', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            const alert = fixture.nativeElement.querySelector('.alert');
            expect(alert.classList.contains('rounded-lg')).toBeTrue();
        });

        it('should have text-white class on message span', () => {
            mockToastService.notifications.set({
                1: { message: 'Test', type: 'info', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            const span = fixture.nativeElement.querySelector('.alert span');
            expect(span.classList.contains('text-white')).toBeTrue();
        });
    });

    describe('dynamic updates', () => {
        it('should update when notifications are added', () => {
            mockToastService.notifications.set({});
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelectorAll('.alert').length).toBe(0);

            mockToastService.notifications.set({
                1: { message: 'New notification', type: 'success', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelectorAll('.alert').length).toBe(1);
        });

        it('should update when notifications are removed', () => {
            mockToastService.notifications.set({
                1: { message: 'Message 1', type: 'info', duration: 5000, permanent: false },
                2: { message: 'Message 2', type: 'info', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelectorAll('.alert').length).toBe(2);

            mockToastService.notifications.set({
                1: { message: 'Message 1', type: 'info', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelectorAll('.alert').length).toBe(1);
        });

        it('should clear all notifications when set to empty', () => {
            mockToastService.notifications.set({
                1: { message: 'Message 1', type: 'info', duration: 5000, permanent: false },
                2: { message: 'Message 2', type: 'success', duration: 5000, permanent: false },
            });
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelectorAll('.alert').length).toBe(2);

            mockToastService.notifications.set({});
            fixture.detectChanges();
            expect(fixture.nativeElement.querySelectorAll('.alert').length).toBe(0);
        });
    });

    describe('toast container', () => {
        it('should have toast container element', () => {
            const toastContainer = fixture.nativeElement.querySelector('.toast');
            expect(toastContainer).toBeTruthy();
        });
    });
});
