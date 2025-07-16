import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { PhraseComponent } from './phrase.component';
import { VocabularyStore } from './../../store/vocabulary.store';
import { TranslatedPhrase } from '../../types/types';
import { DelayMenuComponent } from '../delay-menu/delay-menu.component';

describe('PhraseComponent', () => {
    let component: PhraseComponent;
    let fixture: ComponentFixture<PhraseComponent>;
    let mockVocabularyStore: Partial<VocabularyStore>;

    beforeEach(async () => {
        mockVocabularyStore = {
            getAudio: jasmine.createSpy().and.returnValue(of('audio-url')),
            setReviewedVocabulary: jasmine.createSpy().and.returnValue(of({})),
            delayVocabulary: jasmine.createSpy().and.returnValue(of({})),
        };

        await TestBed.configureTestingModule({
            imports: [PhraseComponent],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PhraseComponent);
        component = fixture.componentInstance;

        (component as any).translatedPhrase = signal<TranslatedPhrase>({
            id: 1,
            original: { id: 1, text: 'Hola', audio_url: '' },
            translated: { id: 2, text: 'Hello', audio_url: '' },
            review_date: '2025-07-16',
            sr_stage_id: 1,
            modified_at: '',
            learned: 0,
            priority: 0,
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show original phrase', () => {
        const originalBtn = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__original',
        );
        expect(originalBtn.textContent.trim()).toEqual('Hola');
    });

    it('should toggle translation visibility and show translation', () => {
        const originalBtn = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__original',
        );
        expect(component.isTranlationVisible()).toBeFalse();

        originalBtn.click();
        expect(component.isTranlationVisible()).toBeTrue();

        fixture.detectChanges();

        const translatedDiv = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__translated',
        );
        expect(translatedDiv.textContent.trim()).toEqual('Hello');
    });

    it('should show play original phrase audio button', () => {
        const audioButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__play-audio--original',
        );
        expect(audioButton).toBeTruthy();
        audioButton.click();
        expect(mockVocabularyStore.getAudio).toHaveBeenCalledWith(1);
    });

    it('should show play translated phrase audio button', () => {
        const originalBtn = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__original',
        );
        originalBtn.click();
        fixture.detectChanges();

        const audioButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__play-audio--translated',
        );
        expect(audioButton).toBeTruthy();
        audioButton.click();
        expect(mockVocabularyStore.getAudio).toHaveBeenCalledWith(2);
    });

    it('should show review vocabulary button', () => {
        const reviewButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__review-button',
        );
        expect(reviewButton).toBeTruthy();
        reviewButton.click();
        expect(mockVocabularyStore.setReviewedVocabulary).toHaveBeenCalledWith(
            1,
        );
    });

    it('should show review date', () => {
        const reviewDate = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__review-date',
        );
        expect(reviewDate).toBeTruthy();
        expect(reviewDate.textContent.trim()).toContain('16 Jul 25');
    });

    it('should not show review date', () => {
        (component as any).showReviewDate = signal<boolean>(false);

        fixture.detectChanges();
        const reviewDate = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__review-date',
        );
        expect(reviewDate).toBeFalsy();
    });

    it('should show stage', () => {
        const stage = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__stage',
        );
        expect(stage).toBeTruthy();
        expect(stage.textContent.trim()).toContain('Stage 1');
    });

    it('should not show stage', () => {
        (component as any).showStage = signal<boolean>(false);

        fixture.detectChanges();
        const stage = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__stage',
        );
        expect(stage).toBeFalsy();
    });

    it('should show delay menu button', () => {
        const delayMenuTrigger =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component__delay-button',
            );
        expect(delayMenuTrigger).toBeTruthy();
    });

    it('should not show delay menu', () => {
        (component as any).showMenu = signal<boolean>(false);

        fixture.detectChanges();
        const delayMenuTrigger =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component__delay-button',
            );
        expect(delayMenuTrigger).toBeFalsy();
    });

    it('should show delay menu options and call delay on click', () => {
        const delayMenuTrigger =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component__delay-button',
            );

        delayMenuTrigger.click();
        fixture.detectChanges();

        const delayMenu = fixture.debugElement.query(
            By.directive(DelayMenuComponent),
        );

        expect(delayMenu).toBeTruthy();
        console.log('🚀 ~ it ~ delayMenu:', delayMenu);

        const delayOptions = delayMenu.nativeElement.querySelectorAll(
            '.delay-menu__option',
        );

        expect(delayOptions.length).toBe(5);

        delayOptions[0].click();
        expect(mockVocabularyStore.delayVocabulary).toHaveBeenCalledWith(
            [1],
            1,
        );
    });

    it('should call setReviewedVocabulary and set loading', () => {
        component.setReviewedVocabulary(1);
        expect(mockVocabularyStore.setReviewedVocabulary).toHaveBeenCalledWith(
            1,
        );
        expect(component.isReviewLoading()).toBeFalse();
    });

    it('should not show select checkbox by default', () => {
        const checkbox = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__select-checkbox',
        );

        expect(checkbox).toBeFalsy();
    });

    it('should emit selectedChange when checkbox is clicked', () => {
        spyOn(component.selectedChange, 'emit');

        (component as any).showSelectCheckbox = signal<boolean>(true);

        fixture.detectChanges();

        const checkbox = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__select-checkbox',
        );

        expect(checkbox).toBeTruthy();

        checkbox.click();
        fixture.detectChanges();

        expect(component.selectedChange.emit).toHaveBeenCalledWith(1);
    });
});
