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
import { AudioService } from '../../services/audio/audio.service';

// Interface for component with optionsMenuTrigger
interface ComponentWithMenuTrigger {
    optionsMenuTrigger: () => CdkMenuTrigger | undefined;
}

// Alias for common store method spy casts
type StoreMethodSpy = jasmine.Spy;

// Minimal audio-like shape used in tests
interface HTMLAudioLike {
    play: jasmine.Spy;
    pause: jasmine.Spy;
}

// Test helpers
const createTriggerSpy = (): CdkMenuTrigger =>
    jasmine.createSpyObj('CdkMenuTrigger', [
        'close',
    ]) as unknown as CdkMenuTrigger;

const setOptionsMenuTrigger = (
    cmp: PhraseComponent,
    trigger: CdkMenuTrigger | null,
): void => {
    (cmp as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
        .createSpy('optionsMenuTrigger')
        .and.returnValue(trigger ?? null);
};

const createAudioStub = (): HTMLAudioLike => ({
    play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
    pause: jasmine.createSpy('pause'),
});

describe('PhraseComponent', () => {
    let component: PhraseComponent;
    let fixture: ComponentFixture<PhraseComponent>;
    let mockVocabularyStore: Partial<VocabularyStore>;
    let mockAudioService: jasmine.SpyObj<AudioService>;
    let audioSpy: jasmine.Spy;

    const mockLocale = { id: 1, locale_code: 'en-US' };

    beforeEach(async () => {
        mockVocabularyStore = {
            setReviewedVocabulary: jasmine.createSpy().and.returnValue(of({})),
            delayVocabulary: jasmine.createSpy().and.returnValue(of({})),
            resetVocabulary: jasmine.createSpy().and.returnValue(of({})),
            restartVocabulary: jasmine.createSpy().and.returnValue(of({})),
            deleteVocabulary: jasmine.createSpy().and.returnValue(of({})),
            editVocabulary: jasmine.createSpy(),
        };

        mockAudioService = jasmine.createSpyObj('AudioService', ['playAudio']);
        mockAudioService.playAudio.and.returnValue(of(undefined));

        await TestBed.configureTestingModule({
            imports: [PhraseComponent],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PhraseComponent);
        component = fixture.componentInstance;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).translatedPhrase = signal<TranslatedPhrase>({
            id: 1,
            original: { id: 1, text: 'Hola', audio_url: 'https://example.com/1.mp3', locale: mockLocale },
            translated: { id: 2, text: 'Hello', audio_url: 'https://example.com/2.mp3', locale: mockLocale },
            review_date: '2025-07-16',
            sr_stage_id: 1,
            modified_at: '',
            learned: 0,
            priority: 0,
        });

        // Global mock: optionsMenuTrigger must be a function returning a trigger with close()
        const globalTrigger = createTriggerSpy();
        setOptionsMenuTrigger(component, globalTrigger);

        // Global Audio stub to avoid DOMException errors
        audioSpy = spyOn(window, 'Audio').and.returnValue(
            createAudioStub() as unknown as HTMLAudioElement,
        );

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
        expect(mockAudioService.playAudio).toHaveBeenCalledWith('1.mp3');
    });

    it('should hide play original phrase audio button when audio_url is null', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).translatedPhrase = signal<TranslatedPhrase>({
            id: 1,
            original: { id: 1, text: 'Hola', audio_url: '', locale: mockLocale },
            translated: { id: 2, text: 'Hello', audio_url: 'https://example.com/2.mp3', locale: mockLocale },
            review_date: '2025-07-16',
            sr_stage_id: 1,
            modified_at: '',
            learned: 0,
            priority: 0,
        });
        fixture.detectChanges();

        const audioButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__play-audio--original',
        );
        expect(audioButton).toBeFalsy();
    });

    it('should hide play translated phrase audio button when audio_url is null', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).translatedPhrase = signal<TranslatedPhrase>({
            id: 1,
            original: { id: 1, text: 'Hola', audio_url: 'https://example.com/1.mp3', locale: mockLocale },
            translated: { id: 2, text: 'Hello', audio_url: '', locale: mockLocale },
            review_date: '2025-07-16',
            sr_stage_id: 1,
            modified_at: '',
            learned: 0,
            priority: 0,
        });
        fixture.detectChanges();

        const originalBtn = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__original',
        );
        originalBtn.click();
        fixture.detectChanges();

        const audioButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__play-audio--translated',
        );
        expect(audioButton).toBeFalsy();
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
        expect(mockAudioService.playAudio).toHaveBeenCalledWith('2.mp3');
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

        expect(menuOptions.length).toBe(8);

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

    // For tests that need specific trigger behavior, you can override the global mock:
    it('should close options menu after reset completion', fakeAsync(() => {
        const specificMockTrigger = createTriggerSpy();

        // Override the global mock for this specific test
        setOptionsMenuTrigger(component, specificMockTrigger);

        const resetSubject = new Subject<void>();
        (mockVocabularyStore.resetVocabulary as StoreMethodSpy).and.returnValue(
            resetSubject.asObservable(),
        );

        component.reset([1]);

        expect(mockVocabularyStore.resetVocabulary).toHaveBeenCalledWith([1]);
        expect(specificMockTrigger.close).not.toHaveBeenCalled();

        resetSubject.complete();
        tick();

        expect(specificMockTrigger.close).toHaveBeenCalled();
    }));

    it('should close options menu after restart completion', fakeAsync(() => {
        const localTrigger = createTriggerSpy();
        setOptionsMenuTrigger(component, localTrigger);

        const restartSubject = new Subject<void>();
        (
            mockVocabularyStore.restartVocabulary as StoreMethodSpy
        ).and.returnValue(restartSubject.asObservable());

        component.restart([1]);

        expect(mockVocabularyStore.restartVocabulary).toHaveBeenCalledWith([1]);
        expect(localTrigger.close).not.toHaveBeenCalled();

        restartSubject.complete();
        tick();

        expect(localTrigger.close).toHaveBeenCalled();
    }));

    it('should call delayVocabulary and close menu on completion', fakeAsync(() => {
        const localTrigger = createTriggerSpy();
        setOptionsMenuTrigger(component, localTrigger);

        const delaySubject = new Subject<void>();
        (mockVocabularyStore.delayVocabulary as StoreMethodSpy).and.returnValue(
            delaySubject.asObservable(),
        );

        component.delay([1], 14);

        expect(mockVocabularyStore.delayVocabulary).toHaveBeenCalledWith(
            [1],
            14,
        );
        expect(localTrigger.close).not.toHaveBeenCalled();

        delaySubject.complete();
        tick();

        expect(localTrigger.close).toHaveBeenCalled();
    }));

    // Stabilized review loading test (no setTimeout)
    it('should set review loading state', () => {
        const reviewSubject = new Subject<void>();
        (
            mockVocabularyStore.setReviewedVocabulary as StoreMethodSpy
        ).and.returnValue(reviewSubject.asObservable());

        expect(component.isReviewLoading()).toBeFalse();

        component.setReviewedVocabulary(1);
        expect(component.isReviewLoading()).toBeTrue();

        reviewSubject.complete();
        expect(component.isReviewLoading()).toBeFalse();
    });

    // Audio playback is delegated to AudioService
    it('should call audioService.playAudio when playing audio', () => {
        component.playAudio(1);
        expect(mockAudioService.playAudio).toHaveBeenCalledWith('1.mp3');
    });

    // Null-safety for optionsMenuTrigger
    it('should not throw if optionsMenuTrigger returns null (selectDelayDays)', () => {
        (component as ComponentWithMenuTrigger).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(null);

        const delaySubject = new Subject<void>();
        (mockVocabularyStore.delayVocabulary as StoreMethodSpy).and.returnValue(
            delaySubject.asObservable(),
        );

        expect(() => component.delay([1], 7)).not.toThrow();

        delaySubject.complete(); // completion callback should not call close on null
    });

    it('should handle error when playing audio', () => {
        mockAudioService.playAudio.and.returnValue(
            throwError(() => new Error('Audio fetch failed'))
        );

        component.playAudio(1);

        expect(mockAudioService.playAudio).toHaveBeenCalledWith('1.mp3');
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

        component.delay([1], 7);

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

        component.reset([1]);

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

        component.restart([1]);

        expect(console.error).toHaveBeenCalledWith(
            'Error resetting vocabulary:',
            jasmine.any(Error),
        );
    });

    it('shows spinner instead of options icon while busy and disables menu', () => {
        // Ensure a fresh trigger for this test
        const localTrigger = jasmine.createSpyObj('CdkMenuTrigger', ['close']);
        (
            component as unknown as {
                optionsMenuTrigger: () => CdkMenuTrigger | null;
            }
        ).optionsMenuTrigger = jasmine
            .createSpy('optionsMenuTrigger')
            .and.returnValue(localTrigger as unknown as CdkMenuTrigger);

        fixture.detectChanges();

        // Open the menu to render app-options-menu
        const optionsButton = fixture.debugElement.query(
            By.css('.phrase-component__options-button'),
        ).nativeElement;
        optionsButton.click();
        fixture.detectChanges();

        // Make delayVocabulary return a controllable observable
        const delaySubject = new Subject<void>();
        (mockVocabularyStore.delayVocabulary as jasmine.Spy).and.returnValue(
            delaySubject.asObservable(),
        );

        // Trigger delay to set busy and show spinner
        component.delay([1], 7);
        fixture.detectChanges();

        // Spinner replaces the ellipsis icon
        const spinnerEl = optionsButton.querySelector('.loading-spinner');
        expect(spinnerEl).toBeTruthy();
        const ellipsisIcon = optionsButton.querySelector('app-icon');
        expect(ellipsisIcon).toBeFalsy();

        // app-options-menu receives disabled=true
        const optionsMenuDE = fixture.debugElement.query(
            By.directive(OptionsMenuComponent),
        );
        expect(optionsMenuDE).toBeTruthy();
        expect(optionsMenuDE.componentInstance.disabled()).toBeTrue();

        // Complete to clear busy state
        delaySubject.complete();
        fixture.detectChanges();

        // Spinner removed, icon visible again
        const spinnerAfter = optionsButton.querySelector('.loading-spinner');
        expect(spinnerAfter).toBeFalsy();
        const ellipsisIconAfter = optionsButton.querySelector('app-icon');
        expect(ellipsisIconAfter).toBeTruthy();
        expect(optionsMenuDE.componentInstance.disabled()).toBeFalse();
    });

    it('opens delete modal from options menu and confirms single deletion', () => {
        const optionsBtn = fixture.debugElement.query(
            By.css('.phrase-component__options-button'),
        ).nativeElement;
        optionsBtn.click();
        fixture.detectChanges();

        const optionsMenuDE = fixture.debugElement.query(
            By.directive(OptionsMenuComponent),
        );
        expect(optionsMenuDE).toBeTruthy();

        // Click Delete option (last)
        const optionsEls = optionsMenuDE.nativeElement.querySelectorAll(
            '.options-menu__option',
        );
        const deleteBtnEl = optionsEls[optionsEls.length - 1];
        deleteBtnEl.click();
        fixture.detectChanges();

        // Modal shows with count=1
        const modalDE = fixture.debugElement.query(
            By.css('app-delete-confirm-modal'),
        );
        expect(modalDE).toBeTruthy();
        const confirmBtn = fixture.debugElement.nativeElement.querySelector(
            'app-delete-confirm-modal .btn-error',
        );

        // Control delete flow
        const deleteSubject = new Subject<void>();
        (mockVocabularyStore.deleteVocabulary as jasmine.Spy).and.returnValue(
            deleteSubject.asObservable(),
        );

        // Confirm deletion
        confirmBtn.click();
        fixture.detectChanges();

        expect(mockVocabularyStore.deleteVocabulary).toHaveBeenCalledWith([1]);
        expect(confirmBtn.disabled).toBeTrue();

        // Emit success then complete to trigger onSuccess + finalize
        deleteSubject.next();
        fixture.detectChanges();
        deleteSubject.complete();
        fixture.detectChanges();

        // Modal gone
        const modalAfterDE = fixture.debugElement.query(
            By.css('app-delete-confirm-modal'),
        );
        expect(modalAfterDE).toBeFalsy();
    });

    it('cancels delete modal without store call', () => {
        const optionsBtn = fixture.debugElement.query(
            By.css('.phrase-component__options-button'),
        ).nativeElement;
        optionsBtn.click();
        fixture.detectChanges();

        const optionsMenuDE = fixture.debugElement.query(
            By.directive(OptionsMenuComponent),
        );
        const optionsEls = optionsMenuDE.nativeElement.querySelectorAll(
            '.options-menu__option',
        );
        optionsEls[optionsEls.length - 1].click();
        fixture.detectChanges();

        const cancelBtn = fixture.debugElement.nativeElement.querySelector(
            'app-delete-confirm-modal .btn.btn-sm:not(.btn-error)',
        );
        cancelBtn.click();
        fixture.detectChanges();

        expect(mockVocabularyStore.deleteVocabulary).not.toHaveBeenCalled();
        const modalAfterDE = fixture.debugElement.query(
            By.css('app-delete-confirm-modal'),
        );
        expect(modalAfterDE).toBeFalsy();
    });

    it('should not show delete button by default', () => {
        const deleteButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__delete-button',
        );

        expect(deleteButton).toBeFalsy();
    });

    it('should show delete button when showDeleteButton is true', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).showDeleteButton = signal<boolean>(true);

        fixture.detectChanges();

        const deleteButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__delete-button',
        );

        expect(deleteButton).toBeTruthy();
    });

    it('should open delete modal when delete button is clicked', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).showDeleteButton = signal<boolean>(true);

        fixture.detectChanges();

        const deleteButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__delete-button',
        );

        deleteButton.click();
        fixture.detectChanges();

        const modalDE = fixture.debugElement.query(
            By.css('app-delete-confirm-modal'),
        );
        expect(modalDE).toBeTruthy();
    });

    it('should show loading spinner on delete button when busy', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).showDeleteButton = signal<boolean>(true);

        fixture.detectChanges();

        // Make deleteVocabulary return a controllable observable
        const deleteSubject = new Subject<void>();
        (mockVocabularyStore.deleteVocabulary as jasmine.Spy).and.returnValue(
            deleteSubject.asObservable(),
        );

        // Click delete button to open modal
        const deleteButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__delete-button',
        );
        deleteButton.click();
        fixture.detectChanges();

        // Confirm deletion
        const confirmBtn = fixture.debugElement.nativeElement.querySelector(
            'app-delete-confirm-modal .btn-error',
        );
        confirmBtn.click();
        fixture.detectChanges();

        // While busy, the delete button should show spinner instead of icon
        const deleteButtonContainer =
            fixture.debugElement.nativeElement.querySelector(
                '.phrase-component .flex.gap-2',
            );
        const spinner = deleteButtonContainer.querySelector('.loading-spinner');
        expect(spinner).toBeTruthy();

        const trashIcon = deleteButtonContainer.querySelector(
            '.phrase-component__delete-button',
        );
        expect(trashIcon).toBeFalsy();

        // Complete to clear busy state
        deleteSubject.complete();
        fixture.detectChanges();
    });

    it('should confirm delete from delete button and call store', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).showDeleteButton = signal<boolean>(true);

        fixture.detectChanges();

        const deleteButton = fixture.debugElement.nativeElement.querySelector(
            '.phrase-component__delete-button',
        );
        deleteButton.click();
        fixture.detectChanges();

        const deleteSubject = new Subject<void>();
        (mockVocabularyStore.deleteVocabulary as jasmine.Spy).and.returnValue(
            deleteSubject.asObservable(),
        );

        const confirmBtn = fixture.debugElement.nativeElement.querySelector(
            'app-delete-confirm-modal .btn-error',
        );
        confirmBtn.click();
        fixture.detectChanges();

        expect(mockVocabularyStore.deleteVocabulary).toHaveBeenCalledWith([1]);

        deleteSubject.next();
        deleteSubject.complete();
        fixture.detectChanges();

        const modalAfterDE = fixture.debugElement.query(
            By.css('app-delete-confirm-modal'),
        );
        expect(modalAfterDE).toBeFalsy();
    });
});
