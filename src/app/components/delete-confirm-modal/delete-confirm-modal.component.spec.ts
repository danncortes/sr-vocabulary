import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteConfirmModalComponent } from '../delete-confirm-modal/delete-confirm-modal.component';

describe('DeleteConfirmModalComponent', () => {
    let fixture: ComponentFixture<DeleteConfirmModalComponent>;
    let component: DeleteConfirmModalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeleteConfirmModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DeleteConfirmModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders count and disables confirm when busy', () => {
        fixture.componentRef.setInput('count', 3);
        fixture.componentRef.setInput('busy', true);
        fixture.detectChanges();

        const textEl =
            fixture.debugElement.nativeElement.querySelector(
                '.bg-white .text-sm',
            );
        expect(textEl.textContent.trim()).toContain(
            'Delete 3 selected item(s)?',
        );

        const confirmBtn =
            fixture.debugElement.nativeElement.querySelector('.btn-error');
        expect(confirmBtn.disabled).toBeTrue();
    });

    it('emits cancel and confirm', () => {
        spyOn(component.cancelModal, 'emit');
        spyOn(component.confirm, 'emit');

        fixture.componentRef.setInput('count', 1);
        fixture.componentRef.setInput('busy', false);
        fixture.detectChanges();

        const cancelBtn = fixture.debugElement.nativeElement.querySelector(
            '.bg-white .btn.btn-sm:not(.btn-error)',
        );
        const confirmBtn =
            fixture.debugElement.nativeElement.querySelector('.btn-error');

        cancelBtn.click();
        fixture.detectChanges();
        expect(component.cancelModal.emit).toHaveBeenCalled();

        confirmBtn.click();
        fixture.detectChanges();
        expect(component.confirm.emit).toHaveBeenCalled();
    });
});
