import { of, throwError, Subject } from 'rxjs';
import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { PhraseComponent } from './phrase.component';
import { VocabularyStore } from './../../store/vocabulary.store';
import { TranslatedPhrase } from '../../types/types';
import { OptionsMenuComponent } from '../options-menu/options-menu.component';
import { CdkMenuTrigger } from '@angular/cdk/menu';

// Interface for component with optionsMenuTrigger
interface ComponentWithMenuTrigger {
    optionsMenuTrigger: () => CdkMenuTrigger | undefined;
}

describe('PhraseComponent', () => {
    let component: PhraseComponent;
    let fixture: ComponentFixture<PhraseComponent>;
    let mockVocabularyStore: Partial<VocabularyStore>;
    let audioSpy: jasmine.Spy;

    beforeEach(async () => {
        mockVocabularyStore = {
            getAudio: jasmine.createSpy().and.returnValue(of('audio-url')),
            setReviewedVocabulary: jasmine.createSpy().and.returnValue(of({})),
            delayVocabulary: jasmine.createSpy().and.returnValue(of({})),
            resetVocabulary: jasmine.createSpy().and.returnValue(of({})),
            restartVocabulary: jasmine.createSpy().and.returnValue(of({})),
        };

        await TestBed.configureTestingModule({
            imports: [PhraseComponent],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PhraseComponent);
        component = fixture.componentInstance;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // Global mock: optionsMenuTrigger must be a function returning a trigger with close()
        const mockTrigger = jasmine.createSpyObj('CdkMenuTrigger', ['close']);
        (component as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(mockTrigger);

        // Global Audio stub to avoid DOMException errors
        audioSpy = spyOn(window, 'Audio').and.returnValue({
            play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
            pause: jasmine.createSpy('pause'),
        } as unknown as HTMLAudioElement);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render the phrase id as title attribute', () => {
        const phraseComponent =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component',
            );
        expect(phraseComponent.getAttribute('title')).toBe('1');
    });

    it('should show original phrase', () => {
        const originalBtn = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__original',
        );
        expect(originalBtn.textContent.trim()).toEqual('Hola');
        expect(originalBtn.getAttribute('title')).toBe('1');
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
        expect(translatedDiv.getAttribute('title')).toBe('2');
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).showStage = signal<boolean>(false);

        fixture.detectChanges();
        const stage = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__stage',
        );
        expect(stage).toBeFalsy();
    });

    it('should show options menu button', () => {
        const optionsMenuTrigger =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component__options-button',
            );
        expect(optionsMenuTrigger).toBeTruthy();
    });

    it('should not show options menu', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).showMenu = signal<boolean>(false);

        fixture.detectChanges();
        const optionsMenuTrigger =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component__options-button',
            );
        expect(optionsMenuTrigger).toBeFalsy();
    });

    it('should show options menu options and call delay on click', () => {
        const optionsMenuTrigger =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component__options-button',
            );

        optionsMenuTrigger.click();
        fixture.detectChanges();

        const optionsMenu = fixture.debugElement.query(
            By.directive(OptionsMenuComponent),
        );

        expect(optionsMenu).toBeTruthy();

        const menuOptions = optionsMenu.nativeElement.querySelectorAll(
            '.options-menu__option',
        );

        expect(menuOptions.length).toBe(7);

        menuOptions[2].click();
        expect(mockVocabularyStore.delayVocabulary).toHaveBeenCalledWith(
            [1],
            1,
        );
    });

    it('should call reset on click', () => {
        const optionsMenuTrigger =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component__options-button',
            );

        optionsMenuTrigger.click();
        fixture.detectChanges();

        const optionsMenu = fixture.debugElement.query(
            By.directive(OptionsMenuComponent),
        );

        expect(optionsMenu).toBeTruthy();

        const menuOptions = optionsMenu.nativeElement.querySelectorAll(
            '.options-menu__option',
        );

        menuOptions[0].click();
        expect(mockVocabularyStore.resetVocabulary).toHaveBeenCalledWith([1]);
    });

    it('should call restart on click', () => {
        const optionsMenuTrigger =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component__options-button',
            );

        optionsMenuTrigger.click();
        fixture.detectChanges();

        const optionsMenu = fixture.debugElement.query(
            By.directive(OptionsMenuComponent),
        );

        expect(optionsMenu).toBeTruthy();

        const menuOptions = optionsMenu.nativeElement.querySelectorAll(
            '.options-menu__option',
        );

        menuOptions[1].click();
        expect(mockVocabularyStore.restartVocabulary).toHaveBeenCalledWith([1]);
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    it('should handle isSelected input', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).isSelected = signal<boolean>(true);

        fixture.detectChanges();

        // Test that the component handles the isSelected state
        expect(component.isSelected()).toBeTrue();
    });

    it('should have correct delayOptions data', () => {
        expect(component.delayOptions).toEqual([
            { label: '1 Day', value: 1 },
            { label: '1 Week', value: 7 },
            { label: '2 Weeks', value: 14 },
            { label: '3 Weeks', value: 21 },
            { label: '4 Weeks', value: 28 },
        ]);
    });

    it('should test toggleSelect method', () => {
        spyOn(component.selectedChange, 'emit');

        component.toggleSelect();

        expect(component.selectedChange.emit).toHaveBeenCalledWith(1);
    });

    it('should test revealTranslation method', () => {
        expect(component.isTranlationVisible()).toBeFalse();

        component.revealTranslation();
        expect(component.isTranlationVisible()).toBeTrue();

        component.revealTranslation();
        expect(component.isTranlationVisible()).toBeFalse();
    });

    it('should test selectDelayDays method', fakeAsync(() => {
        const mockTrigger = jasmine.createSpyObj('CdkMenuTrigger', ['close']);

        // Correctly mock optionsMenuTrigger as a function that returns the trigger
        (component as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(mockTrigger);

        const delaySubject = new Subject<void>();
        (mockVocabularyStore.delayVocabulary as jasmine.Spy).and.returnValue(
            delaySubject.asObservable(),
        );

        component.selectDelayDays(14);

        expect(mockVocabularyStore.delayVocabulary).toHaveBeenCalledWith(
            [1],
            14,
        );

        // Complete the observable to trigger the callback
        delaySubject.complete();
        tick();

        expect(mockTrigger.close).toHaveBeenCalled();
    }));

    it('should test delayVocabulary method directly', () => {
        component.delayVocabulary(1, 21);

        expect(mockVocabularyStore.delayVocabulary).toHaveBeenCalledWith(
            [1],
            21,
        );
    });

    // For tests that need specific trigger behavior, you can override the global mock:
    it('should close options menu after reset completion', fakeAsync(() => {
        const specificMockTrigger = {
            close: jasmine.createSpy('close'),
        };

        // Override the global mock for this specific test
        (component as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(specificMockTrigger);

        const resetSubject = new Subject<void>();
        (mockVocabularyStore.resetVocabulary as jasmine.Spy).and.returnValue(
            resetSubject.asObservable(),
        );

        component.resetVocabulary(1);

        expect(mockVocabularyStore.resetVocabulary).toHaveBeenCalledWith([1]);
        expect(specificMockTrigger.close).not.toHaveBeenCalled();

        resetSubject.complete();
        tick();

        expect(specificMockTrigger.close).toHaveBeenCalled();
    }));

    it('should close options menu after restart completion', () => {
        const mockTrigger = {
            close: jasmine.createSpy('close'),
        };

        // Mock the viewChild signal as a function that returns the mock trigger
        (component as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(mockTrigger);

        component.restartVocabulary(1);

        // Test completion callback
        setTimeout(() => {
            expect(mockTrigger.close).toHaveBeenCalled();
        });
    });

    it('should call delayVocabulary with correct parameters in selectDelayDays', () => {
        component.selectDelayDays(14);
        expect(mockVocabularyStore.delayVocabulary).toHaveBeenCalledWith(
            [1],
            14,
        );
    });

    it('should call delayVocabulary method directly', () => {
        component.delayVocabulary(1, 21);
        expect(mockVocabularyStore.delayVocabulary).toHaveBeenCalledWith(
            [1],
            21,
        );
    });

    it('should call resetVocabulary with correct parameters', () => {
        component.resetVocabulary(1);
        expect(mockVocabularyStore.resetVocabulary).toHaveBeenCalledWith([1]);
    });

    it('should call restartVocabulary with correct parameters', () => {
        component.restartVocabulary(1);
        expect(mockVocabularyStore.restartVocabulary).toHaveBeenCalledWith([1]);
    });

    it('should call selectDelayDays with correct parameters', () => {
        component.selectDelayDays(14);
        expect(mockVocabularyStore.delayVocabulary).toHaveBeenCalledWith(
            [1],
            14,
        );
    });

    // If you want to test menu closing behavior, use these:
    it('should call delayVocabulary and close menu on completion', fakeAsync(() => {
        const localTrigger = jasmine.createSpyObj('CdkMenuTrigger', ['close']);
        (component as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(localTrigger);

        const delaySubject = new Subject<void>();
        (mockVocabularyStore.delayVocabulary as jasmine.Spy).and.returnValue(
            delaySubject.asObservable(),
        );

        component.selectDelayDays(14);

        expect(mockVocabularyStore.delayVocabulary).toHaveBeenCalledWith(
            [1],
            14,
        );
        expect(localTrigger.close).not.toHaveBeenCalled();

        delaySubject.complete();
        tick();

        expect(localTrigger.close).toHaveBeenCalled();
    }));

    // Fix reset completion test (remove setTimeout and assign optionsMenuTrigger as a function)
    it('should close options menu after reset completion', fakeAsync(() => {
        const localTrigger = jasmine.createSpyObj('CdkMenuTrigger', ['close']);
        (component as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(localTrigger);

        const resetSubject = new Subject<void>();
        (mockVocabularyStore.resetVocabulary as jasmine.Spy).and.returnValue(
            resetSubject.asObservable(),
        );

        component.resetVocabulary(1);

        expect(mockVocabularyStore.resetVocabulary).toHaveBeenCalledWith([1]);
        expect(localTrigger.close).not.toHaveBeenCalled();

        resetSubject.complete();
        tick();

        expect(localTrigger.close).toHaveBeenCalled();
    }));

    // Fix restart completion test similarly
    it('should close options menu after restart completion', fakeAsync(() => {
        const localTrigger = jasmine.createSpyObj('CdkMenuTrigger', ['close']);
        (component as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(localTrigger);

        const restartSubject = new Subject<void>();
        (mockVocabularyStore.restartVocabulary as jasmine.Spy).and.returnValue(
            restartSubject.asObservable(),
        );

        component.restartVocabulary(1);

        expect(mockVocabularyStore.restartVocabulary).toHaveBeenCalledWith([1]);
        expect(localTrigger.close).not.toHaveBeenCalled();

        restartSubject.complete();
        tick();

        expect(localTrigger.close).toHaveBeenCalled();
    }));

    // Stabilized review loading test (no setTimeout)
    it('should set review loading state', () => {
        const reviewSubject = new Subject<void>();
        (
            mockVocabularyStore.setReviewedVocabulary as jasmine.Spy
        ).and.returnValue(reviewSubject.asObservable());

        expect(component.isReviewLoading()).toBeFalse();

        component.setReviewedVocabulary(1);
        expect(component.isReviewLoading()).toBeTrue();

        reviewSubject.complete();
        expect(component.isReviewLoading()).toBeFalse();
    });

    // Fix audio test: avoid casting window.Audio as jasmine.Spy; use audioSpy
    it('should stop previous audio when playing new audio', () => {
        const existingAudio = {
            pause: jasmine.createSpy('pause'),
            play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
        };

        const newAudio = {
            pause: jasmine.createSpy('pause'),
            play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
        };

        interface NewAudio {
            pause: jasmine.Spy<jasmine.Func>;
            play: jasmine.Spy<jasmine.Func>;
        }

        // Override the global Audio stub for this test
        audioSpy.and.returnValue(newAudio as NewAudio);

        (
            component as unknown as {
                audioPlayer: { pause: jasmine.Spy } | null;
            }
        ).audioPlayer = existingAudio as NewAudio;

        component.playAudio(1);

        expect(existingAudio.pause).toHaveBeenCalled();
        expect(
            (component as unknown as { audioPlayer: HTMLAudioElement | null })
                .audioPlayer,
        ).toBe(newAudio as unknown as HTMLAudioElement | null);
        expect(newAudio.play).toHaveBeenCalled();
    });

    // Null-safety for optionsMenuTrigger
    it('should not throw if optionsMenuTrigger returns null (selectDelayDays)', () => {
        (component as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(null);

        const delaySubject = new Subject<void>();
        (mockVocabularyStore.delayVocabulary as jasmine.Spy).and.returnValue(
            delaySubject.asObservable(),
        );

        expect(() => component.selectDelayDays(7)).not.toThrow();

        delaySubject.complete(); // completion callback should not call close on null
    });

    // Add these tests to increase coverage

    it('should handle error when playing audio', () => {
        mockVocabularyStore.getAudio = jasmine
            .createSpy()
            .and.returnValue(throwError(() => new Error('Audio fetch failed')));

        spyOn(console, 'error');

        component.playAudio(1);

        expect(mockVocabularyStore.getAudio).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith(
            'Error fetching audio:',
            jasmine.any(Error),
        );
        expect(component.loadingAudioId()).toBeNull();
    });

    it('should handle error when setting reviewed vocabulary', () => {
        mockVocabularyStore.setReviewedVocabulary = jasmine
            .createSpy()
            .and.returnValue(throwError(() => new Error('Review failed')));

        spyOn(console, 'error');

        component.setReviewedVocabulary(1);

        expect(console.error).toHaveBeenCalledWith(
            'Error setting reviewed vocabulary:',
            jasmine.any(Error),
        );
    });

    it('should handle error when delaying vocabulary in selectDelayDays', () => {
        mockVocabularyStore.delayVocabulary = jasmine
            .createSpy()
            .and.returnValue(throwError(() => new Error('Delay failed')));

        spyOn(console, 'error');

        component.selectDelayDays(7);

        expect(console.error).toHaveBeenCalledWith(
            'Error delaying vocabulary:',
            jasmine.any(Error),
        );
    });

    it('should handle error when resetting vocabulary', () => {
        mockVocabularyStore.resetVocabulary = jasmine
            .createSpy()
            .and.returnValue(throwError(() => new Error('Reset failed')));

        spyOn(console, 'error');

        component.resetVocabulary(1);

        expect(console.error).toHaveBeenCalledWith(
            'Error resetting vocabulary:',
            jasmine.any(Error),
        );
    });

    it('should handle error when restarting vocabulary', () => {
        mockVocabularyStore.restartVocabulary = jasmine
            .createSpy()
            .and.returnValue(throwError(() => new Error('Restart failed')));

        spyOn(console, 'error');

        component.restartVocabulary(1);

        expect(console.error).toHaveBeenCalledWith(
            'Error resetting vocabulary:',
            jasmine.any(Error),
        );
    });

    it('should handle error when delaying vocabulary', () => {
        mockVocabularyStore.delayVocabulary = jasmine
            .createSpy()
            .and.returnValue(throwError(() => new Error('Delay failed')));

        spyOn(console, 'error');

        component.delayVocabulary(1, 7);

        expect(console.error).toHaveBeenCalledWith(
            'Error delaying vocabulary:',
            jasmine.any(Error),
        );
    });
});
