import type { Mock, MockedObject } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { VocabularyFormComponent } from './vocabulary-form.component';
import { VocabularyStore } from '../../store/vocabulary.store';
import { VocabularyService } from '../../services/vocabulary/vocabulary.service';
import { AudioService } from '../../services/audio/audio.service';
import { TranslatedPhrase, UserSettings } from '../../types/types';

describe('VocabularyFormComponent', () => {
    beforeEach(() => {
        vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    let component: VocabularyFormComponent;
    let fixture: ComponentFixture<VocabularyFormComponent>;
    let mockVocabularyStore: {
        vocabularyToEdit: WritableSignal<TranslatedPhrase | null>;
        isVocabularyFormOpen: WritableSignal<boolean>;
        userSettings: WritableSignal<UserSettings | null>;
        closeVocabularyForm: Mock;
        createVocabulary: Mock;
        updateVocabulary: Mock;
    };
    let mockVocabularyService: Pick<
        MockedObject<VocabularyService>,
        'translatePhrase' | 'generatePhrase'
    >;
    let mockAudioService: Pick<
        MockedObject<AudioService>,
        'generateAudio' | 'playAudio' | 'deleteAudios'
    >;

    const mockUserSettings = {
        id: 1,
        user_id: 'test-user',
        system_lang: { id: 1, locale_code: 'en-US' },
        origin_lang: { id: 1, locale_code: 'es-ES' },
        learning_lang: { id: 2, locale_code: 'en-US' },
    } as UserSettings;

    const mockVocabularyToEdit: TranslatedPhrase = {
        id: 1,
        original: {
            id: 1,
            text: 'Hola',
            audio_url: 'original-audio.mp3',
            locale: { id: 1, locale_code: 'es-ES' },
        },
        translated: {
            id: 2,
            text: 'Hello',
            audio_url: 'translated-audio.mp3',
            locale: { id: 2, locale_code: 'en-US' },
        },
        review_date: '2025-01-15',
        sr_stage_id: 1,
        modified_at: '',
        learned: 0,
        priority: 1,
    } as TranslatedPhrase;

    beforeEach(async () => {
        mockVocabularyStore = {
            vocabularyToEdit: signal<TranslatedPhrase | null>(null),
            isVocabularyFormOpen: signal<boolean>(true),
            userSettings: signal<UserSettings | null>(mockUserSettings),
            closeVocabularyForm: vi.fn().mockName('closeVocabularyForm'),
            createVocabulary: vi
                .fn()
                .mockName('createVocabulary')
                .mockReturnValue(of({})),
            updateVocabulary: vi
                .fn()
                .mockName('updateVocabulary')
                .mockReturnValue(of({})),
        };

        mockVocabularyService = {
            translatePhrase: vi
                .fn()
                .mockName('VocabularyService.translatePhrase'),
            generatePhrase: vi
                .fn()
                .mockName('VocabularyService.generatePhrase'),
        };
        mockVocabularyService.translatePhrase.mockReturnValue(
            of({ translatedPhrase: 'Translated' }),
        );
        mockVocabularyService.generatePhrase.mockReturnValue(
            of({ generatedPhrase: 'Generated phrase' }),
        );

        mockAudioService = {
            generateAudio: vi.fn().mockName('AudioService.generateAudio'),
            playAudio: vi.fn().mockName('AudioService.playAudio'),
            deleteAudios: vi.fn().mockName('AudioService.deleteAudios'),
        };
        mockAudioService.generateAudio.mockReturnValue(
            of({ filename: 'new-audio.mp3' }),
        );
        mockAudioService.playAudio.mockReturnValue(of(undefined));
        mockAudioService.deleteAudios.mockReturnValue(of({ deleted: [] }));

        localStorage.removeItem('newVocabulary');
        localStorage.removeItem('editVocabulary');

        await TestBed.configureTestingModule({
            imports: [VocabularyFormComponent, ReactiveFormsModule],
            providers: [
                { provide: VocabularyStore, useValue: mockVocabularyStore },
                { provide: VocabularyService, useValue: mockVocabularyService },
                { provide: AudioService, useValue: mockAudioService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VocabularyFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        localStorage.removeItem('newVocabulary');
        localStorage.removeItem('editVocabulary');
        localStorage.removeItem('autoTranslationEnabled');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('form initialization', () => {
        it('should have a valid form group', () => {
            expect(component.vocabularyForm).toBeTruthy();
        });

        it('should have originalPhrase form control', () => {
            expect(
                component.vocabularyForm.controls.originalPhrase,
            ).toBeTruthy();
        });

        it('should have translatedPhrase form control', () => {
            expect(
                component.vocabularyForm.controls.translatedPhrase,
            ).toBeTruthy();
        });

        it('should have reviewDate form control', () => {
            expect(component.vocabularyForm.controls.reviewDate).toBeTruthy();
        });

        it('should have priority form control with default value 0', () => {
            expect(component.vocabularyForm.controls.priority.value).toBe('0');
        });
    });

    describe('form validation', () => {
        it('should be invalid when originalPhrase is empty', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('');
            component.vocabularyForm.controls.translatedPhrase.setValue(
                'Hello',
            );
            expect(component.vocabularyForm.invalid).toBe(true);
        });

        it('should be invalid when translatedPhrase is empty', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('');
            expect(component.vocabularyForm.invalid).toBe(true);
        });

        it('should be invalid when originalPhrase has less than 2 characters', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('H');
            component.vocabularyForm.controls.translatedPhrase.setValue(
                'Hello',
            );
            expect(
                component.vocabularyForm.controls.originalPhrase.hasError(
                    'minlength',
                ),
            ).toBe(true);
        });

        it('should be invalid when translatedPhrase has less than 2 characters', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue('H');
            expect(
                component.vocabularyForm.controls.translatedPhrase.hasError(
                    'minlength',
                ),
            ).toBe(true);
        });

        it('should be valid with both phrases filled correctly', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue(
                'Hello',
            );
            expect(component.vocabularyForm.valid).toBe(true);
        });
    });

    describe('edit mode', () => {
        it('should return false for isEditMode when vocabularyToEdit is null', () => {
            mockVocabularyStore.vocabularyToEdit.set(null);
            expect(component.isEditMode()).toBeFalsy();
        });

        it('should return truthy for isEditMode when vocabularyToEdit exists', () => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            fixture.detectChanges();
            expect(component.isEditMode()).toBeTruthy();
        });

        it('should display "Edit Vocabulary" title in edit mode', () => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            fixture.detectChanges();
            const title = fixture.nativeElement.querySelector('h2');
            expect(title.textContent.trim()).toBe('Edit Vocabulary');
        });

        it('should display "Create Vocabulary" title in create mode', () => {
            mockVocabularyStore.vocabularyToEdit.set(null);
            fixture.detectChanges();
            const title = fixture.nativeElement.querySelector('h2');
            expect(title.textContent.trim()).toBe('Create Vocabulary');
        });

        it('should populate form with vocabulary data in edit mode', async () => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
            expect(component.vocabularyForm.controls.originalPhrase.value).toBe(
                'Hola',
            );
            expect(
                component.vocabularyForm.controls.translatedPhrase.value,
            ).toBe('Hello');
            expect(component.vocabularyForm.controls.priority.value).toBe('1');
        });
    });

    describe('locale computation', () => {
        it('should get originalLocale from userSettings in create mode', () => {
            mockVocabularyStore.vocabularyToEdit.set(null);
            expect(component.originalLocale()).toBe('es-ES');
        });

        it('should get translatedLocale from userSettings in create mode', () => {
            mockVocabularyStore.vocabularyToEdit.set(null);
            expect(component.translatedLocale()).toBe('en-US');
        });

        it('should get originalLocale from vocabulary in edit mode', async () => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
            expect(component.originalLocale()).toBe('es-ES');
        });

        it('should get translatedLocale from vocabulary in edit mode', async () => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
            expect(component.translatedLocale()).toBe('en-US');
        });
    });

    describe('onAudioGenerated', () => {
        it('should set originalAudioFilename for original type', () => {
            component.onAudioGenerated('new-original.mp3', 'original');
            expect(component.originalAudioFilename()).toBe('new-original.mp3');
        });

        it('should set translatedAudioFilename for translated type', () => {
            component.onAudioGenerated('new-translated.mp3', 'translated');
            expect(component.translatedAudioFilename()).toBe(
                'new-translated.mp3',
            );
        });

        it('should delete previous audio in create mode', async () => {
            component.originalAudioFilename.set('old-audio.mp3');
            component.onAudioGenerated('new-audio.mp3', 'original');
            await vi.advanceTimersByTimeAsync(0);
            expect(mockAudioService.deleteAudios).toHaveBeenCalledWith([
                'old-audio.mp3',
            ]);
        });
    });

    describe('onPlayAudio', () => {
        it('should set loadingAudio for original type and reset after complete', async () => {
            const playSubject = new Subject<void>();
            mockAudioService.playAudio.mockReturnValue(
                playSubject.asObservable(),
            );

            component.onPlayAudio('test.mp3', 'original');
            expect(component.loadingAudio()).toBe('original');

            playSubject.next();
            playSubject.complete();
            await vi.advanceTimersByTimeAsync(0);
            expect(component.loadingAudio()).toBeNull();
        });

        it('should set loadingAudio for translated type and reset after complete', async () => {
            const playSubject = new Subject<void>();
            mockAudioService.playAudio.mockReturnValue(
                playSubject.asObservable(),
            );

            component.onPlayAudio('test.mp3', 'translated');
            expect(component.loadingAudio()).toBe('translated');

            playSubject.next();
            playSubject.complete();
            await vi.advanceTimersByTimeAsync(0);
            expect(component.loadingAudio()).toBeNull();
        });

        it('should call audioService.playAudio', () => {
            component.onPlayAudio('test.mp3', 'original');
            expect(mockAudioService.playAudio).toHaveBeenCalledWith('test.mp3');
        });

        it('should reset loadingAudio after error', async () => {
            mockAudioService.playAudio.mockReturnValue(
                throwError(() => new Error('Play error')),
            );
            component.onPlayAudio('test.mp3', 'original');
            await vi.advanceTimersByTimeAsync(0);
            expect(component.loadingAudio()).toBeNull();
        });
    });

    describe('onClearAudio', () => {
        it('should not delete if no audio exists', () => {
            component.originalAudioFilename.set(null);
            component.onClearAudio('original');
            expect(mockAudioService.deleteAudios).not.toHaveBeenCalled();
        });

        it('should delete audio and clear filename in create mode', async () => {
            component.originalAudioFilename.set('test-audio.mp3');
            component.onClearAudio('original');
            await vi.advanceTimersByTimeAsync(0);
            expect(mockAudioService.deleteAudios).toHaveBeenCalledWith([
                'test-audio.mp3',
            ]);
            expect(component.originalAudioFilename()).toBeNull();
        });
    });

    describe('submitForm', () => {
        beforeEach(() => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue(
                'Hello',
            );
        });

        describe('create mode', () => {
            it('should set saving to true and reset after complete', async () => {
                const saveSubject = new Subject<object>();
                mockVocabularyStore.createVocabulary.mockReturnValue(
                    saveSubject.asObservable(),
                );

                component.submitForm();
                expect(component.saving()).toBe(true);

                saveSubject.next({});
                saveSubject.complete();
                await vi.advanceTimersByTimeAsync(0);
                expect(component.saving()).toBe(false);
            });

            it('should call createVocabulary on store', () => {
                component.submitForm();
                expect(mockVocabularyStore.createVocabulary).toHaveBeenCalled();
            });

            it('should close form on success', async () => {
                component.submitForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(
                    mockVocabularyStore.closeVocabularyForm,
                ).toHaveBeenCalled();
            });

            it('should set saving to false on error', async () => {
                mockVocabularyStore.createVocabulary.mockReturnValue(
                    throwError(() => new Error('Save error')),
                );
                component.submitForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(component.saving()).toBe(false);
            });

            it('should remove localStorage on success', async () => {
                localStorage.setItem('newVocabulary', JSON.stringify({}));
                component.submitForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(localStorage.getItem('newVocabulary')).toBeNull();
            });
        });

        describe('edit mode', () => {
            beforeEach(async () => {
                mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
                await vi.advanceTimersByTimeAsync(0);
                fixture.detectChanges();
                await vi.runOnlyPendingTimersAsync();
            });

            it('should call updateVocabulary on store', () => {
                component.submitForm();
                expect(mockVocabularyStore.updateVocabulary).toHaveBeenCalled();
            });

            it('should pass correct vocabulary id', () => {
                component.submitForm();
                const callArgs = vi.mocked(mockVocabularyStore.updateVocabulary)
                    .mock.lastCall![0];
                expect(callArgs.vocabularyId).toBe(1);
            });

            it('should close form on success', async () => {
                component.submitForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(
                    mockVocabularyStore.closeVocabularyForm,
                ).toHaveBeenCalled();
            });
        });
    });

    describe('cancelForm', () => {
        describe('create mode', () => {
            it('should close vocabulary form', async () => {
                component.cancelForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(
                    mockVocabularyStore.closeVocabularyForm,
                ).toHaveBeenCalled();
            });

            it('should delete generated audio files', async () => {
                component.originalAudioFilename.set('audio1.mp3');
                component.translatedAudioFilename.set('audio2.mp3');
                component.cancelForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(mockAudioService.deleteAudios).toHaveBeenCalledWith([
                    'audio1.mp3',
                    'audio2.mp3',
                ]);
            });

            it('should remove localStorage', async () => {
                localStorage.setItem('newVocabulary', JSON.stringify({}));
                component.cancelForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(localStorage.getItem('newVocabulary')).toBeNull();
            });
        });

        describe('edit mode', () => {
            beforeEach(async () => {
                mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
                await vi.advanceTimersByTimeAsync(0);
                fixture.detectChanges();
                await vi.runOnlyPendingTimersAsync();
            });

            it('should reset form', () => {
                component.vocabularyForm.controls.originalPhrase.setValue(
                    'Changed',
                );
                component.cancelForm();
                expect(component.vocabularyForm.controls.priority.value).toBe(
                    '0',
                );
            });

            it('should close vocabulary form', () => {
                component.cancelForm();
                expect(
                    mockVocabularyStore.closeVocabularyForm,
                ).toHaveBeenCalled();
            });
        });
    });

    describe('resetForm', () => {
        describe('create mode', () => {
            it('should reset form to default values', async () => {
                component.vocabularyForm.controls.originalPhrase.setValue(
                    'Test',
                );
                component.vocabularyForm.controls.translatedPhrase.setValue(
                    'Test',
                );
                component.resetForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(
                    component.vocabularyForm.controls.originalPhrase.value,
                ).toBe('');
                expect(
                    component.vocabularyForm.controls.translatedPhrase.value,
                ).toBe('');
            });

            it('should clear audio filenames', async () => {
                component.originalAudioFilename.set('audio.mp3');
                component.translatedAudioFilename.set('audio2.mp3');
                component.resetForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(component.originalAudioFilename()).toBeNull();
                expect(component.translatedAudioFilename()).toBeNull();
            });

            it('should delete audio files', async () => {
                component.originalAudioFilename.set('audio.mp3');
                component.resetForm();
                await vi.advanceTimersByTimeAsync(0);
                expect(mockAudioService.deleteAudios).toHaveBeenCalledWith([
                    'audio.mp3',
                ]);
            });
        });
    });

    describe('UI elements', () => {
        it('should have cancel button', () => {
            const formButtons = fixture.nativeElement.querySelectorAll(
                'form > div:last-child button[type="button"]',
            );
            expect(formButtons[0].textContent.trim()).toBe('Cancel');
        });

        it('should have reset button', () => {
            const formButtons = fixture.nativeElement.querySelectorAll(
                'form > div:last-child button[type="button"]',
            );
            expect(formButtons[1].textContent.trim()).toBe('Reset');
        });

        it('should have submit button', () => {
            const submitButton = fixture.nativeElement.querySelector(
                'button[type="submit"]',
            );
            expect(submitButton).toBeTruthy();
        });

        it('should disable submit button when form is invalid', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('');
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector(
                'button[type="submit"]',
            );
            expect(submitButton.disabled).toBe(true);
        });

        it('should enable submit button when form is valid', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue(
                'Hello',
            );
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector(
                'button[type="submit"]',
            );
            expect(submitButton.disabled).toBe(false);
        });

        it('should disable submit button when saving', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue(
                'Hello',
            );
            component.saving.set(true);
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector(
                'button[type="submit"]',
            );
            expect(submitButton.disabled).toBe(true);
        });

        it('should show "Saving..." text when saving', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue(
                'Hello',
            );
            component.saving.set(true);
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector(
                'button[type="submit"]',
            );
            expect(submitButton.textContent).toContain('Saving...');
        });

        it('should show loading spinner when saving', () => {
            component.saving.set(true);
            fixture.detectChanges();
            const spinner =
                fixture.nativeElement.querySelector('.loading-spinner');
            expect(spinner).toBeTruthy();
        });

        it('should show "Save" text in create mode', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue(
                'Hello',
            );
            component.saving.set(false);
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector(
                'button[type="submit"]',
            );
            expect(submitButton.textContent.trim()).toBe('Save');
        });

        it('should show "Save Changes" text in edit mode', async () => {
            mockVocabularyStore.vocabularyToEdit.set(mockVocabularyToEdit);
            await vi.advanceTimersByTimeAsync(0);
            fixture.detectChanges();
            const submitButton = fixture.nativeElement.querySelector(
                'button[type="submit"]',
            );
            expect(submitButton.textContent.trim()).toBe('Save Changes');
        });

        it('should have review date input', () => {
            const reviewDateInput =
                fixture.nativeElement.querySelector('#review-date-input');
            expect(reviewDateInput).toBeTruthy();
            expect(reviewDateInput.type).toBe('date');
        });

        it('should have priority select', () => {
            const prioritySelect = fixture.nativeElement.querySelector(
                'select[formControlName="priority"]',
            );
            expect(prioritySelect).toBeTruthy();
        });

        it('should have priority options 0, 1, 2', () => {
            const options = fixture.nativeElement.querySelectorAll(
                'select[formControlName="priority"] option',
            );
            expect(options.length).toBe(3);
            expect(options[0].value).toBe('0');
            expect(options[1].value).toBe('1');
            expect(options[2].value).toBe('2');
        });
    });

    describe('button interactions', () => {
        it('should call cancelForm when cancel button is clicked', () => {
            vi.spyOn(component, 'cancelForm').mockReturnValue(undefined);
            const formButtons = fixture.nativeElement.querySelectorAll(
                'form > div:last-child button[type="button"]',
            );
            formButtons[0].click();
            expect(component.cancelForm).toHaveBeenCalled();
        });

        it('should call resetForm when reset button is clicked', () => {
            vi.spyOn(component, 'resetForm').mockReturnValue(undefined);
            const formButtons = fixture.nativeElement.querySelectorAll(
                'form > div:last-child button[type="button"]',
            );
            formButtons[1].click();
            expect(component.resetForm).toHaveBeenCalled();
        });

        it('should call submitForm on form submit', () => {
            vi.spyOn(component, 'submitForm').mockReturnValue(undefined);
            component.vocabularyForm.controls.originalPhrase.setValue('Hola');
            component.vocabularyForm.controls.translatedPhrase.setValue(
                'Hello',
            );
            fixture.detectChanges();
            const form = fixture.nativeElement.querySelector('form');
            form.dispatchEvent(new Event('submit'));
            expect(component.submitForm).toHaveBeenCalled();
        });
    });

    describe('signals initialization', () => {
        it('should initialize translatingTarget as null', () => {
            expect(component.translatingTarget()).toBeNull();
        });

        it('should initialize saving as false', () => {
            expect(component.saving()).toBe(false);
        });

        it('should initialize loadingAudio as null', () => {
            expect(component.loadingAudio()).toBeNull();
        });

        it('should initialize originalAudioFilename as null', () => {
            expect(component.originalAudioFilename()).toBeNull();
        });

        it('should initialize translatedAudioFilename as null', () => {
            expect(component.translatedAudioFilename()).toBeNull();
        });
    });

    describe('ngOnDestroy', () => {
        it('should call removeStoredEdit on destroy', () => {
            vi.spyOn(component, 'removeStoredEdit').mockReturnValue(undefined);
            component.ngOnDestroy();
            expect(component.removeStoredEdit).toHaveBeenCalled();
        });
    });

    describe('autoTranslationEnabled', () => {
        it('should initialize autoTranslationEnabled as true by default', () => {
            expect(component.autoTranslationEnabled()).toBe(true);
        });

        it('should load autoTranslationEnabled from localStorage if set to false', () => {
            localStorage.setItem('autoTranslationEnabled', 'false');
            fixture = TestBed.createComponent(VocabularyFormComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            expect(component.autoTranslationEnabled()).toBe(false);
        });
    });

    describe('toggleAutoTranslation', () => {
        it('should toggle autoTranslationEnabled from true to false', () => {
            component.autoTranslationEnabled.set(true);
            component.toggleAutoTranslation();
            expect(component.autoTranslationEnabled()).toBe(false);
        });

        it('should toggle autoTranslationEnabled from false to true', () => {
            component.autoTranslationEnabled.set(false);
            component.toggleAutoTranslation();
            expect(component.autoTranslationEnabled()).toBe(true);
        });

        it('should save autoTranslationEnabled to localStorage', () => {
            component.autoTranslationEnabled.set(true);
            component.toggleAutoTranslation();
            expect(localStorage.getItem('autoTranslationEnabled')).toBe(
                'false',
            );
        });
    });

    describe('generatingPhraseFor', () => {
        it('should initialize generatingPhraseFor as null', () => {
            expect(component.generatingPhraseFor()).toBeNull();
        });
    });

    describe('onGeneratePhrase', () => {
        it('should not call service if phrase is empty', () => {
            component.vocabularyForm.controls.originalPhrase.setValue('');
            component.onGeneratePhrase('original');
            expect(mockVocabularyService.generatePhrase).not.toHaveBeenCalled();
        });

        it('should call vocabularyService.generatePhrase with text and locale', async () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hello');
            component.onGeneratePhrase('original');
            await vi.advanceTimersByTimeAsync(0);
            expect(mockVocabularyService.generatePhrase).toHaveBeenCalledWith(
                'Hello',
                'es-ES',
            );
        });

        it('should set generatingPhraseFor during generation', async () => {
            const generateSubject = new Subject<{
                generatedPhrase: string;
            }>();
            mockVocabularyService.generatePhrase.mockReturnValue(
                generateSubject.asObservable(),
            );

            component.vocabularyForm.controls.originalPhrase.setValue('Hello');
            component.onGeneratePhrase('original');
            expect(component.generatingPhraseFor()).toBe('original');

            generateSubject.next({ generatedPhrase: 'Generated' });
            generateSubject.complete();
            await vi.advanceTimersByTimeAsync(0);
            expect(component.generatingPhraseFor()).toBeNull();
        });

        it('should update original phrase with generated phrase', async () => {
            component.vocabularyForm.controls.originalPhrase.setValue('Hello');
            component.onGeneratePhrase('original');
            await vi.advanceTimersByTimeAsync(0);
            expect(component.vocabularyForm.controls.originalPhrase.value).toBe(
                'Generated phrase',
            );
        });

        it('should update translated phrase with generated phrase', async () => {
            component.vocabularyForm.controls.translatedPhrase.setValue('Hola');
            component.onGeneratePhrase('translated');
            await vi.advanceTimersByTimeAsync(0);
            expect(
                component.vocabularyForm.controls.translatedPhrase.value,
            ).toBe('Generated phrase');
        });

        it('should reset generatingPhraseFor on error', async () => {
            mockVocabularyService.generatePhrase.mockReturnValue(
                throwError(() => new Error('API Error')),
            );
            component.vocabularyForm.controls.originalPhrase.setValue('Hello');
            component.onGeneratePhrase('original');
            await vi.advanceTimersByTimeAsync(0);
            expect(component.generatingPhraseFor()).toBeNull();
        });
    });

    describe('auto-translation toggle UI', () => {
        it('should have auto-translation toggle', () => {
            const toggle = fixture.nativeElement.querySelector(
                'input[type="checkbox"].toggle',
            );
            expect(toggle).toBeTruthy();
        });

        it('should show "Auto-translate" label', () => {
            const label = fixture.nativeElement.querySelector(
                '.label-text.text-xs',
            );
            expect(label.textContent.trim()).toBe('Auto-translate');
        });

        it('should toggle autoTranslationEnabled when clicked', () => {
            const toggle = fixture.nativeElement.querySelector(
                'input[type="checkbox"].toggle',
            );
            const initialValue = component.autoTranslationEnabled();
            toggle.click();
            fixture.detectChanges();
            expect(component.autoTranslationEnabled()).toBe(!initialValue);
        });
    });
});
