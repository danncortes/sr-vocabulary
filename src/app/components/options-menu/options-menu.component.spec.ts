import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

import { OptionsMenuComponent } from './options-menu.component';
import { VocabularyStore } from '../../store/vocabulary.store';

describe('OptionsMenuComponent', () => {
    let component: OptionsMenuComponent;
    let fixture: ComponentFixture<OptionsMenuComponent>;
    let mockVocabularyStore: Partial<VocabularyStore>;

    beforeEach(async () => {
        mockVocabularyStore = {
            getAudio: jasmine.createSpy().and.returnValue(of('audio-url')),
            setReviewedVocabulary: jasmine.createSpy().and.returnValue(of({})),
            delayVocabulary: jasmine.createSpy().and.returnValue(of({})),
        };

        await TestBed.configureTestingModule({
            imports: [OptionsMenuComponent],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(OptionsMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('disables all menu buttons when disabled input is true', () => {
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();

        const buttons = fixture.debugElement.queryAll(
            By.css('.options-menu__option'),
        );
        expect(buttons.length).toBeGreaterThan(0);
        buttons.forEach((btn) => {
            expect(btn.nativeElement.disabled).toBeTrue();
        });
    });

    it('enables all menu buttons when disabled input is false', () => {
        fixture.componentRef.setInput('disabled', false);
        fixture.detectChanges();

        const buttons = fixture.debugElement.queryAll(
            By.css('.options-menu__option'),
        );
        expect(buttons.length).toBeGreaterThan(0);
        buttons.forEach((btn) => {
            expect(btn.nativeElement.disabled).toBeFalse();
        });
    });
});
